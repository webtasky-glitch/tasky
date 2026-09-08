import React, { useState, useMemo } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { Task, Organization, TeamMember, TaskPriority } from '../types';
import { TaskModal } from './TaskModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Building2, 
  Filter, 
  CheckCircle2, 
  Users, 
  X,
  AlertCircle
} from 'lucide-react';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

export const TimelineScheduleView: React.FC = () => {
  const { 
    tasks, 
    organizations, 
    teamMembers, 
    addTask, 
    currentUserProfile 
  } = useTasky() as any;

  const { t, language, tPriority } = useTranslation();
  const isEl = language === 'el';

  // View state: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [activeTaskForModal, setActiveTaskForModal] = useState<Task | null>(null);

  // Quick slot schedule modal state
  const [quickSlotModal, setQuickSlotModal] = useState<{
    isOpen: boolean;
    dateStr: string;
    hourStr: string;
  }>({
    isOpen: false,
    dateStr: '',
    hourStr: '09:00'
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPlanId, setNewTaskPlanId] = useState<string>('');
  const [newTaskStartTime, setNewTaskStartTime] = useState('09:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('10:00');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');

  // Format date utility
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to get organization for task
  const getTaskOrg = (task: Task): Organization | undefined => {
    const taskPlanId = task.orgId || (task as any).planId;
    if (taskPlanId) {
      const org = organizations.find((o: Organization) => o.id === taskPlanId);
      if (org) return org;
    }
    if (task.assignedTo) {
      const member = teamMembers.find((m: TeamMember) => m.id === task.assignedTo || m.email === task.assignedTo);
      if (member?.orgId) {
        return organizations.find((o: Organization) => o.id === member.orgId);
      }
    }
    return undefined;
  };

  // Filter tasks by selected plan
  const visibleTasks = useMemo(() => {
    return tasks.filter((t: Task) => {
      if (selectedPlanId === 'all') return true;
      const org = getTaskOrg(t);
      return org?.id === selectedPlanId;
    });
  }, [tasks, selectedPlanId, organizations, teamMembers]);

  // Date Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate week days (Monday - Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Calculate month days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7; // days from Monday
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Preceding month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Trailing padding to make full 35 or 42 grid
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [currentDate]);

  // Open Quick Slot Scheduler
  const openSlotScheduler = (dateStr: string, hourInt: number) => {
    const formattedHour = `${String(hourInt).padStart(2, '0')}:00`;
    const endHour = `${String(hourInt + 1).padStart(2, '0')}:00`;

    setQuickSlotModal({
      isOpen: true,
      dateStr,
      hourStr: formattedHour
    });
    setNewTaskTitle('');
    setNewTaskStartTime(formattedHour);
    setNewTaskEndTime(endHour);
    setNewTaskPlanId(selectedPlanId !== 'all' ? selectedPlanId : (organizations[0]?.id || ''));
    setNewTaskAssignee(currentUserProfile?.id || '');
    setNewTaskPriority('Medium');
  };

  // Save new scheduled task
  const handleSaveScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      description: '',
      dueDate: quickSlotModal.dateStr,
      priority: newTaskPriority,
      status: 'Todo',
      categoryId: 'cat-work',
      assignedTo: newTaskAssignee || undefined,
      assignedToIds: newTaskAssignee ? [newTaskAssignee] : [],
      recurring: 'None',
      planId: newTaskPlanId || undefined,
      startTime: newTaskStartTime,
      endTime: newTaskEndTime,
      isAllDay: false
    });

    setQuickSlotModal({ isOpen: false, dateStr: '', hourStr: '09:00' });
  };

  // Helper to parse hour from "HH:MM"
  const getTaskHour = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    return isNaN(h) ? null : h;
  };

  // Day Name translations
  const getDayName = (date: Date) => {
    return date.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/40 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t('timeline.title')}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('timeline.subtitle')}
          </p>
        </div>

        {/* View Mode Switcher + Plan Filter */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Plan Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">{t('timeline.allPlans')}</option>
              {organizations.map((org: Organization) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Day / Week / Month Selector */}
          <div className="flex bg-neutral-200/60 dark:bg-white/5 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t('timeline.dayView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t('timeline.weekView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t('timeline.monthView')}
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-white/10 px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
            title={t('timeline.prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-xl bg-neutral-200/70 dark:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-white/20 cursor-pointer transition-colors"
          >
            {t('timeline.today')}
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
            title={t('timeline.next')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-500" />
          {viewMode === 'day' ? (
            currentDate.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          ) : viewMode === 'week' ? (
            `${weekDays[0].toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
          ) : (
            currentDate.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', {
              month: 'long',
              year: 'numeric'
            })
          )}
        </h3>
      </div>

      {/* VIEW 1: WEEKLY TIMETABLE VIEW */}
      {viewMode === 'week' && (
        <div className="rounded-3xl border border-neutral-200/70 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 overflow-hidden shadow-sm">
          {/* Week Days Header */}
          <div className="grid grid-cols-8 border-b border-neutral-200/60 dark:border-white/10 bg-neutral-50/80 dark:bg-white/5 text-center text-xs font-bold">
            <div className="py-3 text-neutral-400 border-r border-neutral-200/50 dark:border-white/10 font-mono text-[11px]">
              {t('timeline.time')}
            </div>
            {weekDays.map((day) => {
              const isToday = formatDateKey(day) === formatDateKey(new Date());
              return (
                <div 
                  key={day.toISOString()} 
                  className={`py-3 border-r border-neutral-200/50 dark:border-white/10 last:border-r-0 ${
                    isToday ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                    {getDayName(day)}
                  </div>
                  <div className={`text-base font-extrabold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All-Day Tasks Section (Top row) */}
          <div className="grid grid-cols-8 border-b border-neutral-200/60 dark:border-white/10 bg-neutral-100/40 dark:bg-white/2 min-h-[44px]">
            <div className="p-2 text-[10px] uppercase font-bold text-neutral-400 border-r border-neutral-200/50 dark:border-white/10 flex items-center justify-center text-center">
              {t('timeline.allDayTasks')}
            </div>
            {weekDays.map((day) => {
              const dayStr = formatDateKey(day);
              const allDayTasks = visibleTasks.filter((t: Task) => t.dueDate === dayStr && (!t.startTime || t.isAllDay));
              return (
                <div key={`allday-${dayStr}`} className="p-1.5 border-r border-neutral-200/50 dark:border-white/10 last:border-r-0 space-y-1">
                  {allDayTasks.map((t: Task) => {
                    const org = getTaskOrg(t);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveTaskForModal(t)}
                        className="p-1 rounded-md bg-indigo-100/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-[10px] font-bold text-indigo-900 dark:text-indigo-200 truncate cursor-pointer hover:shadow-xs transition-shadow"
                        title={`${t.title} (${org?.name || (isEl ? 'Χώρος Εργασίας' : 'Workspace')})`}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Timetable Hourly Grid */}
          <div className="divide-y divide-neutral-100 dark:divide-white/5 max-h-[640px] overflow-y-auto">
            {HOURS.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, '0')}:00`;
              return (
                <div key={hour} className="grid grid-cols-8 min-h-[56px] group">
                  {/* Left Hour label */}
                  <div className="p-2 text-center text-xs font-mono font-semibold text-neutral-400 border-r border-neutral-200/50 dark:border-white/10 bg-neutral-50/40 dark:bg-white/2 flex items-start justify-center">
                    {hourLabel}
                  </div>

                  {/* Day Slots */}
                  {weekDays.map((day) => {
                    const dayStr = formatDateKey(day);
                    const slotTasks = visibleTasks.filter((t: Task) => {
                      if (t.dueDate !== dayStr) return false;
                      const taskH = getTaskHour(t.startTime);
                      return taskH === hour;
                    });

                    return (
                      <div
                        key={`${dayStr}-${hour}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('.task-pill')) return;
                          openSlotScheduler(dayStr, hour);
                        }}
                        className="p-1 border-r border-neutral-200/50 dark:border-white/10 last:border-r-0 hover:bg-indigo-500/5 cursor-pointer relative transition-colors"
                      >
                        {slotTasks.map((task: Task) => {
                          const org = getTaskOrg(task);
                          const orgColor = org?.themeColor || '#6366f1';

                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTaskForModal(task);
                              }}
                              className="task-pill p-1.5 rounded-lg text-white shadow-xs text-[11px] font-semibold flex flex-col justify-between cursor-pointer hover:opacity-95 transition-opacity mb-1"
                              style={{ backgroundColor: orgColor }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[9px] opacity-90">
                                  {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                                </span>
                                {task.priority === 'Urgent' && (
                                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                )}
                              </div>
                              <span className="truncate font-bold leading-tight mt-0.5">
                                {task.title}
                              </span>
                              {org && (
                                <span className="text-[9px] opacity-80 truncate">
                                  {org.name}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SINGLE DAY AGENDA VIEW */}
      {viewMode === 'day' && (
        <div className="rounded-3xl border border-neutral-200/70 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 overflow-hidden shadow-sm">
          {/* Day Header */}
          <div className="p-4 border-b border-neutral-200/60 dark:border-white/10 bg-neutral-50/80 dark:bg-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {currentDate.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { weekday: 'long' })}
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                {currentDate.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <button
              onClick={() => openSlotScheduler(formatDateKey(currentDate), 9)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('timeline.addTaskAt')} 09:00
            </button>
          </div>

          {/* All-Day Tasks Banner */}
          {(() => {
            const dayStr = formatDateKey(currentDate);
            const allDayTasks = visibleTasks.filter((t: Task) => t.dueDate === dayStr && (!t.startTime || t.isAllDay));
            if (allDayTasks.length === 0) return null;

            return (
              <div className="p-4 border-b border-neutral-200/50 dark:border-white/10 bg-indigo-50/30 dark:bg-indigo-950/20">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-2">
                  {t('timeline.allDayTasks')} ({allDayTasks.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {allDayTasks.map((t: Task) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTaskForModal(t)}
                      className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center justify-between cursor-pointer hover:shadow-xs transition-shadow"
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 font-mono">
                        {tPriority(t.priority)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Hourly Timeline */}
          <div className="divide-y divide-neutral-100 dark:divide-white/5">
            {HOURS.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, '0')}:00`;
              const dayStr = formatDateKey(currentDate);
              const hourTasks = visibleTasks.filter((t: Task) => {
                if (t.dueDate !== dayStr) return false;
                return getTaskHour(t.startTime) === hour;
              });

              return (
                <div 
                  key={hour}
                  onClick={() => openSlotScheduler(dayStr, hour)}
                  className="p-4 flex items-start gap-4 hover:bg-indigo-500/5 cursor-pointer transition-colors group"
                >
                  <div className="w-16 shrink-0 font-mono text-xs font-bold text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 pt-0.5">
                    {hourLabel}
                  </div>

                  <div className="flex-1 min-w-0">
                    {hourTasks.length === 0 ? (
                      <div className="text-xs text-neutral-400/60 italic py-1 group-hover:text-indigo-500/80 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span>{t('timeline.noTasksScheduled')}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hourTasks.map((task: Task) => {
                          const org = getTaskOrg(task);
                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTaskForModal(task);
                              }}
                              className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-800 shadow-xs hover:border-indigo-500/60 cursor-pointer transition-all flex items-center justify-between gap-3"
                              style={{ borderLeft: `5px solid ${org?.themeColor || '#6366f1'}` }}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {task.title}
                                  </h4>
                                  {org && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                                      {org.name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono text-neutral-500 mt-0.5 block">
                                  {task.startTime} – {task.endTime || (isEl ? 'Τέλος' : 'End')}
                                </span>
                              </div>

                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                                {tPriority(task.priority)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY AGENDA VIEW */}
      {viewMode === 'month' && (
        <div className="rounded-3xl border border-neutral-200/70 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 overflow-hidden shadow-sm">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-neutral-200/60 dark:border-white/10 bg-neutral-50/80 dark:bg-white/5 text-center text-xs font-bold">
            {weekDays.map((d) => (
              <div key={d.toISOString()} className="py-2.5 text-neutral-500 uppercase tracking-wider text-[11px]">
                {getDayName(d)}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200/50 dark:divide-white/10">
            {monthDays.map(({ date, isCurrentMonth }) => {
              const dayStr = formatDateKey(date);
              const dayTasks = visibleTasks.filter((t: Task) => t.dueDate === dayStr);
              const isToday = dayStr === formatDateKey(new Date());

              return (
                <div
                  key={dayStr}
                  onClick={() => openSlotScheduler(dayStr, 9)}
                  className={`min-h-[100px] p-2 hover:bg-indigo-500/5 cursor-pointer transition-colors flex flex-col justify-between ${
                    !isCurrentMonth ? 'opacity-30 bg-neutral-100/30 dark:bg-neutral-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${
                      isToday 
                        ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center' 
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-neutral-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((t: Task) => {
                      const org = getTaskOrg(t);
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTaskForModal(t);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold truncate text-white shadow-2xs"
                          style={{ backgroundColor: org?.themeColor || '#6366f1' }}
                          title={`${t.title} (${t.startTime || (isEl ? 'Ολοήμερο' : 'All-Day')})`}
                        >
                          {t.startTime ? `${t.startTime} ` : ''}{t.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-neutral-400 block text-right font-medium">
                        +{dayTasks.length - 3} {isEl ? 'ακόμη' : 'more'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK SLOT SCHEDULE MODAL */}
      <AnimatePresence>
        {quickSlotModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {t('timeline.addTaskAt')} {quickSlotModal.hourStr}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickSlotModal({ isOpen: false, dateStr: '', hourStr: '09:00' })}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveScheduledTask} className="space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('modal.taskTitleLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('modal.titlePlaceholder')}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('sidebar.organizations')}
                  </label>
                  <select
                    value={newTaskPlanId}
                    onChange={(e) => setNewTaskPlanId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="">{isEl ? 'Κανένα / Χώρος Εργασίας' : 'None / Workspace'}</option>
                    {organizations.map((org: Organization) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {t('task.startTime')}
                    </label>
                    <input
                      type="time"
                      value={newTaskStartTime}
                      onChange={(e) => setNewTaskStartTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 font-mono text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {t('task.endTime')}
                    </label>
                    <input
                      type="time"
                      value={newTaskEndTime}
                      onChange={(e) => setNewTaskEndTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 font-mono text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Assignee & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {t('modal.assignLabel')}
                    </label>
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
                    >
                      <option value="">{isEl ? 'Χωρίς ανάθεση' : 'Unassigned'}</option>
                      {teamMembers.map((tm: TeamMember) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {t('modal.priorityLabel')}
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none"
                    >
                      <option value="Low">{t('dashboard.low')}</option>
                      <option value="Medium">{t('dashboard.medium')}</option>
                      <option value="High">{t('dashboard.high')}</option>
                      <option value="Urgent">{t('dashboard.urgent')}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200/60 dark:border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSlotModal({ isOpen: false, dateStr: '', hourStr: '09:00' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {t('modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-colors"
                  >
                    {t('modal.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal for details */}
      {activeTaskForModal && (
        <TaskModal
          task={activeTaskForModal}
          onClose={() => setActiveTaskForModal(null)}
        />
      )}
    </div>
  );
};
