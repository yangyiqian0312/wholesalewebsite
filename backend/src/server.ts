import { buildApp } from "./app.js";
import { config } from "./config.js";
import { startProductSyncScheduler } from "./modules/products/product-sync.scheduler.js";

const app = buildApp();
const productSyncScheduler = startProductSyncScheduler(app.log);

async function start() {
  try {
    await app.listen({
      host: "0.0.0.0",
      port: config.PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  productSyncScheduler.stop();
  await app.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  productSyncScheduler.stop();
  await app.close();
  process.exit(0);
});

void start();
