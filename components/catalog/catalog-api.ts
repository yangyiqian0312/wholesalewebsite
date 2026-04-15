import { unstable_cache } from "next/cache";
import {
  mapInflowProductToCatalogRow,
} from "./catalog-mappers";
import type {
  CatalogCategoryOption,
  CatalogProductRow,
  CatalogProductsResult,
} from "./catalog-types";
import {
  isCatalogCategoryValue,
} from "../../utils/catalog-categories";
import { getBackendBaseUrl } from "../../utils/backend-api";

const backendBaseUrl = getBackendBaseUrl();
const CATALOG_PRODUCTS_TAG = "catalog-products";
const CATALOG_FILTER_OPTIONS_TAG = "catalog-filter-options";
const CATALOG_PRODUCTS_REVALIDATE_SECONDS = 30;
const CATALOG_FILTERS_REVALIDATE_SECONDS = 60;
const CATALOG_PRODUCT_REVALIDATE_SECONDS = 60;

function buildUnavailablePagination(page: number, pageSize: number): CatalogProductsResult {
  return {
    items: [],
    pagination: {
      page: Math.max(1, page),
      pageSize,
      totalItems: 0,
      totalPages: 1,
    },
    unavailable: true,
  };
}

export async function getCatalogProducts({
  page = 1,
  pageSize = 20,
  category,
  smart,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
  smart?: string;
} = {}): Promise<CatalogProductsResult> {
  const normalizedSmart = smart?.trim() || "";
  const query = new URLSearchParams({
    inStockOnly: "true",
    page: String(page),
    pageSize: String(pageSize),
  });

  if (category) {
    query.set("category", category);
  }

  if (normalizedSmart) {
    query.set("smart", normalizedSmart);
  }

  const cacheKey = query.toString();

  try {
    const payload = await unstable_cache(
      async () => {
        const response = await fetch(`${backendBaseUrl}/api/catalog/products?${cacheKey}`, {
          next: {
            revalidate: CATALOG_PRODUCTS_REVALIDATE_SECONDS,
            tags: [CATALOG_PRODUCTS_TAG],
          },
        });

        if (!response.ok) {
          throw new Error(`Catalog backend request failed: ${response.status}`);
        }

        return (await response.json()) as {
          items?: Array<Record<string, unknown>>;
          pagination?: CatalogProductsResult["pagination"];
        };
      },
      [CATALOG_PRODUCTS_TAG, cacheKey],
      {
        revalidate: CATALOG_PRODUCTS_REVALIDATE_SECONDS,
        tags: [CATALOG_PRODUCTS_TAG],
      },
    )();

    if (!Array.isArray(payload.items) || !payload.pagination) {
      throw new Error("Catalog backend returned an invalid paginated products payload");
    }

    const mappedProducts = payload.items.map((product) =>
      mapInflowProductToCatalogRow(product as Parameters<typeof mapInflowProductToCatalogRow>[0]),
    );

    return {
      items: mappedProducts,
      pagination: payload.pagination,
      unavailable: false,
    };
  } catch {
    return buildUnavailablePagination(page, pageSize);
  }
}

export async function getCatalogCategoryOptions({
  smart,
}: {
  smart?: string;
} = {}): Promise<readonly CatalogCategoryOption[]> {
  const query = new URLSearchParams({
    inStockOnly: "true",
  });

  const normalizedSmart = smart?.trim() || "";

  if (normalizedSmart) {
    query.set("smart", normalizedSmart);
  }

  const cacheKey = query.toString();

  try {
    const payload = await unstable_cache(
      async () => {
        const response = await fetch(`${backendBaseUrl}/api/catalog/filter-options?${cacheKey}`, {
          next: {
            revalidate: CATALOG_FILTERS_REVALIDATE_SECONDS,
            tags: [CATALOG_FILTER_OPTIONS_TAG],
          },
        });

        if (!response.ok) {
          throw new Error(`Catalog filter options request failed: ${response.status}`);
        }

        return (await response.json()) as {
          categories?: CatalogCategoryOption[];
        };
      },
      [CATALOG_FILTER_OPTIONS_TAG, cacheKey],
      {
        revalidate: CATALOG_FILTERS_REVALIDATE_SECONDS,
        tags: [CATALOG_FILTER_OPTIONS_TAG],
      },
    )();

    if (!Array.isArray(payload.categories)) {
      throw new Error("Catalog filter options payload is invalid");
    }

    return payload.categories;
  } catch {
    return [];
  }
}

export async function getCatalogProduct(productId: string): Promise<CatalogProductRow> {
  const product = await unstable_cache(
    async () => {
      const response = await fetch(`${backendBaseUrl}/api/catalog/products/${productId}`, {
        next: {
          revalidate: CATALOG_PRODUCT_REVALIDATE_SECONDS,
          tags: [CATALOG_PRODUCTS_TAG, `catalog-product:${productId}`],
        },
      });

      if (!response.ok) {
        throw new Error(`Catalog product request failed: ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    },
    ["catalog-product", productId],
    {
      revalidate: CATALOG_PRODUCT_REVALIDATE_SECONDS,
      tags: [CATALOG_PRODUCTS_TAG, `catalog-product:${productId}`],
    },
  )();

  return mapInflowProductToCatalogRow(
    product as Parameters<typeof mapInflowProductToCatalogRow>[0],
  );
}
