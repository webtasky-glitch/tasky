import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { Task, TaskPriority, TaskStatus, RecurringType, Attachment } from '../types';
import { TaskModal } from './TaskModal';
import { SourceSelector } from './SourceSelector';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Pin, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Flag,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  CheckSquare,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const { 
    tasks, 
    categories, 
    teamMembers, 
    addTask, 
    toggleTaskComplete, 
    togglePinTask,
    addCategory,
    currentUserProfile,
    setActiveTab
  } = useTasky() as any;

  // Filter assignees according to user role rules
  const assignableMembers = teamMembers.filter((tm: any) => {
    if (currentUserProfile?.rank === 'Admin') {
      return true;
    }
    if (tm.rank === 'Admin') {
      return false; // Admin is invisible to non-admins
    }
    if (currentUserProfile?.rank === 'Supervisor') {
      return tm.orgId === currentUserProfile.orgId && tm.rank !== 'Manager';
    }
    if (currentUserProfile?.rank === 'User') {
      return tm.id === currentUserProfile.id;
    }
    if (currentUserProfile?.rank === 'Manager') {
      return tm.orgId === currentUserProfile.orgId;
    }
    return tm.id === currentUserProfile?.id;
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc' | 'priorityHigh'>('dueDateAsc');
  const [showFilters, setShowFilters] = useState(false);

  // Modal & Edit states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Create Task states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newRecurring, setNewRecurring] = useState<RecurringType>('None');
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  // Create Category states
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50');
  const [newCatType, setNewCatType] = useState<'Subject' | 'Project' | 'Personal'>('Subject');

  const catColors = [
    { value: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50', name: 'Indigo' },
    { value: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50', name: 'Emerald' },
    { value: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50', name: 'Amber' },
    { value: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50', name: 'Rose' },
    { value: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50', name: 'Sky' },
    { value: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50', name: 'Violet' },
  ];

  // Initialize category selector in creation form
  React.useEffect(() => {
    if (categories.length > 0 && !newCategoryId) {
      setNewCategoryId(categories[0].id);
    }
  }, [categories, newCategoryId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Resolve category/subject manually entered
    let categoryId = '';
    const cleanSubjectName = newSubjectName.trim();
    if (cleanSubjectName) {
      // Check if there is an existing category with this exact case-insensitive name
      const existingCat = categories.find(
        (c) => c.name.toLowerCase() === cleanSubjectName.toLowerCase()
      );
      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        // Create new category of type 'Subject' with a nice default color
        try {
          categoryId = await addCategory(cleanSubjectName, '#6366f1', 'Subject');
        } catch (err) {
          console.error("Failed to add manual subject category:", err);
          categoryId = categories[0]?.id || '';
        }
      }
    } else {
      categoryId = categories[0]?.id || '';
    }

    await addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      dueDate: newDueDate,
      priority: newPriority,
      categoryId,
      status: 'Todo',
      recurring: newRecurring,
      assignedTo: newAssignee || currentUserProfile?.id,
      attachments: newAttachments
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewSubjectName('');
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setNewPriority('Medium');
    setNewAssignee('');
    setNewRecurring('None');
    setNewAttachments([]);
    setShowCreateForm(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor, newCatType);
    setNewCatName('');
    setShowCatForm(false);
  };

  // Filter & Sort core logic
  const filteredTasks = tasks.filter(task => {
    // Only see the logged-in user's tasks
    const isMyTask = task.assignedTo === currentUserProfile?.id;
    if (!isMyTask) return false;

    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || task.categoryId === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDateAsc') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'dueDateDesc') {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === 'priorityHigh') {
      const priorityWeights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    return 0;
  });

  const pinnedTasks = sortedTasks.filter(t => t.isPinned && t.status !== 'Completed');
  const regularTasks = sortedTasks.filter(t => !t.isPinned && t.status !== 'Completed');
  const completedTasks = sortedTasks.filter(t => t.status === 'Completed');

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50';
      case 'Low':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-400 dark:border-neutral-800/80';
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'Completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getRelativeDateLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0,0,0,0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    const checkDate = new Date(dateStr);
    checkDate.setHours(0,0,0,0);

    if (checkDate.getTime() === today.getTime()) return 'Today';
    if (checkDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (checkDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return dateStr;
  };

  const renderTaskCard = (task: Task) => {
    const cat = categories.find(c => c.id === task.categoryId);
    const completedChecklist = task.checklist.filter(item => item.completed).length;
    const totalChecklist = task.checklist.length;
    const assignee = teamMembers.find(tm => tm.id === task.assignedTo);

    return (
      <motion.div
        layout
        key={task.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`group glass-card border ${
          task.status === 'Completed' 
            ? 'border-neutral-200/20 dark:border-white/5 opacity-60' 
            : 'border-white/30 dark:border-white/5'
        } rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Status & Checkbox */}
          <button 
            className="p-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskComplete(task.id);
            }}
          >
            {task.status === 'Completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/20" />
            ) : task.status === 'InProgress' ? (
              <Clock className="w-5 h-5 text-amber-500" />
            ) : (
              <Circle className="w-5 h-5 hover:text-indigo-600" />
            )}
          </button>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {/* Category Badges */}
              {cat && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border leading-none font-medium truncate max-w-[120px] ${cat.color}`}>
                  {cat.name}
                </span>
              )}
              {/* Priority Badge */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border leading-none font-medium ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              {/* Overdue alert */}
              {isOverdue(task) && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>

            <h3 className={`text-sm font-semibold tracking-tight text-neutral-900 dark:text-white leading-snug truncate ${
              task.status === 'Completed' ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {getRelativeDateLabel(task.dueDate)}
              </span>

              <div className="flex items-center gap-3">
                {/* Checklist progress */}
                {totalChecklist > 0 && (
                  <span className="flex items-center gap-0.5" title="Subtasks">
                    <CheckSquare className="w-3 h-3" />
                    {completedChecklist}/{totalChecklist}
                  </span>
                )}
                {/* Attachments */}
                {task.attachments.length > 0 && (
                  <span className="font-sans text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">
                    📎 {task.attachments.length}
                  </span>
                )}
                {/* Comments */}
                {task.comments.length > 0 && (
                  <span className="font-sans text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">
                    💬 {task.comments.length}
                  </span>
                )}
                {/* Assignee Avatar */}
                {assignee && (
                  <div 
                    title={`Assigned to ${assignee.name}`}
                    className="w-4.5 h-4.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900 font-bold flex items-center justify-center text-[9px] text-indigo-700 dark:text-indigo-300"
                  >
                    {assignee.avatar}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Pin Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePinTask(task.id);
            }}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 text-neutral-400 hover:text-amber-500 transition-all shrink-0 cursor-pointer ${task.isPinned ? 'opacity-100 text-amber-500' : ''}`}
          >
            <Pin className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>
      </motion.div>
    );
  };

  const isAdmin = currentUserProfile?.rank === 'Admin';

  if (isAdmin) {
    return (
      <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl select-none max-w-2xl mx-auto my-auto space-y-6">
        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-3xl flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
            As the Super Admin, assignment lists are kept clean and organized. You can inspect, track, and manage all organization plan assignments by moving to the <span className="font-semibold text-indigo-500">Plans Detail</span> view, then selecting the <span className="font-semibold text-indigo-500">Tasks</span> tab.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('organizations')}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Building2 className="w-4 h-4" />
          Move to Plans Detail
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 space-y-6 overflow-y-auto shadow-xl">
      
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('dashboard.myTasks')}
          </h1>
          <p className="text-sm text-neutral-500">
            {t('calendar.subtitle')}
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCatForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/30 dark:bg-white/10 border border-white/40 dark:border-white/15 text-xs font-semibold rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-white/50 dark:hover:bg-white/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            {t('habits.newHabit')}
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.addTask')}
          </button>
        </div>
      </div>

      {/* Expandable Task Creator Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateTask} className="bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-5 shadow-md space-y-4 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Assignment Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Write Essay Draft 1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  />
                </div>
                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Notes / Description</label>
                  <input 
                    type="text" 
                    placeholder="Short description..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-mono font-medium"
                  />
                </div>
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Priority</label>
                  <select 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                {/* Category Selector (Manual Entry) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Subject / Category</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Maths, Admin, Design"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  />
                </div>
                {/* Assignee */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Assign To (Team)</label>
                  <select 
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="">Unassigned (Just Me)</option>
                    {assignableMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Task Sources / Attachments */}
              <div className="border-t border-neutral-200/20 dark:border-white/5 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Sources & References (PDF, Emails, Links)</label>
                  {newAttachments.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                      {newAttachments.length} added
                    </span>
                  )}
                </div>

                {newAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newAttachments.map((att) => (
                      <div 
                        key={att.id}
                        className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-850 border border-neutral-200/30 dark:border-white/5 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-white/40 dark:bg-neutral-800 text-neutral-500 text-[10px]">
                            {att.type}
                          </span>
                          <div className="truncate min-w-0">
                            <p className="font-medium text-neutral-700 dark:text-neutral-300 truncate">{att.name}</p>
                            {att.size && <p className="text-[10px] text-neutral-400 font-mono truncate">{att.size}</p>}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNewAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 animate-fade-in"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <SourceSelector 
                  onAddSource={(name, type, size, url) => {
                    const att: Attachment = {
                      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                      name,
                      type,
                      size,
                      url
                    };
                    setNewAttachments(prev => [...prev, att]);
                  }}
                />
              </div>

              {/* Extra settings: Recurring */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-neutral-200/20 dark:border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Repeat schedule:</label>
                  <select 
                    value={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.value as RecurringType)}
                    className="text-xs glass-input rounded-xl px-3 py-1.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-xl text-xs font-semibold text-neutral-750 dark:text-neutral-200 hover:bg-white/45 dark:hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors cursor-pointer"
                  >
                    Add Assignment
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover Subject Creator Form */}
      <AnimatePresence>
        {showCatForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-5 rounded-[24px] max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-800 dark:text-white text-sm">Add Subject / Project Category</h3>
                <button onClick={() => setShowCatForm(false)} className="p-1 hover:bg-white/25 dark:hover:bg-white/10 rounded-lg text-neutral-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Category Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Physics Honors"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Theme Category</label>
                  <select 
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as 'Subject' | 'Project' | 'Personal')}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="Subject">Academic Subject</option>
                    <option value="Project">Work Project</option>
                    <option value="Personal">Personal / Hobby</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">Color Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {catColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewCatColor(color.value)}
                        className={`text-[10px] px-2 py-1.5 border rounded-md font-medium text-center truncate cursor-pointer ${color.value} ${newCatColor === color.value ? 'ring-2 ring-indigo-500 font-bold' : ''}`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Create Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder={t('dashboard.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-xs focus:outline-none text-neutral-800 dark:text-white font-medium"
            />
          </div>

          {/* Quick Filters toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              showFilters 
                ? 'bg-white/40 dark:bg-white/15 border-white/50 dark:border-white/15 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'bg-transparent border-white/20 dark:border-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-white/20 dark:hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('dashboard.filters')}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Extended Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-neutral-200/20 dark:border-white/5 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Category filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('dashboard.subjectCategory')}</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-2.5 py-2 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="all">{t('dashboard.all')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('dashboard.priority')}</label>
                  <select 
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-2.5 py-2 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="all">{t('dashboard.all')}</option>
                    <option value="Low">{t('dashboard.low')}</option>
                    <option value="Medium">{t('dashboard.medium')}</option>
                    <option value="High">{t('dashboard.high')}</option>
                    <option value="Urgent">{t('dashboard.urgent')}</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('dashboard.status')}</label>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-2.5 py-2 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="all">{t('dashboard.all')}</option>
                    <option value="Todo">{t('dashboard.todo')}</option>
                    <option value="InProgress">{t('dashboard.inProgress')}</option>
                    <option value="Completed">{t('dashboard.completed')}</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('dashboard.sortBy')}</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full text-xs glass-input rounded-xl px-2.5 py-2 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                  >
                    <option value="dueDateAsc">{t('dashboard.earliestFirst')}</option>
                    <option value="dueDateDesc">{t('dashboard.latestFirst')}</option>
                    <option value="priorityHigh">{t('dashboard.highToLow')}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Grid Content */}
      <div className="space-y-8">
        {/* Pinned Assignments Section */}
        {pinnedTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
              {t('dashboard.pinnedAssignments')} ({pinnedTasks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {/* Regular Assignments Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            {t('dashboard.allAssignments')} ({regularTasks.length})
          </h2>
          {regularTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularTasks.map(renderTaskCard)}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/20 dark:border-white/5 rounded-2xl bg-white/10 dark:bg-white/5">
              <p className="text-sm text-neutral-500 font-sans">{t('dashboard.noTasksFound')}</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedPriority('all');
                  setSelectedStatus('all');
                }}
                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                {t('dashboard.resetFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Completed Assignments Collapsible Section */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-neutral-200/20 dark:border-white/5 space-y-3">
            <button 
              type="button"
              onClick={() => setShowCompletedSection(!showCompletedSection)}
              className="flex items-center justify-between w-full text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Completed Tasks ({completedTasks.length})
              </span>
              <span className="text-[10px] bg-neutral-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                {showCompletedSection ? 'Collapse' : 'Expand / View'}
              </span>
            </button>
            
            <AnimatePresence>
              {showCompletedSection && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4">
                    {completedTasks.map(renderTaskCard)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Selected Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal 
            task={tasks.find(t => t.id === selectedTask.id) || selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
