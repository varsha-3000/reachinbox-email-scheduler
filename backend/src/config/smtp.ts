import nodemailer from "nodemailer";

const smtpPort = Number(process.env.ETHEREAL_PORT) || 587;

export const transporter = nodemailer.createTransport({
  host: process.env.ETHEREAL_HOST || "smtp.ethereal.email",
  port: smtpPort,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASSWORD
  }
});