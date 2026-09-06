import { emailQueue } from "../queue/email.queue.js";

async function testQueue() {
  try {
    const job = await emailQueue.add(
      "test-email",
      {
        emailId: "test-email-id"
      },
      {
        delay: 5000
      }
    );

    console.log("BullMQ job created:", job.id);

    await emailQueue.close();
    process.exit(0);
  } catch (error) {
    console.error("BullMQ queue test failed:", error);
    process.exit(1);
  }
}

testQueue();