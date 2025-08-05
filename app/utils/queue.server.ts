// app/utils/queue.server.ts
import Queue from "bull";
import { redis } from "./redis.server";
import { processShopifySync } from "app/jobs/syncShopifyJob"; // Correct import path

// Create the queue
export const shopifySyncTestQueue = new Queue("shopify-sync-test-queue", {
  redis: {
    host: redis.options.host as string,
    port: redis.options.port as number,
    password: redis.options.password as string | undefined,
    family: redis.options.family as number | undefined,
  },
});

// Register the processor for the "testShopify" job type
shopifySyncTestQueue.process("testShopify", async (job) => {
  console.log(`[Queue Processor] Processing job with ID: ${job.id} and type: ${job.name}`);
  return await processShopifySync(job);
});

// Optional: Events for debugging
shopifySyncTestQueue.on("completed", (job, result) => {
  console.log(`[TEST SYNC] Job ${job.id} completed with result:`, result);
});

shopifySyncTestQueue.on("failed", (job, err) => {
  console.error(`[TEST SYNC] Job ${job.id} failed with error:`, err);
});
