import nodemailer, { type Transporter } from 'nodemailer';
import { env, isEmailConfigured } from '../config/env.js';
import logger from '../utils/logger.js';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!isEmailConfigured) return null;
  if (!transporter) {
    const port = env.SMTP_PORT ?? 587;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
};

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
}

export const sendEmail = async (input: SendEmailInput): Promise<SendEmailResult> => {
  const tx = getTransporter();
  if (!tx) {
    logger.warn('Email is not configured; skipping actual send.');
    return { sent: false };
  }

  const info = await tx.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { sent: true, messageId: info.messageId };
};
