import { mailer } from "../config/mailer.js";

interface SendMailData {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(data: SendMailData) {
  const result = await mailer.sendMail({
    from: data.from,
    to: data.to,
    subject: data.subject,
    text: data.text
  });

  return {
    messageId: result.messageId,
    previewUrl: mailer.getTestMessageUrl(result) || null
  };
}