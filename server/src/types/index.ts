import type { LeadPriority, LeadSource, LeadStatus } from '../utils/constants.js';

/** Standard success/error envelope returned by every endpoint. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Query params accepted by the lead list endpoint. */
export interface LeadQueryFilters {
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minValue?: string | number;
  maxValue?: string | number;
  page?: string | number;
  limit?: string | number;
}

/** Shape of a decoded JWT payload. */
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}
