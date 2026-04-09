export type CatalogTagTone = "In Stock" | "Low Stock" | "Out of Stock" | "Pre-Order" | "New Arrival" | "Hot Title";

export type CatalogProductRow = {
  code: string;
  imageLabel: string;
  imageUrl?: string;
  productPath?: string;
  name: string;
  sku: string;
  upc: string;
  description?: string;
  originalPrice: string;
  wholesale: string;
  wholesaleNote: string;
  releaseDate: string;
  quantity: string;
  tags: readonly CatalogTagTone[];
};

export type CatalogCategoryOption = {
  value: string;
  label: string;
  count: number;
};

export type CatalogPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CatalogProductsResult = {
  items: readonly CatalogProductRow[];
  pagination: CatalogPagination;
};
