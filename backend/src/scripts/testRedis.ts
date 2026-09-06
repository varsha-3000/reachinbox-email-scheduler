import { redisConnection } from "../config/redis.js";

async function testRedis() {
  try {
    const result = await redisConnection.ping();

    console.log("Redis connected successfully");
    console.log("Redis ping result:", result);
  } catch (error) {
    console.error("Redis test failed:", error);
    process.exitCode = 1;
  } finally {
    await redisConnection.quit();
  }
}

testRedis();