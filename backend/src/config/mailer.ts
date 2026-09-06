import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const smtpPort = Number(process.env.ETHEREAL_PORT) || 587;

export const mailer = nodemailer.createTransport({
  host: process.env.ETHEREAL_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASSWORD
  }
});