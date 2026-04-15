import { prisma } from "../../db/prisma.js";
import type { UpdateCatalogProductInput } from "./admin-product.types.js";
import {
  catalogCategoryRules,
  getCatalogCategoryRule,
  type CatalogCategoryValue,
} from "./catalog-category-rules.js";

type FetchCatalogProductsParams = {
  inStockOnly?: boolean;
  smart?: string;
  page?: number;
  pageSize?: number;
  category?: CatalogCategoryValue;
  listingStatus?: "active" | "oos";
  includeSummary?: boolean;
};

type RawCatalogProductPayload = {
  description?: string;
  salesUom?: {
    name?: string;
    conversionRatio?: {
      standardQuantity?: string;
      uomQuantity?: string;
    };
  };
  standardUomName?: string;
  imageSmallUrl?: string;
  defaultImage?: {
    mediumUrl?: string;
    smallUrl?: string;
    thumbUrl?: string;
    largeUrl?: string;
    originalUrl?: string;
  };
};

function extractCatalogPayloadFields(rawPayload: unknown): RawCatalogProductPayload {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return {};
  }

  const payload = rawPayload as RawCatalogProductPayload;

  return {
    description: typeof payload.description === "string" ? payload.description : undefined,
    salesUom: payload.salesUom
      ? {
          name: payload.salesUom.name,
          conversionRatio: payload.salesUom.conversionRatio
            ? {
                standardQuantity: payload.salesUom.conversionRatio.standardQuantity,
                uomQuantity: payload.salesUom.conversionRatio.uomQuantity,
              }
            : undefined,
        }
      : undefined,
    standardUomName: typeof payload.standardUomName === "string" ? payload.standardUomName : undefined,
    imageSmallUrl: payload.imageSmallUrl,
    defaultImage: payload.defaultImage
      ? {
          mediumUrl: payload.defaultImage.mediumUrl,
          smallUrl: payload.defaultImage.smallUrl,
          thumbUrl: payload.defaultImage.thumbUrl,
          largeUrl: payload.defaultImage.largeUrl,
          originalUrl: payload.defaultImage.originalUrl,
        }
      : undefined,
  };
}

function buildSmartSearchWhere(smart?: string) {
  const term = smart?.trim();

  if (!term) {
    return undefined;
  }

  return {
    OR: [
      {
        name: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        sku: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        upc: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        barcode: {
          contains: term,
          mode: "insensitive" as const,
        },
      },
    ],
  };
}

function buildCategoryWhere(category?: CatalogCategoryValue) {
  if (!category) {
    return undefined;
  }

  const rule = getCatalogCategoryRule(category);

  if (!rule) {
    return undefined;
  }

  return {
    sku: {
      startsWith: rule.skuPrefix,
      mode: "insensitive" as const,
    },
  };
}

function buildCatalogWhere(params: FetchCatalogProductsParams) {
  return {
    ...(params.inStockOnly ? { isActive: true, totalQuantityOnHand: { gt: 0 } } : {}),
    ...(params.listingStatus === "active" ? { isActive: true } : {}),
    ...(params.listingStatus === "oos" ? { totalQuantityOnHand: { lte: 0 } } : {}),
    ...buildSmartSearchWhere(params.smart),
    ...buildCategoryWhere(params.category),
  };
}

const CATALOG_CACHE_TTL_MS = 30 * 1000;
const CATALOG_STALE_TTL_MS = 5 * 60 * 1000;
const CATEGORY_COUNTS_CACHE_TTL_MS = 60 * 1000;
const CATEGORY_COUNTS_STALE_TTL_MS = 10 * 60 * 1000;

type CatalogProductsResponse = Awaited<ReturnType<typeof queryCatalogProductsFromDatabase>>;
type CategoryCountsResponse = Awaited<ReturnType<typeof queryCatalogCategoryCountsFromDatabase>>;

type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

const catalogProductsCache = new Map<string, CacheEntry<CatalogProductsResponse>>();
const catalogProductsInFlight = new Map<string, Promise<CatalogProductsResponse>>();
const catalogCategoryCountsCache = new Map<string, CacheEntry<CategoryCountsResponse>>();
const catalogCategoryCountsInFlight = new Map<string, Promise<CategoryCountsResponse>>();

function buildCatalogProductsCacheKey(params: {
  inStockOnly: boolean;
  smart: string;
  page: number;
  pageSize: number;
  category?: CatalogCategoryValue;
  listingStatus?: "active" | "oos";
  includeSummary: boolean;
}) {
  return JSON.stringify(params);
}

function buildCategoryCountsCacheKey(params: {
  inStockOnly: boolean;
  smart: string;
}) {
  return JSON.stringify(params);
}

