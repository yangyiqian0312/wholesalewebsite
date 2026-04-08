import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { fetchProducts } from "./product.service.js";
import type { InflowProduct } from "./product.types.js";

const SYNC_INCLUDE = "defaultPrice,productBarcodes,inventoryLines.location,defaultImage";
const PRIMARY_CATALOG_LOCATION = "152 Main";

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

function mapProductForWrite(product: InflowProduct) {
  const inflowProductId = getInflowProductId(product);

  if (!inflowProductId) {
    return null;
  }

  return {
    inflowProductId,
    inflowEntityId: product.entityId ?? null,
    name: product.name ?? product.productName ?? "Unnamed product",
    sku: product.sku ?? null,
    barcode: getProductBarcode(product),
    upc: product.upc ?? null,
    unitPrice: parsePrice(product.defaultPrice?.unitPrice),
    totalQuantityOnHand: getPrimaryLocationQuantity(product),
    isActive: product.isActive ?? true,
    releaseDate:
      typeof product.lastModifiedDateTime === "string" ? product.lastModifiedDateTime : null,
    rawPayload: product as Prisma.InputJsonValue,
    lastSeenAt: new Date(),
    syncedAt: new Date(),
  };
}

export async function syncInflowProductsToDatabase() {
  const inflowProducts = await fetchProducts({
    include: SYNC_INCLUDE,
    inStockOnly: false,
  });

  let syncedCount = 0;
  let skippedCount = 0;

  for (const product of inflowProducts) {
    const mappedProduct = mapProductForWrite(product);

    if (!mappedProduct) {
      skippedCount += 1;
      continue;
    }

    await prisma.catalogProduct.upsert({
      where: {
        inflowProductId: mappedProduct.inflowProductId,
      },
      create: mappedProduct,
      update: mappedProduct,
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
