import type { FastifyInstance } from "fastify";
import { syncInflowProductsToDatabase } from "./product-sync.service.js";

export async function registerProductSyncRoutes(app: FastifyInstance) {
  app.post("/api/sync/inflow/products", async (request, reply) => {
    try {
      const result = await syncInflowProductsToDatabase();
      return reply.send(result);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: "Failed to sync products into the local database",
      });
    }
  });
}
