import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database.js";
import { emailQueue } from "../queue/email.queue.js";
import type { ScheduleEmailRequest } from "../types/email.js";
import { indexEmail } from "./search.service.js";

export async function scheduleEmail(
  data: ScheduleEmailRequest
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const emailId = uuidv4();

    const scheduledAt = new Date(data.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Invalid scheduled time");
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }

    const senderResult = await client.query(
      `
      SELECT id
      FROM senders
      WHERE email = $1
      LIMIT 1
      `,
      [data.senderEmail]
    );

    let senderId: string;

    if (senderResult.rows.length === 0) {
      senderId = uuidv4();

      await client.query(
        `
        INSERT INTO senders (id, email)
        VALUES ($1, $2)
        `,
        [senderId, data.senderEmail]
      );
    } else {
      senderId = senderResult.rows[0].id;
    }

    await client.query(
      `
      INSERT INTO emails (
        id,
        sender_id,
        recipient,
        subject,
        body,
        scheduled_at,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
      `,
      [
        emailId,
        senderId,
        data.recipient,
        data.subject,
        data.body,
        scheduledAt
      ]
    );

    const delay = Math.max(
      scheduledAt.getTime() - Date.now(),
      0
    );

    const job = await emailQueue.add(
      "send-email",
      {
        emailId
      },
      {
        delay,
        jobId: emailId,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    );

    await client.query(
      `
      UPDATE emails
      SET bull_job_id = $1
      WHERE id = $2
      `,
      [String(job.id), emailId]
    );

    await client.query("COMMIT");

    await indexEmail({
      id: emailId,
      recipient: data.recipient,
      senderEmail: data.senderEmail,
      subject: data.subject,
      body: data.body,
      status: "scheduled",
      scheduledAt: scheduledAt.toISOString(),
      sentAt: null
    });


    return {
      id: emailId,
      recipient: data.recipient,
      subject: data.subject,
      scheduledAt,
      status: "scheduled"
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

}

export async function getScheduledEmails() {
  const result = await pool.query(
    `
    SELECT
      emails.id,
      emails.recipient,
      emails.subject,
      emails.scheduled_at,
      emails.status,
      senders.email AS sender_email
    FROM emails
    LEFT JOIN senders
      ON senders.id = emails.sender_id
    WHERE emails.status IN ('scheduled', 'sending')
    ORDER BY emails.scheduled_at ASC
    `
  );

  return result.rows;
}

export async function getSentEmails() {
  const result = await pool.query(
    `
    SELECT
      emails.id,
      emails.recipient,
      emails.subject,
      emails.sent_at,
      emails.status,
      emails.error_message,
      senders.email AS sender_email
    FROM emails
    LEFT JOIN senders
      ON senders.id = emails.sender_id
    WHERE emails.status IN ('sent', 'failed')
    ORDER BY emails.sent_at DESC NULLS LAST
    `
  );

  return result.rows;
}