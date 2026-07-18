/**
 * Application-wide constants and their derived union types.
 * Using `as const` gives us both runtime values (for enums/validation)
 * and compile-time string-literal unions (for strong typing).
 */

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  BDA: 'bda',
  VIEWER: 'viewer',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// Lead Status
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
  NURTURING: 'nurturing',
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

// Lead Priority
export const LEAD_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type LeadPriority = (typeof LEAD_PRIORITY)[keyof typeof LEAD_PRIORITY];

// Lead Sources
export const LEAD_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  COLD_CALL: 'cold_call',
  EMAIL_CAMPAIGN: 'email_campaign',
  TRADE_SHOW: 'trade_show',
  LINKEDIN: 'linkedin',
  OTHER: 'other',
} as const;
export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  NOTE: 'note',
  TASK: 'task',
  STATUS_CHANGE: 'status_change',
} as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

// Activity Status
export const ACTIVITY_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type ActivityStatus = (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS];

// Communication Types
export const COMMUNICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  CALL: 'call',
} as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[keyof typeof COMMUNICATION_TYPES];

// Client Status
export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_HOLD: 'on_hold',
} as const;
export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

// Notification Types
export const NOTIFICATION_TYPES = {
  LEAD_ASSIGNED: 'lead_assigned',
  TASK_DUE: 'task_due',
  TASK_ASSIGNED: 'task_assigned',
  STATUS_CHANGE: 'status_change',
  MENTION: 'mention',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Stage Probability Mapping
export const STAGE_PROBABILITY: Record<LeadStatus, number> = {
  [LEAD_STATUS.NEW]: 5,
  [LEAD_STATUS.CONTACTED]: 15,
  [LEAD_STATUS.QUALIFIED]: 30,
  [LEAD_STATUS.PROPOSAL]: 50,
  [LEAD_STATUS.NEGOTIATION]: 75,
  [LEAD_STATUS.WON]: 100,
  [LEAD_STATUS.LOST]: 0,
  [LEAD_STATUS.NURTURING]: 10,
};

// Lead Source Score Mapping
export const SOURCE_SCORES: Record<LeadSource, number> = {
  [LEAD_SOURCES.REFERRAL]: 20,
  [LEAD_SOURCES.LINKEDIN]: 15,
  [LEAD_SOURCES.WEBSITE]: 10,
  [LEAD_SOURCES.EMAIL_CAMPAIGN]: 8,
  [LEAD_SOURCES.COLD_CALL]: 5,
  [LEAD_SOURCES.TRADE_SHOW]: 12,
  [LEAD_SOURCES.OTHER]: 3,
};

// File Upload Settings
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this resource',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
  LEAD_NOT_FOUND: 'Lead not found',
  CLIENT_NOT_FOUND: 'Client not found',
  TEAM_NOT_FOUND: 'Team not found',
  INVALID_TOKEN: 'Invalid or expired token',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  PERMISSION_DENIED: 'Permission denied',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LEAD_CREATED: 'Lead created successfully',
  LEAD_UPDATED: 'Lead updated successfully',
  LEAD_DELETED: 'Lead deleted successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
} as const;
