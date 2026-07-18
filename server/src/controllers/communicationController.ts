import type { Request, Response } from 'express';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import { sendEmail } from '../services/email.js';
import { sendMessage, type Channel } from '../services/messaging.js';
import { isEmailConfigured, isTwilioConfigured } from '../config/env.js';
import {
  ERROR_MESSAGES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
} from '../utils/constants.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * @desc    Send an email to a lead and log it as an activity
 * @route   POST /api/v1/leads/:id/email
 * @access  Private
 */
export const sendLeadEmail = async (req: Request, res: Response): Promise<void> => {
  if (!isEmailConfigured) {
    res.status(503).json({
      success: false,
      message: 'Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD on the server.',
    });
    return;
  }

  try {
    const { subject, body } = req.body as { subject?: string; body?: string };
    if (!subject || !body) {
      res.status(400).json({ success: false, message: 'Subject and body are required' });
      return;
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const result = await sendEmail({
      to: lead.email,
      subject,
      html: body.replace(/\n/g, '<br/>'),
      text: body,
    });

    await Activity.create({
      type: ACTIVITY_TYPES.EMAIL,
      subject: `Email: ${subject}`,
      description: body,
      leadId: lead._id,
      userId: req.user._id,
      status: ACTIVITY_STATUS.COMPLETED,
    });

    logger.info(`Email sent to lead ${lead.leadNumber} by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Email sent successfully', data: result });
  } catch (error) {
    logger.error(`Send lead email error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};

/**
 * @desc    Send a WhatsApp/SMS message to a lead and log it as an activity
 * @route   POST /api/v1/leads/:id/message
 * @access  Private
 */
export const sendLeadMessage = async (req: Request, res: Response): Promise<void> => {
  if (!isTwilioConfigured) {
    res.status(503).json({
      success: false,
      message: 'Messaging is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN on the server.',
    });
    return;
  }

  try {
    const { channel, body } = req.body as { channel?: Channel; body?: string };
    if (!body || (channel !== 'sms' && channel !== 'whatsapp')) {
      res.status(400).json({ success: false, message: 'A valid channel (sms|whatsapp) and body are required' });
      return;
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const result = await sendMessage(channel, lead.phone, body);

    await Activity.create({
      type: ACTIVITY_TYPES.NOTE,
      subject: `${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} message sent`,
      description: body,
      leadId: lead._id,
      userId: req.user._id,
      status: ACTIVITY_STATUS.COMPLETED,
    });

    logger.info(`${channel} sent to lead ${lead.leadNumber} by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Message sent successfully', data: result });
  } catch (error) {
    logger.error(`Send lead message error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};
