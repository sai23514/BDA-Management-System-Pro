import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import Lead, { type ILead } from '../models/Lead.js';
import User from '../models/User.js';
import { ERROR_MESSAGES, ROLES, LEAD_STATUS } from '../utils/constants.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const scopeByRole = async (req: Request): Promise<FilterQuery<ILead>> => {
  const { role, _id: userId, team } = req.user;
  const filter: FilterQuery<ILead> = {};

  if (role === ROLES.BDA) {
    filter.assignedTo = userId;
  } else if (role === ROLES.TEAM_LEAD && team) {
    const teamMembers = await User.find({ team }).select('_id');
    filter.assignedTo = { $in: teamMembers.map((m) => m._id) };
  }

  return filter;
};

/**
 * @desc    Aggregated reporting datasets for the analytics dashboard
 * @route   GET /api/v1/reports/overview
 * @access  Private
 */
export const getReportsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await scopeByRole(req);

    const byStatus = await Lead.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$estimatedValue' } } },
    ]);

    const bySource = await Lead.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 }, totalValue: { $sum: '$estimatedValue' } } },
      { $sort: { count: -1 } },
    ]);

    const leaderboard = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          wonLeads: {
            $sum: { $cond: [{ $eq: ['$status', LEAD_STATUS.WON] }, 1, 0] },
          },
          wonValue: {
            $sum: { $cond: [{ $eq: ['$status', LEAD_STATUS.WON] }, '$estimatedValue', 0] },
          },
        },
      },
      { $sort: { wonValue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalLeads: 1,
          wonLeads: 1,
          wonValue: 1,
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        },
      },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthly = await Lead.aggregate([
      { $match: { ...match, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          value: { $sum: '$estimatedValue' },
          won: { $sum: { $cond: [{ $eq: ['$status', LEAD_STATUS.WON] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const totalLeads = await Lead.countDocuments(match);
    const wonLeads = await Lead.countDocuments({ ...match, status: LEAD_STATUS.WON });
    const lostLeads = await Lead.countDocuments({ ...match, status: LEAD_STATUS.LOST });
    const conversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        byStatus,
        bySource,
        leaderboard,
        monthly,
        summary: { totalLeads, wonLeads, lostLeads, conversionRate },
      },
    });
  } catch (error) {
    logger.error(`Reports overview error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
