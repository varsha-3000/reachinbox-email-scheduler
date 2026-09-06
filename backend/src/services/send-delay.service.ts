import { redisConnection } from "../config/redis.js";

const DELAY_KEY = "email-scheduler:next-send-time";

export async function waitForSendSlot() {
  const minimumDelay = Number(
    process.env.MIN_EMAIL_DELAY_MS || 2000
  );

  const now = Date.now();

  const script = `
    local nextTime = redis.call("GET", KEYS[1])

    if not nextTime then
      nextTime = ARGV[1]
    end

    nextTime = tonumber(nextTime)

    if nextTime < tonumber(ARGV[1]) then
      nextTime = tonumber(ARGV[1])
    end

    redis.call(
      "SET",
      KEYS[1],
      nextTime + tonumber(ARGV[2]),
      "PX",
      tonumber(ARGV[2]) * 2
    )

    return nextTime
  `;

  const reservedTime = await redisConnection.eval(
    script,
    1,
    DELAY_KEY,
    now.toString(),
    minimumDelay.toString()
  );

  const waitTime = Math.max(
    Number(reservedTime) - Date.now(),
    0
  );

  if (waitTime > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, waitTime);
    });
  }
}