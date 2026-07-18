import type { Request, Response } from 'express';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import { aiComplete } from '../services/ai.js';
import { isAiConfigured } from '../config/env.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const notConfigured = (res: Response): void => {
  res.status(503).json({
    success: false,
    message: 'AI features are not configured. Set OPENAI_API_KEY on the server to enable them.',
  });
};

/**
 * @desc    Draft a sales email for a lead
 * @route   POST /api/v1/ai/draft-email
 * @access  Private
 */
export const draftEmail = async (req: Request, res: Response): Promise<void> => {
  if (!isAiConfigured) {
    notConfigured(res);
    return;
  }

  try {
    const { leadId, purpose, tone } = req.body as {
      leadId?: string;
      purpose?: string;
      tone?: string;
    };

    let context = '';
    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        context = `Company: ${lead.companyName}\nContact: ${lead.contactPerson}\nIndustry: ${lead.industry ?? 'N/A'}\nStatus: ${lead.status}\nRequirements: ${lead.requirements ?? 'N/A'}`;
      }
    }

    const content = await aiComplete([
      {
        role: 'system',
        content:
          'You are a professional B2B sales assistant for a manufacturing company. Write concise, personalized outreach emails. Respond ONLY with valid JSON of the form {"subject": string, "body": string}.',
      },
      {
        role: 'user',
        content: `Write a ${tone ?? 'professional and friendly'} sales email.\nPurpose: ${purpose ?? 'follow up on the opportunity'}\n\nLead context:\n${context || 'No specific lead context provided.'}`,
      },
    ]);

    let draft: { subject: string; body: string };
    try {
      draft = JSON.parse(content) as { subject: string; body: string };
    } catch {
      draft = { subject: 'Following up', body: content };
    }

    res.status(200).json({ success: true, data: { draft } });
  } catch (error) {
    logger.error(`AI draft email error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};

/**
 * @desc    Summarize a lead's activity history and suggest next steps
 * @route   POST /api/v1/ai/summarize
 * @access  Private
 */
export const summarizeLead = async (req: Request, res: Response): Promise<void> => {
  if (!isAiConfigured) {
    notConfigured(res);
    return;
  }

  try {
    const { leadId } = req.body as { leadId?: string };
    if (!leadId) {
      res.status(400).json({ success: false, message: 'leadId is required' });
      return;
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const activities = await Activity.find({ leadId }).sort({ createdAt: -1 }).limit(30);
    const timeline = activities
      .map((a) => `- [${a.type}] ${a.subject}: ${a.description ?? ''}`)
      .join('\n');

    const content = await aiComplete([
      {
        role: 'system',
        content:
          'You are a sales operations assistant. Summarize the lead status and recommend the single best next action. Be concise (max 6 sentences).',
      },
      {
        role: 'user',
        content: `Lead: ${lead.companyName} (${lead.status}, ₹${lead.estimatedValue}).\nActivity timeline:\n${timeline || 'No activities logged yet.'}`,
      },
    ]);

    res.status(200).json({ success: true, data: { summary: content } });
  } catch (error) {
    logger.error(`AI summarize error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};
