export type InflowProduct = {
  productId?: string;
  id?: string;
  entityId?: string;
  name?: string;
  productName?: string;
  sku?: string;
  barcode?: string;
  upc?: string;
  productType?: string;
  itemType?: string;
  description?: string;
  totalQuantityOnHand?: string;
  isActive?: boolean;
  lastModifiedDateTime?: string;
  imageSmallUrl?: string;
  defaultImage?: {
    imageId?: string;
    largeUrl?: string;
    mediumUncroppedUrl?: string;
    mediumUrl?: string;
    originalUrl?: string;
    smallUrl?: string;
    thumbUrl?: string;
  };
  defaultPrice?: {
    unitPrice?: string;
  };
  productBarcodes?: Array<{
    barcode?: string;
  }>;
  inventoryLines?: Array<{
    quantityOnHand?: string;
    locationId?: string;
    location?: {
      name?: string;
    };
  }>;
  [key: string]: unknown;
};

export type InflowProductListResponse = InflowProduct[];
