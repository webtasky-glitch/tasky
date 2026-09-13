import React, { useState, useMemo } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { Task, Organization, TeamMember, TaskPriority, TaskStatus } from '../types';
import { TaskModal } from './TaskModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  Flag, 
  Filter, 
  Search, 
  Building2, 
  Users, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ArrowUpDown, 
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const AllTasksView: React.FC = () => {
  const { 
    tasks, 
    organizations, 
    teamMembers, 
    currentUserProfile, 
    toggleTaskComplete 
  } = useTasky() as any;

  const { t, language, tPriority, tStatus } = useTranslation();
  const isEl = language === 'el';

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc' | 'priority' | 'title'>('dueDateAsc');
  const [activeTaskForModal, setActiveTaskForModal] = useState<Task | null>(null);

  // Map tasks to their plan organization
  const getTaskOrg = (task: Task): Organization | undefined => {
    // 1. Direct orgId on task
    const taskPlanId = task.orgId || (task as any).planId;
    if (taskPlanId) {
      const org = organizations.find((o: Organization) => o.id === taskPlanId);
      if (org) return org;
    }
    // 2. Map via primary assignee's organization
    if (task.assignedTo) {
      const member = teamMembers.find((m: TeamMember) => m.id === task.assignedTo || m.email === task.assignedTo);
      if (member) {
        const orgId = member.orgId || (member.orgIds && member.orgIds[0]);
        if (orgId) {
          const org = organizations.find((o: Organization) => o.id === orgId);
          if (org) return org;
        }
      }
    }
    return undefined;
  };

  // Helper to resolve assignee names
  const getAssigneeDetails = (task: Task) => {
    const ids = task.assignedToIds && task.assignedToIds.length > 0 
      ? task.assignedToIds 
      : (task.assignedTo ? [task.assignedTo] : []);

    return ids.map(id => {
      const member = teamMembers.find((m: TeamMember) => m.id === id || (m.email && m.email.toLowerCase() === id.toLowerCase()));
      return {
        id,
        name: member?.name || id,
        avatar: member?.avatar || (member?.name ? member.name.slice(0, 2).toUpperCase() : '??'),
        role: member?.role || member?.rank || 'Member'
      };
    });
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Organization filter
      if (selectedOrgFilter !== 'all') {
        const org = getTaskOrg(task);
        if (org?.id !== selectedOrgFilter) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (task.status !== selectedStatusFilter) return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'all') {
        if (task.priority !== selectedPriorityFilter) return false;
      }

      // Assignee filter
      if (selectedAssigneeFilter !== 'all') {
        if (selectedAssigneeFilter === 'me') {
          const isAssigned = (task.assignedToIds && task.assignedToIds.includes(currentUserProfile?.id)) ||
                            task.assignedTo === currentUserProfile?.id ||
                            (currentUserProfile?.email && task.assignedTo === currentUserProfile.email);
          if (!isAssigned) return false;
        } else {
          const isAssigned = (task.assignedToIds && task.assignedToIds.includes(selectedAssigneeFilter)) ||
                            task.assignedTo === selectedAssigneeFilter;
          if (!isAssigned) return false;
        }
      }

      return true;
    }).sort((a: Task, b: Task) => {
      if (sortBy === 'dueDateAsc') {
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      }
      if (sortBy === 'dueDateDesc') {
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      }
      if (sortBy === 'priority') {
        const priorityWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [tasks, searchQuery, selectedOrgFilter, selectedStatusFilter, selectedPriorityFilter, selectedAssigneeFilter, sortBy, organizations, teamMembers, currentUserProfile]);

  // Tasks grouped by plan
  const tasksByPlan = useMemo(() => {
    const groups: { org: Organization | null; tasks: Task[] }[] = [];
    const orgMap = new Map<string, Task[]>();
    const unassignedPlanTasks: Task[] = [];

    filteredTasks.forEach((task: Task) => {
      const org = getTaskOrg(task);
      if (org) {
        const existing = orgMap.get(org.id) || [];
        existing.push(task);
        orgMap.set(org.id, existing);
      } else {
        unassignedPlanTasks.push(task);
      }
    });

    // Add existing organizations that have tasks or if all plans filter
    organizations.forEach((org: Organization) => {
      const orgTasks = orgMap.get(org.id);
      if (orgTasks && orgTasks.length > 0) {
        groups.push({ org, tasks: orgTasks });
      } else if (selectedOrgFilter === org.id) {
        groups.push({ org, tasks: [] });
      }
    });

    if (unassignedPlanTasks.length > 0) {
      groups.push({ org: null, tasks: unassignedPlanTasks });
    }

    return groups;
  }, [filteredTasks, organizations]);

  // "Up Next" urgent items
  const upNextTasks = useMemo(() => {
    return tasks
      .filter((t: Task) => t.status !== 'Completed')
      .sort((a: Task, b: Task) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 4);
  }, [tasks]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedOrgFilter('all');
    setSelectedStatusFilter('all');
    setSelectedPriorityFilter('all');
    setSelectedAssigneeFilter('all');
    setSortBy('dueDateAsc');
  };

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Low':
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/40 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t('allTasks.title')}
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('allTasks.subtitle')}
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{t('allTasks.totalTasks')}:</span>
            <strong className="font-bold">{tasks.length}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('allTasks.completed')}:</span>
            <strong className="font-bold">{tasks.filter((t: Task) => t.status === 'Completed').length}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('allTasks.active')}:</span>
            <strong className="font-bold">{tasks.filter((t: Task) => t.status !== 'Completed').length}</strong>
          </div>
        </div>
      </div>

      {/* "Up Next" / Urgent Action Section */}
      {upNextTasks.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{t('allTasks.upNext')}</span>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {upNextTasks.length} {t('allTasks.active').toLowerCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upNextTasks.map((task: Task) => {
              const org = getTaskOrg(task);
              const assignees = getAssigneeDetails(task);
              return (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskForModal(task)}
                  className="p-3.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityBadgeClass(task.priority)}`}>
                      {tPriority(task.priority)}
                    </span>
                    {org && (
                      <span 
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white truncate max-w-[110px]"
                        style={{ backgroundColor: org.themeColor || '#6366f1' }}
                      >
                        {org.name}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 line-clamp-2 leading-snug">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-white/5 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      {task.dueDate}
                    </span>
                    {task.startTime && (
                      <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {task.startTime}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comprehensive Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search text */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={t('allTasks.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedOrgFilter !== 'all' || selectedStatusFilter !== 'all' || selectedPriorityFilter !== 'all' || selectedAssigneeFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white flex items-center gap-1 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('allTasks.resetFilters')}
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2 border-t border-neutral-100 dark:border-white/5">
          {/* Plan Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {t('allTasks.filterPlan')}
            </label>
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="all">{t('allTasks.allPlans')}</option>
              {organizations.map((org: Organization) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {t('allTasks.filterStatus')}
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="all">{t('dashboard.all')}</option>
              <option value="Todo">{t('dashboard.todo')}</option>
              <option value="In Progress">{t('dashboard.inProgress')}</option>
              <option value="Completed">{t('dashboard.completed')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {t('allTasks.filterPriority')}
            </label>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="all">{t('dashboard.all')}</option>
              <option value="Urgent">{t('dashboard.urgent')}</option>
              <option value="High">{t('dashboard.high')}</option>
              <option value="Medium">{t('dashboard.medium')}</option>
              <option value="Low">{t('dashboard.low')}</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {t('allTasks.filterAssignee')}
            </label>
            <select
              value={selectedAssigneeFilter}
              onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="all">{t('dashboard.all')}</option>
              <option value="me">👉 {t('allTasks.assignedToMe')}</option>
              {teamMembers.map((tm: TeamMember) => (
                <option key={tm.id} value={tm.id}>{tm.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              {t('dashboard.sortBy')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="dueDateAsc">{t('dashboard.earliestFirst')}</option>
              <option value="dueDateDesc">{t('dashboard.latestFirst')}</option>
              <option value="priority">{t('dashboard.highToLow')}</option>
              <option value="title">{t('modal.taskTitleLabel')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plan-Grouped Tasks List */}
      <div className="space-y-6">
        {tasksByPlan.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl space-y-2">
            <CheckSquare className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-200">
              {t('allTasks.noTasksFound')}
            </h3>
            <p className="text-xs text-neutral-400">
              {t('dashboard.noTasks')}
            </p>
          </div>
        ) : (
          tasksByPlan.map(({ org, tasks: planTasks }) => {
            const orgTheme = org?.themeColor || '#6366f1';
            return (
              <div 
                key={org?.id || 'unassigned-plan'} 
                className="rounded-3xl border border-neutral-200/70 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 overflow-hidden shadow-sm transition-all"
              >
                {/* Plan Group Header */}
                <div 
                  className="px-6 py-4 flex items-center justify-between border-b border-neutral-200/50 dark:border-white/10"
                  style={{ borderLeft: `6px solid ${orgTheme}` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: orgTheme }}
                    >
                      {org?.logo ? (
                        <img src={org.logo} alt="" className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          {org?.name || (isEl ? 'Γενικό / Ολόκληρος Χώρος' : 'General / Workspace Wide')}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                          {planTasks.length} {isEl ? (planTasks.length === 1 ? 'εργασία' : 'εργασίες') : (planTasks.length === 1 ? 'task' : 'tasks')}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {org?.type || (isEl ? 'Βασικό' : 'Standard')} {isEl ? 'Πλάνο' : 'Plan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tasks in this Plan */}
                <div className="divide-y divide-neutral-100 dark:divide-white/5">
                  {planTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 italic">
                      {t('allTasks.noTasksInPlan')}
                    </div>
                  ) : (
                    planTasks.map((task: Task) => {
                      const assignees = getAssigneeDetails(task);
                      const isCompleted = task.status === 'Completed';

                      return (
                        <div
                          key={task.id}
                          className="px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-50/70 dark:hover:bg-white/5 transition-colors group"
                        >
                          {/* Left: Checkbox + Title + Status */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleTaskComplete(task.id)}
                              className="shrink-0 cursor-pointer text-neutral-400 hover:text-emerald-500 transition-colors"
                              title={isCompleted ? (isEl ? "Σήμανση ως ενεργή" : "Mark active") : (isEl ? "Σήμανση ως ολοκληρωμένη" : "Mark complete")}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div 
                              onClick={() => setActiveTaskForModal(task)}
                              className="cursor-pointer flex-1 min-w-0"
                            >
                              <h4 className={`text-sm font-semibold truncate transition-colors ${
                                isCompleted 
                                  ? 'line-through text-neutral-400 dark:text-neutral-500' 
                                  : 'text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              }`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xl">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Meta columns (Assignees, Date, Time, Priority, Status badge) */}
                          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
                            {/* Assigned Persons */}
                            <div className="flex items-center gap-1">
                              {assignees.length === 0 ? (
                                <span className="text-[11px] text-neutral-400 italic">{isEl ? 'Χωρίς ανάθεση' : 'Unassigned'}</span>
                              ) : (
                                <div className="flex -space-x-2">
                                  {assignees.map((asgn) => (
                                    <span
                                      key={asgn.id}
                                      className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-xs"
                                      title={`${asgn.name} (${asgn.role})`}
                                    >
                                      {asgn.avatar}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Due Date */}
                            <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                              {task.dueDate}
                            </span>

                            {/* Time / All-Day */}
                            <div className="text-xs font-mono">
                              {task.startTime ? (
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 text-[11px]">
                                  {t('allTasks.allDay')}
                                </span>
                              )}
                            </div>

                            {/* Priority Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityBadgeClass(task.priority)}`}>
                              {tPriority(task.priority)}
                            </span>

                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              task.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : task.status === 'InProgress'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20'
                            }`}>
                              {tStatus(task.status)}
                            </span>

                            {/* Open Details Action */}
                            <button
                              type="button"
                              onClick={() => setActiveTaskForModal(task)}
                              className="p-1 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal for editing / viewing details */}
      {activeTaskForModal && (
        <TaskModal
          task={activeTaskForModal}
          onClose={() => setActiveTaskForModal(null)}
        />
      )}
    </div>
  );
};
