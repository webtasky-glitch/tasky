import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Task, Category, Habit, TeamMember, TaskPriority, TaskStatus, RecurringType, ChecklistItem, Attachment, Comment, Organization, Message, UserRank, AiSupportQA, Project } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, INITIAL_HABITS, INITIAL_TEAM_MEMBERS } from './initialData';
import { db, cleanUndefined, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc as firestoreSetDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { getNextDueDate, generateFutureRecurringTasks } from './utils/recurringUtils';

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
  const errCode = (error as any)?.code;
  const errMessage = error instanceof Error ? error.message : String(error);
  const isOfflineOrUnavailable = errCode === 'unavailable' || errMessage.includes('unavailable') || errMessage.includes('Could not reach Cloud Firestore backend');

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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

  if (isOfflineOrUnavailable) {
    console.warn('Firestore offline / re-connecting mode active:', errMessage);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
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
  deleteTeamMember: (id: string, orgId?: string) => Promise<void>;
  deleteTeamMemberFromOrg: (idOrEmail: string, targetOrgId: string) => Promise<void>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  isAdminOrManager: boolean;

  // Organizations Actions
  addOrganization: (name: string, type: 'Company' | 'Family' | 'Single') => Promise<void>;
  updateOrganization: (org: Organization) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  joinOrganizationByCode: (code: string) => Promise<{ success: boolean; message: string; org?: Organization }>;

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

  const [allCategories, setAllCategories] = useState<Category[]>(() => {
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'habits' | 'statistics' | 'team' | 'organizations' | 'chat' | 'create-member' | 'projects' | 'admin-requests'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // New states for multi-organization plan management & chat
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const saved = localStorage.getItem('tasky_organizations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(() => {
    return localStorage.getItem('tasky_selected_org_id') || null;
  });

  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState<boolean>(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('tasky_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
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
      if (currentEmail && currentEmail.toLowerCase() === 'webtasky@gmail.com') {
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
    if (emailLower === 'webtasky@gmail.com') {
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
          email: emailLower,
          orgId: impersonatedOrgId,
          isImpersonated: true
        });
        return;
      }

      setCurrentUserProfile({
        id: 'admin-webtasky',
        name: 'Web Tasky',
        role: 'Super Admin',
        rank: 'Admin',
        avatar: 'WT',
        email: 'webtasky@gmail.com'
      });
      return;
    }

    const userOrgs = teamMembers.filter(tm => tm.email && tm.email.toLowerCase().trim() === emailLower);
    let chosenMember = userOrgs.find(tm => selectedOrgId && (tm.orgIds?.includes(selectedOrgId) || tm.orgId === selectedOrgId)) || userOrgs[0];

    if (chosenMember) {
      const activeOrgId = selectedOrgId || chosenMember.orgId;
      const activeRank = (activeOrgId && chosenMember.orgRanks?.[activeOrgId])
        ? chosenMember.orgRanks[activeOrgId]
        : chosenMember.rank;

      setCurrentUserProfile({
        ...chosenMember,
        rank: activeRank,
        orgId: activeOrgId
      });
    } else if (localStorage.getItem('tasky_guest_mode') === 'true') {
      setCurrentUserProfile({
        id: 'tm-guest',
        name: 'Guest Explorer',
        role: 'Guest User',
        rank: 'User',
        avatar: 'GE',
        email: 'guest@tasky.local',
        orgId: selectedOrgId || 'org-guest'
      });
    } else {
      const cleanUid = user.uid ? (user.uid.startsWith('tm-') ? user.uid : (user.uid.startsWith('user-') ? `tm-${user.uid}` : `tm-fb-${user.uid}`)) : 'tm-user';
      setCurrentUserProfile({
        id: cleanUid,
        name: user.displayName || 'Sandbox User',
        role: 'Developer',
        rank: 'User',
        avatar: (user.displayName || 'SU').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        email: emailLower,
        orgId: selectedOrgId || undefined
      });
    }
  }, [user, teamMembers, organizations, selectedOrgId]);

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

  const safeSaveLocalStorage = (key: string, data: any) => {
    try {
      setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(data));
      }, 0);
    } catch {}
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
      safeSaveLocalStorage('tasky_tasks', sorted);
    }, (error) => {
      console.warn("Firestore tasks subscription warning:", error);
      const isUnavailable = (error as any)?.code === 'unavailable' || error?.message?.includes('unavailable');
      setSyncStatus(isUnavailable ? 'offline' : 'error');
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
      setAllCategories(list);
      safeSaveLocalStorage('tasky_categories', list);
    }, (error) => {
      console.warn("Firestore categories subscription warning:", error);
      const isUnavailable = (error as any)?.code === 'unavailable' || error?.message?.includes('unavailable');
      setSyncStatus(isUnavailable ? 'offline' : 'error');
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
      safeSaveLocalStorage('tasky_habits', list);
    }, (error) => {
      console.warn("Firestore habits subscription warning:", error);
      const isUnavailable = (error as any)?.code === 'unavailable' || error?.message?.includes('unavailable');
      setSyncStatus(isUnavailable ? 'offline' : 'error');
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
      safeSaveLocalStorage('tasky_team_members', list);
    }, (error) => {
      console.warn("Firestore team subscription warning:", error);
      const isUnavailable = (error as any)?.code === 'unavailable' || error?.message?.includes('unavailable');
      setSyncStatus(isUnavailable ? 'offline' : 'error');
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
      safeSaveLocalStorage('tasky_organizations', list);
    }, (error) => {
      console.error("Firestore organizations subscription error:", error);
      handleFirestoreError(error, OperationType.LIST, 'organizations');
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list: Project[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const p = { id: doc.id, ...data } as Project;
        if (p && p.id && !seenIds.has(p.id)) {
          seenIds.add(p.id);
          list.push(p);
        }
      });
      setProjects(list);
      safeSaveLocalStorage('tasky_projects', list);
    }, (error) => {
      console.warn("Firestore projects subscription warning:", error);
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
      unsubProjects();
      unsubMessages();
      unsubAiSupportQA();
    };
  }, []);

  // 2. Database initialization and setup helper (Ensures Admin exists and default seed data if DB is empty)
  useEffect(() => {
    const initializeAndCleanupDatabase = async () => {
      try {
        setSyncStatus('syncing');

        // Ensure Admin user entry exists in team collection
        const teamSnap = await getDocs(collection(db, 'team'));
        let adminExistsInTeam = false;

        for (const teamDoc of teamSnap.docs) {
          const tmData = teamDoc.data() as TeamMember;
          const isSuperEmail = tmData.email && tmData.email.toLowerCase().trim() === 'webtasky@gmail.com';
          if (tmData.rank === 'Admin' || isSuperEmail) {
            adminExistsInTeam = true;
            break;
          }
        }

        if (!adminExistsInTeam) {
          const adminMember: TeamMember = {
            id: 'admin-webtasky',
            name: 'Web Tasky',
            role: 'Super Admin',
            rank: 'Admin',
            avatar: 'WT',
            email: 'webtasky@gmail.com',
            password: 'Sspidereg.com'
          };
          await setDoc(doc(db, 'team', adminMember.id), adminMember);
        }

        // Seed categories, habits, and tasks if empty
        const catSnap = await getDocs(collection(db, 'categories'));
        if (catSnap.empty) {
          for (const cat of INITIAL_CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), cat);
          }
          for (const hab of INITIAL_HABITS) {
            await setDoc(doc(db, 'habits', hab.id), hab);
          }
          for (const task of INITIAL_TASKS) {
            await setDoc(doc(db, 'tasks', task.id), task);
          }
        }

        // 5. Seed initial aiSupportQA if empty
        const qaSnap = await getDocs(collection(db, 'aiSupportQA'));
        if (qaSnap.empty) {
          const defaultQAs = [
            { id: 'qa-1', question: 'how to change password', answer: 'You can change your password in the Profile section of the navigation panel.', createdAt: new Date().toISOString() },
            { id: 'qa-2', question: 'app keeps lagging', answer: 'Try clearing your browser cache or reloading the application. If problems persist, check your internet connectivity.', createdAt: new Date().toISOString() },
            { id: 'qa-3', question: 'how to create task', answer: 'Click the "Add Task" button on the dashboard, fill in the subject, description, priority, and select a category.', createdAt: new Date().toISOString() }
          ];
          for (const qa of defaultQAs) {
            await setDoc(doc(db, 'aiSupportQA', qa.id), qa);
          }
        }

        // Clear stale local storage impersonations if present
        localStorage.removeItem('tasky_impersonated_email');
        localStorage.removeItem('tasky_impersonated_org_id');

        setSyncStatus('synced');
      } catch (error) {
        console.error("Error during database cleanup and init:", error);
        setSyncStatus('error');
      }
    };
    initializeAndCleanupDatabase();
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
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const isRecurring = newTaskData.recurring && newTaskData.recurring !== 'None';
    const groupId = isRecurring ? taskId : undefined;

    const newTask: Task = {
      ...newTaskData,
      id: taskId,
      recurringGroupId: groupId,
      checklist: [],
      attachments: newTaskData.attachments || [],
      comments: [],
      isPinned: false,
    };

    let futureInstances: Task[] = [];
    if (isRecurring) {
      futureInstances = generateFutureRecurringTasks(newTask, 8);
    }

    const allNewTasks = [newTask, ...futureInstances];

    setTasks(prev => {
      const updated = [...allNewTasks, ...prev];
      localStorage.setItem('tasky_tasks', JSON.stringify(updated));
      return updated;
    });

    setSyncStatus('syncing');
    try {
      for (const t of allNewTasks) {
        await setDoc(doc(db, 'tasks', t.id), t);
      }
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

    if (updatedTask.recurring && updatedTask.recurring !== 'None' && !updatedTask.recurringGroupId) {
      updatedTask.recurringGroupId = updatedTask.id;
    }

    const previousTask = tasks.find(t => t.id === updatedTask.id);
    const wasNotCompleted = previousTask && previousTask.status !== 'Completed';

    setTasks(prev => {
      const updated = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      localStorage.setItem('tasky_tasks', JSON.stringify(updated));
      return updated;
    });
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'tasks', updatedTask.id), updatedTask);

      // Automatically recreate task for next cycle if status transitioned to Completed and task is recurring
      if (updatedTask.status === 'Completed' && wasNotCompleted && updatedTask.recurring && updatedTask.recurring !== 'None') {
        const nextDueDate = getNextDueDate(updatedTask.dueDate, updatedTask.recurring);
        const exists = tasks.some(t => 
          (updatedTask.recurringGroupId ? t.recurringGroupId === updatedTask.recurringGroupId : t.title === updatedTask.title) &&
          t.dueDate === nextDueDate &&
          t.status !== 'Completed'
        );
        if (!exists) {
          const newTaskId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
          const newRecurringTask: Task = {
            ...updatedTask,
            id: newTaskId,
            recurringGroupId: updatedTask.recurringGroupId || updatedTask.id,
            status: 'Todo',
            completedAt: undefined,
            dueDate: nextDueDate,
            checklist: updatedTask.checklist ? updatedTask.checklist.map(item => ({ ...item, completed: false })) : [],
            attachments: [],
            comments: [],
          };
          await setDoc(doc(db, 'tasks', newTaskId), newRecurringTask);
        }
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error("Error updating task in Firestore:", error);
      setSyncStatus('error');
    }
  };

  // Delete Task from Firestore
  const deleteTask = async (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    let taskIdsToDelete = [id];

    if (targetTask) {
      if (targetTask.recurringGroupId) {
        taskIdsToDelete = tasks
          .filter(t => t.recurringGroupId === targetTask.recurringGroupId && t.dueDate >= targetTask.dueDate)
          .map(t => t.id);
      } else if (targetTask.recurring && targetTask.recurring !== 'None') {
        taskIdsToDelete = tasks
          .filter(t => t.title === targetTask.title && t.recurring === targetTask.recurring && t.dueDate >= targetTask.dueDate)
          .map(t => t.id);
      }
    }

    if (!taskIdsToDelete.includes(id)) {
      taskIdsToDelete.push(id);
    }

    setTasks(prev => {
      const updated = prev.filter(t => !taskIdsToDelete.includes(t.id));
      localStorage.setItem('tasky_tasks', JSON.stringify(updated));
      return updated;
    });

    setSyncStatus('syncing');
    try {
      for (const delId of taskIdsToDelete) {
        await deleteDoc(doc(db, 'tasks', delId));
      }
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

      // Automatically recreate task for next cycle if marked as Completed and task is recurring
      if (newStatus === 'Completed' && task.recurring && task.recurring !== 'None') {
        const nextDueDate = getNextDueDate(task.dueDate, task.recurring);
        const exists = tasks.some(t => t.title === task.title && t.dueDate === nextDueDate && t.status !== 'Completed');
        if (!exists) {
          const newTaskId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
          const newRecurringTask: Task = {
            ...task,
            id: newTaskId,
            status: 'Todo',
            completedAt: undefined,
            dueDate: nextDueDate,
            checklist: task.checklist ? task.checklist.map(item => ({ ...item, completed: false })) : [],
            attachments: [],
            comments: [],
          };
          await setDoc(doc(db, 'tasks', newTaskId), newRecurringTask);
        }
      }

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

  // Derive active user ID for user-specific data scoping
  const activeUserId = currentUserProfile?.id || (user ? (user.email === 'webtasky@gmail.com' ? 'admin-webtasky' : `tm-fb-${user.uid}`) : 'admin-webtasky');

  // Filter categories / subjects so every user sees only their own subjects
  const userCategories = useMemo(() => {
    if (!activeUserId) return [];
    return allCategories.filter(c => {
      if (c.userId) {
        return c.userId === activeUserId;
      }
      return activeUserId === 'admin-webtasky';
    });
  }, [allCategories, activeUserId]);

  // Auto-seed default starter subjects/categories for new users if they have none
  useEffect(() => {
    if (!activeUserId || authLoading) return;

    const userHasCat = allCategories.some(c => c.userId === activeUserId || (!c.userId && activeUserId === 'admin-webtasky'));

    if (!userHasCat && allCategories.length > 0) {
      const seedStarterCategories = async () => {
        try {
          for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
            const cat = INITIAL_CATEGORIES[i];
            const newCat: Category = {
              ...cat,
              id: `cat-${activeUserId}-${i + 1}`,
              userId: activeUserId
            };
            await setDoc(doc(db, 'categories', newCat.id), newCat);
          }
        } catch (err) {
          console.error("Error auto-seeding user categories:", err);
        }
      };
      seedStarterCategories();
    }
  }, [allCategories, activeUserId, authLoading]);

  // Category: Add directly to Firestore with user scoping
  const addCategory = async (name: string, color: string, type: 'Subject' | 'Project' | 'Personal'): Promise<string> => {
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      color,
      type,
      userId: activeUserId,
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
    const orgRanksObj = orgId ? { [orgId]: rank } : {};
    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      role,
      rank,
      orgRanks: orgRanksObj,
      avatar: initials || '??',
      email,
      password,
      orgId,
      orgIds: orgId ? [orgId] : []
    };
    setTeamMembers(prev => {
      const updated = [newMember, ...prev];
      localStorage.setItem('tasky_team_members', JSON.stringify(updated));
      return updated;
    });
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

  const generateOrgCode = () => `PLAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const deleteTeamMemberFromOrg = async (idOrEmail: string, targetOrgId: string) => {
    const target = teamMembers.find(tm => tm.id === idOrEmail || (tm.email && tm.email.toLowerCase().trim() === idOrEmail.toLowerCase().trim()));
    if (!target) return;

    const allMemberOrgIds = target.orgIds || (target.orgId ? [target.orgId] : []);
    const remainingOrgIds = allMemberOrgIds.filter(id => id !== targetOrgId);

    const newActiveOrgId = remainingOrgIds.length > 0 
      ? (target.orgId === targetOrgId ? remainingOrgIds[0] : target.orgId)
      : undefined;

    const updatedMember: TeamMember = {
      ...target,
      orgId: newActiveOrgId,
      orgIds: remainingOrgIds
    };

    setTeamMembers(prev => prev.map(m => m.id === target.id ? updatedMember : m));
    safeSaveLocalStorage('tasky_team_members', teamMembers.map(m => m.id === target.id ? updatedMember : m));

    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'team', target.id), updatedMember);
      setSyncStatus('synced');
    } catch (err) {
      console.error("Error removing team member from plan in Firestore:", err);
      setSyncStatus('error');
    }
  };

  const deleteTeamMember = async (id: string, orgId?: string) => {
    if (orgId) {
      await deleteTeamMemberFromOrg(id, orgId);
      return;
    }

    const target = teamMembers.find(tm => tm.id === id || (tm.email && tm.email.toLowerCase().trim() === id.toLowerCase().trim()));
    const targetId = target?.id || id;
    const targetEmail = target?.email || (id.includes('@') ? id : undefined);

    setTeamMembers(prev => {
      const updated = prev.filter(tm => 
        tm.id !== targetId && 
        (!targetEmail || !tm.email || tm.email.toLowerCase().trim() !== targetEmail.toLowerCase().trim())
      );
      safeSaveLocalStorage('tasky_team_members', updated);
      return updated;
    });

    setSyncStatus('syncing');
    try {
      if (targetId) {
        await deleteDoc(doc(db, 'team', targetId));
      }
      
      // Also query Firestore team collection by email to ensure duplicate records or alternate IDs are deleted
      if (targetEmail) {
        try {
          const teamSnap = await getDocs(collection(db, 'team'));
          for (const teamDoc of teamSnap.docs) {
            const tmData = teamDoc.data();
            if (tmData.email && tmData.email.toLowerCase().trim() === targetEmail.toLowerCase().trim()) {
              await deleteDoc(doc(db, 'team', teamDoc.id));
            }
          }
        } catch (e) {
          console.warn("Firestore team email query warning during deletion:", e);
        }

        try {
          const reqSnap = await getDocs(collection(db, 'join_requests'));
          for (const reqDoc of reqSnap.docs) {
            const reqData = reqDoc.data();
            if (reqData.email && reqData.email.toLowerCase().trim() === targetEmail.toLowerCase().trim()) {
              await deleteDoc(doc(db, 'join_requests', reqDoc.id));
            }
          }
        } catch (e) {
          console.warn("Firestore join_requests query warning during deletion:", e);
        }
      }

      setSyncStatus('synced');
    } catch (error) {
      console.error("Error deleting team member from Firestore:", error);
      setSyncStatus('error');
    }
  };

  const updateTeamMember = async (member: TeamMember) => {
    setTeamMembers(prev => {
      const updated = prev.map(tm => tm.id === member.id ? member : tm);
      localStorage.setItem('tasky_team_members', JSON.stringify(updated));
      return updated;
    });
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
      code: generateOrgCode(),
      createdAt: new Date().toISOString()
    };
    setOrganizations(prev => {
      const updated = [newOrg, ...prev];
      localStorage.setItem('tasky_organizations', JSON.stringify(updated));
      return updated;
    });
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

  const joinOrganizationByCode = async (code: string): Promise<{ success: boolean; message: string; org?: Organization }> => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a valid Plan Invite Code.' };
    }
    const rawClean = code.trim().toUpperCase();
    const cleanNoPrefix = rawClean.replace(/^PLAN-/, '');

    const targetOrg = organizations.find(o => {
      if (o.code) {
        const oCodeClean = o.code.trim().toUpperCase();
        if (oCodeClean === rawClean || oCodeClean.replace(/^PLAN-/, '') === cleanNoPrefix) return true;
      }
      const generatedCode = `PLAN-${o.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
      if (generatedCode === rawClean || generatedCode.replace(/^PLAN-/, '') === cleanNoPrefix) return true;
      if (o.id.toUpperCase() === rawClean || o.id.toUpperCase().slice(-6) === cleanNoPrefix) return true;
      return false;
    });

    if (!targetOrg) {
      return { success: false, message: `Plan Invite Code "${code}" not found. Please check the code and try again.` };
    }

    try {
      const activeMemberId = currentUserProfile?.id;
      const userEmail = currentUserProfile?.email || user?.email;

      let memberToUpdate = teamMembers.find(tm => tm.id === activeMemberId || (userEmail && tm.email && tm.email.toLowerCase().trim() === userEmail.toLowerCase().trim()));

      if (memberToUpdate) {
        const existingOrgIds = memberToUpdate.orgIds || (memberToUpdate.orgId ? [memberToUpdate.orgId] : []);
        const updatedOrgIds = Array.from(new Set([...existingOrgIds, targetOrg.id]));

        const updatedMember: TeamMember = {
          ...memberToUpdate,
          orgId: targetOrg.id,
          orgIds: updatedOrgIds
        };

        await setDoc(doc(db, 'team', updatedMember.id), updatedMember);
        setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      } else {
        const newMemberId = activeMemberId || `tm-${Date.now()}`;
        const newMember: TeamMember = {
          id: newMemberId,
          name: currentUserProfile?.name || user?.displayName || userEmail?.split('@')[0] || 'Member',
          email: userEmail || '',
          role: 'Team Member',
          rank: 'User',
          avatar: (currentUserProfile?.name || 'M').slice(0, 2).toUpperCase(),
          orgId: targetOrg.id,
          orgIds: [targetOrg.id]
        };
        await setDoc(doc(db, 'team', newMemberId), newMember);
        setTeamMembers(prev => [...prev, newMember]);
      }

      setCurrentUserProfile(prev => prev ? {
        ...prev,
        orgId: targetOrg.id,
        orgIds: Array.from(new Set([...(prev.orgIds || (prev.orgId ? [prev.orgId] : [])), targetOrg.id]))
      } : null);

      setSelectedOrgId(targetOrg.id);
      localStorage.setItem('tasky_selected_org_id', targetOrg.id);

      return {
        success: true,
        message: `Successfully joined plan "${targetOrg.name}"! Workspace switched.`,
        org: targetOrg
      };
    } catch (err: any) {
      console.error("Error joining organization by code:", err);
      return { success: false, message: err.message || 'Failed to join plan. Please try again.' };
    }
  };

  const updateOrganization = async (org: Organization) => {
    setOrganizations(prev => {
      const updated = prev.map(o => o.id === org.id ? org : o);
      localStorage.setItem('tasky_organizations', JSON.stringify(updated));
      return updated;
    });
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
    setOrganizations(prev => {
      const updated = prev.filter(o => o.id !== id);
      localStorage.setItem('tasky_organizations', JSON.stringify(updated));
      return updated;
    });
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

        if (currentUserProfile.rank !== 'Admin' && (receiverId === 'admin-webtasky' || receiverId === 'admin-spidereg2010')) {
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
            (m: Message) => m.isSupport && m.senderId === receiverId && (m.receiverId === 'admin-webtasky' || m.receiverId === 'admin-spidereg2010')
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

  // Helper to generate 6-character unique join code
  const generateProjectCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'PRJ-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Projects Actions
  const createProject = async (name: string, description?: string, color?: string) => {
    const code = generateProjectCode();
    const ownerId = currentUserProfile?.id || user?.uid || 'user-owner';
    const ownerName = currentUserProfile?.name || user?.displayName || 'Project Owner';
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      description: description || '',
      code,
      ownerId,
      ownerName,
      memberIds: [ownerId],
      color: color || '#6366f1',
      createdAt: new Date().toISOString(),
      orgId: currentUserProfile?.orgId || undefined
    };

    setProjects(prev => {
      const updated = [newProject, ...prev];
      safeSaveLocalStorage('tasky_projects', updated);
      return updated;
    });

    try {
      await firestoreSetDoc(doc(db, 'projects', newProject.id), newProject);
    } catch (err) {
      console.error("Error creating project in Firestore:", err);
    }

    return newProject;
  };

  const joinProjectByCode = async (code: string): Promise<{ success: boolean; message: string; project?: Project }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a valid project join code.' };

    const targetProject = projects.find(p => p.code.trim().toUpperCase() === cleanCode);
    if (!targetProject) {
      return { success: false, message: `No project found with code "${cleanCode}". Please check the code and try again.` };
    }

    const userId = currentUserProfile?.id || user?.uid || 'user-member';
    if (targetProject.memberIds.includes(userId)) {
      return { success: true, message: `You are already a member of "${targetProject.name}".`, project: targetProject };
    }

    const updatedMembers = [...targetProject.memberIds, userId];
    const updatedProject = { ...targetProject, memberIds: updatedMembers };

    setProjects(prev => {
      const updated = prev.map(p => p.id === targetProject.id ? updatedProject : p);
      safeSaveLocalStorage('tasky_projects', updated);
      return updated;
    });

    try {
      await firestoreSetDoc(doc(db, 'projects', targetProject.id), updatedProject);
    } catch (err) {
      console.error("Error joining project in Firestore:", err);
    }

    return { success: true, message: `Successfully joined project "${targetProject.name}"!`, project: updatedProject };
  };

  const leaveProject = async (projectId: string) => {
    const userId = currentUserProfile?.id || user?.uid || 'user-member';
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const updatedMembers = targetProject.memberIds.filter(id => id !== userId);
    const updatedProject = { ...targetProject, memberIds: updatedMembers };

    setProjects(prev => {
      const updated = prev.map(p => p.id === projectId ? updatedProject : p);
      safeSaveLocalStorage('tasky_projects', updated);
      return updated;
    });

    try {
      await firestoreSetDoc(doc(db, 'projects', projectId), updatedProject);
    } catch (err) {
      console.error("Error leaving project:", err);
    }
  };

  const deleteProject = async (projectId: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      safeSaveLocalStorage('tasky_projects', updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // Multi-Company Workspace Selector
  const userOrganizations = useMemo(() => {
    if (!user && localStorage.getItem('tasky_guest_mode') !== 'true') return [];
    const userEmail = user?.email?.toLowerCase().trim() || 'guest@tasky.local';
    if (userEmail === 'webtasky@gmail.com') return organizations;

    const memberOrgs = teamMembers
      .filter(tm => tm.email && tm.email.toLowerCase().trim() === userEmail && tm.orgId)
      .map(tm => tm.orgId as string);

    const profileOrgIds = currentUserProfile?.orgIds || [];
    if (currentUserProfile?.orgId) profileOrgIds.push(currentUserProfile.orgId);

    const allOrgIds = Array.from(new Set([...memberOrgs, ...profileOrgIds]));
    return organizations.filter(o => allOrgIds.includes(o.id));
  }, [user, teamMembers, organizations, currentUserProfile]);

  const selectCompanyWorkspace = (orgId: string) => {
    setSelectedOrgId(orgId);
    localStorage.setItem('tasky_selected_org_id', orgId);
    setIsWorkspaceSelectorOpen(false);
  };

  // Super Admin visibility: Super Admin is invisible to regular users and managers
  const isSuperAdmin = currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com';

  const visibleTeamMembers = useMemo(() => {
    if (isSuperAdmin) return teamMembers;

    return teamMembers.filter(m => {
      const emailLower = m.email?.toLowerCase().trim();
      if (m.id === 'admin-webtasky' || m.id === 'admin-spidereg2010') return false;
      if (emailLower === 'webtasky@gmail.com' || emailLower === 'spidereg2010@gmail.com') return false;
      if (m.role === 'Super Admin') return false;
      return true;
    });
  }, [teamMembers, isSuperAdmin]);

  const contextValue = useMemo(() => ({
    tasks,
    categories: userCategories,
    habits,
    teamMembers: visibleTeamMembers,
    organizations,
    userOrganizations,
    selectedOrgId,
    selectCompanyWorkspace,
    isWorkspaceSelectorOpen,
    setIsWorkspaceSelectorOpen,
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    joinProjectByCode,
    leaveProject,
    deleteProject,
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
    deleteTeamMemberFromOrg,
    updateTeamMember,
    isAdminOrManager,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    joinOrganizationByCode,
    sendMessage,
    syncStatus,
    triggerSync,
    isOnline,
    impersonateUser,
    impersonateOrgAsManager,
    stopImpersonating,
  }), [
    tasks,
    userCategories,
    habits,
    teamMembers,
    organizations,
    userOrganizations,
    selectedOrgId,
    isWorkspaceSelectorOpen,
    projects,
    activeProjectId,
    messages,
    aiSupportQA,
    darkMode,
    language,
    activeTab,
    user,
    authLoading,
    currentUserProfile,
    isAdminOrManager,
    syncStatus,
    isOnline
  ]);

  return (
    <TaskyContext.Provider value={contextValue}>
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

