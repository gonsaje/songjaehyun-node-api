export type ProductCategory =
  | "guitar"
  | "piano"
  | "drums"
  | "microphone"
  | "audio-interface"
  | "studio"
  | "accessory";

export type ProductCondition = "new" | "used";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  price: number;
  inventory: number;
  condition: ProductCondition;
  rating: number;
  createdAt: string;
}

export interface ProductListQuery {
  category?: ProductCategory;
  brand?: string;
  condition?: ProductCondition;
  search?: string;
  sortBy?: "name" | "price" | "rating";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CreateProductInput {
  name: string;
  category: ProductCategory;
  brand: string;
  price: number;
  inventory: number;
  condition: ProductCondition;
  rating: number;
}

export interface PaginatedProducts {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}