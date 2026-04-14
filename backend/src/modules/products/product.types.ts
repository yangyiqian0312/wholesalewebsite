export type InflowProduct = {
  prices?: Array<{
    pricingSchemeId?: string;
    productPriceId?: string;
    priceType?: string;
    unitPrice?: string | null;
  }>;
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
  customFields?: {
    custom1?: string;
    custom2?: string;
    custom3?: string;
    custom4?: string;
    custom5?: string;
    custom6?: string;
    custom7?: string;
    custom8?: string;
    custom9?: string;
    custom10?: string;
  };
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

export type InflowPricingScheme = {
  pricingSchemeId?: string;
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
};

export type InflowPricingSchemeListResponse = InflowPricingScheme[];
