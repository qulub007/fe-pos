import type { Customer } from "./customers";
import type { Product } from "./products";

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Transaction {
  id: number;
  code: string;
  customer_id: number;
  subtotal: number;
  tax: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  items?: TransactionItem[];
}
