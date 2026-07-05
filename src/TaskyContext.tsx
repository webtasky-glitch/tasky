import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Category, Habit, TeamMember, TaskPriority, TaskStatus, RecurringType, ChecklistItem, Attachment, Comment, Organization, Message, UserRank, AiSupportQA } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, INITIAL_HABITS, INITIAL_TEAM_MEMBERS } from './initialData';
import { db, cleanUndefined, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc as firestoreSetDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const setDoc = (docRef: any, data: any) => firestoreSetDoc(docRef, cleanUndefined(data));

interface TaskyContextType {
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  teamMembers: TeamMember[];
  organizations: Organization[];
  messages: Message[];
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  language: 'en' | 'el';
  setLanguage: (lang: 'en' | 'el') => void;
  activeTab: 'dashboard' | 'calendar' | 'habits' | 'statistics' | 'team' | 'organizations' | 'chat' | 'create-member';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'habits' | 'statistics' | 'team' | 'organizations' | 'chat' | 'create-member') => void;
  
  // Auth state & actions
  user: any;
  authLoading: boolean;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  currentUserProfile: TeamMember | null;

  // Tasks Actions
  addTask: (task: Omit<Task, 'id' | 'checklist' | 'attachments' | 'comments'> & { attachments?: Attachment[] }) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  togglePinTask: (id: string) => void;
  
  // Checklist Actions
  addChecklistItem: (taskId: string, text: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  deleteChecklistItem: (taskId: string, itemId: string) => void;
  
  // Attachments Actions
  addAttachment: (taskId: string, name: string, type: string, size?: string, url?: string) => void;
  deleteAttachment: (taskId: string, attachmentId: string) => void;
  
  // Comments Actions
  addComment: (taskId: string, authorId: string, authorName: string, text: string) => void;
  
  // Category Actions
  addCategory: (name: string, color: string, type: 'Subject' | 'Project' | 'Personal') => Promise<string>;
  
  // Habit Actions
  addHabit: (name: string, frequency: 'Daily' | 'Weekly') => void;
  toggleHabitDate: (id: string, date: string) => void;
  deleteHabit: (id: string) => void;

  // Team Actions
  addTeamMember: (name: string, role: string, email?: string, password?: string) => Promise<void>;
  addTeamMemberWithRank: (name: string, role: string, rank: UserRank, email?: string, password?: string, orgId?: string) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  isAdminOrManager: boolean;

  // Organizations Actions
  addOrganization: (name: string, type: 'Company' | 'Family' | 'Single') => Promise<void>;
  updateOrganization: (org: Organization) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;

  // Messages Actions
  sendMessage: (text: string, isSupport: boolean, receiverId?: string, orgId?: string) => Promise<void>;
  aiSupportQA: AiSupportQA[];
  
  // Sync Simulation / Cloud State
  syncStatus: 'offline' | 'syncing' | 'synced' | 'error';
  triggerSync: () => void;
  isOnline: boolean;
  impersonateUser: (email: string) => void;
  impersonateOrgAsManager: (orgId: string) => void;
  stopImpersonating: () => void;
}

const TaskyContext = createContext<TaskyContextType | undefined>(undefined);

export const TaskyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from local storage or defaults for fast first paint
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasky_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('tasky_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('tasky_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('tasky_team_members');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('tasky_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  const [language, setLanguageState] = useState<'en' | 'el'>(() => {
    const saved = localStorage.getItem('tasky_language');
    return (saved === 'el' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: 'en' | 'el') => {
    setLanguageState(lang);
    localStorage.setItem('tasky_language', lang);
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'habits' | 'statistics' | 'team' | 'organizations' | 'chat' | 'create-member'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // New states for multi-organization plan management & chat
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiSupportQA, setAiSupportQA] = useState<AiSupportQA[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<TeamMember | null>(null);

  // Auth State Management
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = localStorage.getItem('tasky_local_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [isAdminOrManager, setIsAdminOrManager] = useState<boolean>(true);

  useEffect(() => {
    try {
      const currentEmail = user ? user.email : (localStorage.getItem('tasky_guest_mode') === 'true' ? 'guest@tasky.local' : 'sandbox@tasky.local');
      if (currentEmail && currentEmail.toLowerCase() === 'spidereg2010@gmail.com') {
        setIsAdminOrManager(true);
        return;
      }
      // If we have a custom user profile, determine if they are Admin or Manager
      if (currentUserProfile) {
        setIsAdminOrManager(currentUserProfile.rank === 'Admin' || currentUserProfile.rank === 'Manager');
        return;
      }
      setIsAdminOrManager(true);
    } catch {
      setIsAdminOrManager(true);
    }
  }, [user, currentUserProfile]);

  // Derive and keep current user profile up to date
  useEffect(() => {
    if (!user) {
      setCurrentUserProfile(null);
      return;
    }
    const emailLower = user.email ? user.email.toLowerCase().trim() : '';
    
    // Super Admin check with optional impersonation
    if (emailLower === 'spidereg2010@gmail.com') {
      const impersonatedEmail = localStorage.getItem('tasky_impersonated_email');
      if (impersonatedEmail) {
        const found = teamMembers.find(tm => tm.email && tm.email.toLowerCase().trim() === impersonatedEmail.toLowerCase().trim());
        if (found) {
          setCurrentUserProfile({
            ...found,
            isImpersonated: true
          });
          return;
        }
      }

      const impersonatedOrgId = localStorage.getItem('tasky_impersonated_org_id');
      if (impersonatedOrgId) {
        const targetOrg = organizations.find(o => o.id === impersonatedOrgId);
        setCurrentUserProfile({
          id: `tm-guest-manager-${impersonatedOrgId}`,
          name: `Guest Manager (${targetOrg?.name || 'Plan'})`,
          role: 'Guest Manager (Admin)',
          rank: 'Manager',
          avatar: 'GM',
          email: 'spidereg2010@gmail.com',
          orgId: impersonatedOrgId,
          isImpersonated: true
        });
        return;
      }

      setCurrentUserProfile({
        id: 'admin-spidereg2010',
        name: 'Spider Eg',
        role: 'Super Admin',
        rank: 'Admin',
        avatar: 'SE',
        email: 'spidereg2010@gmail.com'
      });
      return;
    }

    const found = teamMembers.find(tm => tm.email && tm.email.toLowerCase().trim() === emailLower);
    if (found) {
      setCurrentUserProfile(found);
    } else if (localStorage.getItem('tasky_guest_mode') === 'true') {
      setCurrentUserProfile({
        id: 'tm-guest',
        name: 'Guest Explorer',
        role: 'Guest User',
        rank: 'User',
        avatar: 'GE',
        email: 'guest@tasky.local',
        orgId: 'org-guest'
      });
    } else {
      setCurrentUserProfile({
        id: `tm-fb-${user.uid}`,
        name: user.displayName || 'Sandbox User',
        role: 'Developer',
        rank: 'User',
        avatar: (user.displayName || 'SU').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        email: emailLower
      });
    }
  }, [user, teamMembers, organizations]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const savedUser = localStorage.getItem('tasky_local_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('tasky_local_user');
      localStorage.removeItem('tasky_guest_mode');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error in TaskyContext:", error);
      localStorage.removeItem('tasky_local_user');
      localStorage.removeItem('tasky_guest_mode');
      setUser(null);
    }
  };

  // 1. Live Firestore synchronization
  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const list: Task[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const t = { id: doc.id, ...data } as Task;
        if (t && t.id && !seenIds.has(t.id)) {
          seenIds.add(t.id);
          list.push(t);
        }
      });
      // Sort tasks consistently: pinned first, then by due date or fallback to ID
      const sorted = list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      setTasks(sorted);
      localStorage.setItem('tasky_tasks', JSON.stringify(sorted));
    }, (error) => {
      console.error("Firestore tasks subscription error:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const c = { id: doc.id, ...data } as Category;
        if (c && c.id && !seenIds.has(c.id)) {
          seenIds.add(c.id);
          list.push(c);
        }
      });
      setCategories(list);
      localStorage.setItem('tasky_categories', JSON.stringify(list));
    }, (error) => {
      console.error("Firestore categories subscription error:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const unsubHabits = onSnapshot(collection(db, 'habits'), (snapshot) => {
      const list: Habit[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const h = { id: doc.id, ...data } as Habit;
        if (h && h.id && !seenIds.has(h.id)) {
          seenIds.add(h.id);
          list.push(h);
        }
      });
      setHabits(list);
      localStorage.setItem('tasky_habits', JSON.stringify(list));
    }, (error) => {
      console.error("Firestore habits subscription error:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.LIST, 'habits');
    });

    const unsubTeam = onSnapshot(collection(db, 'team'), (snapshot) => {
      const list: TeamMember[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const tm = { id: doc.id, ...data } as TeamMember;
        if (tm && tm.id && !seenIds.has(tm.id)) {
          seenIds.add(tm.id);
          list.push(tm);
        }
      });
      setTeamMembers(list);
      localStorage.setItem('tasky_team_members', JSON.stringify(list));
    }, (error) => {
      console.error("Firestore team subscription error:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.LIST, 'team');
    });

    const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
      const list: Organization[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const o = { id: doc.id, ...data } as Organization;
        if (o && o.id && !seenIds.has(o.id)) {
          seenIds.add(o.id);
          list.push(o);
        }
      });
      setOrganizations(list);
    }, (error) => {
      console.error("Firestore organizations subscription error:", error);
      handleFirestoreError(error, OperationType.LIST, 'organizations');
    });

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const list: Message[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const m = { id: doc.id, ...data } as Message;
        if (m && m.id && !seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push(m);
        }
      });
      // Sort messages by date ascending
      const sorted = list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted);
    }, (error) => {
      console.error("Firestore messages subscription error:", error);
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    const unsubAiSupportQA = onSnapshot(collection(db, 'aiSupportQA'), (snapshot) => {
      const list: AiSupportQA[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, ...data } as AiSupportQA);
      });
      setAiSupportQA(list);
    }, (error) => {
      console.error("Firestore aiSupportQA subscription error:", error);
    });

    return () => {
      unsubTasks();
      unsubCategories();
      unsubHabits();
      unsubTeam();
      unsubOrgs();
      unsubMessages();
      unsubAiSupportQA();
    };
  }, []);

  // 2. Seeding helper to pre-populate database if empty on startup
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const orgSnap = await getDocs(collection(db, 'organizations'));

        if (orgSnap.empty) {
          console.log("Seeding organizations...");
          const defaultOrgs = [
            { id: 'org-1', name: 'Acme Corp', type: 'Company', createdAt: new Date().toISOString() },
            { id: 'org-2', name: 'The Smith Family', type: 'Family', createdAt: new Date().toISOString() },
            { id: 'org-3', name: 'Personal Workspace', type: 'Single', createdAt: new Date().toISOString() }
          ];
          for (const org of defaultOrgs) {
            await setDoc(doc(db, 'organizations', org.id), org);
          }
        }

        if (catSnap.empty) {
          setSyncStatus('syncing');
          console.log("Firestore empty. Seeding defaults...");
          
          for (const cat of INITIAL_CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), cat);
          }
          for (const hab of INITIAL_HABITS) {
            await setDoc(doc(db, 'habits', hab.id), hab);
          }
          for (const task of INITIAL_TASKS) {
            await setDoc(doc(db, 'tasks', task.id), task);
          }

          // Seed default team members with ranks and organizations
          const defaultTeam = [
            { id: 'tm-1', name: 'Alex Rivera', role: 'Project Lead', rank: 'Manager', avatar: 'AR', orgId: 'org-1', email: 'alex@acme.com', password: 'password' },
            { id: 'tm-2', name: 'Sarah Chen', role: 'Senior Developer', rank: 'Supervisor', avatar: 'SC', orgId: 'org-1', email: 'sarah@acme.com', password: 'password' },
            { id: 'tm-3', name: 'Marcus Vance', role: 'UX Designer', rank: 'User', avatar: 'MV', orgId: 'org-1', email: 'marcus@acme.com', password: 'password' }
          ];
          for (const tm of defaultTeam) {
            await setDoc(doc(db, 'team', tm.id), tm);
          }
          console.log("Seeding complete!");
        } else {
          // If already seeded but team is empty
          const teamSnap = await getDocs(collection(db, 'team'));
          if (teamSnap.empty) {
            setSyncStatus('syncing');
            const defaultTeam = [
              { id: 'tm-1', name: 'Alex Rivera', role: 'Project Lead', rank: 'Manager', avatar: 'AR', orgId: 'org-1', email: 'alex@acme.com', password: 'password' },
              { id: 'tm-2', name: 'Sarah Chen', role: 'Senior Developer', rank: 'Supervisor', avatar: 'SC', orgId: 'org-1', email: 'sarah@acme.com', password: 'password' },
              { id: 'tm-3', name: 'Marcus Vance', role: 'UX Designer', rank: 'User', avatar: 'MV', orgId: 'org-1', email: 'marcus@acme.com', password: 'password' }
            ];
            for (const tm of defaultTeam) {
              await setDoc(doc(db, 'team', tm.id), tm);
            }
          }
        }

        // Seed initial aiSupportQA if empty
        const qaSnap = await getDocs(collection(db, 'aiSupportQA'));
        if (qaSnap.empty) {
          console.log("Seeding AI Support QAs...");
          const defaultQAs = [
            { id: 'qa-1', question: 'how to change password', answer: 'You can change your password in the Profile section of the navigation panel.', createdAt: new Date().toISOString() },
            { id: 'qa-2', question: 'app keeps lagging', answer: 'Try clearing your browser cache or reloading the application. If problems persist, check your internet connectivity.', createdAt: new Date().toISOString() },
            { id: 'qa-3', question: 'how to create task', answer: 'Click the "Add Task" button on the dashboard, fill in the subject, description, priority, and select a category.', createdAt: new Date().toISOString() }
          ];
          for (const qa of defaultQAs) {
            await setDoc(doc(db, 'aiSupportQA', qa.id), qa);
          }
        }

        setSyncStatus('synced');
      } catch (error) {
        console.error("Error seeding Firestore:", error);
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.WRITE, 'seed_all');
      }
    };
    seedDatabase();
  }, []);

  // Handle system online/offline updates
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) setSyncStatus('offline');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Update DOM for Tailwind Dark Mode support
  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark);
    localStorage.setItem('tasky_dark_mode', JSON.stringify(dark));
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync Trigger (manually refreshes status visualizer)
  const triggerSync = () => {
    if (!isOnline) {
      setSyncStatus('error');
      return;
    }
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 600);
  };

  // Add Task directly to Firestore
  const addTask = async (newTaskData: Omit<Task, 'id' | 'checklist' | 'attachments' | 'comments'> & { attachments?: Attachment[] }) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      checklist: [],
      attachments: newTaskData.attachments || [],
      comments: [],
      isPinned: false,
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', newTask.id), newTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding task to Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Update Task directly to Firestore
  const updateTask = async (updatedTask: Task) => {
    // If the task status is Completed, automatically delete/clear its attachments from Firestore
    if (updatedTask.status === 'Completed') {
      updatedTask.attachments = [];
    }
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', updatedTask.id), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error updating task in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Delete Task from Firestore
  const deleteTask = async (id: string) => {
    setSyncStatus('syncing');
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting task in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Toggle Complete Task directly to Firestore
  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const isCompleted = task.status === 'Completed';
    const newStatus: TaskStatus = isCompleted ? 'Todo' : 'Completed';
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      completedAt: isCompleted ? undefined : new Date().toISOString(),
    };

    // Automatically delete/clear attachments from Firestore when marked completed/done
    if (newStatus === 'Completed') {
      updatedTask.attachments = [];
    }

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', id), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error toggling task completion in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Pin / Unpin Task directly to Firestore
  const togglePinTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      isPinned: !task.isPinned,
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', id), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error pinning task in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Checklist Item: Add directly to Firestore
  const addChecklistItem = async (taskId: string, text: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newItem: ChecklistItem = {
      id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      completed: false,
    };
    const updatedTask: Task = {
      ...task,
      checklist: [...task.checklist, newItem],
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding checklist item:", error);
      setSyncStatus('error');
    }
  };

  // Checklist Item: Toggle directly to Firestore
  const toggleChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updatedTask: Task = {
      ...task,
      checklist: updatedChecklist,
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error toggling checklist item:", error);
      setSyncStatus('error');
    }
  };

  // Checklist Item: Delete from Firestore
  const deleteChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      checklist: task.checklist.filter((item) => item.id !== itemId),
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      setSyncStatus('error');
    }
  };

  // Attachment: Add to Firestore
  const addAttachment = async (taskId: string, name: string, type: string, size?: string, url?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newAttachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      type,
      size,
      url,
    };
    const updatedTask: Task = {
      ...task,
      attachments: [...task.attachments, newAttachment],
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding attachment:", error);
      setSyncStatus('error');
    }
  };

  // Attachment: Delete from Firestore
  const deleteAttachment = async (taskId: string, attachmentId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      attachments: task.attachments.filter((att) => att.id !== attachmentId),
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setSyncStatus('error');
    }
  };

  // Comment: Add directly to Firestore
  const addComment = async (taskId: string, authorId: string, authorName: string, text: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newComment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      authorId,
      authorName,
      authorAvatar: authorName.split(' ').map((n) => n[0]).join('').toUpperCase(),
      text,
      createdAt: new Date().toISOString(),
    };
    const updatedTask: Task = {
      ...task,
      comments: [...task.comments, newComment],
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', taskId), updatedTask);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding comment:", error);
      setSyncStatus('error');
    }
  };

  // Category: Add directly to Firestore
  const addCategory = async (name: string, color: string, type: 'Subject' | 'Project' | 'Personal'): Promise<string> => {
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      color,
      type,
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'categories', newCategory.id), newCategory);
      setSyncStatus('synced');
      return newCategory.id;
    } catch (error) {
      console.error("Error adding category:", error);
      setSyncStatus('error');
      throw error;
    }
  };

  // Habit: Add directly to Firestore
  const addHabit = async (name: string, frequency: 'Daily' | 'Weekly') => {
    const newHabit: Habit = {
      id: `hab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      frequency,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString().split('T')[0],
      userId: currentUserProfile?.id
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'habits', newHabit.id), newHabit);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding habit:", error);
      setSyncStatus('error');
    }
  };

  // Habit: Toggle Completion Date directly to Firestore
  const toggleHabitDate = async (id: string, date: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const completedDates = [...habit.completedDates];
    const index = completedDates.indexOf(date);
    if (index > -1) {
      completedDates.splice(index, 1);
    } else {
      completedDates.push(date);
    }

    // Calculate streak
    let streak = 0;
    const sorted = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (sorted.length > 0) {
      let current = new Date();
      let checkStr = current.toISOString().split('T')[0];
      
      const hasToday = completedDates.includes(checkStr);
      current.setDate(current.getDate() - 1);
      const hasYesterday = completedDates.includes(current.toISOString().split('T')[0]);

      if (hasToday || hasYesterday) {
        let checkDate = hasToday ? new Date() : current;
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (completedDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    const updatedHabit: Habit = {
      ...habit,
      completedDates,
      streak,
    };

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'habits', id), updatedHabit);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error toggling habit date in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Habit: Delete from Firestore
  const deleteHabit = async (id: string) => {
    setSyncStatus('syncing');
    try {
      await deleteDoc(doc(db, 'habits', id));
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting habit from Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Team Actions: Create and delete team members/users
  const addTeamMemberWithRank = async (name: string, role: string, rank: UserRank, email?: string, password?: string, orgId?: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      role,
      rank,
      avatar: initials || '??',
      email,
      password,
      orgId
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'team', newMember.id), newMember);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding team member with rank:", error);
      setSyncStatus('error');
    }
  };

  const addTeamMember = async (name: string, role: string, email?: string, password?: string) => {
    await addTeamMemberWithRank(name, role, 'User', email, password);
  };

  const deleteTeamMember = async (id: string) => {
    setSyncStatus('syncing');
    try {
      await deleteDoc(doc(db, 'team', id));
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting team member from Firestore:", error);
      setSyncStatus('error');
    }
  };

  const updateTeamMember = async (member: TeamMember) => {
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'team', member.id), member);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error updating team member in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Organizations Actions
  const addOrganization = async (name: string, type: 'Company' | 'Family' | 'Single') => {
    const newOrg: Organization = {
      id: `org-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      type,
      createdAt: new Date().toISOString()
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'organizations', newOrg.id), newOrg);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error adding organization:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'organizations');
    }
  };

  const updateOrganization = async (org: Organization) => {
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'organizations', org.id), org);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error updating organization:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'organizations');
    }
  };

  const deleteOrganization = async (id: string) => {
    setSyncStatus('syncing');
    try {
      await deleteDoc(doc(db, 'organizations', id));
      
      // Update any team members who had this orgId to remove/clear it in Firestore
      const membersToUpdate = teamMembers.filter(tm => tm.orgId === id);
      for (const tm of membersToUpdate) {
        try {
          const updatedMember = { ...tm };
          delete updatedMember.orgId;
          await setDoc(doc(db, 'team', tm.id), updatedMember);
        } catch (tmErr) {
          console.error(`Failed to unlink team member ${tm.id} from deleted organization ${id}:`, tmErr);
        }
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting organization:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.DELETE, `organizations/${id}`);
    }
  };

  // Messages Actions
  const sendMessage = async (text: string, isSupport: boolean, receiverId?: string, orgId?: string) => {
    if (!currentUserProfile) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      senderId: currentUserProfile.id,
      senderName: currentUserProfile.name,
      senderAvatar: currentUserProfile.avatar,
      senderEmail: currentUserProfile.email || 'unknown@tasky.local',
      isSupport,
      receiverId,
      orgId: orgId || currentUserProfile.orgId,
      createdAt: new Date().toISOString()
    };
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      setSyncStatus('synced');

      // AI tech support responses & auto-learning
      if (isSupport) {
        const normalizeText = (t: string) => {
          return t.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
        };

        const findMatchingQA = (userText: string, qaList: AiSupportQA[]): AiSupportQA | null => {
          const normUser = normalizeText(userText);
          if (!normUser) return null;

          for (const qa of qaList) {
            const normStored = normalizeText(qa.question);
            if (normUser === normStored || normUser.includes(normStored) || normStored.includes(normUser)) {
              return qa;
            }
          }
          return null;
        };

        if (currentUserProfile.rank !== 'Admin' && receiverId === 'admin-spidereg2010') {
          // A user asks tech support
          const match = findMatchingQA(text, aiSupportQA);
          if (match) {
            // AI knows the answer!
            setTimeout(async () => {
              const aiMsg: Message = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                text: match.answer,
                senderId: 'system-ai',
                senderName: 'System Tech AI',
                senderAvatar: 'AI',
                senderEmail: 'ai@tasky.local',
                isSupport: true,
                receiverId: currentUserProfile.id,
                orgId: currentUserProfile.orgId,
                createdAt: new Date().toISOString()
              };
              try {
                await setDoc(doc(db, 'messages', aiMsg.id), aiMsg);
              } catch (err) {
                console.error("Error sending AI automatic answer:", err);
              }
            }, 1000);
          } else {
            // AI does not know. It's a new question!
            console.log(`New custom tech support question from ${currentUserProfile.name}: "${text.trim()}"`);
          }
        } else if (currentUserProfile.rank === 'Admin' && receiverId) {
          // Admin replies to a support message!
          // We can check if there was a previous unanswered user message from this user, and save it as a newly learned QA!
          const userMsgs = messages.filter(
            (m: Message) => m.isSupport && m.senderId === receiverId && m.receiverId === 'admin-spidereg2010'
          );
          if (userMsgs.length > 0) {
            const lastUserMsg = userMsgs[userMsgs.length - 1];
            // If we don't already have a match for this question, learn it!
            const match = findMatchingQA(lastUserMsg.text, aiSupportQA);
            if (!match) {
              const newQA: AiSupportQA = {
                id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                question: lastUserMsg.text.trim(),
                answer: text.trim(),
                createdAt: new Date().toISOString()
              };
              try {
                await setDoc(doc(db, 'aiSupportQA', newQA.id), newQA);
                console.log(`[AI Auto-Learned QA]: "${newQA.question}" -> "${newQA.answer}"`);
              } catch (err) {
                console.error("Error saving auto-learned QA:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const impersonateUser = (email: string) => {
    localStorage.setItem('tasky_impersonated_email', email);
    localStorage.removeItem('tasky_impersonated_org_id');
    window.location.reload();
  };

  const impersonateOrgAsManager = (orgId: string) => {
    localStorage.setItem('tasky_impersonated_org_id', orgId);
    localStorage.removeItem('tasky_impersonated_email');
    window.location.reload();
  };

  const stopImpersonating = () => {
    localStorage.removeItem('tasky_impersonated_email');
    localStorage.removeItem('tasky_impersonated_org_id');
    window.location.reload();
  };

  return (
    <TaskyContext.Provider
      value={{
        tasks,
        categories,
        habits,
        teamMembers,
        organizations,
        messages,
        aiSupportQA,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        activeTab,
        setActiveTab,
        user,
        setUser,
        authLoading,
        logout,
        currentUserProfile,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        togglePinTask,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addAttachment,
        deleteAttachment,
        addComment,
        addCategory,
        addHabit,
        toggleHabitDate,
        deleteHabit,
        addTeamMember,
        addTeamMemberWithRank,
        deleteTeamMember,
        updateTeamMember,
        isAdminOrManager,
        addOrganization,
        updateOrganization,
        deleteOrganization,
        sendMessage,
        syncStatus,
        triggerSync,
        isOnline,
        impersonateUser,
        impersonateOrgAsManager,
        stopImpersonating,
      }}
    >
      {children}
    </TaskyContext.Provider>
  );
};

export const useTasky = () => {
  const context = useContext(TaskyContext);
  if (context === undefined) {
    throw new Error('useTasky must be used within a TaskyProvider');
  }
  return context;
};

