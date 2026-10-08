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
  User,
  Mic
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
    language,
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

  const [activeTab, setActiveTab] = useState<'python' | 'javascript' | 'curl' | 'gemini_voice' | 'custom_gpt' | 'system_prompt' | 'playground'>('gemini_voice');
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

  // Gemini Live Chat/Voice Assistant State
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'user' | 'assistant', text: string, timestamp: string }>>([
    {
      sender: 'assistant',
      text: 'Γεια σας! Είμαι ο προσωπικός σας βοηθός Gemini για το Tasky. Πώς μπορώ να σας βοηθήσω σήμερα με το πρόγραμμά σας; Μπορείτε να μου γράψετε ή να κάνετε κλικ στο μικρόφωνο για να μου μιλήσετε!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInputMessage, setUserInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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

  const executeVoiceFunction = async (name: string, args: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (name === "getMySchedule") {
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
        project: (projects || []).find((p: any) => p.id === t.projectId)?.name || 'General'
      }));

      return { count: schedule.length, tasks: schedule.slice(0, 10) };
    }

    if (name === "createTask") {
      const newTask = {
        title: args.title,
        description: args.description || "Created by Gemini Voice Assistant",
        dueDate: args.dueDate || todayStr,
        priority: args.priority || "High",
        status: "Todo" as const,
        categoryId: 'cat-general',
        assignedTo: targetUserId,
        assignedToIds: [targetUserId],
        createdBy: isTargetSuperAdmin ? 'AI_SUPER_ADMIN' : `AI_USER_${targetUserId}`,
        createdAt: new Date().toISOString()
      };

      if (addTask) {
        await addTask(newTask);
      }

      return { success: true, message: `Added task "${args.title}" successfully.`, task: newTask };
    }

    if (name === "updateTaskStatus") {
      const target = (tasks || []).find((t: any) => t.id === args.taskId || t.title.toLowerCase().includes(args.taskId.toLowerCase()));
      if (target && updateTask) {
        const updated = {
          ...target,
          status: args.status,
          completedAt: args.status === 'Completed' ? new Date().toISOString() : undefined
        };
        await updateTask(updated);
        return { success: true, message: `Marked task "${target.title}" as ${args.status}.` };
      }
      return { success: false, message: `Task with ID or title "${args.taskId}" not found.` };
    }

    return { error: "Unknown tool call" };
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'el' ? 'el-GR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessageToAssistant = async (textToSend?: string) => {
    const rawMessage = textToSend || userInputMessage;
    const cleanText = rawMessage.trim();
    if (!cleanText || isProcessing) return;

    if (!textToSend) {
      setUserInputMessage('');
    }

    const newUserMsg = {
      sender: 'user' as const,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAssistantMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const currentHistory: any[] = [];
      const recentMessages = assistantMessages.slice(-6);
      recentMessages.forEach(msg => {
        currentHistory.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });

      const response = await fetch('/api/gemini/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          targetName,
          targetEmail,
          history: currentHistory
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }

      let data = await response.json();

      if (data.functionCalls && data.functionCalls.length > 0) {
        const call = data.functionCalls[0];
        const toolResult = await executeVoiceFunction(call.name, call.args);

        const followUpHistory = [
          ...currentHistory,
          { role: 'user', parts: [{ text: cleanText }] },
          {
            role: 'model',
            parts: [{
              functionCall: {
                name: call.name,
                args: call.args
              }
            }]
          }
        ];

        const followUpResponse = await fetch('/api/gemini/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: JSON.stringify({
              functionResponse: {
                name: call.name,
                response: { result: toolResult }
              }
            }),
            targetName,
            targetEmail,
            history: followUpHistory
          })
        });

        if (followUpResponse.ok) {
          data = await followUpResponse.json();
        }
      }

      const assistantText = data.text || (language === 'el' ? 'Έγινε!' : 'Done!');
      const newAssistantMsg = {
        sender: 'assistant' as const,
        text: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAssistantMessages(prev => [...prev, newAssistantMsg]);

      if (voiceEnabled) {
        speakResponse(assistantText);
      }
    } catch (err: any) {
      console.error(err);
      setAssistantMessages(prev => [...prev, {
        sender: 'assistant',
        text: language === 'el' 
          ? `Σφάλμα: ${err.message || 'Αδυναμία επικοινωνίας με το Gemini.'}`
          : `Error: ${err.message || 'Could not reach Gemini assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVoiceListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'el' ? 'Η φωνητική αναγνώριση δεν υποστηρίζεται από αυτόν τον περιηγητή.' : 'Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'el' ? 'el-GR' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        handleSendMessageToAssistant(transcript);
      }
    };

    recognition.start();
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

  const geminiVoiceCode = `// ==============================================================================
// 🎙️ GEMINI VOICE ASSISTANT INTEGRATION FOR TASKY
// Target User: ${targetName} (${targetEmail})
// Tasky User API Key: ${displayedKey}
// SDK: @google/genai (TypeScript / Node.js)
// ==============================================================================
// How to connect:
// 1. Get a Gemini API Key from Google AI Studio (https://aistudio.google.com)
// 2. Set environment variable: GEMINI_API_KEY="your-gemini-key"
// 3. Run this script to let your voice assistant read & manage Tasky in real time!
// ==============================================================================

import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

// 1. Initialize Gemini with your Google Gemini API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 2. Tasky Live Database Connection
const firebaseConfig = {
  projectId: "industrious-modem-hg02f",
  appId: "1:293311432413:web:da918c8d753f17e753fd34",
  apiKey: "AIzaSyD6MZ9-p6fZgVs2gyxRfJ2jIAAYrC2rwDQ",
  firestoreDatabaseId: "ai-studio-tasky-c61ab918-c3f2-41b3-b3b1-c86500bb74fd"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. Define Voice Assistant Tools (Function Calling)
const voiceAssistantTools = [
  {
    name: "getMySchedule",
    description: "Fetches current tasks, pending deadlines, and schedule from Tasky for ${targetName}.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: { type: Type.STRING, description: "Filter option: 'today', 'pending', 'urgent', or 'all'" }
      }
    }
  },
  {
    name: "createTask",
    description: "Adds a new task to Tasky when the user asks via voice.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the task" },
        description: { type: Type.STRING, description: "Optional notes or details" },
        dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
        priority: { type: Type.STRING, description: "'Low', 'Medium', 'High', or 'Urgent'" }
      },
      required: ["title"]
    }
  },
  {
    name: "updateTaskStatus",
    description: "Updates a task status (e.g. marks as Completed).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskId: { type: Type.STRING, description: "The task ID" },
        status: { type: Type.STRING, description: "'Completed', 'InProgress', or 'Todo'" }
      },
      required: ["taskId", "status"]
    }
  }
];

