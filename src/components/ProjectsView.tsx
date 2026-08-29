import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { Project, Task } from '../types';
import { 
  FolderKanban, 
  Plus, 
  UserPlus, 
  Copy, 
  Check, 
  Users, 
  Trash2, 
  LogOut, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  X,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssigneeMultiSelector } from './AssigneeMultiSelector';
import { AssigneeAvatarStack } from './AssigneeAvatarStack';
import { TaskModal } from './TaskModal';
import { getTaskAssigneeIds } from '../utils/taskFilter';

export const ProjectsView: React.FC = () => {
  const { 
    projects, 
    createProject, 
    joinProjectByCode, 
    leaveProject, 
    deleteProject, 
    tasks, 
    addTask, 
    toggleTaskComplete, 
    deleteTask,
    currentUserProfile,
    teamMembers,
    user
  } = useTasky() as any;

  const currentUserId = currentUserProfile?.id || user?.uid || '';
  const currentEmail = currentUserProfile?.email?.toLowerCase() || user?.email?.toLowerCase() || '';

  // Filter projects user belongs to or owns
  const userProjects = projects.filter((p: Project) => 
    p.ownerId === currentUserId || 
    p.memberIds.includes(currentUserId) ||
    (currentEmail && p.memberIds.some((mId: string) => mId.toLowerCase() === currentEmail))
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    userProjects.length > 0 ? userProjects[0].id : null
  );
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Project task creation state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskModal, setSelectedTaskModal] = useState<Task | null>(null);

  const activeProject = projects.find((p: Project) => p.id === selectedProjectId) || userProjects[0];

  // Members belonging to this active project (Owner + all invited/joined members)
  // Cross-plan: Anyone in this project can be assigned tasks by anyone in the project!
  const activeProjectMembers = React.useMemo(() => {
    if (!activeProject) return [];
    const projectMemberIds = [activeProject.ownerId, ...(activeProject.memberIds || [])].filter(Boolean);
    return (teamMembers || []).filter((tm: any) => {
      const isIdMatch = tm.id && projectMemberIds.some((id: string) => id.toLowerCase() === tm.id.toLowerCase());
      const isEmailMatch = tm.email && projectMemberIds.some((id: string) => id.toLowerCase() === tm.email.toLowerCase());
      const isOwner = activeProject.ownerId && (
        activeProject.ownerId.toLowerCase() === tm.id?.toLowerCase() ||
        (tm.email && activeProject.ownerId.toLowerCase() === tm.email.toLowerCase())
      );
      return isIdMatch || isEmailMatch || isOwner;
    });
  }, [activeProject, teamMembers]);

  // Set default assignee to current user when active project changes
  React.useEffect(() => {
    if (currentUserId && newTaskAssignees.length === 0) {
      setNewTaskAssignees([currentUserId]);
    }
  }, [currentUserId, activeProject?.id]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const created = await createProject(newProjectName.trim(), newProjectDesc.trim(), newProjectColor);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreateModalOpen(false);
    if (created) {
      setSelectedProjectId(created.id);
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinStatus({ type: null, message: '' });

    if (!joinCodeInput.trim()) {
      setJoinStatus({ type: 'error', message: 'Please enter a project join code.' });
      return;
    }

    const res = await joinProjectByCode(joinCodeInput.trim());
    if (res.success) {
      setJoinStatus({ type: 'success', message: res.message });
      setJoinCodeInput('');
      if (res.project) {
        setSelectedProjectId(res.project.id);
      }
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinStatus({ type: null, message: '' });
      }, 1500);
    } else {
      setJoinStatus({ type: 'error', message: res.message });
    }
  };

  const handleAddProjectTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;

    const assigned = newTaskAssignees.length > 0 ? newTaskAssignees : [currentUserId];

    addTask({
      title: newTaskTitle.trim(),
      description: `Task for project ${activeProject.name}`,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      status: 'Todo',
      categoryId: 'cat-project',
      projectId: activeProject.id,
      assignedTo: assigned[0],
      assignedToIds: assigned,
      createdBy: currentUserId,
      orgId: currentUserProfile?.orgId || undefined,
      isPinned: false,
      checklist: [],
      attachments: [],
      comments: [],
      recurring: 'None'
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignees(currentUserId ? [currentUserId] : []);
  };

  // Filter tasks belonging to active project
  const projectTasks = tasks.filter((t: Task) => activeProject && t.projectId === activeProject.id);

  const filteredProjects = userProjects.filter((p: Project) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden glass-panel rounded-[32px] p-4 md:p-8 relative">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/20 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Projects Workspace
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Create custom projects, generate join codes, and collaborate seamlessly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-4 py-2.5 bg-white/60 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-indigo-500" />
            Join with Code
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 overflow-hidden min-h-0">
        
        {/* Left Column: Projects Selector List */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden border-r border-neutral-200/20 dark:border-white/5 pr-0 lg:pr-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              My Projects ({userProjects.length})
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white/40 dark:bg-neutral-800/40 border border-neutral-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500 w-32"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white/20 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10">
                <FolderKanban className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">No projects found</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                  Create a new project or join one using a friend's join code.
                </p>
              </div>
            ) : (
              filteredProjects.map((p: Project) => {
                const isSelected = activeProject?.id === p.id;
                const isOwner = p.ownerId === currentUserId;
                const taskCount = tasks.filter((t: Task) => t.projectId === p.id).length;

                return (
                  <motion.div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/40 shadow-sm'
                        : 'bg-white/40 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                          {p.name}
                        </h3>
                      </div>
                      {isOwner && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase rounded-lg shrink-0">
                          Owner
                        </span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                        {p.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-200/20 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-neutral-200/60 dark:bg-neutral-700/60 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-bold">
                          {p.code}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(p.code);
                          }}
                          className="p-1 hover:text-indigo-500 transition-colors"
                          title="Copy join code"
                        >
                          {copiedCode === p.code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-neutral-400" />
                          {p.memberIds?.length || 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-neutral-400" />
                          {taskCount}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Project Detail Workspace */}
        <div className="lg:col-span-8 flex flex-col overflow-y-auto space-y-6">
          {activeProject ? (
            <>
              {/* Project Top Card Banner */}
              <div 
                className="p-6 rounded-3xl border border-neutral-200/40 dark:border-white/10 relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-full inline-block" 
                        style={{ backgroundColor: activeProject.color || '#6366f1' }}
                      />
                      <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                        {activeProject.name}
                      </h2>
                    </div>
                    {activeProject.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-xl">
                        {activeProject.description}
                      </p>
                    )}
                  </div>

                  {/* Join Code Callout Box */}
                  <div className="p-3 bg-white/80 dark:bg-neutral-900/80 rounded-2xl border border-indigo-500/30 flex items-center gap-3 shrink-0 shadow-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Project Join Code
                      </span>
                      <span className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {activeProject.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(activeProject.code)}
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Copy code to share with teammates"
                    >
                      {copiedCode === activeProject.code ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Actions / Members Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-200/30 dark:border-white/5">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {activeProject.memberIds?.length || 1} Members Joined
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600">•</span>
                    <span>Created by {activeProject.ownerName || 'Project Owner'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeProject.ownerId === currentUserId ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete project "${activeProject.name}"?`)) {
                            deleteProject(activeProject.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Project
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to leave project "${activeProject.name}"?`)) {
                            leaveProject(activeProject.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave Project
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Project Task Bar */}
              <div className="bg-white/40 dark:bg-neutral-800/40 rounded-2xl p-4 border border-neutral-200/40 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Add Task to {activeProject.name}
                  </h3>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Assignable to any member in this project ({activeProjectMembers.length})
                  </span>
                </div>

                <form onSubmit={handleAddProjectTask} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Project task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-neutral-800 dark:text-white"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Assignee selection row: Anyone in the project can assign to ANYONE in the project independent of plan! */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <AssigneeMultiSelector
                        selectedIds={newTaskAssignees}
                        onChange={setNewTaskAssignees}
                        assignableMembers={activeProjectMembers}
                        currentUserId={currentUserId}
                        placeholder="Assign any project member (cross-plan)..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add Project Task
                    </button>
                  </div>
                </form>
              </div>

              {/* Project Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    Project Tasks ({projectTasks.length})
                  </h3>
                </div>

                {projectTasks.length === 0 ? (
                  <div className="p-8 text-center bg-white/20 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-neutral-300 dark:border-white/10">
                    <CheckSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">No tasks in this project yet</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Use the input form above to assign tasks to this project workspace.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectTasks.map((t: Task) => {
                      const taskAssignees = getTaskAssigneeIds(t);
                      return (
                        <div 
                          key={t.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            t.status === 'Completed'
                              ? 'bg-neutral-100/40 dark:bg-neutral-900/20 border-neutral-200/30 dark:border-white/5 opacity-70'
                              : 'bg-white/60 dark:bg-neutral-800/60 border-neutral-200/50 dark:border-white/5 hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => toggleTaskComplete(t.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                t.status === 'Completed'
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-neutral-300 dark:border-neutral-600 hover:border-indigo-500'
                              }`}
                            >
                              {t.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <div 
                              onClick={() => setSelectedTaskModal(t)}
                              className="cursor-pointer min-w-0 group"
                            >
                              <span className={`text-xs font-semibold block group-hover:text-indigo-500 transition-colors ${
                                t.status === 'Completed' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'
                              }`}>
                                {t.title}
                              </span>
                              {t.dueDate && (
                                <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {t.dueDate}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Assignee Avatar Stack */}
                            <AssigneeAvatarStack
                              assigneeIds={taskAssignees}
                              members={teamMembers}
                              maxAvatars={3}
                              size="sm"
                            />

                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                              t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-500' :
                              t.priority === 'High' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-neutral-500/10 text-neutral-500'
                            }`}>
                              {t.priority}
                            </span>

                            <button
                              onClick={() => deleteTask(t.id)}
                              className="p-1 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-neutral-800 dark:text-white">Select or Create a Project</h2>
              <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                Join an existing project with a join code or create a new project workspace to share with your team.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 bg-white/80 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-xs font-bold rounded-xl"
                >
                  Join Code
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Project Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">Join a Project</h3>
                </div>
                <button 
                  onClick={() => setIsJoinModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Enter the 6-character project join code provided by the project creator.
              </p>

              {joinStatus.message && (
                <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  joinStatus.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {joinStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{joinStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleJoinProject} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PRJ-8K9A2M"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-2xl text-sm font-mono font-bold tracking-widest text-center focus:outline-none focus:border-indigo-500 uppercase"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Join Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">Create New Project</h3>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Website Redesign 2026"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Brief objective or description..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          newProjectColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-neutral-900' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-300">
                  <span className="font-bold">Automatic Join Code:</span> A unique 6-character code will be generated upon creation so others can join this project instantly!
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Create & Generate Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal for detailed project task view & editing */}
      {selectedTaskModal && (
        <TaskModal
          task={tasks.find((t: Task) => t.id === selectedTaskModal.id) || selectedTaskModal}
          onClose={() => setSelectedTaskModal(null)}
        />
      )}
    </div>
  );
};
