import type { ProductCategory } from "./product-categories";

export interface Product {
  id: number;
  product_category_id: number;
  name: string;
  price: number;
  stock: number;
  image?: string | null;
  product_category?: ProductCategory;
}
