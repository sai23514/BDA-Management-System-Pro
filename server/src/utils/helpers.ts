import type { FilterQuery } from 'mongoose';
import {
  STAGE_PROBABILITY,
  SOURCE_SCORES,
  type LeadStatus,
  type LeadPriority,
  type LeadSource,
} from './constants.js';
import type { ILead } from '../models/Lead.js';
import type { UserDocument } from '../models/User.js';
import type {
  LeadQueryFilters,
  PaginationParams,
  PaginatedResult,
} from '../types/index.js';

/** Generate a unique, human-readable lead number. */
export const generateLeadNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LEAD-${timestamp}-${random}`;
};

/** Generate a unique, human-readable client number. */
export const generateClientNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLT-${timestamp}-${random}`;
};

interface ScorableLead {
  estimatedValue: number;
  source: LeadSource;
}

interface ScorableActivity {
  createdAt: Date | string;
}

/** Calculate a lead score in the range 0-100. */
export const calculateLeadScore = (
  lead: ScorableLead,
  activities: ScorableActivity[] = [],
): number => {
  let score = 0;

  // Company size/value (30 points max)
  if (lead.estimatedValue >= 1_000_000) score += 30;
  else if (lead.estimatedValue >= 500_000) score += 20;
  else if (lead.estimatedValue >= 100_000) score += 10;
  else if (lead.estimatedValue >= 50_000) score += 5;

  // Engagement level based on activities (30 points max)
  const activityCount = activities.length;
  if (activityCount >= 10) score += 30;
  else if (activityCount >= 5) score += 20;
  else if (activityCount >= 2) score += 10;
  else if (activityCount >= 1) score += 5;

  // Response time (20 points max) - based on last activity
  if (activities.length > 0) {
    const lastActivity = activities[0];
    const hoursSinceLastActivity =
      (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastActivity < 24) score += 20;
    else if (hoursSinceLastActivity < 72) score += 10;
    else if (hoursSinceLastActivity < 168) score += 5;
  }

  // Source quality (20 points max)
  score += SOURCE_SCORES[lead.source] ?? 0;

  return Math.min(score, 100);
};

interface ProbabilityLead {
  status: LeadStatus;
  score: number;
  priority: LeadPriority;
}

/** Calculate win probability based on stage and other factors. */
export const calculateWinProbability = (
  lead: ProbabilityLead,
  daysInStage = 0,
): number => {
  let probability = STAGE_PROBABILITY[lead.status] ?? 0;

  // Adjust based on lead score
  const scoreAdjustment = (lead.score - 50) / 10;
  probability += scoreAdjustment;

  // Adjust based on time in stage (negative impact if too long)
  if (daysInStage > 60) probability -= 20;
  else if (daysInStage > 30) probability -= 10;

  // Priority adjustment
  if (lead.priority === 'high') probability += 5;
  else if (lead.priority === 'low') probability -= 5;

  return Math.max(0, Math.min(100, Math.round(probability)));
};

/** Calculate the number of whole days between two dates. */
export const calculateDaysBetween = (date1: Date, date2: Date = new Date()): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/** Format a number as currency (defaults to INR). */
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/** Remove sensitive fields from a user document before returning it. */
export const sanitizeUser = (user: UserDocument): Record<string, unknown> => {
  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.password;
  delete userObj.refreshToken;
  return userObj;
};

/** Build a MongoDB filter object from request query parameters. */
export const buildQueryFilters = (filters: LeadQueryFilters): FilterQuery<ILead> => {
  const query: FilterQuery<ILead> = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.source) query.source = filters.source;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;

  if (filters.search) {
    query.$or = [
      { companyName: { $regex: filters.search, $options: 'i' } },
      { contactPerson: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) createdAt.$lte = new Date(filters.dateTo);
    query.createdAt = createdAt;
  }

  if (filters.minValue || filters.maxValue) {
    const estimatedValue: Record<string, number> = {};
    if (filters.minValue) estimatedValue.$gte = Number(filters.minValue);
    if (filters.maxValue) estimatedValue.$lte = Number(filters.maxValue);
    query.estimatedValue = estimatedValue;
  }

  return query;
};

/** Normalise pagination inputs into concrete numbers. */
export const getPaginationParams = (
  page: string | number = 1,
  limit: string | number = 10,
): PaginationParams => {
  const pageNum = Number.parseInt(String(page), 10) || 1;
  const limitNum = Number.parseInt(String(limit), 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, skip };
};

/** Wrap a data array with pagination metadata. */
export const buildPaginationResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
