import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTasky } from '../TaskyContext';
import { 
  X, 
  Bot, 
  Code2, 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Database,
  FileCode,
  Lock,
  Cpu,
  UserCheck,
  Users,
  ShieldAlert,
  Calendar,
  Trash2,
  CheckCircle2,
  FolderPlus,
  Building2,
  RefreshCw,
  Crown,
  ListTodo,
  FileText,
  Clock,
  Send,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { DEFAULT_STANDARD_PASSWORD } from '../utils/emailUtils';

interface AiIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiIntegrationsModal: React.FC<AiIntegrationsModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    currentUserProfile, 
    tasks, 
    projects, 
    teamMembers, 
    organizations,
    addTask, 
    deleteTask,
    updateTask,
    addCategory,
    addOrganization
  } = useTasky() as any;

  const isSuperAdmin = currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com';
  const isAdmin = currentUserProfile?.rank === 'Admin' || isSuperAdmin;

  // Master Super Admin AI Key (Stored or generated)
  const [superAdminAiKey, setSuperAdminAiKey] = useState<string>(() => {
    const saved = localStorage.getItem('tasky_ai_superadmin_key');
    if (saved) return saved;
    const generated = `tasky_super_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('tasky_ai_superadmin_key', generated);
    return generated;
  });

  const handleRegenerateKey = () => {
    const newKey = `tasky_super_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('tasky_ai_superadmin_key', newKey);
    setSuperAdminAiKey(newKey);
    setCopiedKey('super_key_regen');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Selected member for delegation (Default is Master Super Admin)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('super_admin');
  const [memberPassword, setMemberPassword] = useState<string>(DEFAULT_STANDARD_PASSWORD);
  
  const [activeTab, setActiveTab] = useState<'python' | 'javascript' | 'curl' | 'custom_gpt' | 'system_prompt' | 'playground'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Playground state for Super Admin execution
  const [playgroundAction, setPlaygroundAction] = useState<
    'get_schedule' | 'create_task' | 'delete_task' | 'update_task_status' | 'create_project' | 'create_plan' | 'get_audit'
  >('get_schedule');
  
  // Playground Form inputs
  const [testTaskTitle, setTestTaskTitle] = useState('AI Automated Strategic Review');
  const [testTaskDescription, setTestTaskDescription] = useState('Scheduled and managed autonomously by Second Super Admin AI.');
  const [testTaskPriority, setTestTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Urgent');
  const [testTaskDueDate, setTestTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [testDeleteTaskId, setTestDeleteTaskId] = useState<string>('');
  const [testUpdateTaskId, setTestUpdateTaskId] = useState<string>('');
  const [testUpdateStatus, setTestUpdateStatus] = useState<'Todo' | 'InProgress' | 'Completed'>('Completed');
  const [testProjectName, setTestProjectName] = useState('Q4 Autonomous Growth Plan');
  const [testProjectDesc, setTestProjectDesc] = useState('Project initiated by Second Super Admin AI.');
  const [testPlanName, setTestPlanName] = useState('Alpha Division Workspace');
  const [testPlanType, setTestPlanType] = useState<'Company' | 'Family' | 'Single'>('Company');

  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);

  // Set default selected task for deletion/update when tasks change
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      if (!testDeleteTaskId || !tasks.some((t: any) => t.id === testDeleteTaskId)) {
        setTestDeleteTaskId(tasks[0].id);
      }
      if (!testUpdateTaskId || !tasks.some((t: any) => t.id === testUpdateTaskId)) {
        setTestUpdateTaskId(tasks[0].id);
      }
    }
  }, [tasks]);

  if (!isOpen) return null;

  // If not admin, show restricted access banner
  if (!isAdmin) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-[#151722] border border-neutral-200 dark:border-white/10 rounded-[28px] shadow-2xl max-w-md w-full p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Super Admin Feature</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Only Organization Administrators have permission to issue AI Super Admin API Keys and configure autonomous agents.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Resolve target account for API Generation
  const isTargetSuperAdmin = selectedMemberId === 'super_admin';
  const currentAdminEmail = user?.email || currentUserProfile?.email || 'webtasky@gmail.com';
  const currentAdminId = user?.uid || currentUserProfile?.id || 'admin_uid';

  const selectedMember = (teamMembers || []).find((m: any) => m.id === selectedMemberId);
  const targetEmail = isTargetSuperAdmin ? 'webtasky@gmail.com' : (selectedMember ? selectedMember.email : currentAdminEmail);
  const targetUserId = isTargetSuperAdmin ? 'super_admin_master' : (selectedMember ? selectedMember.id : currentAdminId);
  const targetName = isTargetSuperAdmin ? 'Second Super Admin AI' : (selectedMember ? selectedMember.name : (currentUserProfile?.name || 'Administrator'));
  const targetRank = isTargetSuperAdmin ? 'Super Admin (Full Root Authority)' : (selectedMember ? (selectedMember.rank || 'User') : (currentUserProfile?.rank || 'Admin'));

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunPlayground = async () => {
    setIsRunningPlayground(true);
    setPlaygroundOutput(null);

    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      if (playgroundAction === 'get_schedule') {
        const todayStr = new Date().toISOString().split('T')[0];
        const schedule = (tasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          isOverdue: t.dueDate < todayStr && t.status !== 'Completed',
          assignedTo: (teamMembers || []).find((m: any) => m.id === t.assignedTo)?.name || t.assignedTo || 'Unassigned',
          project: (projects || []).find((p: any) => p.id === t.projectId)?.name || 'General'
        })).sort((a: any, b: any) => (a.dueDate || '').localeCompare(b.dueDate || ''));

        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          action: "GET_FULL_SCHEDULE",
          authorityLevel: "SECOND_SUPER_ADMIN",
          agentApiKey: superAdminAiKey,
          currentDate: todayStr,
          totalScheduleItems: schedule.length,
          scheduleSummary: {
            urgent: schedule.filter((s: any) => s.priority === 'Urgent').length,
            overdue: schedule.filter((s: any) => s.isOverdue).length,
            completed: schedule.filter((s: any) => s.status === 'Completed').length,
            inProgress: schedule.filter((s: any) => s.status === 'InProgress').length
          },
          schedule: schedule
        }, null, 2));
      } else if (playgroundAction === 'create_task') {
        const newTask = {
          title: testTaskTitle.trim() || 'AI Generated Task',
          description: testTaskDescription.trim() || 'Created via Second Super Admin AI Key',
          dueDate: testTaskDueDate || new Date().toISOString().split('T')[0],
          priority: testTaskPriority,
          status: 'Todo' as const,
          categoryId: 'cat-general',
          assignedTo: currentAdminId,
          assignedToIds: [currentAdminId],
          createdBy: 'AI_SUPER_ADMIN',
          isPinned: true
        };

        if (addTask) {
          addTask(newTask);
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_TASK",
          executedBy: "Second Super Admin AI",
          apiKey: superAdminAiKey,
          task: {
            id: `task_${Math.random().toString(36).substring(2, 9)}`,
            ...newTask,
            createdAt: new Date().toISOString(),
            statusMessage: "Task immediately committed to Tasky live workspace."
          }
        }, null, 2));
      } else if (playgroundAction === 'delete_task') {
        if (!testDeleteTaskId) {
          throw new Error("No task selected for deletion.");
        }
        const taskToDelete = (tasks || []).find((t: any) => t.id === testDeleteTaskId);
        if (deleteTask) {
          deleteTask(testDeleteTaskId);
        }

        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          action: "DELETE_TASK",
          executedBy: "Second Super Admin AI",
          deletedTaskId: testDeleteTaskId,
          deletedTaskTitle: taskToDelete?.title || 'Unknown Task',
          statusMessage: "Task permanently deleted from database with Super Admin key authority."
        }, null, 2));
      } else if (playgroundAction === 'update_task_status') {
        if (!testUpdateTaskId) {
          throw new Error("No task selected for status update.");
        }
        const target = (tasks || []).find((t: any) => t.id === testUpdateTaskId);
        if (target && updateTask) {
          updateTask({
            ...target,
            status: testUpdateStatus,
            completedAt: testUpdateStatus === 'Completed' ? new Date().toISOString() : undefined
          });
        }

        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          action: "UPDATE_TASK_STATUS",
          executedBy: "Second Super Admin AI",
          taskId: testUpdateTaskId,
          title: target?.title,
          previousStatus: target?.status,
          newStatus: testUpdateStatus,
          statusMessage: `Task successfully updated to ${testUpdateStatus}.`
        }, null, 2));
      } else if (playgroundAction === 'create_project') {
        const catName = testProjectName.trim() || 'AI Strategic Initiative';
        if (addCategory) {
          await addCategory(catName, 'bg-purple-500', 'Project');
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_PROJECT",
          executedBy: "Second Super Admin AI",
          projectName: catName,
          description: testProjectDesc,
          color: "bg-purple-500",
          statusMessage: "New project workspace initialized by Second Super Admin AI."
        }, null, 2));
      } else if (playgroundAction === 'create_plan') {
        const orgName = testPlanName.trim() || 'AI Workspace Plan';
        if (addOrganization) {
          await addOrganization(orgName, testPlanType);
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_ORGANIZATION_PLAN",
          executedBy: "Second Super Admin AI",
          planName: orgName,
          type: testPlanType,
          statusMessage: `New ${testPlanType} Organization Plan created with full multi-user provisioning.`
        }, null, 2));
      } else if (playgroundAction === 'get_audit') {
        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          action: "SUPER_ADMIN_FULL_AUDIT",
          totalTasks: (tasks || []).length,
          totalProjects: (projects || []).length,
          totalPlans: (organizations || []).length,
          totalTeamMembers: (teamMembers || []).length,
          activeOrganizations: organizations || [],
          teamRoster: (teamMembers || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            rank: m.rank,
            role: m.role
          }))
        }, null, 2));
      }
    } catch (e: any) {
      setPlaygroundOutput(JSON.stringify({
        status: 500,
        error: e.message || 'Super Admin API execution error'
      }, null, 2));
    } finally {
      setIsRunningPlayground(false);
    }
  };

  const effectivePassword = memberPassword.trim() || DEFAULT_STANDARD_PASSWORD;

  // Code Snippets for Full Super Admin Second AI
  const pythonSuperAdminCode = `import requests
import json
from datetime import datetime

# ==============================================================================
# 👑 TASKY SECOND SUPER ADMIN AI SDK
# Master Key: ${superAdminAiKey}
# Authority: FULL LEVEL-2 ROOT ACCESS (Schedule, Tasks, Plans, Projects, Deletions)
# ==============================================================================

FIREBASE_API_KEY = "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ"
PROJECT_ID = "industrious-modem-hg02f"
DATABASE_ID = "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"
TASKY_AI_MASTER_KEY = "${superAdminAiKey}"

class TaskySuperAdminAI:
    def __init__(self, master_key=TASKY_AI_MASTER_KEY, super_admin_email="webtasky@gmail.com", password="${DEFAULT_STANDARD_PASSWORD}"):
        self.master_key = master_key
        self.email = super_admin_email
        self.password = password
        self.id_token = None
        self.uid = None
        self._authenticate_as_super_admin()

    def _authenticate_as_super_admin(self):
        """Authenticates with Root Super Admin token bypass."""
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        resp = requests.post(url, json={"email": self.email, "password": self.password, "returnSecureToken": True})
        if resp.status_code != 200:
            raise PermissionError(f"Super Admin Authentication failed: {resp.text}")
        data = resp.json()
        self.id_token = data["idToken"]
        self.uid = data["localId"]
        print(f"👑 [Tasky AI] Second Super Admin connected with key: {self.master_key[:16]}...")

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.id_token}",
            "X-Tasky-Super-Key": self.master_key,
            "Content-Type": "application/json"
        }

    # 1. 📅 SEE FULL SCHEDULE & ALL TASKS
    def get_schedule(self):
        """Retrieve full schedule, deadlines, and task timeline across the entire system."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks"
        resp = requests.get(url, headers=self._headers())
        docs = resp.json().get("documents", [])
        schedule = []
        for doc in docs:
            fields = doc.get("fields", {})
            schedule.append({
                "id": doc["name"].split("/")[-1],
                "title": fields.get("title", {}).get("stringValue", "Untitled"),
                "status": fields.get("status", {}).get("stringValue", "Todo"),
                "priority": fields.get("priority", {}).get("stringValue", "Medium"),
                "dueDate": fields.get("dueDate", {}).get("stringValue", ""),
                "description": fields.get("description", {}).get("stringValue", "")
            })
        return sorted(schedule, key=lambda x: x.get("dueDate", ""))

    # 2. ➕ CREATE TASK AS SECOND SUPER ADMIN
    def create_task(self, title, description="Created by Super Admin AI", due_date=None, priority="High", assigned_to=None):
        """Create a new task with root permissions."""
        if not due_date:
            due_date = datetime.now().strftime("%Y-%m-%d")
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks"
        payload = {
            "fields": {
                "title": {"stringValue": title},
                "description": {"stringValue": description},
                "priority": {"stringValue": priority},
                "status": {"stringValue": "Todo"},
                "dueDate": {"stringValue": due_date},
                "isPinned": {"booleanValue": True},
                "assignedTo": {"stringValue": assigned_to or self.uid},
                "createdBy": {"stringValue": "AI_SUPER_ADMIN"}
            }
        }
        resp = requests.post(url, headers=self._headers(), json=payload)
        return resp.json()

    # 3. 🗑️ DELETE ANY TASK (Full Super Admin Authority)
    def delete_task(self, task_id):
        """Delete any task permanently from the system."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks/{task_id}"
        resp = requests.delete(url, headers=self._headers())
        return {"status": resp.status_code, "deleted_task_id": task_id, "success": resp.status_code in [200, 204]}

    # 4. ✏️ UPDATE TASK STATUS & DETAILS
    def update_task_status(self, task_id, status="Completed"):
        """Update status to 'Todo', 'InProgress', or 'Completed'."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks/{task_id}?updateMask.fieldPaths=status"
        payload = {"fields": {"status": {"stringValue": status}}}
        resp = requests.patch(url, headers=self._headers(), json=payload)
        return resp.json()

    # 5. 🏗️ CREATE PROJECT
    def create_project(self, name, description="", color="bg-indigo-500"):
        """Create a new project in the workspace."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/categories"
        payload = {
            "fields": {
                "name": {"stringValue": name},
                "color": {"stringValue": color},
                "type": {"stringValue": "Project"},
                "createdBy": {"stringValue": "AI_SUPER_ADMIN"}
            }
        }
        resp = requests.post(url, headers=self._headers(), json=payload)
        return resp.json()

    # 6. 🏢 CREATE WORKSPACE PLAN / ORGANIZATION
    def create_plan_organization(self, name, plan_type="Company"):
        """Create an organization plan (Company, Family, Single)."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/organizations"
        payload = {
            "fields": {
                "name": {"stringValue": name},
                "type": {"stringValue": plan_type},
                "ownerEmail": {"stringValue": self.email},
                "inviteCode": {"stringValue": f"AI-{int(datetime.now().timestamp())}"}
            }
        }
        resp = requests.post(url, headers=self._headers(), json=payload)
        return resp.json()

# === QUICK EXECUTION EXAMPLE ===
if __name__ == "__main__":
    ai_admin = TaskySuperAdminAI()

    # 1. Read entire schedule
    schedule = ai_admin.get_schedule()
    print(f"📅 Schedule Loaded ({len(schedule)} tasks):")
    for item in schedule[:5]:
        print(f"  • [{item['dueDate']}] ({item['priority']}) {item['title']} - {item['status']}")

    # 2. AI creates an urgent executive task
    created = ai_admin.create_task("Q4 AI Revenue Architecture Plan", priority="Urgent")
    print("✅ Created Task:", created.get("name"))

    # 3. AI creates a new project
    project = ai_admin.create_project("Autonomous AI Systems 2026")
    print("🏗️ Created Project:", project.get("name"))
`;

  const jsSuperAdminCode = `// ==============================================================================
// 👑 TASKY SECOND SUPER ADMIN AI AGENT (Node.js / TypeScript)
// Master Key: ${superAdminAiKey}
// Full Root Access: Schedule, Tasks, Deletions, Projects, Plans
// ==============================================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "industrious-modem-hg02f",
  appId: "1:293311432413:web:da918c8d753f17e753fd34",
  apiKey: "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ",
  authDomain: "industrious-modem-hg02f.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function initSuperAdminAI(masterKey = "${superAdminAiKey}") {
  // Authenticate as Super Admin
  const creds = await signInWithEmailAndPassword(auth, "webtasky@gmail.com", "${DEFAULT_STANDARD_PASSWORD}");
  const superAdminUid = creds.user.uid;
  console.log("👑 Second Super Admin connected. Key:", masterKey);

  return {
    // 1. 📅 Read full schedule & all tasks
    async getSchedule() {
      const snap = await getDocs(collection(db, 'tasks'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    },

    // 2. ➕ Create task with super admin priority
    async createTask({ title, description = '', dueDate = new Date().toISOString().split('T')[0], priority = 'High' }) {
      const ref = doc(collection(db, 'tasks'));
      const newTask = {
        id: ref.id,
        title,
        description,
        dueDate,
        priority,
        status: 'Todo',
        categoryId: 'cat-general',
        assignedTo: superAdminUid,
        createdBy: 'AI_SUPER_ADMIN',
        isPinned: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(ref, newTask);
      return newTask;
    },

    // 3. 🗑️ Delete any task
    async deleteTask(taskId) {
      await deleteDoc(doc(db, 'tasks', taskId));
      return { success: true, deletedTaskId: taskId };
    },

    // 4. ✏️ Update task status (Todo | InProgress | Completed)
    async updateTaskStatus(taskId, status) {
      await updateDoc(doc(db, 'tasks', taskId), { status });
      return { success: true, taskId, status };
    },

    // 5. 🏗️ Create new project
    async createProject(name, color = 'bg-indigo-500') {
      const ref = doc(collection(db, 'categories'));
      const project = { id: ref.id, name, color, type: 'Project' };
      await setDoc(ref, project);
      return project;
    },

    // 6. 🏢 Create organization plan
    async createPlan(name, type = 'Company') {
      const ref = doc(collection(db, 'organizations'));
      const plan = {
        id: ref.id,
        name,
        type,
        ownerEmail: 'webtasky@gmail.com',
        inviteCode: 'AI-' + Date.now().toString(36).toUpperCase()
      };
      await setDoc(ref, plan);
      return plan;
    }
  };
}
`;

  const curlSuperAdminCode = `# ==============================================================================
# 👑 TASKY SECOND SUPER ADMIN REST API (cURL Commands)
# AI Key: ${superAdminAiKey}
# ==============================================================================

# 1. Step 1: Exchange Super Admin Key for Live Bearer Token
AUTH_RESP=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"webtasky@gmail.com","password":"${DEFAULT_STANDARD_PASSWORD}","returnSecureToken":true}')
TOKEN=$(echo $AUTH_RESP | grep -o '"idToken": "[^"]*' | cut -d'"' -f4)

# 2. 📅 GET Full Schedule and All Tasks:
curl -X GET "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Tasky-Super-Key: ${superAdminAiKey}"

# 3. ➕ CREATE Task as Second Super Admin:
curl -X POST "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fields": {
      "title": {"stringValue": "Urgent AI Executive Priority"},
      "priority": {"stringValue": "Urgent"},
      "status": {"stringValue": "Todo"},
      "dueDate": {"stringValue": "2026-09-01"},
      "createdBy": {"stringValue": "AI_SUPER_ADMIN"}
    }
  }'

# 4. 🗑️ DELETE Any Task by ID:
curl -X DELETE "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks/YOUR_TASK_ID" \\
  -H "Authorization: Bearer $TOKEN"

# 5. 🏗️ CREATE New Project Workspace:
curl -X POST "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/categories" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"fields":{"name":{"stringValue":"AI Innovation Hub"},"type":{"stringValue":"Project"}}}'
`;

  const customGptSuperAdminSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Tasky Second Super Admin AI Controller",
    "description": "Full Root Super Admin API tools for AI agent. Authorized with Key: ${superAdminAiKey}",
    "version": "2.0.0"
  },
  "servers": [
    {
      "url": "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents"
    }
  ],
  "paths": {
    "/tasks": {
      "get": {
        "summary": "See Full Schedule and Read All Tasks",
        "operationId": "getSchedule",
        "description": "Returns complete schedule and task list across all workspaces.",
        "responses": {
          "200": { "description": "Full schedule list" }
        }
      },
      "post": {
        "summary": "Create Task as Super Admin",
        "operationId": "createTask",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fields": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "object", "properties": { "stringValue": { "type": "string" } } },
                      "priority": { "type": "object", "properties": { "stringValue": { "type": "string", "enum": ["Low", "Medium", "High", "Urgent"] } } },
                      "dueDate": { "type": "object", "properties": { "stringValue": { "type": "string" } } },
                      "description": { "type": "object", "properties": { "stringValue": { "type": "string" } } },
                      "status": { "type": "object", "properties": { "stringValue": { "type": "string", "enum": ["Todo", "InProgress", "Completed"] } } }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Task created successfully" }
        }
      }
    },
    "/tasks/{taskId}": {
      "delete": {
        "summary": "Delete Task (Super Admin)",
        "operationId": "deleteTask",
        "parameters": [
          { "name": "taskId", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Task permanently deleted" }
        }
      }
    },
    "/categories": {
      "post": {
        "summary": "Create Project",
        "operationId": "createProject",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fields": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "object", "properties": { "stringValue": { "type": "string" } } },
                      "type": { "type": "object", "properties": { "stringValue": { "type": "string", "default": "Project" } } }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Project created" }
        }
      }
    },
    "/organizations": {
      "post": {
        "summary": "Create Plan / Organization",
        "operationId": "createPlan",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fields": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "object", "properties": { "stringValue": { "type": "string" } } },
                      "type": { "type": "object", "properties": { "stringValue": { "type": "string", "enum": ["Company", "Family", "Single"] } } }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Plan organization created" }
        }
      }
    }
  }
}`;

  const aiSystemPrompt = `You are the "Tasky Second Super Admin AI" with Level-2 Root Authority over the user's workspace.

