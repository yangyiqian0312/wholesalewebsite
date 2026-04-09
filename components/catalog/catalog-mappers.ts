import { catalogProducts } from "./catalog-data";
import type { CatalogProductRow } from "./catalog-types";

type InflowProduct = {
  productId?: string;
  name?: string;
  sku?: string;
  barcode?: string;
  upc?: string;
  marketPrice?: string;
  itemType?: string;
  categoryId?: string;
  description?: string;
  standardUomName?: string;
  lastModifiedDateTime?: string;
  isActive?: boolean;
  totalQuantityOnHand?: string;
  defaultPrice?: {
    unitPrice?: string;
  };
  imageSmallUrl?: string;
  defaultImage?: {
    largeUrl?: string;
    mediumUncroppedUrl?: string;
    mediumUrl?: string;
    originalUrl?: string;
    smallUrl?: string;
    thumbUrl?: string;
  };
  productBarcodes?: Array<{
    barcode?: string;
  }>;
};

function formatDate(value?: string) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toISOString().slice(0, 10);
}

function formatMoney(value?: string) {
  if (!value) {
    return "N/A";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return `$${amount.toFixed(2)}`;
}

function parseQuantity(value?: string) {
  if (!value) {
    return 0;
  }

  const quantity = Number(value);
  return Number.isNaN(quantity) ? 0 : quantity;
}

function buildImageLabel(name?: string) {
  if (!name) {
    return "PRODUCT";
  }

  return name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ")
    .toUpperCase() || "PRODUCT";
}

function buildTags(product: InflowProduct): CatalogProductRow["tags"] {
  const quantityOnHand = parseQuantity(product.totalQuantityOnHand);

  if (product.isActive === false || quantityOnHand <= 0) {
    return ["Out of Stock"];
  }

  if (quantityOnHand <= 5) {
    return ["Low Stock"];
  }

  return ["In Stock"];
}

function buildBarcode(product: InflowProduct) {
  const relatedBarcode = product.productBarcodes?.find((item) => item.barcode)?.barcode;
  return product.upc || product.barcode || relatedBarcode || "N/A";
}

function buildImageUrl(product: InflowProduct) {
  return (
    product.defaultImage?.mediumUrl ||
    product.defaultImage?.smallUrl ||
    product.defaultImage?.thumbUrl ||
    product.defaultImage?.largeUrl ||
    product.defaultImage?.originalUrl ||
    product.imageSmallUrl ||
    undefined
  );
}

export function mapInflowProductToCatalogRow(product: InflowProduct): CatalogProductRow {
  const quantityOnHand = parseQuantity(product.totalQuantityOnHand);
  const trimmedSku = product.sku?.trim();

  return {
    code: product.productId ?? product.name ?? crypto.randomUUID(),
    imageLabel: buildImageLabel(product.name),
    imageUrl: buildImageUrl(product),
    productPath: trimmedSku ? `/catalog/${encodeURIComponent(trimmedSku)}` : undefined,
    name: product.name?.trim() || "Unnamed product",
    sku: trimmedSku || "N/A",
    upc: buildBarcode(product),
    description: typeof product.description === "string" ? product.description : undefined,
    originalPrice: formatMoney(product.marketPrice),
    wholesale: formatMoney(product.defaultPrice?.unitPrice),
    wholesaleNote: "",
    releaseDate: formatDate(product.lastModifiedDateTime),
    quantity: "",
    tags: buildTags(product),
  };
}

export function fallbackCatalogProducts() {
  return catalogProducts.map((product) => ({
    ...product,
    originalPrice: "N/A",
    productPath: product.sku ? `/catalog/${product.sku}` : undefined,
  })) satisfies readonly CatalogProductRow[];
}

export function filterSellableCatalogProducts(products: readonly CatalogProductRow[]) {
  return products.filter((product) => !product.tags.includes("Out of Stock"));
}
