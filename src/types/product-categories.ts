import api from "@/api/axios";

export interface ProductCategory {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
}
