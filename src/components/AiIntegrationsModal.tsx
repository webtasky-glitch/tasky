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
  Plus,
  User
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
    addOrganization,
    generateOrUpdateMemberApiKey
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

  // Selected member for delegation / viewing
  // If admin: defaults to 'super_admin' or can select any user
  // If non-admin: defaults to currentUserProfile.id
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return isAdmin ? 'super_admin' : (currentUserProfile?.id || 'self');
  });

  const [activeTab, setActiveTab] = useState<'python' | 'javascript' | 'curl' | 'custom_gpt' | 'system_prompt' | 'playground'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Playground state
  const [playgroundAction, setPlaygroundAction] = useState<
    'get_schedule' | 'create_task' | 'delete_task' | 'update_task_status' | 'create_project' | 'create_plan' | 'get_audit'
  >('get_schedule');
  
  // Playground Form inputs
  const [testTaskTitle, setTestTaskTitle] = useState('AI Automated Task');
  const [testTaskDescription, setTestTaskDescription] = useState('Managed via Tasky AI Key.');
  const [testTaskPriority, setTestTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');
  const [testTaskDueDate, setTestTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [testDeleteTaskId, setTestDeleteTaskId] = useState<string>('');
  const [testUpdateTaskId, setTestUpdateTaskId] = useState<string>('');
  const [testUpdateStatus, setTestUpdateStatus] = useState<'Todo' | 'InProgress' | 'Completed'>('Completed');
  const [testProjectName, setTestProjectName] = useState('Autonomous AI Project');
  const [testProjectDesc, setTestProjectDesc] = useState('Project initiated by Tasky AI.');
  const [testPlanName, setTestPlanName] = useState('AI Workspace Plan');
  const [testPlanType, setTestPlanType] = useState<'Company' | 'Family' | 'Single'>('Company');

  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);

  // Reset selected member if rank changes
  useEffect(() => {
    if (!isAdmin) {
      setSelectedMemberId(currentUserProfile?.id || 'self');
    }
  }, [isAdmin, currentUserProfile?.id]);

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

  // Resolve target account for API Generation & Display
  const isTargetSuperAdmin = isAdmin && selectedMemberId === 'super_admin';
  const selectedMember = (teamMembers || []).find((m: any) => 
    m.id === selectedMemberId || 
    (selectedMemberId === 'self' && (m.id === currentUserProfile?.id || (m.email && m.email.toLowerCase().trim() === currentUserProfile?.email?.toLowerCase().trim())))
  ) || (!isTargetSuperAdmin ? currentUserProfile : null);

  const targetEmail = isTargetSuperAdmin 
    ? (user?.email || 'webtasky@gmail.com') 
    : (selectedMember?.email || currentUserProfile?.email || 'user@tasky.com');
  const targetUserId = isTargetSuperAdmin 
    ? (user?.uid || 'super_admin_uid') 
    : (selectedMember?.id || currentUserProfile?.id || 'user_uid');
  const targetName = isTargetSuperAdmin 
    ? 'Second Super Admin AI' 
    : (selectedMember?.name || currentUserProfile?.name || 'User');
  const targetRank = isTargetSuperAdmin 
    ? 'Super Admin (Full Root Authority)' 
    : (selectedMember?.rank || currentUserProfile?.rank || 'User');

  // The active key to display and put in code snippets
  const activeEffectiveKey = isTargetSuperAdmin 
    ? superAdminAiKey 
    : (selectedMember?.apiKey || currentUserProfile?.apiKey || null);

  const handleRegenerateSuperAdminKey = () => {
    const newKey = `tasky_super_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('tasky_ai_superadmin_key', newKey);
    setSuperAdminAiKey(newKey);
    setCopiedKey('super_key_regen');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateUserKey = async () => {
    if (!selectedMember && !currentUserProfile) return;
    const memberIdToUpdate = selectedMember?.id || currentUserProfile?.id;
    if (!memberIdToUpdate) return;

    setIsGeneratingKey(true);
    try {
      if (generateOrUpdateMemberApiKey) {
        await generateOrUpdateMemberApiKey(memberIdToUpdate);
        setCopiedKey('user_key_generated');
        setTimeout(() => setCopiedKey(null), 3000);
      }
    } catch (err: any) {
      console.error("Failed to generate key:", err);
    } finally {
      setIsGeneratingKey(false);
    }
  };

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
      const todayStr = new Date().toISOString().split('T')[0];

      if (playgroundAction === 'get_schedule') {
        // If super admin, view everything; if user, filter to their assigned or accessible tasks
        const filteredTasks = isTargetSuperAdmin 
          ? (tasks || []) 
          : (tasks || []).filter((t: any) => {
              if (t.assignedTo === targetUserId || t.createdBy === targetUserId) return true;
              if (Array.isArray(t.assignedToIds) && t.assignedToIds.includes(targetUserId)) return true;
              return false;
            });

        const schedule = filteredTasks.map((t: any) => ({
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
          action: "GET_SCHEDULE",
          authorityLevel: isTargetSuperAdmin ? "SUPER_ADMIN_ROOT" : "USER_SCOPED",
          user: {
            name: targetName,
            email: targetEmail,
            rank: targetRank
          },
          apiKey: activeEffectiveKey || 'NO_KEY_ISSUED',
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
          description: testTaskDescription.trim() || `Created via Tasky AI Key for ${targetName}`,
          dueDate: testTaskDueDate || todayStr,
          priority: testTaskPriority,
          status: 'Todo' as const,
          categoryId: 'cat-general',
          assignedTo: targetUserId,
          assignedToIds: [targetUserId],
          createdBy: isTargetSuperAdmin ? 'AI_SUPER_ADMIN' : `AI_USER_${targetUserId}`,
          isPinned: isTargetSuperAdmin
        };

        if (addTask) {
          addTask(newTask);
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_TASK",
          executedFor: targetName,
          assignedTo: targetEmail,
          apiKey: activeEffectiveKey,
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
          executedBy: isTargetSuperAdmin ? "Second Super Admin AI" : `${targetName} AI Agent`,
          deletedTaskId: testDeleteTaskId,
          deletedTaskTitle: taskToDelete?.title || 'Unknown Task',
          statusMessage: "Task permanently removed from workspace database."
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
          executedFor: targetName,
          taskId: testUpdateTaskId,
          title: target?.title,
          previousStatus: target?.status,
          newStatus: testUpdateStatus,
          statusMessage: `Task successfully updated to ${testUpdateStatus}.`
        }, null, 2));
      } else if (playgroundAction === 'create_project') {
        const catName = testProjectName.trim() || 'AI Strategic Initiative';
        if (addCategory) {
          await addCategory(catName, 'bg-indigo-500', 'Project');
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_PROJECT",
          executedBy: isTargetSuperAdmin ? "Second Super Admin AI" : `${targetName} AI`,
          projectName: catName,
          description: testProjectDesc,
          color: "bg-indigo-500",
          statusMessage: "New project workspace initialized in Tasky."
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
          executedBy: isTargetSuperAdmin ? "Second Super Admin AI" : `${targetName} AI`,
          planName: orgName,
          type: testPlanType,
          statusMessage: `New ${testPlanType} Organization Plan created with full multi-user provisioning.`
        }, null, 2));
      } else if (playgroundAction === 'get_audit') {
        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          action: "WORKSPACE_AUDIT",
          auditedBy: targetName,
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
            role: m.role,
            hasApiKey: !!m.apiKey
          }))
        }, null, 2));
      }
    } catch (e: any) {
      setPlaygroundOutput(JSON.stringify({
        status: 500,
        error: e.message || 'API execution error'
      }, null, 2));
    } finally {
      setIsRunningPlayground(false);
    }
  };

  const displayedKey = activeEffectiveKey || 'tasky_user_live_pending_key_generation';

  // Code Snippets
  const pythonCode = `import requests
import json
from datetime import datetime

# ==============================================================================
# 🤖 TASKY AI CONNECTOR (Python SDK)
# Target User: ${targetName} (${targetEmail})
# Rank: ${targetRank}
# API Key: ${displayedKey}
# ==============================================================================

FIREBASE_API_KEY = "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ"
PROJECT_ID = "industrious-modem-hg02f"
DATABASE_ID = "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"
TASKY_API_KEY = "${displayedKey}"
USER_EMAIL = "${targetEmail}"
USER_ID = "${targetUserId}"

class TaskyAI:
    def __init__(self, api_key=TASKY_API_KEY, email=USER_EMAIL, password="${DEFAULT_STANDARD_PASSWORD}"):
        self.api_key = api_key
        self.email = email
        self.password = password
        self.id_token = None
        self.uid = USER_ID
        self._authenticate()

    def _authenticate(self):
        """Authenticates with Tasky Workspace Engine."""
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        resp = requests.post(url, json={"email": self.email, "password": self.password, "returnSecureToken": True})
        if resp.status_code != 200:
            raise PermissionError(f"Authentication failed: {resp.text}")
        data = resp.json()
        self.id_token = data["idToken"]
        self.uid = data.get("localId", USER_ID)
        print(f"✅ [Tasky AI] Connected as ${targetName} with key: {self.api_key[:16]}...")

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.id_token}",
            "X-Tasky-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    # 1. 📅 SEE SCHEDULE & TASKS
    def get_schedule(self):
        """Retrieve upcoming schedule and task timeline."""
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

    # 2. ➕ CREATE TASK
    def create_task(self, title, description="", due_date=None, priority="High"):
        """Create a new task assigned to user."""
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
                "assignedTo": {"stringValue": self.uid},
                "createdBy": {"stringValue": "AI_ASSISTANT"}
            }
        }
        resp = requests.post(url, headers=self._headers(), json=payload)
        return resp.json()

    # 3. 🗑️ DELETE TASK
    def delete_task(self, task_id):
        """Delete task from schedule."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks/{task_id}"
        resp = requests.delete(url, headers=self._headers())
        return {"status": resp.status_code, "deleted_task_id": task_id, "success": resp.status_code in [200, 204]}

    # 4. ✏️ UPDATE TASK STATUS
    def update_task_status(self, task_id, status="Completed"):
        """Update status to 'Todo', 'InProgress', or 'Completed'."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks/{task_id}?updateMask.fieldPaths=status"
        payload = {"fields": {"status": {"stringValue": status}}}
        resp = requests.patch(url, headers=self._headers(), json=payload)
        return resp.json()