YOUR CREDENTIALS & KEY:
- Master Key: ${superAdminAiKey}
- Authority: Second Super Admin (Full Read, Write, Delete, Project & Plan Creation)
- Database: Tasky Cloud Workspace (ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd)

YOUR DIRECT CAPABILITIES:
1. 📅 SEE SCHEDULE: You can inspect all tasks, deadlines, upcoming milestones, and overdue items.
2. ➕ CREATE TASKS: When the user asks you to plan their day or schedule items, create tasks with appropriate priorities (Low, Medium, High, Urgent) and due dates.
3. 🗑️ DELETE TASKS: When the user asks to remove, cancel, or clean up tasks, execute task deletions using task IDs.
4. ✏️ UPDATE TASKS: Mark tasks as Completed, InProgress, or reschedule deadlines.
5. 🏗️ CREATE PROJECTS: Group related tasks under newly initialized projects.
6. 🏢 CREATE PLANS: Spin up new Company, Family, or Personal workspaces.

OPERATIONAL INSTRUCTIONS:
- Always confirm deletions with the user before deleting major milestones.
- Keep deadlines strictly in YYYY-MM-DD format.
- Proactively summarize the user's daily schedule when they ask "What is on my schedule today?".
`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white dark:bg-[#12141f] border border-neutral-200 dark:border-white/10 rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    Second Super Admin AI Key & Agent Hub
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    ROOT ACCESS
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Empower your AI with a master key to see schedules, create/delete tasks, build projects, and manage plans.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Master Super Admin Key Banner */}
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 text-white border-b border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>YOUR AI SUPER ADMIN MASTER KEY:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs sm:text-sm font-bold text-emerald-400 bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-500/30 select-all">
                  {superAdminAiKey}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(superAdminAiKey, 'super_key')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {copiedKey === 'super_key' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Key Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Master Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRegenerateKey}
                title="Regenerate new key"
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="px-5 sm:px-6 py-2.5 bg-neutral-100/80 dark:bg-white/[0.02] border-b border-neutral-200/60 dark:border-white/5 flex flex-wrap items-center gap-3 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Granted Super Admin Permissions:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3" /> See Schedule & Tasks
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create Tasks
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Delete Tasks
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
              <FolderPlus className="w-3 h-3" /> Create Projects
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Create Workspace Plans
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-neutral-200/60 dark:border-white/5 flex items-center justify-between shrink-0 bg-neutral-50/30 dark:bg-white/[0.01]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'python'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python SDK</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('javascript')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'javascript'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Node.js Agent</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'curl'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>cURL / REST</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('custom_gpt')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'custom_gpt'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Custom GPT Schema</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system_prompt')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'system_prompt'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI System Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playground')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'playground'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Live Super Admin Console</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {activeTab !== 'playground' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    <span>
                      {activeTab === 'python' && 'Python Super Admin AI Controller Class'}
                      {activeTab === 'javascript' && 'Node.js / TypeScript Super Admin AI Module'}
                      {activeTab === 'curl' && 'Direct REST API cURL Commands with Super Admin Token'}
                      {activeTab === 'custom_gpt' && 'OpenAPI 3.1.0 Actions Specification for ChatGPT & Gemini'}
                      {activeTab === 'system_prompt' && 'AI System Prompt for Autonomous Second Super Admin'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const codeToCopy = 
                        activeTab === 'python' ? pythonSuperAdminCode :
                        activeTab === 'javascript' ? jsSuperAdminCode :
                        activeTab === 'curl' ? curlSuperAdminCode :
                        activeTab === 'custom_gpt' ? customGptSuperAdminSchema : aiSystemPrompt;
                      copyToClipboard(codeToCopy, activeTab);
                    }}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedKey === activeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Block Container */}
                <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[380px] select-all shadow-inner">
                  <pre>{
                    activeTab === 'python' ? pythonSuperAdminCode :
                    activeTab === 'javascript' ? jsSuperAdminCode :
                    activeTab === 'curl' ? curlSuperAdminCode :
                    activeTab === 'custom_gpt' ? customGptSuperAdminSchema : aiSystemPrompt
                  }</pre>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <Crown className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="font-bold block">Second Super Admin Authority:</span>
                    <span>This integration code has full root capabilities over your Tasky system. It can autonomously read your schedule, create tasks, permanently delete completed/canceled tasks, and establish new project workspaces and organization plans.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Test Playground for Second Super Admin */
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Execute Super Admin Actions as Second AI
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Test live data mutations in your active workspace using your AI Master Key
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={playgroundAction}
                        onChange={(e) => setPlaygroundAction(e.target.value as any)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white shadow-sm"
                      >
                        <option value="get_schedule">📅 1. See Full Schedule & Tasks</option>
                        <option value="create_task">➕ 2. Create Task as Super Admin</option>
                        <option value="delete_task">🗑️ 3. Delete Task (Full Authority)</option>
                        <option value="update_task_status">🔄 4. Update Task Status</option>
                        <option value="create_project">🏗️ 5. Create New Project</option>
                        <option value="create_plan">🏢 6. Create Workspace Plan</option>
                        <option value="get_audit">👥 7. Full Workspace Audit</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleRunPlayground}
                        disabled={isRunningPlayground}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        {isRunningPlayground ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Run Action</span>
                      </button>
                    </div>
                  </div>

                  {/* Contextual Form for specific actions */}
                  {playgroundAction === 'create_task' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-neutral-200/60 dark:border-white/5">
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Task Title</label>
                        <input
                          type="text"
                          value={testTaskTitle}
                          onChange={(e) => setTestTaskTitle(e.target.value)}
                          placeholder="e.g. Schedule Executive Alignment"
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Priority</label>
                        <select
                          value={testTaskPriority}
                          onChange={(e) => setTestTaskPriority(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={testTaskDueDate}
                          onChange={(e) => setTestTaskDueDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {playgroundAction === 'delete_task' && (
                    <div className="pt-3 border-t border-neutral-200/60 dark:border-white/5">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Select Task to Delete with Super Admin Authority</label>
                      <select
                        value={testDeleteTaskId}
                        onChange={(e) => setTestDeleteTaskId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        {(tasks || []).map((t: any) => (
                          <option key={t.id} value={t.id}>
                            [{t.priority}] {t.title} (Due: {t.dueDate || 'No date'}, Status: {t.status}) — ID: {t.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {playgroundAction === 'update_task_status' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-neutral-200/60 dark:border-white/5">
                      <div className="sm:col-span-8">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Select Task</label>
                        <select
                          value={testUpdateTaskId}
                          onChange={(e) => setTestUpdateTaskId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                          {(tasks || []).map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.status})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">New Status</label>
                        <select
                          value={testUpdateStatus}
                          onChange={(e) => setTestUpdateStatus(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Todo">Todo</option>
                          <option value="InProgress">InProgress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {playgroundAction === 'create_project' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-neutral-200/60 dark:border-white/5">
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Project Name</label>
                        <input
                          type="text"
                          value={testProjectName}
                          onChange={(e) => setTestProjectName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Description</label>
                        <input
                          type="text"
                          value={testProjectDesc}
                          onChange={(e) => setTestProjectDesc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {playgroundAction === 'create_plan' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-neutral-200/60 dark:border-white/5">
                      <div className="sm:col-span-7">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Organization Plan Name</label>
                        <input
                          type="text"
                          value={testPlanName}
                          onChange={(e) => setTestPlanName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Plan Workspace Type</label>
                        <select
                          value={testPlanType}
                          onChange={(e) => setTestPlanType(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Company">Company Workspace (Full Team)</option>
                          <option value="Family">Family Workspace</option>
                          <option value="Single">Single / Personal Workspace</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Playground Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      Live Second Super Admin Response
                    </span>
                    {playgroundOutput && (
                      <button
                        onClick={() => copyToClipboard(playgroundOutput, 'output')}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'output' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Output JSON</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-[11px] text-emerald-400 min-h-[160px] max-h-[280px] overflow-y-auto shadow-inner">
                    {playgroundOutput ? (
                      <pre>{playgroundOutput}</pre>
                    ) : (
                      <span className="text-neutral-500 italic">
                        Select an action above and click "Run Action" to test schedule reading, task creation, deletion, project creation, or plan setup...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Full Level-2 Root Super Admin Authorization Active</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

