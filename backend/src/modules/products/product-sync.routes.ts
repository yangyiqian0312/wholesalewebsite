import type { FastifyInstance } from "fastify";
import { getProductSyncState, startProductSync } from "./product-sync.service.js";

export async function registerProductSyncRoutes(app: FastifyInstance) {
  app.post("/api/sync/inflow/products", async (request, reply) => {
    try {
      const result = startProductSync();
      return reply.status(result.started ? 202 : 200).send(result);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync products into the local database",
      });
    }
  });

  app.get("/api/sync/inflow/products/status", async (_request, reply) => {
    return reply.send(getProductSyncState());
  });
}
