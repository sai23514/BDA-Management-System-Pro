import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import Activity, { type IActivity } from '../models/Activity.js';
import Lead from '../models/Lead.js';
import { ERROR_MESSAGES, ACTIVITY_STATUS } from '../utils/constants.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';
import type { LeadQueryFilters } from '../types/index.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * @desc    Get activities for a lead
 * @route   GET /api/v1/leads/:id/activities
 * @access  Private
 */
export const getLeadActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as LeadQueryFilters;
    const { page, limit, skip } = getPaginationParams(query.page ?? 1, query.limit ?? 10);

    const activities = await Activity.find({ leadId: req.params.id })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments({ leadId: req.params.id });

    res.status(200).json({
      success: true,
      ...buildPaginationResponse(activities, total, page, limit),
    });
  } catch (error) {
    logger.error(`Get lead activities error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Create activity for a lead
 * @route   POST /api/v1/leads/:id/activities
 * @access  Private
 */
export const createActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const activity = await Activity.create({
      ...req.body,
      leadId,
      userId: req.user._id,
    });

    // Update the lead's next follow-up if this activity is a future task
    if (activity.dueDate && activity.dueDate > new Date()) {
      if (!lead.nextFollowUp || activity.dueDate < lead.nextFollowUp) {
        lead.nextFollowUp = activity.dueDate;
        await lead.save();
      }
    }

    const populatedActivity = await Activity.findById(activity._id).populate(
      'userId',
      'firstName lastName avatar',
    );

    logger.info(`Activity created for lead ${lead.leadNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity: populatedActivity },
    });
  } catch (error) {
    logger.error(`Create activity error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Update activity
 * @route   PUT /api/v1/activities/:id
 * @access  Private
 */
export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Activity.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Activity not found' });
      return;
    }

    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('userId', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: { activity },
    });
  } catch (error) {
    logger.error(`Update activity error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};

/**
 * @desc    Get the current user's tasks / follow-ups
 * @route   GET /api/v1/activities/my-tasks
 * @access  Private
 * @query   filter=today|overdue|upcoming|all (default: all)
 */
export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = String(req.query.filter ?? 'all');

    const query: FilterQuery<IActivity> = {
      userId: req.user._id,
      status: ACTIVITY_STATUS.PENDING,
      dueDate: { $ne: null },
    };

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    if (filter === 'today') {
      query.dueDate = { $gte: startOfDay, $lt: endOfDay };
    } else if (filter === 'overdue') {
      query.dueDate = { $lt: startOfDay };
    } else if (filter === 'upcoming') {
      query.dueDate = { $gte: endOfDay };
    }

    const tasks = await Activity.find(query)
      .populate('leadId', 'companyName leadNumber')
      .sort({ dueDate: 1 })
      .limit(200);

    res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    logger.error(`Get my tasks error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Mark a task/activity as completed
 * @route   PATCH /api/v1/activities/:id/complete
 * @access  Private
 */
export const completeActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      res.status(404).json({ success: false, message: 'Activity not found' });
      return;
    }

    activity.status = ACTIVITY_STATUS.COMPLETED;
    activity.completedDate = new Date();
    await activity.save();

    res.status(200).json({ success: true, message: 'Task completed', data: { activity } });
  } catch (error) {
    logger.error(`Complete activity error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Delete activity
 * @route   DELETE /api/v1/activities/:id
 * @access  Private
 */
export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      res.status(404).json({ success: false, message: 'Activity not found' });
      return;
    }

    await activity.deleteOne();

    res.status(200).json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    logger.error(`Delete activity error: ${errorMessage(error)}`);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: errorMessage(error),
    });
  }
};
