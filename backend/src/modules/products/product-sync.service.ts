import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { inflowRequest } from "../../integrations/inflow/client.js";
import { fetchProducts } from "./product.service.js";
import type {
  InflowPricingScheme,
  InflowPricingSchemeListResponse,
  InflowProduct,
} from "./product.types.js";

const SYNC_INCLUDE = "defaultPrice,prices,productBarcodes,inventoryLines.location,defaultImage";
const PRIMARY_CATALOG_LOCATION = "152 Main";
const PRICING_SCHEME_PAGE_SIZE = 100;

export type ProductSyncStatus = "idle" | "running" | "success" | "error";

export type ProductSyncState = {
  status: ProductSyncStatus;
  startedAt: string | null;
  finishedAt: string | null;
  fetchedCount: number | null;
  syncedCount: number | null;
  skippedCount: number | null;
  syncedAt: string | null;
  error: string | null;
};

let activeSyncPromise: Promise<void> | null = null;
let currentSyncState: ProductSyncState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  fetchedCount: null,
  syncedCount: null,
  skippedCount: null,
  syncedAt: null,
  error: null,
};

function getInflowProductId(product: InflowProduct) {
  return product.productId ?? product.id ?? product.entityId ?? null;
}

function parseQuantity(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parsePrice(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed.toFixed(2);
}

function normalizePricingSchemeName(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

async function fetchPricingSchemes() {
  const schemes: InflowPricingScheme[] = [];
  let skip = 0;

  while (true) {
    const page = await inflowRequest<InflowPricingSchemeListResponse>("/pricing-schemes", {
      count: PRICING_SCHEME_PAGE_SIZE,
      skip,
    });

    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    schemes.push(...page);

    if (page.length < PRICING_SCHEME_PAGE_SIZE) {
      break;
    }

    skip += PRICING_SCHEME_PAGE_SIZE;
  }

  return schemes;
}

function buildPricingSchemeMap(pricingSchemes: InflowPricingScheme[]) {
  return new Map(
    pricingSchemes
      .filter((scheme): scheme is InflowPricingScheme & { pricingSchemeId: string } =>
        Boolean(scheme.pricingSchemeId),
      )
      .map((scheme) => [scheme.pricingSchemeId, normalizePricingSchemeName(scheme.name)]),
  );
}

function getPriceForScheme(
  product: InflowProduct,
  pricingSchemeNamesById: Map<string, string>,
  schemeName: string,
) {
  const normalizedTargetName = normalizePricingSchemeName(schemeName);
  const matchingPrice = product.prices?.find(
    (price) =>
      price.pricingSchemeId &&
      pricingSchemeNamesById.get(price.pricingSchemeId) === normalizedTargetName,
  );

  return parsePrice(matchingPrice?.unitPrice ?? undefined);
}

function getProductBarcode(product: InflowProduct) {
  const firstBarcode = product.productBarcodes?.find((entry) => entry.barcode)?.barcode;
  return firstBarcode ?? product.upc ?? product.barcode ?? null;
}

function normalizeLocationName(name?: string) {
  if (!name) {
    return "";
  }

  return name.replace(/^[-\s]+/, "").trim().toLowerCase();
}

function getPrimaryLocationQuantity(product: InflowProduct) {
  const matchingLines = product.inventoryLines?.filter((line) => {
    return normalizeLocationName(line.location?.name) === PRIMARY_CATALOG_LOCATION.toLowerCase();
  });

  if (!matchingLines?.length) {
    return 0;
  }

  return matchingLines.reduce((total, line) => total + parseQuantity(line.quantityOnHand), 0);
}

function mapProductForWrite(
  product: InflowProduct,
  pricingSchemeNamesById: Map<string, string>,
  existingRawPayload?: Prisma.JsonValue,
) {
  const inflowProductId = getInflowProductId(product);

  if (!inflowProductId) {
    return null;
  }

  const existingDescription =
    existingRawPayload &&
    typeof existingRawPayload === "object" &&
    !Array.isArray(existingRawPayload) &&
    typeof (existingRawPayload as { description?: unknown }).description === "string"
      ? (existingRawPayload as { description: string }).description
      : undefined;

  return {
    inflowProductId,
    inflowEntityId: product.entityId ?? null,
    name: product.name ?? product.productName ?? "Unnamed product",
    sku: product.sku ?? null,
    barcode: getProductBarcode(product),
    upc: product.upc ?? null,
    unitPrice: null,
    marketPrice: getPriceForScheme(product, pricingSchemeNamesById, "Market"),
    totalQuantityOnHand: getPrimaryLocationQuantity(product),
    isActive: false,
    releaseDate:
      typeof product.lastModifiedDateTime === "string" ? product.lastModifiedDateTime : null,
    rawPayload: {
      ...(product as Prisma.InputJsonValue as Record<string, unknown>),
      ...(existingDescription !== undefined ? { description: existingDescription } : {}),
    } as Prisma.InputJsonValue,
    lastSeenAt: new Date(),
    syncedAt: new Date(),
  };
}

export async function syncInflowProductsToDatabase() {
  const [inflowProducts, pricingSchemes] = await Promise.all([
    fetchProducts({
      include: SYNC_INCLUDE,
      inStockOnly: false,
    }),
    fetchPricingSchemes(),
  ]);
  const pricingSchemeNamesById = buildPricingSchemeMap(pricingSchemes);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const product of inflowProducts) {
    const inflowProductId = getInflowProductId(product);

    if (!inflowProductId) {
      skippedCount += 1;
      continue;
    }

    const existingProduct = await prisma.catalogProduct.findUnique({
      where: {
        inflowProductId,
      },
      select: {
        rawPayload: true,
      },
    });

    const mappedProduct = mapProductForWrite(
      product,
      pricingSchemeNamesById,
      existingProduct?.rawPayload,
    );

    if (!mappedProduct) {
      skippedCount += 1;
      continue;
    }

    await prisma.catalogProduct.upsert({
      where: {
        inflowProductId: mappedProduct.inflowProductId,
      },
      create: mappedProduct,
      update: {
        inflowEntityId: mappedProduct.inflowEntityId,
        name: mappedProduct.name,
        sku: mappedProduct.sku,
        barcode: mappedProduct.barcode,
        upc: mappedProduct.upc,
        marketPrice: mappedProduct.marketPrice,
        totalQuantityOnHand: mappedProduct.totalQuantityOnHand,
        releaseDate: mappedProduct.releaseDate,
        rawPayload: mappedProduct.rawPayload,
        lastSeenAt: mappedProduct.lastSeenAt,
        syncedAt: mappedProduct.syncedAt,
      },
    });

    syncedCount += 1;
  }

  return {
    fetchedCount: inflowProducts.length,
    syncedCount,
    skippedCount,
    syncedAt: new Date().toISOString(),
  };
}

export function getProductSyncState() {
  return currentSyncState;
}

export function startProductSync() {
  if (activeSyncPromise) {
    return {
      started: false,
      state: currentSyncState,
    } as const;
  }

  currentSyncState = {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    fetchedCount: null,
    syncedCount: null,
    skippedCount: null,
    syncedAt: null,
    error: null,
  };

  activeSyncPromise = (async () => {
    try {
      const result = await syncInflowProductsToDatabase();
      currentSyncState = {
        status: "success",
        startedAt: currentSyncState.startedAt,
        finishedAt: new Date().toISOString(),
        fetchedCount: result.fetchedCount,
        syncedCount: result.syncedCount,
        skippedCount: result.skippedCount,
        syncedAt: result.syncedAt,
        error: null,
      };
    } catch (error) {
      currentSyncState = {
        status: "error",
        startedAt: currentSyncState.startedAt,
        finishedAt: new Date().toISOString(),
        fetchedCount: null,
        syncedCount: null,
        skippedCount: null,
        syncedAt: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync products into the local database",
      };
    } finally {
      activeSyncPromise = null;
    }
  })();

  return {
    started: true,
    state: currentSyncState,
  } as const;
}
