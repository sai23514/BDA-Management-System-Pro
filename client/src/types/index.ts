export type Role = 'super_admin' | 'manager' | 'team_lead' | 'bda' | 'viewer';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurturing';

export type LeadPriority = 'high' | 'medium' | 'low';

export type LeadSource =
  | 'website'
  | 'referral'
  | 'cold_call'
  | 'email_campaign'
  | 'trade_show'
  | 'linkedin'
  | 'other';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'status_change';

export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

export interface UserTargets {
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface TeamRef {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string | null;
  department?: string;
  team?: TeamRef | string | null;
  targets?: UserTargets;
  isActive: boolean;
  fullName?: string;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string | null;
  phone?: string;
}

export interface Lead {
  _id: string;
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  industry?: string;
  location?: { city?: string; state?: string; country?: string };
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  estimatedValue: number;
  probability: number;
  expectedCloseDate?: string | null;
  assignedTo?: UserRef | string;
  assignedBy?: UserRef | string | null;
  requirements?: string;
  notes?: string;
  tags?: string[];
  lostReason?: string | null;
  wonDate?: string | null;
  nextFollowUp?: string | null;
  createdAt: string;
  updatedAt: string;
  daysOld?: number;
}

export interface Activity {
  _id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  leadId: string;
  userId: UserRef | string;
  status: ActivityStatus;
  priority?: LeadPriority;
  dueDate?: string | null;
  completedDate?: string | null;
  duration?: number;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface LeadStatsStat {
  _id: LeadStatus;
  count: number;
  totalValue: number;
}

export interface LeadStatsSummary {
  totalLeads: number;
  totalValue: number;
  wonLeads: number;
  conversionRate: number;
}

export interface LeadStats {
  stats: LeadStatsStat[];
  summary: LeadStatsSummary;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  department?: string;
}

export interface LeadDetailResponse {
  lead: Lead;
  activities: Activity[];
}

export interface CreateLeadInput {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: LeadSource;
  estimatedValue?: number | string;
  priority?: LeadPriority;
  requirements?: string;
  notes?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'on_hold';

export interface Client {
  _id: string;
  clientNumber: string;
  leadId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry?: string;
  accountManager?: UserRef | string;
  totalRevenue: number;
  activeContracts: number;
  status: ClientStatus;
  gst?: string;
  pan?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientStatsSummary {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface LeadRef {
  _id: string;
  companyName: string;
  leadNumber: string;
}

export interface TaskItem {
  _id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  priority?: LeadPriority;
  dueDate?: string | null;
  leadId?: LeadRef | string | null;
  createdAt: string;
}

export interface ReportsOverview {
  byStatus: Array<{ _id: LeadStatus; count: number; totalValue: number }>;
  bySource: Array<{ _id: LeadSource; count: number; totalValue: number }>;
  leaderboard: Array<{
    _id: string;
    name?: string;
    totalLeads: number;
    wonLeads: number;
    wonValue: number;
  }>;
  monthly: Array<{
    _id: { year: number; month: number };
    count: number;
    value: number;
    won: number;
  }>;
  summary: { totalLeads: number; wonLeads: number; lostLeads: number; conversionRate: number };
}

export interface SearchResults {
  leads: Array<Pick<Lead, '_id' | 'companyName' | 'contactPerson' | 'leadNumber' | 'status'>>;
  clients: Array<Pick<Client, '_id' | 'companyName' | 'contactPerson' | 'clientNumber' | 'status'>>;
}

export interface ChatUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface ChatConversation {
  _id: string;
  otherUser: ChatUser | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: ChatUser | string;
  body: string;
  readBy?: string[];
  createdAt: string;
}
