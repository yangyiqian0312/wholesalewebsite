import type { FastifyBaseLogger } from "fastify";
import { config } from "../../config.js";
import { syncInflowProductsToDatabase } from "./product-sync.service.js";

const ONE_MINUTE_MS = 60 * 1000;

type ProductSyncScheduler = {
  stop: () => void;
};

export function startProductSyncScheduler(logger: FastifyBaseLogger): ProductSyncScheduler {
  if (!config.PRODUCT_SYNC_ENABLED) {
    logger.info("Automatic product sync is disabled.");
    return {
      stop: () => undefined,
    };
  }

  const intervalMs = config.PRODUCT_SYNC_INTERVAL_MINUTES * ONE_MINUTE_MS;
  let isRunning = false;

  const runSync = async () => {
    if (isRunning) {
      logger.warn("Skipping scheduled product sync because a previous sync is still running.");
      return;
    }

    isRunning = true;

    try {
      logger.info(
        {
          intervalMinutes: config.PRODUCT_SYNC_INTERVAL_MINUTES,
        },
        "Starting scheduled product sync.",
      );

      const result = await syncInflowProductsToDatabase();

      logger.info(result, "Scheduled product sync completed.");
    } catch (error) {
      logger.error(error, "Scheduled product sync failed.");
    } finally {
      isRunning = false;
    }
  };

  const initialTimeout = setTimeout(() => {
    void runSync();
  }, 30 * 1000);

  const interval = setInterval(() => {
    void runSync();
  }, intervalMs);

  logger.info(
    {
      intervalMinutes: config.PRODUCT_SYNC_INTERVAL_MINUTES,
    },
    "Automatic product sync scheduler started.",
  );

  return {
    stop: () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    },
  };
}
