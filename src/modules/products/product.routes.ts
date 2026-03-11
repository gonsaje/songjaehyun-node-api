import { FastifyInstance } from "fastify";
import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";
import {
  CreateProductInput,
  ProductCategory,
  ProductCondition,
} from "./product.types";

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);

const allowedCategories: ProductCategory[] = [
  "guitar",
  "piano",
  "drums",
  "microphone",
  "audio-interface",
  "studio",
  "accessory",
];

const allowedConditions: ProductCondition[] = ["new", "used"];

export async function registerProductRoutes(app: FastifyInstance) {
  app.get("/api/products", async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;

    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;

    const category = query.category as ProductCategory | undefined;
    const brand = query.brand;
    const condition = query.condition as ProductCondition | undefined;
    const search = query.search;
    const sortBy =
      (query.sortBy as "name" | "price" | "rating" | undefined) ?? "name";
    const order = (query.order as "asc" | "desc" | undefined) ?? "asc";

    if (category && !allowedCategories.includes(category)) {
      return reply.status(400).send({
        error: {
          code: "INVALID_CATEGORY",
          message: `category must be one of: ${allowedCategories.join(", ")}`,
        },
      });
    }

    if (condition && !allowedConditions.includes(condition)) {
      return reply.status(400).send({
        error: {
          code: "INVALID_CONDITION",
          message: `condition must be one of: ${allowedConditions.join(", ")}`,
        },
      });
    }

    if (Number.isNaN(page) || page < 1) {
      return reply.status(400).send({
        error: {
          code: "INVALID_PAGE",
          message: "page must be greater than or equal to 1",
        },
      });
    }

    if (Number.isNaN(pageSize) || pageSize < 1) {
      return reply.status(400).send({
        error: {
          code: "INVALID_PAGE_SIZE",
          message: "pageSize must be greater than or equal to 1",
        },
      });
    }

    const result = productService.listProducts({
      category,
      brand,
      condition,
      search,
      sortBy,
      order,
      page,
      pageSize,
    });

    return reply.send(result);
  });

  app.get("/api/products/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const product = productService.getProductById(params.id);

    if (!product) {
      return reply.status(404).send({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product with id ${params.id} was not found`,
        },
      });
    }

    return reply.send(product);
  });

  app.post("/api/products", async (request, reply) => {
    const body = request.body as Partial<CreateProductInput>;

    if (!body.name || typeof body.name !== "string") {
      return reply.status(400).send({
        error: {
          code: "INVALID_NAME",
          message: "name is required",
        },
      });
    }

    if (!body.category || !allowedCategories.includes(body.category)) {
      return reply.status(400).send({
        error: {
          code: "INVALID_CATEGORY",
          message: `category must be one of: ${allowedCategories.join(", ")}`,
        },
      });
    }

    if (!body.brand || typeof body.brand !== "string" || !body.brand.trim()) {
      return reply.status(400).send({
        error: {
          code: "INVALID_BRAND",
          message: "brand is required",
        },
      });
    }

    if (!body.condition || !allowedConditions.includes(body.condition)) {
      return reply.status(400).send({
        error: {
          code: "INVALID_CONDITION",
          message: `condition must be one of: ${allowedConditions.join(", ")}`,
        },
      });
    }

    if (typeof body.price !== "number" || body.price < 0) {
      return reply.status(400).send({
        error: {
          code: "INVALID_PRICE",
          message: "price must be a non-negative number",
        },
      });
    }

    if (typeof body.inventory !== "number" || body.inventory < 0) {
      return reply.status(400).send({
        error: {
          code: "INVALID_INVENTORY",
          message: "inventory must be a non-negative number",
        },
      });
    }

    if (
      typeof body.rating !== "number" ||
      body.rating < 0 ||
      body.rating > 5
    ) {
      return reply.status(400).send({
        error: {
          code: "INVALID_RATING",
          message: "rating must be between 0 and 5",
        },
      });
    }

    const created = productService.createProduct({
      name: body.name,
      category: body.category,
      brand: body.brand.trim(),
      price: body.price,
      inventory: body.inventory,
      condition: body.condition,
      rating: body.rating,
    });

    return reply.status(201).send(created);
  });

  app.patch("/api/products/:id/inventory", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { inventory?: number };

    if (typeof body.inventory !== "number" || body.inventory < 0) {
      return reply.status(400).send({
        error: {
          code: "INVALID_INVENTORY",
          message: "inventory must be a non-negative number",
        },
      });
    }

    const updated = productService.updateInventory(params.id, body.inventory);

    if (!updated) {
      return reply.status(404).send({
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product with id ${params.id} was not found`,
        },
      });
    }

    return reply.send(updated);
  });
}