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
  const query = new URLSearchParams({
    inStockOnly: "true",
    page: String(page),
    pageSize: String(pageSize),
  });

  if (category) {
    query.set("category", category);
  }

  if (smart?.trim()) {
    query.set("smart", smart.trim());
  }

  try {
    const response = await fetch(
      `${backendBaseUrl}/api/catalog/products?${query.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Catalog backend request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      items?: Array<Record<string, unknown>>;
      pagination?: CatalogProductsResult["pagination"];
    };

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

  if (smart?.trim()) {
    query.set("smart", smart.trim());
  }

  try {
    const response = await fetch(`${backendBaseUrl}/api/catalog/filter-options?${query.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Catalog filter options request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      categories?: CatalogCategoryOption[];
    };

    if (!Array.isArray(payload.categories)) {
      throw new Error("Catalog filter options payload is invalid");
    }

    return payload.categories;
  } catch {
    return [];
  }
}

export async function getCatalogProduct(productId: string): Promise<CatalogProductRow> {
  const response = await fetch(`${backendBaseUrl}/api/catalog/products/${productId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Catalog product request failed: ${response.status}`);
  }

  const product = (await response.json()) as Record<string, unknown>;

  return mapInflowProductToCatalogRow(
    product as Parameters<typeof mapInflowProductToCatalogRow>[0],
  );
}
