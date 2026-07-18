import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import Lead, { type ILead } from '../models/Lead.js';
import Client, { type IClient } from '../models/Client.js';
import User from '../models/User.js';
import { ERROR_MESSAGES, ROLES } from '../utils/constants.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * @desc    Global search across leads and clients
 * @route   GET /api/v1/search?q=term
 * @access  Private
 */
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const term = String(req.query.q ?? '').trim();
    if (term.length < 2) {
      res.status(200).json({ success: true, data: { leads: [], clients: [] } });
      return;
    }

    const regex = { $regex: term, $options: 'i' };

    const leadFilter: FilterQuery<ILead> = {
      $or: [{ companyName: regex }, { contactPerson: regex }, { email: regex }, { leadNumber: regex }],
    };
    const clientFilter: FilterQuery<IClient> = {
      $or: [{ companyName: regex }, { contactPerson: regex }, { email: regex }, { clientNumber: regex }],
    };

    // Restrict BDAs to their own records
    const { role, _id: userId, team } = req.user;
    if (role === ROLES.BDA) {
      leadFilter.assignedTo = userId;
      clientFilter.accountManager = userId;
    } else if (role === ROLES.TEAM_LEAD && team) {
      const teamMembers = await User.find({ team }).select('_id');
      const ids = teamMembers.map((m) => m._id);
      leadFilter.assignedTo = { $in: ids };
      clientFilter.accountManager = { $in: ids };
    }

    const [leads, clients] = await Promise.all([
      Lead.find(leadFilter).select('companyName contactPerson leadNumber status').limit(8).lean(),
      Client.find(clientFilter)
        .select('companyName contactPerson clientNumber status')
        .limit(8)
        .lean(),
    ]);

    res.status(200).json({ success: true, data: { leads, clients } });
  } catch (error) {
    logger.error(`Global search error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
