import type { Request, Response } from "express";
import {
  getScheduledEmails,
  getSentEmails,
  scheduleEmail
} from "../services/email.service.js";
import { searchEmails } from "../services/search.service.js";

export async function scheduleEmailController(
  req: Request,
  res: Response
) {
  try {
    const {
      recipient,
      subject,
      body,
      scheduledAt,
      senderEmail
    } = req.body;

    if (
      !recipient ||
      !subject ||
      !body ||
      !scheduledAt ||
      !senderEmail
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const email = await scheduleEmail({
      recipient,
      subject,
      body,
      scheduledAt,
      senderEmail
    });

    return res.status(201).json({
      message: "Email scheduled successfully",
      email
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to schedule email";

    return res.status(400).json({
      message
    });
  }
}

export async function getScheduledEmailsController(
  _req: Request,
  res: Response
) {
  try {
    const emails = await getScheduledEmails();

    return res.status(200).json({
      emails,
      count: emails.length
    });
  } catch (error) {
    console.error("Unable to fetch scheduled emails:", error);

    return res.status(500).json({
      message: "Unable to fetch scheduled emails"
    });
  }
}

export async function getSentEmailsController(
  _req: Request,
  res: Response
) {
  try {
    const emails = await getSentEmails();

    return res.status(200).json({
      emails,
      count: emails.length
    });
  } catch (error) {
    console.error("Unable to fetch sent emails:", error);

    return res.status(500).json({
      message: "Unable to fetch sent emails"
    });
  }
}
export async function searchEmailsController(
  req: Request,
  res: Response
) {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        message: "Search query is required"
      });
    }

    const emails = await searchEmails(query);

    return res.status(200).json({
      emails,
      count: emails.length
    });
  } catch (error) {
    console.error("Email search failed:", error);

    return res.status(500).json({
      message: "Unable to search emails"
    });
  }
}