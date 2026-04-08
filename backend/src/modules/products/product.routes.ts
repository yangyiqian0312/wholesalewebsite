import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../../config.js";
import {
  fetchCatalogCategoryCountsFromDatabase,
  fetchCatalogProductFromDatabase,
  fetchCatalogProductsFromDatabase,
  updateCatalogProductInDatabase,
} from "./catalog-product.service.js";
import { updateCatalogProductSchema } from "./admin-product.types.js";
import { fetchProducts } from "./product.service.js";
import { isCatalogCategoryValue } from "./catalog-category-rules.js";

const booleanQueryParam = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }

    return undefined;
  });

const productQuerySchema = z.object({
  include: z.string().min(1).optional(),
  inStockOnly: booleanQueryParam.default(true),
  smart: z.string().min(1).optional(),
  category: z
    .string()
    .optional()
    .transform((value) => (value && isCatalogCategoryValue(value) ? value : undefined)),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export async function registerProductRoutes(app: FastifyInstance) {
  function isAuthorizedAdminRequest(request: FastifyRequest) {
    const token = request.headers["x-admin-token"];
    return typeof token === "string" && token === config.ADMIN_API_TOKEN;
  }

  app.get("/api/catalog/products/:productId", async (request, reply) => {
    const productId = z.string().min(1).safeParse(
      (request.params as { productId?: string }).productId,
    );

    if (!productId.success) {
      return reply.status(400).send({
        error: "Invalid product id",
      });
    }

    try {
      const product = await fetchCatalogProductFromDatabase(productId.data);

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
        });
      }

      return reply.send(product);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch product from the local catalog database",
      });
    }
  });

  app.patch("/api/admin/catalog/products/:productId", async (request, reply) => {
    if (!isAuthorizedAdminRequest(request)) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const productId = z.string().min(1).safeParse(
      (request.params as { productId?: string }).productId,
    );

    if (!productId.success) {
      return reply.status(400).send({
        error: "Invalid product id",
      });
    }

    const parsedBody = updateCatalogProductSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Invalid product update payload",
        details: parsedBody.error.flatten(),
      });
    }

    try {
      const product = await updateCatalogProductInDatabase(productId.data, parsedBody.data);
      return reply.send(product);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to update local catalog product",
      });
    }
  });

  app.get("/api/catalog/products", async (request, reply) => {
    const parsedQuery = productQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: parsedQuery.error.flatten(),
      });
    }

    try {
      const products = await fetchCatalogProductsFromDatabase(parsedQuery.data);

      return reply.send(products);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch products from the local catalog database",
      });
    }
  });

  app.get("/api/catalog/filter-options", async (request, reply) => {
    const parsedQuery = productQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: parsedQuery.error.flatten(),
      });
    }

    try {
      const categories = await fetchCatalogCategoryCountsFromDatabase(parsedQuery.data);

      return reply.send({
        categories,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to fetch catalog filter options",
      });
    }
  });

  app.get("/api/inflow/products", async (request, reply) => {
    const parsedQuery = productQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: "Invalid query parameters",
        details: parsedQuery.error.flatten(),
      });
    }

    try {
      const products = await fetchProducts(parsedQuery.data);

      return reply.send(products);
    } catch (error) {
      request.log.error(error);

      return reply.status(502).send({
        error: "Failed to fetch products from Inflow",
      });
    }
  });
}
