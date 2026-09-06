import dotenv from "dotenv";
import IORedis from "ioredis";

dotenv.config();

const redisPort = Number(process.env.REDIS_PORT) || 6379;
const useTls = process.env.REDIS_TLS === "true";

if (!process.env.REDIS_HOST) {
  throw new Error("REDIS_HOST is missing");
}

if (!process.env.REDIS_PASSWORD) {
  throw new Error("REDIS_PASSWORD is missing");
}

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: redisPort,
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  tls: useTls ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});