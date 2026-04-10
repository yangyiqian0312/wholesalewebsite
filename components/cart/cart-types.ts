export type CartItem = {
  code: string;
  name: string;
  sku: string;
  upc: string;
  imageUrl?: string;
  imageLabel: string;
  productPath?: string;
  wholesale: string;
  originalPrice?: string;
  quantity: number;
};

export type CartProductInput = Omit<CartItem, "quantity">;
