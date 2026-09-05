export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'InProgress' | 'Completed';
export type RecurringType = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind class color or hex
  type: 'Subject' | 'Project' | 'Personal';
  userId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // 'pdf' | 'doc' | 'image' | 'link'
  size?: string;
  url?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  categoryId: string; // References Category
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: Comment[];
  recurring: RecurringType;
  recurringGroupId?: string; // Links recurring task series
  isPinned: boolean;
  completedAt?: string; // ISO string when completed
  assignedTo?: string; // Primary/legacy TeamMember ID
  assignedToIds?: string[]; // Array of TeamMember IDs for multi-assignee support
  createdBy?: string; // TeamMember ID of creator
  orgId?: string; // Organization ID
  projectId?: string; // Project ID
  focusBlock?: 'MorningFocus' | 'AfternoonDeep' | 'QuickAdmin' | 'EveningReview';
  estimatedHours?: number; // Estimated hours of effort for workload calculation
  dependsOnTaskId?: string; // Task ID this task is blocked by or depends on
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  code: string; // Unique join code (e.g. PRJ-8K9A2M)
  ownerId: string; // TeamMember ID or email
  ownerName?: string;
  memberIds: string[]; // TeamMember IDs or emails
  color?: string;
  createdAt: string; // ISO string
  orgId?: string; // Optional organization association
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly';
  streak: number;
  completedDates: string[]; // YYYY-MM-DD
  createdAt: string;
  userId?: string;
}

export type UserRank = 'Admin' | 'Manager' | 'Supervisor' | 'User';

export interface Organization {
  id: string;
  name: string;
  type: 'Company' | 'Family' | 'Single';
  createdAt: string;
  createdBy?: string;
  logo?: string;
  themeColor?: string;
  code?: string; // Join code for inviting users to this plan (e.g. PLAN-9X2K4M)
  managerId?: string; // Plan Manager assigned by Admin
  managerName?: string;
  managerEmail?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderEmail: string;
  orgId?: string; // for company-wide chat
  receiverId?: string; // for direct technical support chat with Admin
  isSupport: boolean;
  createdAt: string; // ISO string
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Manual role / position
  rank: UserRank; // Admin, Manager, Supervisor, User
  orgRanks?: Record<string, UserRank>; // Plan-specific ranks (e.g. { 'org-1': 'Manager', 'org-2': 'User' })
  avatar: string; // Initials or URL
  orgId?: string; // Active organization reference
  orgIds?: string[]; // Multiple organization IDs
  projectIds?: string[]; // Joined project IDs
  email?: string;
  password?: string;
  apiKey?: string; // Personalized AI API Key (issued by Admin or auto-provisioned)
  apiKeyCreatedAt?: string; // ISO string
  isImpersonated?: boolean;
  joinedAt?: string;
  familyRole?: 'parent' | 'teen' | 'child'; // GDPR family protection role
  accountCategory?: 'Personal' | 'Family' | 'Company';
}

export type FamilyRole = 'parent' | 'teen' | 'child';

export interface PrivacyConsents {
  essentialContract: boolean; // Article 6(1)(b) - always true
  aiAssistance: boolean; // Article 6(1)(a) - user consent for AI features
  analyticsTelemetry: boolean; // Article 6(1)(a) - product usage
  emailNotifications: boolean; // Article 6(1)(f) - legitimate interest or consent
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string;
  actorId?: string;
  actorEmail?: string;
  action: 'export_data' | 'delete_data' | 'update_consents' | 'access_resource' | 'delete_account' | 'modify_role' | 'incident_reported' | 'retention_cleanup' | string;
  resourceType: 'task' | 'file' | 'profile' | 'organization' | 'security' | 'consent' | string;
  resourceId?: string;
  timestamp: string; // ISO string
  details?: string;
}

export interface DataRetentionPolicy {
  retentionDays: number; // 30, 90, 180, 365, or 0 (forever)
  autoArchiveCompletedTasks: boolean;
  autoPurgeAuditLogsDays: number;
}

export interface DataInventoryItem {
  category: string;
  example: string;
  purpose: string;
  legalBasis: 'Contract (Art. 6(1)(b))' | 'Consent (Art. 6(1)(a))' | 'Legitimate Interest (Art. 6(1)(f))' | 'Legal Obligation (Art. 6(1)(c))';
  retention: string;
  processor: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedAt: string;
  status: 'Investigating' | 'Contained' | 'Resolved' | 'Notified';
  affectedDataTypes: string[];
  affectedUsersCount: number;
  dpaNotifiedWithin72h: boolean;
  summary: string;
}

export interface ProductivityStats {
  completedCount: number;
  pendingCount: number;
  completionRate: number;
  streakDays: number;
}

export interface AiSupportQA {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
  category?: string;
  usageCount?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JoinRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  membersCount: number;
  message: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}
