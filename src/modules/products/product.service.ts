import { ProductRepository } from "./product.repository";
import {
  CreateProductInput,
  PaginatedProducts,
  Product,
  ProductListQuery,
} from "./product.types";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  private normalizeValue(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ");
    }
  private resolveAliases(value: string): string {
    const aliases: Record<string, string> = {
        "audio interface": "audio-interface",
        "audi interface": "audio-interface",
        "mic": "microphone",
        "mics": "microphone",
        "drum": "drums",
    };

    const normalized = this.normalizeValue(value);
    return aliases[normalized] ?? value;
  }
  
  private levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, () =>
        Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
        );
        }
    }

    return dp[a.length][b.length];
  }

  private matchesSearch(product: Product, rawSearch: string): boolean {
    const search = this.normalizeValue(this.resolveAliases(rawSearch));

    const fields = [
        this.normalizeValue(product.name),
        this.normalizeValue(product.brand),
        this.normalizeValue(product.category),
    ];

    for (const field of fields) {
        if (field.includes(search)) {
            return true;
        }

        const words = field.split(" ");
            for (const word of words) {
            const distance = this.levenshtein(search, word);

            if (distance <= 1) {
                return true;
            }

            if (search.length >= 5 && distance <= 2) {
                return true;
            }
        }
    }

    return false;
  }

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
      results = results.filter((product) => this.matchesSearch(product, search));
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