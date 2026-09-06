import dotenv from "dotenv";
import { Worker } from "bullmq";
import { pool } from "../config/database.js";
import { redisConnection } from "../config/redis.js";
import { sendMail } from "../services/mailer.service.js";
import { waitForSendSlot } from "../services/send-delay.service.js";
import { EMAIL_QUEUE_NAME,type EmailJobData } from "./email.queue.js";
import { indexEmail } from "../services/search.service.js";

dotenv.config();

const workerConcurrency = Number(
    process.env.WORKER_CONCURRENCY || 5
);

const maxEmailsPerHour = Number(
    process.env.MAX_EMAILS_PER_HOUR || 200
);

const emailWorker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
        const emailId = job.data.emailId;

        const result = await pool.query(
            `
      SELECT
        emails.id,
        emails.recipient,
        emails.subject,
        emails.body,
        emails.status,
        emails.scheduled_at,
        senders.email AS sender_email
      FROM emails
      LEFT JOIN senders
        ON senders.id = emails.sender_id
      WHERE emails.id = $1
      `,
            [emailId]
        );

        if (result.rows.length === 0) {
            throw new Error("Email record not found");
        }

        const email = result.rows[0];

        if (email.status === "sent") {
            console.log(`Email ${emailId} was already sent`);
            return;
        }

        const lockResult = await pool.query(
            `
  UPDATE emails
  SET
    status = 'sending',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
    AND status = 'scheduled'
  RETURNING id
  `,
            [emailId]
        );

        if (lockResult.rows.length === 0) {
            console.log(
                `Email ${emailId} was already claimed or processed`
            );
            return;
        }

        await pool.query(
            `
      UPDATE emails
      SET status = 'sending',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND status = 'scheduled'
      `,
            [emailId]
        );

        await waitForSendSlot();

        const mailResult = await sendMail({
            from: email.sender_email || process.env.ETHEREAL_USER || "",
            to: email.recipient,
            subject: email.subject,
            text: email.body
        });

        await pool.query(
            `
      UPDATE emails
      SET
        status = 'sent',
        sent_at = CURRENT_TIMESTAMP,
        message_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
            [
                mailResult.messageId,
                emailId
            ]
        );

        await indexEmail({
            id: email.id,
            recipient: email.recipient,
            senderEmail: email.sender_email,
            subject: email.subject,
            body: email.body,
            status: "sent",
            scheduledAt: new Date(
                email.scheduled_at
            ).toISOString(),
            sentAt: new Date().toISOString()
        });

        console.log(
            `Email sent successfully: ${email.recipient}`
        );

        if (mailResult.previewUrl) {
            console.log(
                `Preview URL: ${mailResult.previewUrl}`
            );
        }

        return {
            emailId,
            messageId: mailResult.messageId
        };
    },
    {
        connection: redisConnection,
        concurrency: workerConcurrency,
        limiter: {
            max: maxEmailsPerHour,
            duration: 60 * 60 * 1000
        }
    }
);

emailWorker.on("completed", (job) => {
    console.log(`Job completed: ${job.id}`);
});

emailWorker.on("failed", async (job, error) => {
  console.error(
    `Job failed: ${job?.id}`,
    error.message
  );

  if (!job?.data.emailId) {
    return;
  }

  try {
    const updateResult = await pool.query(
      `
      UPDATE emails
      SET
        status = 'failed',
        error_message = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        recipient,
        subject,
        body,
        status,
        scheduled_at,
        sent_at,
        sender_id
      `,
      [
        error.message,
        job.data.emailId
      ]
    );

    if (updateResult.rows.length === 0) {
      return;
    }

    const email = updateResult.rows[0];

    const senderResult = await pool.query(
      `
      SELECT email
      FROM senders
      WHERE id = $1
      `,
      [email.sender_id]
    );

    await indexEmail({
      id: email.id,
      recipient: email.recipient,
      senderEmail:
        senderResult.rows[0]?.email || null,
      subject: email.subject,
      body: email.body,
      status: "failed",
      scheduledAt: new Date(
        email.scheduled_at
      ).toISOString(),
      sentAt: email.sent_at
        ? new Date(email.sent_at).toISOString()
        : null
    });
  } catch (handlerError) {
    console.error(
      "Unable to update failed email:",
      handlerError
    );
  }
});

emailWorker.on("error", (error) => {
    console.error("Worker error:", error.message);
});

console.log(
    `Email worker started with concurrency: ${workerConcurrency}`
);