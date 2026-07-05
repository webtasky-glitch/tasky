import { Task, Category, Habit, TeamMember } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Computer Science', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50', type: 'Subject' },
  { id: 'cat-2', name: 'Mathematics 101', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50', type: 'Subject' },
  { id: 'cat-3', name: 'Marketing Campaign', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50', type: 'Project' },
  { id: 'cat-4', name: 'Fitness & Health', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50', type: 'Personal' },
  { id: 'cat-5', name: 'Financial Planning', color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50', type: 'Project' }
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', name: 'Alex Rivera', role: 'Project Lead', avatar: 'AR', rank: 'Manager' },
  { id: 'tm-2', name: 'Sarah Chen', role: 'Senior Developer', avatar: 'SC', rank: 'Supervisor' },
  { id: 'tm-3', name: 'Marcus Vance', role: 'UX Designer', avatar: 'MV', rank: 'User' }
];

// Use current year-month-day for realistic deadlines
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Implement Database Schema & Migrations',
    description: 'Design and write SQL migrations for the relational user tables and assign appropriate indexes for faster lookups.',
    dueDate: getRelativeDate(2),
    priority: 'High',
    status: 'InProgress',
    categoryId: 'cat-1',
    checklist: [
      { id: 'ch-1', text: 'Create draft schema diagram', completed: true },
      { id: 'ch-2', text: 'Define Drizzle schemas in schema.ts', completed: true },
      { id: 'ch-3', text: 'Run migration & verify local DB', completed: false },
      { id: 'ch-4', text: 'Write seed scripts', completed: false }
    ],
    attachments: [
      { id: 'att-1', name: 'database_schema_v2.pdf', type: 'pdf', size: '1.2 MB' },
      { id: 'att-2', name: 'https://dbdiagram.io/d/schema', type: 'link' }
    ],
    comments: [
      {
        id: 'c-1',
        authorId: 'tm-1',
        authorName: 'Alex Rivera',
        authorAvatar: 'AR',
        text: 'Marcus, please double check if the relationship mapping for comments is optimal.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'c-2',
        authorId: 'tm-3',
        authorName: 'Marcus Vance',
        authorAvatar: 'MV',
        text: 'Looks solid, Alex. I reviewed the foreign key cascade constraints too.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ],
    recurring: 'None',
    isPinned: true,
    assignedTo: 'tm-2'
  },
  {
    id: 'task-2',
    title: 'Linear Algebra Assignment 3',
    description: 'Complete questions 1 to 5 on Vector Subspaces and Linear Independence. Scan and upload solutions.',
    dueDate: getRelativeDate(1),
    priority: 'Urgent',
    status: 'Todo',
    categoryId: 'cat-2',
    checklist: [
      { id: 'ch-5', text: 'Solve question 1 & 2', completed: false },
      { id: 'ch-6', text: 'Solve question 3 & 4', completed: false },
      { id: 'ch-7', text: 'Solve bonus question 5', completed: false }
    ],
    attachments: [
      { id: 'att-3', name: 'Math_Assgn_3_Problems.pdf', type: 'pdf', size: '450 KB' }
    ],
    comments: [],
    recurring: 'None',
    isPinned: false
  },
  {
    id: 'task-3',
    title: 'Review Marketing Q3 Copywriting',
    description: 'Write, review, and finalize email newsletters and landing page copy for the upcoming autumn campaign.',
    dueDate: getRelativeDate(5),
    priority: 'Medium',
    status: 'Todo',
    categoryId: 'cat-3',
    checklist: [
      { id: 'ch-8', text: 'Draft email newsletter', completed: true },
      { id: 'ch-9', text: 'Write landing page header alternatives', completed: false }
    ],
    attachments: [],
    comments: [],
    recurring: 'Weekly',
    isPinned: false,
    assignedTo: 'tm-1'
  },
  {
    id: 'task-4',
    title: 'Cardio & Core Workout Routine',
    description: '45-minute gym session focusing on cardiovascular endurance and core stability exercises.',
    dueDate: getRelativeDate(0), // Today
    priority: 'Low',
    status: 'Completed',
    categoryId: 'cat-4',
    checklist: [
      { id: 'ch-10', text: '15 mins incline treadmill run', completed: true },
      { id: 'ch-11', text: '3 sets of hanging leg raises', completed: true },
      { id: 'ch-12', text: 'Plank hold (2 mins)', completed: true }
    ],
    attachments: [],
    comments: [],
    recurring: 'Daily',
    isPinned: false,
    completedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'task-5',
    title: 'Budget Allocation & Forecast',
    description: 'Compile department expenditures and create a forecast report for next quarter’s cloud services spend.',
    dueDate: getRelativeDate(-1), // Yesterday
    priority: 'High',
    status: 'Todo',
    categoryId: 'cat-5',
    checklist: [
      { id: 'ch-13', text: 'Export AWS and GCP bills', completed: true },
      { id: 'ch-14', text: 'Generate projection charts', completed: false }
    ],
    attachments: [],
    comments: [
      {
        id: 'c-3',
        authorId: 'tm-1',
        authorName: 'Alex Rivera',
        authorAvatar: 'AR',
        text: 'This is overdue. Let’s finish this today so we can present it tomorrow.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    recurring: 'Monthly',
    isPinned: true
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'hab-1',
    name: 'Solve LeetCode Problem',
    frequency: 'Daily',
    streak: 5,
    completedDates: [getRelativeDate(-4), getRelativeDate(-3), getRelativeDate(-2), getRelativeDate(-1), getRelativeDate(0)],
    createdAt: getRelativeDate(-10)
  },
  {
    id: 'hab-2',
    name: 'Read Technical Book (15 pages)',
    frequency: 'Daily',
    streak: 3,
    completedDates: [getRelativeDate(-3), getRelativeDate(-2), getRelativeDate(-1)],
    createdAt: getRelativeDate(-5)
  },
  {
    id: 'hab-3',
    name: 'Review Budget & Savings',
    frequency: 'Weekly',
    streak: 1,
    completedDates: [getRelativeDate(-2)],
    createdAt: getRelativeDate(-14)
  }
];
