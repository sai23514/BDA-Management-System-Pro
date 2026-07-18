import type {
  Role,
  LeadStatus,
  LeadPriority,
  LeadSource,
  ActivityType,
  ActivityStatus,
} from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ROLES: Record<string, Role> = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  BDA: 'bda',
  VIEWER: 'viewer',
};

export const LEAD_STATUS: Record<string, LeadStatus> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
  NURTURING: 'nurturing',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  nurturing: 'Nurturing',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#2196F3',
  contacted: '#FF9800',
  qualified: '#9C27B0',
  proposal: '#00BCD4',
  negotiation: '#FFC107',
  won: '#4CAF50',
  lost: '#F44336',
  nurturing: '#607D8B',
};

export const LEAD_PRIORITY: Record<string, LeadPriority> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const PRIORITY_COLORS: Record<LeadPriority, string> = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
};

export interface SourceOption {
  value: LeadSource;
  label: string;
}

export const LEAD_SOURCES: SourceOption[] = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
];

export const ACTIVITY_TYPES: Record<string, ActivityType> = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  NOTE: 'note',
  TASK: 'task',
  STATUS_CHANGE: 'status_change',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Phone Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  task: 'Task',
  status_change: 'Status Change',
};

export const ACTIVITY_STATUS: Record<string, ActivityStatus> = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const;

export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';

export const CHART_COLORS = [
  '#2196F3',
  '#4CAF50',
  '#FF9800',
  '#F44336',
  '#9C27B0',
  '#00BCD4',
  '#FFC107',
  '#607D8B',
];
