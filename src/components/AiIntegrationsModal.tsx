import React, { useState } from 'react';
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
  CheckCircle2, 
  Database,
  ExternalLink,
  Layers,
  FileCode,
  Lock,
  Cpu,
  UserCheck,
  Users,
  ShieldAlert
} from 'lucide-react';
import { DEFAULT_STANDARD_PASSWORD } from '../utils/emailUtils';

interface AiIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiIntegrationsModal: React.FC<AiIntegrationsModalProps> = ({ isOpen, onClose }) => {
  const { user, currentUserProfile, tasks, projects, teamMembers, addTask } = useTasky() as any;

  const isSuperAdmin = currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com';
  const isAdmin = currentUserProfile?.rank === 'Admin' || isSuperAdmin;

  // Selected member for whom the Admin wants to generate the AI connector
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberPassword, setMemberPassword] = useState<string>(DEFAULT_STANDARD_PASSWORD);
  
  const [activeTab, setActiveTab] = useState<'python' | 'javascript' | 'curl' | 'custom_gpt' | 'playground'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Playground state
  const [playgroundAction, setPlaygroundAction] = useState<'get_tasks' | 'create_task' | 'get_projects' | 'get_members'>('get_tasks');
  const [testTaskTitle, setTestTaskTitle] = useState('AI Scheduled Strategy Review');
  const [testTaskPriority, setTestTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);

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
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Admin-Only Feature</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Only Organization Administrators have permission to access the AI API Code Generator and configure AI agents for team members.
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

  // Resolve target account for API Generation (Admin can pick self or any member)
  const currentAdminEmail = user?.email || currentUserProfile?.email || 'admin@tasky.local';
  const currentAdminId = user?.uid || currentUserProfile?.id || 'admin_uid';

  const selectedMember = (teamMembers || []).find((m: any) => m.id === selectedMemberId);
  const targetEmail = selectedMember ? selectedMember.email : currentAdminEmail;
  const targetUserId = selectedMember ? selectedMember.id : currentAdminId;
  const targetName = selectedMember ? selectedMember.name : (currentUserProfile?.name || 'Administrator');
  const targetRank = selectedMember ? (selectedMember.rank || 'User') : (currentUserProfile?.rank || 'Admin');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunPlayground = async () => {
    setIsRunningPlayground(true);
    setPlaygroundOutput(null);

    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      if (playgroundAction === 'get_tasks') {
        const userVisibleTasks = tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo,
          projectId: t.projectId
        }));
        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          authenticatedUser: targetEmail,
          userRank: targetRank,
          totalCount: userVisibleTasks.length,
          tasks: userVisibleTasks
        }, null, 2));
      } else if (playgroundAction === 'create_task') {
        const newTask = {
          title: testTaskTitle.trim() || 'AI Generated Task',
          description: `Created via Admin AI Connector on behalf of ${targetEmail}`,
          dueDate: new Date().toISOString().split('T')[0],
          priority: testTaskPriority,
          status: 'Todo' as const,
          categoryId: 'cat-general',
          assignedTo: targetUserId,
          assignedToIds: [targetUserId],
          createdBy: currentAdminId,
          isPinned: false
        };

        if (addTask) {
          addTask(newTask);
        }

        setPlaygroundOutput(JSON.stringify({
          status: 201,
          success: true,
          action: "CREATE_TASK",
          authenticatedAs: targetEmail,
          targetUser: targetName,
          task: {
            id: `task_${Math.random().toString(36).substr(2, 9)}`,
            ...newTask,
            createdAt: new Date().toISOString()
          }
        }, null, 2));
      } else if (playgroundAction === 'get_projects') {
        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          authenticatedUser: targetEmail,
          totalProjects: (projects || []).length,
          projects: projects || []
        }, null, 2));
      } else if (playgroundAction === 'get_members') {
        setPlaygroundOutput(JSON.stringify({
          status: 200,
          success: true,
          authenticatedUser: targetEmail,
          totalMembers: (teamMembers || []).length,
          members: (teamMembers || []).map((m: any) => ({
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
        error: e.message || 'API execution error'
      }, null, 2));
    } finally {
      setIsRunningPlayground(false);
    }
  };

  const effectivePassword = memberPassword.trim() || DEFAULT_STANDARD_PASSWORD;

  // Code Snippets tailored to target user
  const pythonCode = `import requests
import json

# === TASKY ADMIN-MANAGED AI CONNECTOR ===
# Configured for: ${targetName} (${targetEmail} - ${targetRank})
FIREBASE_API_KEY = "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ"
PROJECT_ID = "industrious-modem-hg02f"
DATABASE_ID = "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"

class TaskyMemberAI:
    def __init__(self, email="${targetEmail}", password="${effectivePassword}"):
        self.email = email
        self.password = password
        self.id_token = None
        self.user_id = None
        self._login()

    def _login(self):
        """Authenticates with Firebase on behalf of ${targetEmail}."""
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        resp = requests.post(url, json={"email": self.email, "password": self.password, "returnSecureToken": True})
        if resp.status_code != 200:
            raise PermissionError(f"Authentication failed for {self.email}: {resp.text}")
        data = resp.json()
        self.id_token = data["idToken"]
        self.user_id = data["localId"]
        print(f"✅ AI Authenticated successfully as {self.email} (UID: {self.user_id})")

    def get_tasks(self):
        """Fetch all tasks visible to ${targetEmail}."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks"
        headers = {"Authorization": f"Bearer {self.id_token}"}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def create_task(self, title, priority="High", due_date="2026-09-01", description=""):
        """Create a new task assigned to ${targetEmail}."""
        url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DATABASE_ID}/documents/tasks"
        headers = {"Authorization": f"Bearer {self.id_token}"}
        payload = {
            "fields": {
                "title": {"stringValue": title},
                "description": {"stringValue": description or "Created via AI API Connector"},
                "priority": {"stringValue": priority},
                "status": {"stringValue": "Todo"},
                "dueDate": {"stringValue": due_date},
                "assignedTo": {"stringValue": self.user_id},
                "createdBy": {"stringValue": self.user_id}
            }
        }
        resp = requests.post(url, headers=headers, json=payload)
        return resp.json()

# === Usage with Any AI (ChatGPT, Claude, Gemini, LangChain) ===
if __name__ == "__main__":
    tasky = TaskyMemberAI()
    
    # 1. Fetch member tasks
    tasks = tasky.get_tasks()
    print("Tasks for ${targetName}:", json.dumps(tasks, indent=2))

    # 2. AI Creates task for member
    created = tasky.create_task("Review Q3 deliverables with AI", priority="Urgent")
    print("Created Task:", created)
`;

  const jsCode = `// Tasky AI Connector for JavaScript / Node.js
// Configured by Admin for: ${targetName} (${targetEmail})
// Run: npm install firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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

export async function initTaskyAI(email = "${targetEmail}", password = "${effectivePassword}") {
  // 1. Authenticate with the chosen user account
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  console.log("✅ Authenticated as " + email + " (UID: " + uid + ")");

  return {
    async getTasks() {
      const snap = await getDocs(collection(db, 'tasks'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async createTask({ title, priority = 'Medium', dueDate = '2026-09-01', description = '' }) {
      const taskRef = doc(collection(db, 'tasks'));
      const newTask = {
        id: taskRef.id,
        title,
        description,
        dueDate,
        priority,
        status: 'Todo',
        categoryId: 'cat-general',
        assignedTo: uid,
        assignedToIds: [uid],
        createdBy: uid,
        createdAt: new Date().toISOString()
      };
      await setDoc(taskRef, newTask);
      return newTask;
    }
  };
}
`;

  const curlCode = `# 1. Authenticate as ${targetEmail}:
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${targetEmail}","password":"${effectivePassword}","returnSecureToken":true}'

# 2. Fetch all tasks for ${targetEmail} with the returned ID_TOKEN:
curl -X GET "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer <YOUR_ID_TOKEN>"

# 3. Create a task assigned to ${targetEmail}:
curl -X POST "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents/tasks" \\
  -H "Authorization: Bearer <YOUR_ID_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fields": {
      "title": {"stringValue": "AI Scheduled Task"},
      "priority": {"stringValue": "High"},
      "status": {"stringValue": "Todo"},
      "dueDate": {"stringValue": "2026-09-01"},
      "assignedTo": {"stringValue": "${targetUserId}"}
    }
  }'
`;

  const customGptSchema = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Tasky AI Connector for ${targetName}",
    "description": "Admin-configured API access for ${targetEmail}",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://firestore.googleapis.com/v1/projects/industrious-modem-hg02f/databases/ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd/documents"
    }
  ],
  "paths": {
    "/tasks": {
      "get": {
        "summary": "Fetch tasks for ${targetEmail}",
        "operationId": "getTasks",
        "responses": {
          "200": { "description": "List of user tasks" }
        }
      },
      "post": {
        "summary": "Create task for ${targetEmail}",
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
                      "dueDate": { "type": "object", "properties": { "stringValue": { "type": "string" } } }
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
    }
  }
}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-[#151722] border border-neutral-200 dark:border-white/10 rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Admin AI & API Code Generator
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Generate personal login credentials & API code for an AI to access your own account or any team member
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

          {/* Member Selector Bar for Admin */}
          <div className="px-6 py-3.5 bg-neutral-100/70 dark:bg-white/[0.03] border-b border-neutral-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 shrink-0">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="font-bold">Target Account:</span>
              </div>
              
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white flex-1 max-w-[280px]"
              >
                <option value="">Admin Account ({currentAdminEmail})</option>
                {(teamMembers || [])
                  .filter((m: any) => m.email !== currentAdminEmail)
                  .map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email}) — {m.rank || 'User'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold">Password:</span>
                <input
                  type="text"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="Password (123456)"
                  className="w-28 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-lg text-xs font-mono text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">UID:</span>
                <span className="font-mono text-[10px] truncate max-w-[90px]">{targetUserId}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-3 pb-2 border-b border-neutral-200/60 dark:border-white/5 flex items-center justify-between shrink-0 bg-neutral-50/30 dark:bg-white/[0.01]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'python'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python Script</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('javascript')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'javascript'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Node.js / JS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('curl')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'curl'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>cURL / REST</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('custom_gpt')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'custom_gpt'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Custom GPT Schema</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playground')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'playground'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Test</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-500">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Target: <strong>{targetName}</strong></span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {activeTab !== 'playground' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    <span>
                      {activeTab === 'python' && `Python API Script configured for ${targetName} (${targetEmail})`}
                      {activeTab === 'javascript' && `Node.js Client configured for ${targetName} (${targetEmail})`}
                      {activeTab === 'curl' && `REST API cURL Commands for ${targetName}`}
                      {activeTab === 'custom_gpt' && `OpenAPI 3.1 Schema for ${targetName}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const codeToCopy = 
                        activeTab === 'python' ? pythonCode :
                        activeTab === 'javascript' ? jsCode :
                        activeTab === 'curl' ? curlCode : customGptSchema;
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
                        <span>Copy Code Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Block Container */}
                <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[380px]">
                  <pre>{
                    activeTab === 'python' ? pythonCode :
                    activeTab === 'javascript' ? jsCode :
                    activeTab === 'curl' ? curlCode : customGptSchema
                  }</pre>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-bold block">Admin Access Control:</span>
                    <span>Only you as an Admin can view this generator. You can switch the target account dropdown above to generate personalized AI access scripts for any team member or employee using their account credentials.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Test Playground */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        Simulate AI API Execution as {targetName}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Test live data access under the identity of {targetEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={playgroundAction}
                        onChange={(e) => setPlaygroundAction(e.target.value as any)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white"
                      >
                        <option value="get_tasks">GET /tasks (Fetch All Tasks)</option>
                        <option value="create_task">POST /tasks (Create AI Task)</option>
                        <option value="get_projects">GET /projects (Fetch Projects)</option>
                        <option value="get_members">GET /users (Fetch Team)</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleRunPlayground}
                        disabled={isRunningPlayground}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isRunningPlayground ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>Execute</span>
                      </button>
                    </div>
                  </div>

                  {playgroundAction === 'create_task' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-neutral-200/60 dark:border-white/5">
                      <div className="sm:col-span-8">
                        <label className="text-[10px] font-bold text-neutral-500 block mb-1">Task Title to Create</label>
                        <input
                          type="text"
                          value={testTaskTitle}
                          onChange={(e) => setTestTaskTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-neutral-500 block mb-1">Priority</label>
                        <select
                          value={testTaskPriority}
                          onChange={(e) => setTestTaskPriority(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Playground Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Live Response Payload</span>
                    {playgroundOutput && (
                      <button
                        onClick={() => copyToClipboard(playgroundOutput, 'output')}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'output' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Response JSON</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 font-mono text-[11px] text-emerald-400 min-h-[160px] max-h-[300px] overflow-y-auto">
                    {playgroundOutput ? (
                      <pre>{playgroundOutput}</pre>
                    ) : (
                      <span className="text-neutral-500 italic">Click "Execute" above to test reading or creating data on behalf of {targetName}...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-white/[0.02]">
            <span className="text-[11px] text-neutral-500">
              Admin Exclusive · Generate AI API tokens for ChatGPT Custom GPTs, Gemini, Claude, and Python scripts.
            </span>

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
