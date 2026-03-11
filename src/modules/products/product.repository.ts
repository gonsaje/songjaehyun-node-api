import { randomUUID } from "crypto";
import { CreateProductInput, Product } from "./product.types";

export class ProductRepository {
  private products: Product[] = [
    {
      id: randomUUID(),
      name: "Fender Stratocaster",
      category: "guitar",
      brand: "Fender",
      price: 1299.99,
      inventory: 5,
      condition: "new",
      rating: 4.8,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Gibson Les Paul Studio",
      category: "guitar",
      brand: "Gibson",
      price: 1499.99,
      inventory: 2,
      condition: "used",
      rating: 4.7,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Yamaha Pacifica 112V",
      category: "guitar",
      brand: "Yamaha",
      price: 349.99,
      inventory: 6,
      condition: "new",
      rating: 4.4,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Roland FP-30X Digital Piano",
      category: "piano",
      brand: "Roland",
      price: 699.99,
      inventory: 7,
      condition: "new",
      rating: 4.6,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Yamaha P-145",
      category: "piano",
      brand: "Yamaha",
      price: 649.99,
      inventory: 3,
      condition: "used",
      rating: 4.3,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Ludwig Breakbeats Kit",
      category: "drums",
      brand: "Ludwig",
      price: 499.99,
      inventory: 4,
      condition: "new",
      rating: 4.5,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Shure SM7B Microphone",
      category: "microphone",
      brand: "Shure",
      price: 399.99,
      inventory: 10,
      condition: "new",
      rating: 4.9,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Audio-Technica AT2020",
      category: "microphone",
      brand: "Audio-Technica",
      price: 99.99,
      inventory: 8,
      condition: "used",
      rating: 4.4,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Focusrite Scarlett 2i2",
      category: "audio-interface",
      brand: "Focusrite",
      price: 179.99,
      inventory: 4,
      condition: "used",
      rating: 4.5,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      name: "Universal Audio Volt 2",
      category: "audio-interface",
      brand: "Universal Audio",
      price: 189.99,
      inventory: 5,
      condition: "new",
      rating: 4.6,
      createdAt: new Date().toISOString(),
    },
  ];

  findAll(): Product[] {
    return [...this.products];
  }

  findById(id: string): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  create(input: CreateProductInput): Product {
    const product: Product = {
      id: randomUUID(),
      name: input.name,
      category: input.category,
      brand: input.brand,
      price: input.price,
      inventory: input.inventory,
      condition: input.condition,
      rating: input.rating,
      createdAt: new Date().toISOString(),
    };

    this.products.push(product);
    return product;
  }

  updateInventory(id: string, inventory: number): Product | undefined {
    const product = this.products.find((item) => item.id === id);

    if (!product) {
      return undefined;
    }

    product.inventory = inventory;
    return product;
  }
}