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
};

type RawCatalogProductPayload = {
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

export async function fetchCatalogProductsFromDatabase(params: FetchCatalogProductsParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(5000, Math.max(1, params.pageSize ?? 20));
  const where = buildCatalogWhere(params);
  const summaryWhere = buildCatalogWhere({
    ...params,
    listingStatus: undefined,
  });

  const [totalItems, products, totalListings, activeListings, outOfStockListings] = await Promise.all([
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
  ]);

  const items = products.map((product) => ({
    ...extractCatalogPayloadFields(product.rawPayload),
    productId: product.inflowProductId,
    entityId: product.inflowEntityId,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    upc: product.upc,
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
    },
  };
}

export async function fetchCatalogCategoryCountsFromDatabase(
  params: Pick<FetchCatalogProductsParams, "inStockOnly" | "smart">,
) {
  const baseWhere = buildCatalogWhere({
    ...params,
    category: undefined,
  });

  const counts = await Promise.all(
    catalogCategoryRules.map(async (rule) => {
      const count = await prisma.catalogProduct.count({
        where: {
          ...baseWhere,
          sku: {
            startsWith: rule.skuPrefix,
            mode: "insensitive",
          },
        },
      });

      return {
        value: rule.value,
        label: rule.label,
        count,
      };
    }),
  );

  return counts;
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
  const product = await prisma.catalogProduct.update({
    where: {
      inflowProductId: productId,
    },
    data: {
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
    totalQuantityOnHand: String(product.totalQuantityOnHand),
    isActive: product.isActive,
    lastModifiedDateTime: product.releaseDate,
    defaultPrice: {
      unitPrice: product.unitPrice?.toString() ?? undefined,
    },
    rawPayload: product.rawPayload,
  };
}