# === QUICK TEST EXECUTION ===
if __name__ == "__main__":
    ai = TaskyAI()
    schedule = ai.get_schedule()
    print(f"📅 Schedule Loaded ({len(schedule)} tasks)")
    for t in schedule[:3]:
        print(f"  • [{t['dueDate']}] ({t['priority']}) {t['title']} - {t['status']}")
`;

  const jsCode = `// ==============================================================================
// 🤖 TASKY AI CONNECTOR (Node.js / TypeScript)
// User: ${targetName} (${targetEmail})
// API Key: ${displayedKey}
// ==============================================================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "industrious-modem-hg02f",
  appId: "1:293311432413:web:da918c8d753f17e753fd34",
  apiKey: "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ",
  firestoreDatabaseId: "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function initTaskyAI(apiKey = "${displayedKey}") {
  const creds = await signInWithEmailAndPassword(auth, "${targetEmail}", "${DEFAULT_STANDARD_PASSWORD}");
  const userId = creds.user.uid;
  console.log("🤖 Tasky AI Connected for ${targetName}. Key:", apiKey);

  return {
    // 1. 📅 Read schedule
    async getSchedule() {
      const snap = await getDocs(collection(db, 'tasks'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    },

    // 2. ➕ Create task
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
        assignedTo: userId,
        createdBy: 'AI_ASSISTANT',
        createdAt: new Date().toISOString()
      };
      await setDoc(ref, newTask);
      return newTask;
    },

    // 3. 🗑️ Delete task
    async deleteTask(taskId) {
      await deleteDoc(doc(db, 'tasks', taskId));
      return { success: true, deletedTaskId: taskId };
    },

    // 4. ✏️ Update status
    async updateTaskStatus(taskId, status) {
      await updateDoc(doc(db, 'tasks', taskId), { status });
      return { success: true, taskId, status };
    }
  };
}
`;

  const curlCode = `# ==============================================================================
