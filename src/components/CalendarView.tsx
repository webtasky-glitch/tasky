import React, { useState, useMemo } from 'react';
import { useTasky } from '../TaskyContext';
import { Task, TaskPriority, Habit, TeamMember, Organization } from '../types';
import { TaskModal } from './TaskModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckSquare, 
  Tag, 
  AlertCircle,
  Flame,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Filter,
  CheckCircle2,
  CalendarDays,
  GanttChartSquare,
  AlertTriangle,
  Sun,
  Moon,
  Coffee,
  Brain,
  Shield,
  User,
  Users,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isTaskForUser, getTaskAssigneeIds } from '../utils/taskFilter';

type ViewMode = 'Month' | 'Week' | 'Day' | 'Timeline';
type RoleFilter = 'all' | 'personal' | 'plan_milestones' | 'assigned_team';
type EnergyBlock = 'All' | 'MorningFocus' | 'AfternoonDeep' | 'QuickAdmin' | 'EveningReview';

export const CalendarView: React.FC = () => {
  const { 
    tasks, 
    categories, 
    teamMembers, 
    organizations,
    habits,
    addTask, 
    updateTask,
    currentUserProfile, 
    user 
  } = useTasky() as any;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Super Calendar Features State
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [energyFilter, setEnergyFilter] = useState<EnergyBlock>('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickEstimatedHours, setQuickEstimatedHours] = useState('1.5');
  const [quickEnergyBlock, setQuickEnergyBlock] = useState<'MorningFocus' | 'AfternoonDeep' | 'QuickAdmin' | 'EveningReview'>('MorningFocus');

  // AI Day-in-Review / Auto-Catchup State
  const [isAiCatchupOpen, setIsAiCatchupOpen] = useState(false);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [catchupSummary, setCatchupSummary] = useState<string | null>(null);

  // Timeline Gantt zoom/navigation
  const [timelineSpanDays, setTimelineSpanDays] = useState(14);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Convert date object to YYYY-MM-DD local format
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDateString(new Date());

  // Filter tasks based on Role / Scope Overlays
  const scopedTasks = useMemo(() => {
    return (tasks || []).filter((t: Task) => {
      // Base user visibility
      const isVisible = isTaskForUser(t, currentUserProfile, user, teamMembers);
      if (!isVisible) return false;

      // Role & Plan overlays
      const currentUserId = currentUserProfile?.id;
      const assigneeIds = getTaskAssigneeIds(t);
      const isAssignedToMe = currentUserId && (t.assignedTo === currentUserId || assigneeIds.includes(currentUserId));
      const isCreatedByMe = currentUserId && t.createdBy === currentUserId;

      if (roleFilter === 'personal') {
        return isAssignedToMe || isCreatedByMe;
      }
      if (roleFilter === 'plan_milestones') {
        return t.priority === 'Urgent' || t.priority === 'High' || t.orgId || t.projectId;
      }
      if (roleFilter === 'assigned_team') {
        return assigneeIds.length > 0 || (t.assignedTo && t.assignedTo !== currentUserId);
      }

      return true;
    }).filter((t: Task) => {
      // Energy block filter
      if (energyFilter === 'All') return true;
      return (t.focusBlock || 'MorningFocus') === energyFilter;
    });
  }, [tasks, currentUserProfile, user, teamMembers, roleFilter, energyFilter]);

  // Tasks mapped by date string
  const tasksByDate = useMemo(() => {
    return scopedTasks.reduce((acc, task) => {
      if (!acc[task.dueDate]) acc[task.dueDate] = [];
      acc[task.dueDate].push(task);
      return acc;
    }, {} as { [key: string]: Task[] });
  }, [scopedTasks]);

  // Workload and Overload Calculation per date
  const workloadByDate = useMemo(() => {
    const workload: Record<string, { totalHours: number; taskCount: number; isOverloaded: boolean; level: 'low' | 'balanced' | 'heavy' | 'overloaded' }> = {};
    
    Object.entries(tasksByDate).forEach(([dateStr, dayTasks]) => {
      const taskList = (dayTasks as Task[]) || [];
      const pendingTasks = taskList.filter((t: Task) => t.status !== 'Completed');
      const totalHours = pendingTasks.reduce((sum: number, t: Task) => sum + (t.estimatedHours || (t.priority === 'Urgent' ? 3 : t.priority === 'High' ? 2 : 1)), 0);
      const taskCount = pendingTasks.length;

      let level: 'low' | 'balanced' | 'heavy' | 'overloaded' = 'low';
      if (totalHours > 7 || taskCount >= 6) {
        level = 'overloaded';
      } else if (totalHours >= 5 || taskCount >= 4) {
        level = 'heavy';
      } else if (totalHours >= 2.5 || taskCount >= 2) {
        level = 'balanced';
      }

      workload[dateStr] = {
        totalHours,
        taskCount,
        isOverloaded: level === 'overloaded',
        level
      };
    });

    return workload;
  }, [tasksByDate]);

  // Overdue / Unfinished tasks for AI Auto-Catchup
  const uncompletedPastTasks = useMemo(() => {
    return (tasks || []).filter((t: Task) => {
      return isTaskForUser(t, currentUserProfile, user, teamMembers) &&
        t.status !== 'Completed' &&
        t.dueDate < todayStr;
    });
  }, [tasks, currentUserProfile, user, teamMembers, todayStr]);

  // Execute AI Day-in-Review Auto-Catchup
  const handleAutoCatchup = async () => {
    if (uncompletedPastTasks.length === 0) {
      setCatchupSummary("All past tasks are up to date! Your schedule is clear of backlogs.");
      return;
    }

    setIsCatchingUp(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      // Reschedule overdue tasks to today or next open focus blocks
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateString(tomorrow);

      uncompletedPastTasks.forEach((task: Task, idx: number) => {
        const targetDate = idx % 2 === 0 ? todayStr : tomorrowStr;
        const focusSlot = idx % 3 === 0 ? 'MorningFocus' : idx % 3 === 1 ? 'AfternoonDeep' : 'QuickAdmin';
        
        if (updateTask) {
          updateTask({
            ...task,
            dueDate: targetDate,
            focusBlock: task.focusBlock || focusSlot
          });
        }
      });

      setCatchupSummary(`Successfully caught up and rescheduled ${uncompletedPastTasks.length} past unfinished items into balanced upcoming focus slots.`);
    } catch (err: any) {
      setCatchupSummary("Auto-catchup encountered an issue while re-allocating slots.");
    } finally {
      setIsCatchingUp(false);
    }
  };

  // Date Navigation
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Month') {
      nextDate.setMonth(month - 1);
    } else if (viewMode === 'Week' || viewMode === 'Timeline') {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Month') {
      nextDate.setMonth(month + 1);
    } else if (viewMode === 'Week' || viewMode === 'Timeline') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month Grid Calculation
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((daysInMonth + firstDayIndex) / 7) * 7;

  const calendarDays: { date: Date | null; isCurrentMonth: boolean }[] = [];
  const prevMonthDaysCount = getDaysInMonth(year, month - 1);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthDaysCount - i);
    calendarDays.push({ date: prevDate, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    calendarDays.push({ date, isCurrentMonth: true });
  }
  const remainingCells = totalCells - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarDays.push({ date: nextDate, isCurrentMonth: false });
  }

  // Week Days
  const getWeekDays = (baseDate: Date) => {
    const startOfWeek = new Date(baseDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const wDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      wDays.push(d);
    }
    return wDays;
  };
  const weekDays = getWeekDays(currentDate);

  // Timeline Days (e.g. 14 or 21 days from current start)
  const timelineDays = useMemo(() => {
    const tDays: Date[] = [];
    const start = new Date(currentDate);
    for (let i = 0; i < timelineSpanDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      tDays.push(d);
    }
    return tDays;
  }, [currentDate, timelineSpanDays]);

  const handleDayClick = (date: Date) => {
    const dateStr = formatDateString(date);
    const dayTasks = tasksByDate[dateStr] || [];
    setSelectedDayTasks(dayTasks);
    setSelectedDateStr(dateStr);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !selectedDateStr) return;

    addTask({
      title: quickTitle.trim(),
      description: `Scheduled in ${quickEnergyBlock} block.`,
      dueDate: selectedDateStr,
      priority: 'Medium',
      categoryId: categories[0]?.id || '',
      status: 'Todo',
      recurring: 'None',
      focusBlock: quickEnergyBlock,
      estimatedHours: parseFloat(quickEstimatedHours) || 1.5,
      assignedTo: currentUserProfile?.id,
      assignedToIds: [currentUserProfile?.id].filter(Boolean),
      createdBy: currentUserProfile?.id,
      orgId: currentUserProfile?.orgId || undefined
    });

    setQuickTitle('');
    setShowQuickAdd(false);
    
    setTimeout(() => {
      const updatedTasks = tasksByDate[selectedDateStr] || [];
      setSelectedDayTasks([...updatedTasks]);
    }, 100);
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      case 'Low': return 'bg-neutral-400 text-white';
    }
  };

  const getEnergyIcon = (block?: string) => {
    switch (block) {
      case 'MorningFocus': return <Brain className="w-3 h-3 text-amber-500" title="Morning Focus (High Cognitive Capacity)" />;
      case 'AfternoonDeep': return <Zap className="w-3 h-3 text-indigo-500" title="Afternoon Deep Work" />;
      case 'QuickAdmin': return <Coffee className="w-3 h-3 text-emerald-500" title="Quick Admin / Low Energy" />;
      case 'EveningReview': return <Moon className="w-3 h-3 text-purple-500" title="Evening Wrap-up & Review" />;
      default: return <Clock className="w-3 h-3 text-neutral-400" />;
    }
  };

  // Helper to check if a habit is done on a specific date
  const getHabitsForDate = (dateStr: string) => {
    return (habits || []).filter((h: Habit) => (h.completedDates || []).includes(dateStr));
  };

  // Helper to check task dependency
  const getDependencyTask = (task: Task) => {
    if (!task.dependsOnTaskId) return null;
    return (tasks || []).find((t: Task) => t.id === task.dependsOnTaskId);
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 overflow-y-auto shadow-xl">
      
      {/* Main Calendar View Area */}
      <div className="flex-1 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col select-none backdrop-blur-md">
        
        {/* Top Header & Strategic Toolbars */}
        <div className="flex flex-col gap-4 mb-5 border-b border-neutral-200/60 dark:border-white/10 pb-5">
          
          {/* Main Title, Navigation & Super Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight min-w-44">
                {viewMode === 'Month' 
                  ? `${monthNames[month]} ${year}` 
                  : viewMode === 'Week' 
                    ? `Week of ${weekDays[0].toLocaleDateString([], {month: 'short', day: 'numeric'})}` 
                    : viewMode === 'Timeline'
                      ? `Project Timeline (${timelineSpanDays} Days)`
                      : currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>

              <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white/70 dark:bg-neutral-950 shadow-sm">
                <button onClick={handlePrev} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleToday} className="px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                  Today
                </button>
                <button onClick={handleNext} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-l border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* AI Auto-Catchup Button */}
              <button
                onClick={() => setIsAiCatchupOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/15 border border-indigo-500/30 text-xs font-bold text-indigo-900 dark:text-indigo-300 hover:scale-[1.02] transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>AI Day-in-Review & Catchup</span>
                {uncompletedPastTasks.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                    {uncompletedPastTasks.length}
                  </span>
                )}
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-black/40 p-1.5 rounded-2xl border border-neutral-200/80 dark:border-white/5 self-start lg:self-auto overflow-x-auto max-w-full">
              {(['Month', 'Week', 'Day', 'Timeline'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === mode 
                      ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-md border border-neutral-200/60 dark:border-white/10' 
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {mode === 'Timeline' ? <GanttChartSquare className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />}
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sub-toolbar: Role Filters & Energy-Focus Overlays */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            {/* Multi-User & Role Overlays */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 pr-1">
                <Filter className="w-3 h-3" /> Layer:
              </span>

              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                All Workspace
              </button>

              <button
                onClick={() => setRoleFilter('personal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'personal'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <User className="w-3 h-3" /> My Tasks
              </button>

              <button
                onClick={() => setRoleFilter('plan_milestones')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'plan_milestones'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <Shield className="w-3 h-3 text-amber-400" /> Plan Milestones
              </button>

              <button
                onClick={() => setRoleFilter('assigned_team')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'assigned_team'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <Users className="w-3 h-3" /> Team Deliverables
              </button>
            </div>

            {/* Energy & Focus Block Scheduling Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 pr-1">
                <Brain className="w-3 h-3 text-indigo-400" /> Focus Block:
              </span>

              {(['All', 'MorningFocus', 'AfternoonDeep', 'QuickAdmin', 'EveningReview'] as EnergyBlock[]).map((block) => (
                <button
                  key={block}
                  onClick={() => setEnergyFilter(block)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    energyFilter === block
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                      : 'bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  {block === 'MorningFocus' && <Sun className="w-3 h-3 text-amber-500" />}
                  {block === 'AfternoonDeep' && <Zap className="w-3 h-3 text-indigo-400" />}
                  {block === 'QuickAdmin' && <Coffee className="w-3 h-3 text-emerald-400" />}
                  {block === 'EveningReview' && <Moon className="w-3 h-3 text-purple-400" />}
                  <span>{block === 'MorningFocus' ? 'Morning (Peak)' : block === 'AfternoonDeep' ? 'Afternoon (Deep)' : block === 'QuickAdmin' ? 'Admin' : block === 'EveningReview' ? 'Evening' : 'All Focus'}</span>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* VIEW 1: MONTHLY GRID WITH WORKLOAD HEATMAP & HABIT CHAINS     */}
        {/* ============================================================ */}
        {viewMode === 'Month' && (
          <div className="flex-1 flex flex-col min-h-[460px] overflow-x-auto">
            <div className="min-w-[540px] sm:min-w-0 flex-1 flex flex-col">
              
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-neutral-400 dark:text-neutral-500 text-xs py-2">
                {dayNames.map(day => <div key={day}>{day}</div>)}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-2 flex-1 mt-1">
                {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                  if (!date) return <div key={idx} className="min-h-[90px] rounded-2xl bg-transparent" />;

                  const dateStr = formatDateString(date);
                  const dayTasks = tasksByDate[dateStr] || [];
                  const dayHabits = getHabitsForDate(dateStr);
                  const workload = workloadByDate[dateStr];
                  const isSelected = selectedDateStr === dateStr;
                  const isToday = dateStr === todayStr;

                  // Workload Heatmap Background Styling
                  let heatmapBg = 'bg-white/40 dark:bg-white/[0.02] border-neutral-200/50 dark:border-white/5';
                  if (workload?.level === 'overloaded') {
                    heatmapBg = 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-900 dark:text-rose-200';
                  } else if (workload?.level === 'heavy') {
                    heatmapBg = 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200';
                  } else if (workload?.level === 'balanced') {
                    heatmapBg = 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20';
                  }

                  return (
                    <motion.div
                      key={dateStr}
                      whileHover={{ scale: 1.015 }}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[95px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${heatmapBg} ${
                        !isCurrentMonth ? 'opacity-35 grayscale' : ''
                      } ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-indigo-400'}`}
                    >
                      {/* Top Day Header & Workload Indicator */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {date.getDate()}
                        </span>

                        {/* Workload Indicator Badge */}
                        {workload && workload.taskCount > 0 && (
                          <div className="flex items-center gap-1">
                            {workload.isOverloaded && (
                              <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" title="High Workload Alert: Over capacity" />
                            )}
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              workload.level === 'overloaded'
                                ? 'bg-rose-500 text-white'
                                : workload.level === 'heavy'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}>
                              {workload.totalHours}h
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Integrated Habit Chain Dots */}
                      {dayHabits.length > 0 && (
                        <div className="flex items-center gap-1 my-1 py-0.5 px-1 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Flame className="w-2.5 h-2.5 text-emerald-500 fill-current" />
                          <span>{dayHabits.length} habit{dayHabits.length > 1 ? 's' : ''} chained</span>
                        </div>
                      )}

                      {/* Task Chips in Month Day Cell */}
                      <div className="space-y-1 mt-1">
                        {dayTasks.slice(0, 2).map((t) => {
                          const dep = getDependencyTask(t);
                          return (
                            <div
                              key={t.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center justify-between gap-1 shadow-2xs ${
                                t.status === 'Completed'
                                  ? 'bg-neutral-200/70 dark:bg-neutral-800/70 text-neutral-400 line-through'
                                  : 'bg-white/80 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10'
                              }`}
                            >
                              <span className="truncate flex items-center gap-1">
                                {getEnergyIcon(t.focusBlock)}
                                {t.title}
                              </span>
                              {dep && (
                                <span className="text-[8px] text-amber-500 font-mono" title={`Blocked by: ${dep.title}`}>
                                  ⏳
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {dayTasks.length > 2 && (
                          <div className="text-[9px] font-extrabold text-neutral-400 dark:text-neutral-500 pl-1">
                            +{dayTasks.length - 2} more tasks
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: WEEKLY FOCUS-BLOCK VIEW                              */}
        {/* ============================================================ */}
        {viewMode === 'Week' && (
          <div className="flex-1 flex flex-col overflow-x-auto min-h-[460px]">
            <div className="min-w-[620px] flex-1 grid grid-cols-7 gap-2.5">
              {weekDays.map((date) => {
                const dateStr = formatDateString(date);
                const dayTasks = tasksByDate[dateStr] || [];
                const workload = workloadByDate[dateStr];
                const dayHabits = getHabitsForDate(dateStr);
                const isToday = dateStr === todayStr;

                return (
                  <div 
                    key={dateStr}
                    onClick={() => handleDayClick(date)}
                    className={`flex flex-col p-3 rounded-2xl border transition-all cursor-pointer ${
                      isToday 
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500' 
                        : 'bg-white/40 dark:bg-white/[0.02] border-neutral-200/60 dark:border-white/5 hover:border-indigo-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="border-b border-neutral-200/50 dark:border-white/5 pb-2 mb-2">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase">
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className={`text-base font-extrabold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-800 dark:text-white'}`}>
                          {date.getDate()}
                        </span>
                        {workload && workload.totalHours > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                            {workload.totalHours}h
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Habit Streak Tag */}
                    {dayHabits.length > 0 && (
                      <div className="mb-2 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-emerald-500 fill-current" />
                        <span>{dayHabits.length} Habits Done</span>
                      </div>
                    )}

                    {/* Tasks grouped by energy block */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[380px] no-scrollbar">
                      {dayTasks.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-neutral-400 dark:text-neutral-600 italic">
                          No tasks
                        </div>
                      ) : (
                        dayTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-xs hover:border-indigo-400 transition-all text-xs"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500">
                                {getEnergyIcon(task.focusBlock)}
                                <span>{task.focusBlock ? task.focusBlock.replace(/([A-Z])/g, ' $1').trim() : 'Focus'}</span>
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">
                              {task.title}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: DAY VIEW (ENERGY & TIME BLOCKS)                      */}
        {/* ============================================================ */}
        {viewMode === 'Day' && (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                  {currentDate.getDate()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Energy-Optimized Schedule: High cognitive tasks placed in peak morning slots.
                  </p>
                </div>
              </div>

              {workloadByDate[formatDateString(currentDate)]?.isOverloaded && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Day Overloaded (&gt; 7h effort)</span>
                </div>
              )}
            </div>

            {/* Focus Blocks Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {[
                { key: 'MorningFocus', title: '🌅 Morning Focus (08:00 - 12:00)', desc: 'Peak cognitive energy for complex strategic tasks and high priority items.', icon: Sun, color: 'text-amber-500' },
                { key: 'AfternoonDeep', title: '⚡ Afternoon Deep Work (13:00 - 16:30)', desc: 'Uninterrupted deep focus sprints and execution.', icon: Zap, color: 'text-indigo-500' },
                { key: 'QuickAdmin', title: '☕ Quick Admin & Comms (16:30 - 18:00)', desc: 'Low energy quick emails, checklists, and administrative updates.', icon: Coffee, color: 'text-emerald-500' },
                { key: 'EveningReview', title: '🌙 Evening Review & Planning (18:00 - 20:00)', desc: 'Wrap-up, log streak progress, and queue tasks for tomorrow.', icon: Moon, color: 'text-purple-500' }
              ].map((block) => {
                const dayTasks = (tasksByDate[formatDateString(currentDate)] || []).filter(
                  t => (t.focusBlock || 'MorningFocus') === block.key
                );

                return (
                  <div key={block.key} className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <block.icon className={`w-4 h-4 ${block.color}`} />
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                          {block.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
                        {block.desc}
                      </p>

                      <div className="space-y-2">
                        {dayTasks.length === 0 ? (
                          <div className="text-xs text-neutral-400 dark:text-neutral-600 italic py-2">
                            No tasks scheduled in this block.
                          </div>
                        ) : (
                          dayTasks.map(t => (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTask(t)}
                              className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-2 hover:border-indigo-400 transition-all cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                  {t.title}
                                </p>
                                <span className="text-[10px] text-neutral-500 font-medium">
                                  Est. {t.estimatedHours || 1.5} hrs
                                </span>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getPriorityColor(t.priority)}`}>
                                {t.priority}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: INTERACTIVE TIMELINE & GANTT BRIDGE                  */}
        {/* ============================================================ */}
        {viewMode === 'Timeline' && (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-200/60 dark:border-white/5">
              <div className="flex items-center gap-2">
                <GanttChartSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-white">
                  Multi-Day Roadmap & Cross-Member Dependencies
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <span>Span:</span>
                {[7, 14, 21].map((span) => (
                  <button
                    key={span}
                    onClick={() => setTimelineSpanDays(span)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timelineSpanDays === span
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10'
                    }`}
                  >
                    {span} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Gantt Timeline View Table */}
            <div className="flex-1 overflow-x-auto border border-neutral-200/80 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-neutral-950/40">
              <div className="min-w-[800px]">
                {/* Timeline Header (Days) */}
                <div className="grid grid-cols-12 border-b border-neutral-200/80 dark:border-white/10 bg-neutral-100/70 dark:bg-neutral-900/70">
                  <div className="col-span-4 p-3 text-xs font-bold text-neutral-500 uppercase border-r border-neutral-200 dark:border-white/10">
                    Task / Deliverable
                  </div>
                  <div className="col-span-8 grid" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                    {timelineDays.map((d) => (
                      <div key={d.toISOString()} className="text-center py-2 border-r border-neutral-200/40 dark:border-white/5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        <div>{d.toLocaleDateString([], { weekday: 'narrow' })}</div>
                        <div className={`${formatDateString(d) === todayStr ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}>{d.getDate()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Task Rows */}
                <div className="divide-y divide-neutral-200/50 dark:divide-white/5 max-h-[420px] overflow-y-auto">
                  {scopedTasks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400 italic">
                      No tasks in the current filter scope for this timeline.
                    </div>
                  ) : (
                    scopedTasks.map((t) => {
                      const dep = getDependencyTask(t);
                      const taskDate = new Date(t.dueDate);
                      const firstTimelineDate = timelineDays[0];
                      const diffTime = taskDate.getTime() - firstTimelineDate.getTime();
                      const dayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const isInRange = dayOffset >= 0 && dayOffset < timelineDays.length;

                      const assigneeName = (teamMembers || []).find((m: any) => m.id === t.assignedTo)?.name || 'Assignee';

                      return (
                        <div key={t.id} className="grid grid-cols-12 items-center hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <div className="col-span-4 p-3 border-r border-neutral-200/80 dark:border-white/10">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate cursor-pointer hover:text-indigo-500" onClick={() => setSelectedTask(t)}>
                                {t.title}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${getPriorityColor(t.priority)}`}>
                                {t.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                              <span>👤 {assigneeName}</span>
                              {dep && (
                                <span className="text-amber-500 font-semibold truncate" title={`Depends on: ${dep.title}`}>
                                  ↳ Dep: {dep.title}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="col-span-8 grid relative h-12 items-center" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                            {/* Vertical day guidelines */}
                            {timelineDays.map((d, i) => (
                              <div key={i} className="h-full border-r border-neutral-200/30 dark:border-white/5" />
                            ))}

                            {/* Scheduled Task Milestone Pill */}
                            {isInRange && (
                              <div
                                onClick={() => setSelectedTask(t)}
                                style={{
                                  gridColumnStart: dayOffset + 1,
                                  gridColumnEnd: Math.min(dayOffset + 2, timelineDays.length + 1)
                                }}
                                className="absolute z-10 inset-x-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md text-[10px] font-bold truncate flex items-center justify-between cursor-pointer hover:scale-105 transition-all"
                              >
                                <span className="truncate">{t.title}</span>
                                {getEnergyIcon(t.focusBlock)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* SIDEBAR: SELECTED DAY TASKS & SCHEDULE OVERVIEW              */}
      {/* ============================================================ */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4">
        
        {/* Selected Day Agenda Box */}
        <div className="p-5 rounded-3xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col flex-1">
          
          <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-white/10 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                {selectedDateStr ? `Agenda: ${selectedDateStr}` : 'Select a Date'}
              </h3>
              <p className="text-[11px] text-neutral-500">
                {selectedDateStr 
                  ? `${(selectedDayTasks || []).length} scheduled items`
                  : 'Click any calendar box to view focus items'}
              </p>
            </div>

            {selectedDateStr && (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow"
                title="Quick Add Task"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px]">Add</span>
              </button>
            )}
          </div>

          {/* Quick Add Form Modal/Drawer */}
          {showQuickAdd && selectedDateStr && (
            <form onSubmit={handleQuickAddSubmit} className="mb-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2.5">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                <span>Quick Add for {selectedDateStr}</span>
                <button type="button" onClick={() => setShowQuickAdd(false)} className="text-neutral-400 hover:text-neutral-600 text-xs">
                  ✕
                </button>
              </div>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-0.5">Focus Block</label>
                  <select
                    value={quickEnergyBlock}
                    onChange={(e) => setQuickEnergyBlock(e.target.value as any)}
                    className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-lg text-xs font-semibold text-neutral-800 dark:text-white"
                  >
                    <option value="MorningFocus">🌅 Morning Focus</option>
                    <option value="AfternoonDeep">⚡ Afternoon Deep</option>
                    <option value="QuickAdmin">☕ Quick Admin</option>
                    <option value="EveningReview">🌙 Evening Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-0.5">Effort (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={quickEstimatedHours}
                    onChange={(e) => setQuickEstimatedHours(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-lg text-xs font-semibold text-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Schedule Task
              </button>
            </form>
          )}

          {/* Tasks List for Selected Day */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] no-scrollbar">
            {!selectedDateStr ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                <CalendarIcon className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                <p className="text-xs">Click on any date to inspect workload, focus blocks, and dependencies.</p>
              </div>
            ) : (selectedDayTasks || []).length === 0 ? (
              <div className="text-center py-10 text-neutral-400 dark:text-neutral-500 text-xs italic">
                No tasks scheduled on this date.
              </div>
            ) : (
              (selectedDayTasks || []).map((t) => {
                const dep = getDependencyTask(t);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-white/10 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {getEnergyIcon(t.focusBlock)}
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-medium">
                      <span>{t.focusBlock || 'Morning Focus'} • {t.estimatedHours || 1.5}h</span>
                      <span className={`${t.status === 'Completed' ? 'text-emerald-500 font-bold' : 'text-neutral-400'}`}>
                        {t.status}
                      </span>
                    </div>

                    {dep && (
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <span>⏳ Waiting for:</span>
                        <span className="truncate font-bold">{dep.title}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* AI DAY-IN-REVIEW & AUTO-CATCHUP MODAL                        */}
      {/* ============================================================ */}
      {isAiCatchupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#12141f] border border-neutral-200 dark:border-white/10 rounded-[32px] p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    AI Day-in-Review & Catchup
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Smart schedule re-balancing & backlog resolution
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiCatchupOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {uncompletedPastTasks.length} Overdue / Unfinished Item{uncompletedPastTasks.length === 1 ? '' : 's'} Detected
                  </span>
                  <span>
                    Tasky AI analyzes previous days, balances current cognitive load, and automatically shifts pending tasks into open morning or afternoon focus blocks.
                  </span>
                </div>
              </div>

              {catchupSummary ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Action Completed
                  </div>
                  <p>{catchupSummary}</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-neutral-200 dark:border-white/10 rounded-2xl p-3 bg-neutral-50 dark:bg-neutral-900/50">
                  {uncompletedPastTasks.length === 0 ? (
                    <div className="text-center py-4 text-xs text-neutral-400">
                      No overdue tasks! You are completely on track.
                    </div>
                  ) : (
                    uncompletedPastTasks.map(t => (
                      <div key={t.id} className="text-xs flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-800">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{t.title}</span>
                        <span className="text-[10px] text-rose-500 font-mono font-bold shrink-0">{t.dueDate}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsAiCatchupOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleAutoCatchup}
                disabled={isCatchingUp || uncompletedPastTasks.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isCatchingUp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-balancing slots...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Reschedule Overdue</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Task Modal for details / editing */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

    </div>
  );
};
