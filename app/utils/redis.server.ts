// app/utils/redis.server.ts
import Redis from "ioredis";

// These secrets are set on your main app via: 
//   fly secrets set REDIS_HOST="notify_rush_redis.internal" REDIS_PORT="6379" ...
const host = process.env.REDIS_HOST || "notify-rush-redis.internal";
const port = parseInt(process.env.REDIS_PORT || "6379", 10);
const password = process.env.REDIS_PASSWORD || undefined;

// For Fly's private networking, typically no TLS. If IPv6 needed, do family: 6
export const redis = new Redis({
  host,
  port,
  password,
  family: 6, // uncomment if you want to force IPv6
});

redis.on("connect", () => {
  console.log("Redis connected on", host, port);
});
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
