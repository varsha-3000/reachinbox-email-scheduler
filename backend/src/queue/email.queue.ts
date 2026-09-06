import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const EMAIL_QUEUE_NAME = "email-scheduler";

export interface EmailJobData {
  emailId: string;
}

export const emailQueue = new Queue<EmailJobData>(
  EMAIL_QUEUE_NAME,
  {
    connection: redisConnection
  }
);