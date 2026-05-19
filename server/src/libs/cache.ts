import { Redis } from "ioredis";
import { env } from "@/config/env.js";
import { logger } from "@/libs/logger.js";

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required for BullMQ
    lazyConnect: true,
});

redis.on("connect", () => logger.info({ event: "REDIS_CONNECTED" }, "Redis connected"));
redis.on("error", (err) => logger.error({ err, event: "REDIS_ERROR" }, "Redis error"));