function getCachedValue<T>(cache: Map<string, CacheEntry<T>>, cacheKey: string, maxAgeMs: number) {
  const cachedEntry = cache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.fetchedAt > maxAgeMs) {
    return null;
  }

  return cachedEntry.value;
}

async function queryCatalogProductsFromDatabase(params: FetchCatalogProductsParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const where = buildCatalogWhere(params);
  const includeSummary = params.includeSummary ?? false;

  if (!includeSummary) {
    const [totalItems, products] = await prisma.$transaction([
      prisma.catalogProduct.count({ where }),
      prisma.catalogProduct.findMany({
        where,
        orderBy: [{ name: "asc" }, { inflowProductId: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = products.map((product) => ({
      ...extractCatalogPayloadFields(product.rawPayload),
      productId: product.inflowProductId,
      entityId: product.inflowEntityId,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      upc: product.upc,
      marketPrice: product.marketPrice?.toString() ?? undefined,
      totalQuantityOnHand: String(product.totalQuantityOnHand),
      isActive: product.isActive,
      lastModifiedDateTime: product.releaseDate,
      defaultPrice: {
        unitPrice: product.unitPrice?.toString() ?? undefined,
      },
    }));

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  const summaryWhere = buildCatalogWhere({
    ...params,
    includeSummary: undefined,
    listingStatus: undefined,
  });

  const [totalItems, products, totalListings, activeListings, outOfStockListings, latestSync] =
    await prisma.$transaction([
      prisma.catalogProduct.count({ where }),
      prisma.catalogProduct.findMany({
        where,
        orderBy: [{ name: "asc" }, { inflowProductId: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.catalogProduct.count({ where: summaryWhere }),
      prisma.catalogProduct.count({
        where: {
          ...summaryWhere,
          isActive: true,
        },
      }),
      prisma.catalogProduct.count({
        where: {
          ...summaryWhere,
          totalQuantityOnHand: { lte: 0 },
        },
      }),
      prisma.catalogProduct.aggregate({
        where: summaryWhere,
        _max: {
          updatedAt: true,
        },
      }),
    ]);

  const items = products.map((product) => ({
    ...extractCatalogPayloadFields(product.rawPayload),
    productId: product.inflowProductId,
    entityId: product.inflowEntityId,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    upc: product.upc,
    marketPrice: product.marketPrice?.toString() ?? undefined,
    totalQuantityOnHand: String(product.totalQuantityOnHand),
    isActive: product.isActive,
    lastModifiedDateTime: product.releaseDate,
    defaultPrice: {
      unitPrice: product.unitPrice?.toString() ?? undefined,
    },
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    summary: {
      totalListings,
      activeListings,
      outOfStockListings,
      latestSyncedAt: latestSync._max.updatedAt?.toISOString() ?? null,
    },
  };
}

export async function fetchCatalogProductsFromDatabase(params: FetchCatalogProductsParams) {
  const normalizedParams = {
    inStockOnly: params.inStockOnly ?? false,
    smart: params.smart?.trim() ?? "",
    page: Math.max(1, params.page ?? 1),
    pageSize: Math.min(5000, Math.max(1, params.pageSize ?? 20)),
    category: params.category,
    listingStatus: params.listingStatus,
    includeSummary: params.includeSummary ?? false,
  } as const;
  const cacheKey = buildCatalogProductsCacheKey(normalizedParams);
  const freshResponse = getCachedValue(catalogProductsCache, cacheKey, CATALOG_CACHE_TTL_MS);

  if (freshResponse) {
    return freshResponse;
  }

  const runningRequest = catalogProductsInFlight.get(cacheKey);

  if (runningRequest) {
    return runningRequest;
  }

  const requestPromise = (async () => {
    try {
      const response = await queryCatalogProductsFromDatabase(normalizedParams);

      catalogProductsCache.set(cacheKey, {
        value: response,
        fetchedAt: Date.now(),
      });

      return response;
    } catch (error) {
      const staleResponse = getCachedValue(catalogProductsCache, cacheKey, CATALOG_STALE_TTL_MS);

      if (staleResponse) {
        return staleResponse;
      }

      throw error;
    } finally {
      catalogProductsInFlight.delete(cacheKey);
    }
  })();

  catalogProductsInFlight.set(cacheKey, requestPromise);

  return requestPromise;
}

async function queryCatalogCategoryCountsFromDatabase(
  params: Pick<FetchCatalogProductsParams, "inStockOnly" | "smart">,
) {
  const baseWhere = buildCatalogWhere({
    ...params,
    category: undefined,
  });

  const counts = await prisma.$transaction(
    catalogCategoryRules.map((rule) =>
      prisma.catalogProduct.count({
        where: {
          ...baseWhere,
          sku: {
            startsWith: rule.skuPrefix,
            mode: "insensitive",
          },
        },
      }),
    ),
  );

  return catalogCategoryRules.map((rule, index) => ({
    value: rule.value,
    label: rule.label,
    count: counts[index] ?? 0,
  }));
}

export async function fetchCatalogCategoryCountsFromDatabase(
  params: Pick<FetchCatalogProductsParams, "inStockOnly" | "smart">,
) {
  const normalizedParams = {
    inStockOnly: params.inStockOnly ?? false,
    smart: params.smart?.trim() ?? "",
  } as const;
  const cacheKey = buildCategoryCountsCacheKey(normalizedParams);
  const freshCounts = getCachedValue(
    catalogCategoryCountsCache,
    cacheKey,
    CATEGORY_COUNTS_CACHE_TTL_MS,
  );

  if (freshCounts) {
    return freshCounts;
  }

  const runningRequest = catalogCategoryCountsInFlight.get(cacheKey);

  if (runningRequest) {
    return runningRequest;
  }

  const requestPromise = (async () => {
    try {
      const counts = await queryCatalogCategoryCountsFromDatabase(normalizedParams);

      catalogCategoryCountsCache.set(cacheKey, {
        value: counts,
        fetchedAt: Date.now(),
      });

      return counts;
    } catch (error) {
      const staleCounts = getCachedValue(
        catalogCategoryCountsCache,
        cacheKey,
        CATEGORY_COUNTS_STALE_TTL_MS,
      );

      if (staleCounts) {
        return staleCounts;
      }

      throw error;
    } finally {
      catalogCategoryCountsInFlight.delete(cacheKey);
    }
  })();

  catalogCategoryCountsInFlight.set(cacheKey, requestPromise);

  return requestPromise;
}

export async function fetchCatalogProductFromDatabase(productId: string) {
  const product = await prisma.catalogProduct.findFirst({
    where: {
      sku: productId,
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...extractCatalogPayloadFields(product.rawPayload),
    productId: product.inflowProductId,
    entityId: product.inflowEntityId,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    upc: product.upc,
    marketPrice: product.marketPrice?.toString() ?? undefined,
    totalQuantityOnHand: String(product.totalQuantityOnHand),
    isActive: product.isActive,
    lastModifiedDateTime: product.releaseDate,
    defaultPrice: {
      unitPrice: product.unitPrice?.toString() ?? undefined,
    },
    rawPayload: product.rawPayload,
  };
}

export async function fetchCatalogProductByInflowIdFromDatabase(productId: string) {
  const product = await prisma.catalogProduct.findUnique({
    where: {
      inflowProductId: productId,
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...extractCatalogPayloadFields(product.rawPayload),
    productId: product.inflowProductId,
    entityId: product.inflowEntityId,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    upc: product.upc,
    marketPrice: product.marketPrice?.toString() ?? undefined,
    totalQuantityOnHand: String(product.totalQuantityOnHand),
    isActive: product.isActive,
    lastModifiedDateTime: product.releaseDate,
    defaultPrice: {
      unitPrice: product.unitPrice?.toString() ?? undefined,
    },
    rawPayload: product.rawPayload,
  };
}

export async function updateCatalogProductInDatabase(
  productId: string,
  input: UpdateCatalogProductInput,
) {
  const existingProduct = await prisma.catalogProduct.findUnique({
    where: {
      inflowProductId: productId,
    },
    select: {
      rawPayload: true,
    },
  });

  const product = await prisma.catalogProduct.update({
    where: {
      inflowProductId: productId,
    },
    data: {
      ...(input.description !== undefined
        ? {
            rawPayload: {
              ...(existingProduct?.rawPayload &&
              typeof existingProduct.rawPayload === "object" &&
              !Array.isArray(existingProduct.rawPayload)
                ? (existingProduct.rawPayload as Record<string, unknown>)
                : {}),
              description: input.description || null,
            },
          }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.releaseDate !== undefined ? { releaseDate: input.releaseDate || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return {
    ...extractCatalogPayloadFields(product.rawPayload),
    productId: product.inflowProductId,
    entityId: product.inflowEntityId,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    upc: product.upc,
    marketPrice: product.marketPrice?.toString() ?? undefined,
    totalQuantityOnHand: String(product.totalQuantityOnHand),
    isActive: product.isActive,
    lastModifiedDateTime: product.releaseDate,
    defaultPrice: {
      unitPrice: product.unitPrice?.toString() ?? undefined,
    },
    rawPayload: product.rawPayload,
  };
}