# 🤖 TASKY REST API (cURL Commands)
# User: ${targetName} (${targetEmail})
# API Key: ${displayedKey}
# ==============================================================================

# 1. Obtain Live Bearer Token
AUTH_RESP=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${targetEmail}","password":"${DEFAULT_STANDARD_PASSWORD}","returnSecureToken":true}')
TOKEN=$(echo $AUTH_RESP | grep -o '"idToken": "[^"]*' | cut -d'"' -f4)

# 2. 📅 GET Schedule and Tasks:
curl -X GET "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Tasky-API-Key: ${displayedKey}"

# 3. ➕ CREATE Task:
curl -X POST "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fields": {
      "title": {"stringValue": "New Priority Task"},
      "priority": {"stringValue": "High"},
      "status": {"stringValue": "Todo"},
      "dueDate": {"stringValue": "${new Date().toISOString().split('T')[0]}"},
      "assignedTo": {"stringValue": "${targetUserId}"},
      "createdBy": {"stringValue": "AI_ASSISTANT"}
    }
  }'
`;

  const customGptSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Tasky AI Assistant Controller",
    "description": "API tools for ${targetName} (${targetRank}). Authorized with Key: ${displayedKey}",
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
        "summary": "See Schedule and Read Tasks",
        "operationId": "getSchedule",
        "responses": {
          "200": { "description": "Schedule list retrieved" }
        }
      },
      "post": {
        "summary": "Create Task",
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
                      "status": { "type": "object", "properties": { "stringValue": { "type": "string", "enum": ["Todo", "InProgress", "Completed"] } } }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Task created" }
        }
      }
    },
    "/tasks/{taskId}": {
      "delete": {
        "summary": "Delete Task",
        "operationId": "deleteTask",
        "parameters": [
          { "name": "taskId", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Task deleted" }
        }
      }
    }
  }
}`;

  const systemPromptCode = `You are the personal AI Assistant for ${targetName} (${targetEmail}) in Tasky.

YOUR CREDENTIALS:
- User: ${targetName}
- Role/Rank: ${targetRank}
- Active API Key: ${displayedKey}
- Database: Tasky Cloud Workspace

YOUR CORE CAPABILITIES:
1. 📅 SEE SCHEDULE: View current deadlines, tasks, and overdue items.
2. ➕ CREATE TASKS: Add actionable items with due dates and priority levels.
3. 🗑️ DELETE TASKS: Clean up finished or cancelled tasks.
4. ✏️ UPDATE PROGRESS: Mark tasks InProgress or Completed.

OPERATIONAL RULES:
- Format dates strictly as YYYY-MM-DD.
- Prioritize high-impact and overdue tasks when summarizing the daily agenda.
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
              <div className={`w-11 h-11 rounded-2xl ${isTargetSuperAdmin ? 'bg-gradient-to-tr from-indigo-500 to-emerald-500' : 'bg-gradient-to-tr from-emerald-500 to-cyan-500'} text-white flex items-center justify-center shadow-lg`}>
                {isTargetSuperAdmin ? <Crown className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {isTargetSuperAdmin ? 'Second Super Admin AI & Agent Hub' : `${targetName}'s AI Assistant & API Hub`}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border flex items-center gap-1 ${
                    isTargetSuperAdmin 
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isTargetSuperAdmin ? <Crown className="w-3 h-3 text-amber-500" /> : <Sparkles className="w-3 h-3 text-emerald-500" />}
                    {isTargetSuperAdmin ? 'SUPER ADMIN KEY' : `${targetRank.toUpperCase()} API KEY`}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isTargetSuperAdmin 
                    ? 'Empower your AI with a master key to see schedules, delete/create tasks, build projects, and manage plans.' 
                    : 'Connect your local PC AI, Gemini in your phone, or custom scripts to manage your schedule and tasks.'}
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

          {/* Admin User Selector Banner (Only for Admins) */}
          {isAdmin && (
            <div className="px-5 sm:px-6 py-2.5 bg-neutral-100 dark:bg-neutral-900/80 border-b border-neutral-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Admin Target Mode:</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 rounded-xl text-xs font-bold text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                >
                  <option value="super_admin">👑 Master Super Admin (Full Level-2 Root Access)</option>
                  <optgroup label="Manage User API Keys">
                    {(teamMembers || []).map((m: any) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.rank || 'User'} - {m.email || 'No email'}) {m.apiKey ? '✓ Has Key' : '⚠️ No Key'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Active Key Display Banner */}
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 text-white border-b border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isTargetSuperAdmin ? 'MASTER AI SUPER ADMIN KEY:' : `ACTIVE AI KEY FOR ${targetName.toUpperCase()}:`}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeEffectiveKey ? (
                  <code className="font-mono text-xs sm:text-sm font-bold text-emerald-400 bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-500/30 select-all">
                    {activeEffectiveKey}
                  </code>
                ) : (
                  <span className="text-xs text-amber-300 italic bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    No API Key issued yet for this user. Click below to generate one instantly.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeEffectiveKey ? (
                <>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeEffectiveKey, 'active_key')}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {copiedKey === 'active_key' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Key Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy API Key</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={isTargetSuperAdmin ? handleRegenerateSuperAdminKey : handleGenerateUserKey}
                    disabled={isGeneratingKey}
                    title="Regenerate new key"
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateUserKey}
                  disabled={isGeneratingKey}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingKey ? 'Generating Key...' : 'Generate API Key'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="px-5 sm:px-6 py-2.5 bg-neutral-100/80 dark:bg-white/[0.02] border-b border-neutral-200/60 dark:border-white/5 flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Granted AI Capabilities:
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
            {isTargetSuperAdmin && (
              <>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
                  <FolderPlus className="w-3 h-3" /> Create Projects
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Create Workspace Plans
                </span>
              </>
            )}
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
                <span>Node.js / TS</span>
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
                <span>Live Testing Console</span>
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
                      {activeTab === 'python' && `Python SDK for ${targetName}`}
                      {activeTab === 'javascript' && `Node.js / TS Module for ${targetName}`}
                      {activeTab === 'curl' && `REST API cURL Commands (${targetEmail})`}
                      {activeTab === 'custom_gpt' && `OpenAPI 3.1.0 Actions Specification for GPT & Gemini`}
                      {activeTab === 'system_prompt' && `AI System Prompt for Autonomous Agent`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const codeToCopy = 
                        activeTab === 'python' ? pythonCode :
                        activeTab === 'javascript' ? jsCode :
                        activeTab === 'curl' ? curlCode :
                        activeTab === 'custom_gpt' ? customGptSchema : systemPromptCode;
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
                    activeTab === 'python' ? pythonCode :
                    activeTab === 'javascript' ? jsCode :
                    activeTab === 'curl' ? curlCode :
                    activeTab === 'custom_gpt' ? customGptSchema : systemPromptCode
                  }</pre>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="font-bold block">
                      {isTargetSuperAdmin ? 'Second Super Admin AI Authority:' : `Personal AI Key for ${targetName}:`}
                    </span>
                    <span>
                      {isTargetSuperAdmin 
                        ? 'This integration code has full root capabilities over your Tasky system. It can autonomously read your schedule, create tasks, permanently delete completed/canceled tasks, and establish new project workspaces and organization plans.'
                        : `This key allows ${targetName}'s AI to read their schedule, create tasks, update statuses, and track project deadlines in real time.`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Test Playground */
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                        {isTargetSuperAdmin ? <Crown className="w-4 h-4 text-amber-500" /> : <Bot className="w-4 h-4 text-emerald-500" />}
                        Execute AI Action for {targetName}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Test live data mutations in your active workspace using this AI Key
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={playgroundAction}
                        onChange={(e) => setPlaygroundAction(e.target.value as any)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white shadow-sm"
                      >
                        <option value="get_schedule">📅 1. See Schedule & Tasks</option>
                        <option value="create_task">➕ 2. Create Task</option>
                        <option value="delete_task">🗑️ 3. Delete Task</option>
                        <option value="update_task_status">🔄 4. Update Task Status</option>
                        {isTargetSuperAdmin && (
                          <>
                            <option value="create_project">🏗️ 5. Create Project</option>
                            <option value="create_plan">🏢 6. Create Workspace Plan</option>
                            <option value="get_audit">👥 7. Full Workspace Audit</option>
                          </>
                        )}
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
                          placeholder="e.g. Finish quarterly project proposal"
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
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Select Task to Delete</label>
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
                      Live AI Execution Response
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
                        Select an action above and click "Run Action" to test schedule reading, task creation, deletion, or status updates...
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
              <span>
                {isTargetSuperAdmin 
                  ? 'Full Level-2 Root Super Admin Authorization Active' 
                  : `Personal AI Authorization for ${targetName} (${targetRank}) Active`}
              </span>
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
