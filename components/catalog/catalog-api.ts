import {
  fallbackCatalogProducts,
  filterSellableCatalogProducts,
  mapInflowProductToCatalogRow,
} from "./catalog-mappers";
import type {
  CatalogCategoryOption,
  CatalogProductRow,
  CatalogProductsResult,
} from "./catalog-types";
import {
  catalogCategoryRules,
  getCatalogCategoryFromSku,
  isCatalogCategoryValue,
} from "../../utils/catalog-categories";
import { getBackendBaseUrl } from "../../utils/backend-api";

const backendBaseUrl = getBackendBaseUrl();

function normalizeSearchTerm(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearch(product: CatalogProductRow, smart?: string) {
  const normalizedSearch = normalizeSearchTerm(smart);

  if (!normalizedSearch) {
    return true;
  }

  const haystack = [product.name, product.sku, product.upc, product.code, ...product.tags]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

function filterFallbackProducts({
  category,
  smart,
}: {
  category?: string;
  smart?: string;
}) {
  return filterSellableCatalogProducts(fallbackCatalogProducts()).filter((product) => {
    const matchesCategory = category && isCatalogCategoryValue(category)
      ? getCatalogCategoryFromSku(product.sku) === category
      : true;

    return matchesCategory && matchesSearch(product, smart);
  });
}

function buildFallbackPagination(
  items: readonly CatalogProductRow[],
  page: number,
  pageSize: number,
): CatalogProductsResult {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: currentPage,
      pageSize,
      totalItems,
      totalPages,
    },
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
    };
  } catch {
    return buildFallbackPagination(filterFallbackProducts({ category, smart }), page, pageSize);
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
    const filteredProducts = filterFallbackProducts({ smart });

    return catalogCategoryRules
      .map((rule) => ({
        value: rule.value,
        label: rule.label,
        count: filteredProducts.filter((product) => getCatalogCategoryFromSku(product.sku) === rule.value)
          .length,
      }))
      .filter((option) => option.count > 0);
  }
}

export async function getCatalogProduct(productId: string): Promise<CatalogProductRow> {
  try {
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
  } catch {
    const fallbackProduct = fallbackCatalogProducts().find(
      (product) => product.sku === productId || product.code === productId,
    );

    if (!fallbackProduct) {
      throw new Error(`Catalog product request failed: fallback product not found for ${productId}`);
    }

    return fallbackProduct;
  }
}
