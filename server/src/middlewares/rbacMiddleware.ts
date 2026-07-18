import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ROLES, ERROR_MESSAGES, type Role } from '../utils/constants.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

/**
 * Role-Based Access Control middleware factory.
 * @param roles - roles that are permitted to access the route.
 */
export const authorize = (...roles: Role[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: ERROR_MESSAGES.PERMISSION_DENIED });
      return;
    }

    next();
  };
};

/**
 * Check if the current user can access a specific lead resource
 * (own leads for BDAs, team leads for team leads, everything for managers/admins).
 */
export const canAccessLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { role, _id: userId, team } = req.user;

    // Super admin and managers can access all
    if (role === ROLES.SUPER_ADMIN || role === ROLES.MANAGER) {
      next();
      return;
    }

    const leadId = req.params.id;

    if (!leadId) {
      next();
      return;
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Team leads can access their team's leads
    if (role === ROLES.TEAM_LEAD && team) {
      const assignedUser = await User.findById(lead.assignedTo);
      if (assignedUser?.team && assignedUser.team.toString() === team.toString()) {
        next();
        return;
      }
    }

    // BDAs can only access their own leads
    if (role === ROLES.BDA && lead.assignedTo.toString() === userId.toString()) {
      next();
      return;
    }

    // Viewers can only read
    if (role === ROLES.VIEWER && req.method === 'GET') {
      next();
      return;
    }

    res.status(403).json({ success: false, message: ERROR_MESSAGES.PERMISSION_DENIED });
  } catch {
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/** Block write operations for read-only (viewer) users. */
export const canModify = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user.role === ROLES.VIEWER) {
    res.status(403).json({
      success: false,
      message: 'Viewers do not have permission to modify resources',
    });
    return;
  }

  next();
};
