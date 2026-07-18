import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import Client, { type IClient } from '../models/Client.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { ERROR_MESSAGES, ROLES, LEAD_STATUS } from '../utils/constants.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Restrict client visibility based on the requesting user's role. */
const scopeByRole = async (req: Request): Promise<FilterQuery<IClient>> => {
  const { role, _id: userId, team } = req.user;
  const filter: FilterQuery<IClient> = {};

  if (role === ROLES.BDA) {
    filter.accountManager = userId;
  } else if (role === ROLES.TEAM_LEAD && team) {
    const teamMembers = await User.find({ team }).select('_id');
    filter.accountManager = { $in: teamMembers.map((m) => m._id) };
  }

  return filter;
};

/**
 * @desc    Get all clients
 * @route   GET /api/v1/clients
 * @access  Private
 */
export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(
      (req.query.page as string) ?? 1,
      (req.query.limit as string) ?? 10,
    );

    const filter = await scopeByRole(req);

    if (req.query.status) filter.status = String(req.query.status) as IClient['status'];
    if (req.query.search) {
      const term = String(req.query.search);
      filter.$or = [
        { companyName: { $regex: term, $options: 'i' } },
        { contactPerson: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { clientNumber: { $regex: term, $options: 'i' } },
      ];
    }

    const clients = await Client.find(filter)
      .populate('accountManager', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments(filter);

    res.status(200).json({ success: true, ...buildPaginationResponse(clients, total, page, limit) });
  } catch (error) {
    logger.error(`Get clients error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Get single client
 * @route   GET /api/v1/clients/:id
 * @access  Private
 */
export const getClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id).populate(
      'accountManager',
      'firstName lastName email',
    );

    if (!client) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.CLIENT_NOT_FOUND });
      return;
    }

    res.status(200).json({ success: true, data: { client } });
  } catch (error) {
    logger.error(`Get client error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Create a client
 * @route   POST /api/v1/clients
 * @access  Private
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.create({
      ...req.body,
      accountManager: req.body.accountManager || req.user._id,
    });

    logger.info(`Client created: ${client.clientNumber} by ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Client created successfully', data: { client } });
  } catch (error) {
    logger.error(`Create client error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};

/**
 * @desc    Convert a won lead into a client
 * @route   POST /api/v1/clients/convert/:leadId
 * @access  Private
 */
export const convertLeadToClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.LEAD_NOT_FOUND });
      return;
    }

    const existing = await Client.findOne({ leadId: lead._id });
    if (existing) {
      res.status(400).json({ success: false, message: 'This lead has already been converted to a client' });
      return;
    }

    const client = await Client.create({
      leadId: lead._id,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      accountManager: lead.assignedTo ?? req.user._id,
      totalRevenue: lead.estimatedValue ?? 0,
      notes: req.body?.notes,
    });

    // Mark the lead as won on conversion
    if (lead.status !== LEAD_STATUS.WON) {
      lead.status = LEAD_STATUS.WON;
      lead.wonDate = new Date();
      await lead.save();
    }

    logger.info(`Lead ${lead.leadNumber} converted to client ${client.clientNumber}`);
    res.status(201).json({
      success: true,
      message: 'Lead converted to client successfully',
      data: { client },
    });
  } catch (error) {
    logger.error(`Convert lead error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR, error: errorMessage(error) });
  }
};

/**
 * @desc    Update a client
 * @route   PUT /api/v1/clients/:id
 * @access  Private
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('accountManager', 'firstName lastName email');

    if (!client) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.CLIENT_NOT_FOUND });
      return;
    }

    res.status(200).json({ success: true, message: 'Client updated successfully', data: { client } });
  } catch (error) {
    logger.error(`Update client error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Delete a client
 * @route   DELETE /api/v1/clients/:id
 * @access  Private (managers+)
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404).json({ success: false, message: ERROR_MESSAGES.CLIENT_NOT_FOUND });
      return;
    }

    await client.deleteOne();
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    logger.error(`Delete client error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/**
 * @desc    Client statistics
 * @route   GET /api/v1/clients/stats
 * @access  Private
 */
export const getClientStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await scopeByRole(req);

    const totalClients = await Client.countDocuments(filter);
    const activeClients = await Client.countDocuments({ ...filter, status: 'active' });
    const revenueAgg = await Client.aggregate<{ _id: null; total: number }>([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalClients,
          activeClients,
          totalRevenue: revenueAgg[0]?.total ?? 0,
        },
      },
    });
  } catch (error) {
    logger.error(`Client stats error: ${errorMessage(error)}`);
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};
