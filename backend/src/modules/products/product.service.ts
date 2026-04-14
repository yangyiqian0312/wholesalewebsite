import { inflowRequest } from "../../integrations/inflow/client.js";
import type { InflowProduct, InflowProductListResponse } from "./product.types.js";

const DEFAULT_INCLUDE = "defaultPrice,prices,productBarcodes,inventoryLines.location,defaultImage";
const INFLOW_PAGE_SIZE = 100;
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;
const PRODUCT_STALE_TTL_MS = 30 * 60 * 1000;

type FetchProductsParams = {
  include?: string;
  inStockOnly?: boolean;
  smart?: string;
};

type ProductCacheEntry = {
  products: InflowProduct[];
  fetchedAt: number;
};

const productCache = new Map<string, ProductCacheEntry>();
const inFlightRequests = new Map<string, Promise<InflowProduct[]>>();

function parseQuantity(value?: string) {
  if (!value) {
    return 0;
  }

  const quantity = Number(value);
  return Number.isNaN(quantity) ? 0 : quantity;
}

function isSellableProduct(product: InflowProduct) {
  if (product.isActive === false) {
    return false;
  }

  return parseQuantity(product.totalQuantityOnHand) > 0;
}

function buildCacheKey(params: Required<FetchProductsParams>) {
  return JSON.stringify(params);
}

function getCachedProducts(cacheKey: string, maxAgeMs: number) {
  const cachedEntry = productCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.fetchedAt > maxAgeMs) {
    return null;
  }

  return cachedEntry.products;
}

async function fetchProductsFromInflow(include: string, smart?: string) {
  const allProducts: InflowProduct[] = [];
  let skip = 0;

  while (true) {
    const query: Record<string, string | number | undefined> = {
      count: INFLOW_PAGE_SIZE,
      include,
      skip,
    };

    if (smart) {
      query["filter[smart]"] = smart;
    }

    const page = await inflowRequest<InflowProductListResponse>("/products", query);

    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    allProducts.push(...page);

    if (page.length < INFLOW_PAGE_SIZE) {
      break;
    }

    skip += INFLOW_PAGE_SIZE;
  }

  return allProducts;
}

export async function fetchProducts(params: FetchProductsParams) {
  const normalizedParams: Required<FetchProductsParams> = {
    include: params.include ?? DEFAULT_INCLUDE,
    inStockOnly: params.inStockOnly ?? true,
    smart: params.smart ?? "",
  };

  const cacheKey = buildCacheKey(normalizedParams);
  const freshProducts = getCachedProducts(cacheKey, PRODUCT_CACHE_TTL_MS);

  if (freshProducts) {
    return freshProducts;
  }

  const runningRequest = inFlightRequests.get(cacheKey);

  if (runningRequest) {
    return runningRequest;
  }

  const requestPromise = (async () => {
    try {
      const rawProducts = await fetchProductsFromInflow(
        normalizedParams.include,
        normalizedParams.smart || undefined,
      );
      const products = normalizedParams.inStockOnly
        ? rawProducts.filter(isSellableProduct)
        : rawProducts;

      productCache.set(cacheKey, {
        products,
        fetchedAt: Date.now(),
      });

      return products;
    } catch (error) {
      const staleProducts = getCachedProducts(cacheKey, PRODUCT_STALE_TTL_MS);

      if (staleProducts) {
        return staleProducts;
      }

      throw error;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

export async function upsertInflowProduct(payload: Record<string, unknown>) {
  return inflowRequest<InflowProduct>(
    "/products",
    {},
    {
      method: "PUT",
      body: payload,
    },
  );
}

export async function fetchInflowProductById(productId: string) {
  return inflowRequest<InflowProduct>(`/products/${productId}`);
}
