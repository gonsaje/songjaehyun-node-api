import { ProductRepository } from "./product.repository";
import {
  CreateProductInput,
  PaginatedProducts,
  Product,
  ProductListQuery,
} from "./product.types";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  listProducts(query: ProductListQuery): PaginatedProducts {
    const {
      category,
      brand,
      condition,
      search,
      sortBy = "name",
      order = "asc",
      page = 1,
      pageSize = 10,
    } = query;

    let results = this.repository.findAll();

    if (category) {
      results = results.filter((product) => product.category === category);
    }

    if (brand) {
      const normalizedBrand = brand.toLowerCase();
      results = results.filter(
        (product) => product.brand.toLowerCase() === normalizedBrand
      );
    }

    if (condition) {
      results = results.filter((product) => product.condition === condition);
    }

    if (search) {
      const normalizedSearch = search.toLowerCase();
      results = results.filter((product) =>
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch)
      );
    }

    results = this.sortProducts(results, sortBy, order);

    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;
    const items = results.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  getProductById(id: string): Product | undefined {
    return this.repository.findById(id);
  }

  createProduct(input: CreateProductInput): Product {
    return this.repository.create(input);
  }

  updateInventory(id: string, inventory: number): Product | undefined {
    return this.repository.updateInventory(id, inventory);
  }

  private sortProducts(
    products: Product[],
    sortBy: "name" | "price" | "rating",
    order: "asc" | "desc"
  ): Product[] {
    const sorted = [...products].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "price") {
        return a.price - b.price;
      }

      return a.rating - b.rating;
    });

    return order === "desc" ? sorted.reverse() : sorted;
  }
}