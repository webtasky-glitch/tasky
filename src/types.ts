export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'InProgress' | 'Completed';
export type RecurringType = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind class color or hex
  type: 'Subject' | 'Project' | 'Personal';
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
  isPinned: boolean;
  completedAt?: string; // ISO string when completed
  assignedTo?: string; // TeamMember ID
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
  logo?: string;
  themeColor?: string;
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
  avatar: string; // Initials or URL
  orgId?: string; // Organization reference
  email?: string;
  password?: string;
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
  createdAt: string;
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