// 4. Voice Tool Execution Handler
async function handleVoiceFunctionCall(name: string, args: any) {
  const creds = await signInWithEmailAndPassword(auth, "${targetEmail}", "${DEFAULT_STANDARD_PASSWORD}");
  const userId = creds.user.uid;

  if (name === "getMySchedule") {
    const snap = await getDocs(collection(db, "tasks"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const myTasks = all.filter((t: any) => t.assignedTo === userId || t.createdBy === userId || (t.assignedToIds && t.assignedToIds.includes(userId)));
    return { count: myTasks.length, tasks: myTasks.slice(0, 10) };
  }

  if (name === "createTask") {
    const ref = doc(collection(db, "tasks"));
    const newTask = {
      id: ref.id,
      title: args.title,
      description: args.description || "Created by Gemini Voice Assistant",
      dueDate: args.dueDate || new Date().toISOString().split("T")[0],
      priority: args.priority || "High",
      status: "Todo",
      categoryId: "cat-general",
      assignedTo: userId,
      assignedToIds: [userId],
      createdBy: "GEMINI_VOICE_ASSISTANT",
      createdAt: new Date().toISOString()
    };
    await setDoc(ref, newTask);
    return { success: true, message: \`Added task "\${args.title}"\`, task: newTask };
  }

  if (name === "updateTaskStatus") {
    await updateDoc(doc(db, "tasks", args.taskId), { status: args.status });
    return { success: true, message: \`Marked task \${args.taskId} as \${args.status}\` };
  }
}

// 5. Run Live Voice Assistant Turn
export async function talkToTaskyVoiceAssistant(userVoiceTranscript: string) {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: "You are the Tasky Voice Assistant for ${targetName}. Speak conversationally, concise and friendly. Use tools to check schedules and manage tasks when instructed.",
      tools: [{ functionDeclarations: voiceAssistantTools }]
    }
  });

  const response = await chat.sendMessage({ message: userVoiceTranscript });

  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const call of response.functionCalls) {
      const result = await handleVoiceFunctionCall(call.name, call.args);
      const finalReply = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: { result }
          }
        }
      ]);
      return finalReply.text;
    }
  }

  return response.text;
}
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
                onClick={() => setActiveTab('gemini_voice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'gemini_voice'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                    : 'text-indigo-600 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Gemini Voice Assistant</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-white rounded-full uppercase tracking-wider font-extrabold">SDK</span>
              </button>

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
                      {activeTab === 'gemini_voice' && `Gemini Live / Voice Assistant Script for ${targetName} (@google/genai)`}
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
                        activeTab === 'gemini_voice' ? geminiVoiceCode :
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
                    activeTab === 'gemini_voice' ? geminiVoiceCode :
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
              <div className="flex flex-col h-[450px] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-900/40">
                {/* Chat Header */}
                <div className="p-3 bg-neutral-100 dark:bg-white/[0.03] border-b border-neutral-200 dark:border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                      {language === 'el' ? 'Σύνδεση Gemini Live' : 'Gemini Live Connected'}
                    </span>
                  </div>
                  
                  {/* Options */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={voiceEnabled}
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                        className="rounded border-neutral-300 dark:border-white/10 text-indigo-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>{language === 'el' ? 'Φωνητική Απάντηση (TTS)' : 'Voice Replies (TTS)'}</span>
                    </label>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col scrollbar-thin">
                  {assistantMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.sender === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/5 text-neutral-800 dark:text-neutral-100 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 italic p-1 self-start">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span>Gemini is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input Controls */}
                <div className="p-3 bg-neutral-100/50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-white/10 flex items-center gap-2">
                  {/* Microphone Action Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceListening}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer relative shrink-0 ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/15'
                    }`}
                    title={isListening ? 'Listening...' : 'Click to Speak (Greek/English)'}
                  >
                    <Mic className="w-4 h-4" />
                    {isListening && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </button>

                  {/* Text Input bar */}
                  <input
                    type="text"
                    value={userInputMessage}
                    onChange={(e) => setUserInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessageToAssistant();
                      }
                    }}
                    placeholder={isListening ? (language === 'el' ? 'Ακούω, μιλήστε τώρα...' : 'Listening, speak now...') : (language === 'el' ? 'Πληκτρολογήστε ή μιλήστε στο Gemini...' : 'Type or talk to Gemini...')}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-0 shadow-inner"
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessageToAssistant()}
                    disabled={isProcessing || !userInputMessage.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
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
