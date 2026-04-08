import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { config } from "./config.js";
import { registerApplicationRoutes } from "./modules/applications/application.routes.js";
import { registerOrderRoutes } from "./modules/orders/order.routes.js";
import { registerProductRoutes } from "./modules/products/product.routes.js";
import { registerProductSyncRoutes } from "./modules/products/product-sync.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: config.FRONTEND_ORIGIN,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-token"],
  });
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
    },
  });

  app.get("/api/health", async () => {
    return {
      ok: true,
    };
  });

  app.register(registerProductRoutes);
  app.register(registerProductSyncRoutes);
  app.register(registerApplicationRoutes);
  app.register(registerOrderRoutes);

  return app;
}
