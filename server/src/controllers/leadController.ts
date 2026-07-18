import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import Lead, { type ILead } from '../models/Lead.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROLES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  LEAD_STATUS,
  NOTIFICATION_TYPES,
  type LeadStatus,
} from '../utils/constants.js';
import {
  buildQueryFilters,
  getPaginationParams,
  buildPaginationResponse,
  calculateLeadScore,
  calculateWinProbability,
  calculateDaysBetween,
} from '../utils/helpers.js';
import { createNotification } from '../utils/notify.js';
import type { LeadQueryFilters } from '../types/index.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * @desc    Get all leads
 * @route   GET /api/v1/leads
 * @access  Private
 */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as LeadQueryFilters;
    const { page, limit, skip } = getPaginationParams(query.page ?? 1, query.limit ?? 10);

    const queryFilters = buildQueryFilters(query);

    const { role, _id: userId, team } = req.user;

    if (role === ROLES.BDA) {
      queryFilters.assignedTo = userId;
    } else if (role === ROLES.TEAM_LEAD && team) {
      const teamMembers = await User.find({ team }).select('_id');
      queryFilters.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const leads = await Lead.find(queryFilters)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(queryFilters);

    logger.info(`Fetched ${leads.length} leads for user ${req.user.email}`);

    res.status(200).json({
      success: true,
      ...buildPaginationResponse(leads, total, page, limit),
    });
  } catch (error) {
    logger.error(`Get leads error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Get single lead
 * @route   GET /api/v1/leads/:id
 * @access  Private
 */
export const getLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone avatar')
      .populate('assignedBy', 'firstName lastName');

    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const activities = await Activity.find({ leadId: lead._id })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: { lead, activities } });
  } catch (error) {
    logger.error(`Get lead error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/v1/leads
 * @access  Private
 */
export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadData = {
      ...req.body,
      assignedBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id,
    };

    const lead = await Lead.create(leadData);

    lead.score = calculateLeadScore(lead, []);
    lead.probability = calculateWinProbability(lead, 0);
    await lead.save();

    await Activity.create({
      type: ACTIVITY_TYPES.STATUS_CHANGE,
      subject: 'Lead Created',
      description: `Lead ${lead.leadNumber} was created`,
      leadId: lead._id,
      userId: req.user._id,
      status: ACTIVITY_STATUS.COMPLETED,
    });

    logger.info(`Lead created: ${lead.leadNumber} by ${req.user.email}`);

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.LEAD_CREATED,
      data: { lead: populatedLead },
    });
  } catch (error) {
    logger.error(`Create lead error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Update lead
 * @route   PUT /api/v1/leads/:id
 * @access  Private
 */
export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Lead.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const oldStatus = existing.status;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const activities = await Activity.find({ leadId: lead._id });
    lead.score = calculateLeadScore(lead, activities);

    const lastChange =
      lead.statusHistory.length > 0
        ? lead.statusHistory[lead.statusHistory.length - 1].changedAt
        : lead.createdAt;
    lead.probability = calculateWinProbability(lead, calculateDaysBetween(lastChange));
    await lead.save();

    const newStatus = req.body.status as LeadStatus | undefined;
    if (newStatus && oldStatus !== newStatus) {
      await Activity.create({
        type: ACTIVITY_TYPES.STATUS_CHANGE,
        subject: `Status changed to ${newStatus}`,
        description: `Lead status changed from ${oldStatus} to ${newStatus}`,
        leadId: lead._id,
        userId: req.user._id,
        status: ACTIVITY_STATUS.COMPLETED,
      });
    }

    logger.info(`Lead updated: ${lead.leadNumber} by ${req.user.email}`);

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.LEAD_UPDATED,
      data: { lead: populatedLead },
    });
  } catch (error) {
    logger.error(`Update lead error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Delete lead
 * @route   DELETE /api/v1/leads/:id
 * @access  Private
 */
export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    await lead.deleteOne();
    await Activity.deleteMany({ leadId: lead._id });

    logger.info(`Lead deleted: ${lead.leadNumber} by ${req.user.email}`);

    res.status(200).json({ success: true, message: SUCCESS_MESSAGES.LEAD_DELETED });
  } catch (error) {
    logger.error(`Delete lead error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Update lead status
 * @route   PATCH /api/v1/leads/:id/status
 * @access  Private
 */
export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body as { status: LeadStatus; notes?: string };

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const oldStatus = lead.status;
    lead.status = status;

    if (status === LEAD_STATUS.WON) {
      lead.wonDate = new Date();
    }

    await lead.save();

    await Activity.create({
      type: ACTIVITY_TYPES.STATUS_CHANGE,
      subject: `Status changed to ${status}`,
      description: notes || `Lead moved from ${oldStatus} to ${status}`,
      leadId: lead._id,
      userId: req.user._id,
      status: ACTIVITY_STATUS.COMPLETED,
    });

    logger.info(`Lead status updated: ${lead.leadNumber} to ${status}`);

    res.status(200).json({ success: true, message: 'Status updated successfully', data: { lead } });
  } catch (error) {
    logger.error(`Update lead status error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Assign lead to a BDA
 * @route   PATCH /api/v1/leads/:id/assign
 * @access  Private
 */
export const assignLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignedTo } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const newAssignee = await User.findById(assignedTo);
    if (!newAssignee) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    lead.assignedTo = assignedTo;
    lead.assignedBy = req.user._id;
    await lead.save();

    await Activity.create({
      type: ACTIVITY_TYPES.NOTE,
      subject: 'Lead Reassigned',
      description: `Lead assigned to ${newAssignee.firstName} ${newAssignee.lastName}`,
      leadId: lead._id,
      userId: req.user._id,
      status: ACTIVITY_STATUS.COMPLETED,
    });

    await createNotification({
      recipient: newAssignee._id,
      type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
      title: 'New lead assigned',
      message: `${lead.companyName} (${lead.leadNumber}) was assigned to you`,
      link: `/leads/${lead._id.toString()}`,
    });

    logger.info(`Lead assigned: ${lead.leadNumber} to ${newAssignee.email}`);

    const populatedLead = await Lead.findById(lead._id).populate(
      'assignedTo',
      'firstName lastName email',
    );

    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead: populatedLead },
    });
  } catch (error) {
    logger.error(`Assign lead error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Get lead statistics
 * @route   GET /api/v1/leads/stats
 * @access  Private
 */
export const getLeadStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchQuery: FilterQuery<ILead> = {};
    const { role, _id: userId, team } = req.user;

    if (role === ROLES.BDA) {
      matchQuery.assignedTo = userId;
    } else if (role === ROLES.TEAM_LEAD && team) {
      const teamMembers = await User.find({ team }).select('_id');
      matchQuery.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const stats = await Lead.aggregate<{ _id: LeadStatus; count: number; totalValue: number }>([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
        },
      },
    ]);

    const totalLeads = await Lead.countDocuments(matchQuery);
    const totalValueAgg = await Lead.aggregate<{ _id: null; total: number }>([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } },
    ]);

    const wonLeads = await Lead.countDocuments({ ...matchQuery, status: LEAD_STATUS.WON });
    const conversionRate =
      totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats,
        summary: {
          totalLeads,
          totalValue: totalValueAgg[0]?.total ?? 0,
          wonLeads,
          conversionRate,
        },
      },
    });
  } catch (error) {
    logger.error(`Get lead stats error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Perform a bulk action on multiple leads
 * @route   POST /api/v1/leads/bulk
 * @access  Private (managers / team leads)
 */
export const bulkLeadAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, ids, status, assignedTo } = req.body as {
      action?: 'assign' | 'status' | 'delete';
      ids?: string[];
      status?: LeadStatus;
      assignedTo?: string;
    };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'action and a non-empty ids array are required' });
      return;
    }

    if (action === 'delete') {
      await Lead.deleteMany({ _id: { $in: ids } });
      await Activity.deleteMany({ leadId: { $in: ids } });
      res.status(200).json({ success: true, message: `${ids.length} lead(s) deleted` });
      return;
    }

    if (action === 'status') {
      if (!status) {
        res.status(400).json({ success: false, message: 'status is required for this action' });
        return;
      }
      await Lead.updateMany({ _id: { $in: ids } }, { status });
      res.status(200).json({ success: true, message: `${ids.length} lead(s) updated` });
      return;
    }

    if (action === 'assign') {
      if (!assignedTo) {
        res.status(400).json({ success: false, message: 'assignedTo is required for this action' });
        return;
      }
      await Lead.updateMany({ _id: { $in: ids } }, { assignedTo, assignedBy: req.user._id });
      await createNotification({
        recipient: assignedTo,
        type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
        title: 'Leads assigned',
        message: `${ids.length} lead(s) were assigned to you`,
        link: '/leads',
      });
      res.status(200).json({ success: true, message: `${ids.length} lead(s) assigned` });
      return;
    }

    res.status(400).json({ success: false, message: 'Unknown action' });
  } catch (error) {
    logger.error(`Bulk lead action error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Import multiple leads at once
 * @route   POST /api/v1/leads/import
 * @access  Private
 */
export const importLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leads } = req.body as { leads?: Array<Record<string, unknown>> };

    if (!Array.isArray(leads) || leads.length === 0) {
      res.status(400).json({ success: false, message: 'A non-empty leads array is required' });
      return;
    }

    const prepared = leads.map((lead) => ({
      ...lead,
      assignedBy: req.user._id,
      assignedTo: lead.assignedTo ?? req.user._id,
    }));

    const created = await Lead.insertMany(prepared as unknown as ILead[], { ordered: false });

    logger.info(`${created.length} leads imported by ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: `${created.length} lead(s) imported successfully`,
      data: { count: created.length },
    });
  } catch (error) {
    logger.error(`Import leads error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};
