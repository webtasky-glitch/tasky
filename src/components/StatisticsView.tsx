import React from 'react';
import { useTasky } from '../TaskyContext';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Award, 
  Flag,
  Tag,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export const StatisticsView: React.FC = () => {
  const { tasks: allTasks, categories, habits: allHabits, currentUserProfile } = useTasky() as any;

  // Filter to user-specific data
  const tasks = allTasks.filter((t: any) => t.assignedTo === currentUserProfile?.id);
  const habits = allHabits.filter((h: any) => h.userId === currentUserProfile?.id);

  // Basic task stats
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasksCount = totalTasks - completedTasksCount;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Priority distribution
  const urgentCount = tasks.filter(t => t.priority === 'Urgent').length;
  const highCount = tasks.filter(t => t.priority === 'High').length;
  const mediumCount = tasks.filter(t => t.priority === 'Medium').length;
  const lowCount = tasks.filter(t => t.priority === 'Low').length;
  const maxPriorityCount = Math.max(urgentCount, highCount, mediumCount, lowCount, 1);

  // Category task count
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.categoryId === cat.id);
    const completed = catTasks.filter(t => t.status === 'Completed').length;
    const total = catTasks.length;
    return {
      name: cat.name,
      color: cat.color,
      total,
      completed,
      pending: total - completed,
      rate: total > 0 ? Math.round((completed / total) * 150) : 0 // max length indicator
    };
  });

  // Calculate last 7 days for completion trends
  const getPast7DaysLabel = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        str: d.toISOString().split('T')[0],
        label: d.toLocaleDateString([], { weekday: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const past7Days = getPast7DaysLabel();

  // Count completions on each past day
  const dailyCompletions = past7Days.map(day => {
    const count = tasks.filter(t => {
      if (t.status !== 'Completed' || !t.completedAt) return false;
      const compDate = t.completedAt.split('T')[0];
      return compDate === day.str;
    }).length;
    return {
      label: day.label,
      count
    };
  });

  const maxDailyCompletions = Math.max(...dailyCompletions.map(d => d.count), 1);

  // Habit completion ratios
  const habitCompletionRate = habits.length > 0 
    ? Math.round((habits.reduce((acc, h) => acc + h.streak, 0) / (habits.length * 10)) * 100)
    : 0;

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 space-y-6 overflow-y-auto shadow-xl">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
          Productivity Statistics
        </h1>
        <p className="text-sm text-neutral-500">
          In-depth reports, completion percentages, subject metrics, and task historic trends.
        </p>
      </div>

      {/* Grid Row 1: Core Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ring Gauge Completion Card */}
        <div className="glass-card border border-white/25 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center backdrop-blur-md">
          <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 text-sm mb-4 self-start flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-indigo-500" />
            Overall Completion Rate
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="72" cy="72" r="60" 
                className="stroke-white/20 dark:stroke-white/10 fill-none"
                strokeWidth="12"
              />
              <motion.circle 
                cx="72" cy="72" r="60" 
                className="stroke-indigo-500 fill-none"
                strokeWidth="12"
                strokeDasharray={377}
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 377 - (377 * completionRate) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-bold font-sans text-neutral-800 dark:text-white">{completionRate}%</span>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wider uppercase mt-0.5">Tasks Done</p>
            </div>
          </div>

          <div className="flex gap-6 mt-5 text-xs text-neutral-500 border-t border-neutral-200/20 dark:border-white/5 pt-4 w-full justify-around font-mono">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Completed</p>
              <p className="text-sm font-bold text-emerald-500">{completedTasksCount} assignments</p>
            </div>
            <div className="border-r border-neutral-200/20 dark:border-white/5" />
            <div>
              <p className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Pending</p>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{pendingTasksCount} assignments</p>
            </div>
          </div>
        </div>

        {/* Priority Distributions Card */}
        <div className="glass-card border border-white/25 dark:border-white/5 rounded-2xl p-6 shadow-sm backdrop-blur-md">
          <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 text-sm mb-4 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-orange-500" />
            Assignments by Priority
          </h3>

          <div className="space-y-4 pt-1">
            {/* Urgent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-500 flex items-center gap-1">● Urgent</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-mono">{urgentCount} tasks</span>
              </div>
              <div className="w-full bg-white/20 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-rose-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(urgentCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-orange-500 flex items-center gap-1">● High</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-mono">{highCount} tasks</span>
              </div>
              <div className="w-full bg-white/20 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-orange-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(highCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-500 flex items-center gap-1">● Medium</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-mono">{mediumCount} tasks</span>
              </div>
              <div className="w-full bg-white/20 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-amber-500 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(mediumCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-500 flex items-center gap-1">● Low</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-mono">{lowCount} tasks</span>
              </div>
              <div className="w-full bg-white/20 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-neutral-400 h-full rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(lowCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Completion Trend Card */}
        <div className="glass-card border border-white/25 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between backdrop-blur-md">
          <div>
            <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 text-sm mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              7-Day Completion Trend
            </h3>
            
            {/* Simple Dynamic SVG Bar Graph */}
            <div className="flex items-end justify-between h-28 pt-2">
              {dailyCompletions.map((day, idx) => {
                const heightPercent = Math.max((day.count / maxDailyCompletions) * 100, 5);
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 gap-1.5 group">
                    <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div className="w-6 bg-white/20 dark:bg-white/10 rounded-md h-24 flex items-end overflow-hidden relative">
                      <motion.div 
                        className="bg-indigo-500 rounded-md w-full"
                        style={{ height: `${heightPercent}%` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate max-w-10 text-center select-none leading-none">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 italic text-center mt-4">
            Highlights assignment completion volumes over the preceding week.
          </p>
        </div>
      </div>

      {/* Grid Row 2: Subject/Category Wise Distribution & Routine Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subject-Wise Report Card */}
        <div className="glass-card border border-white/25 dark:border-white/5 rounded-2xl p-6 shadow-sm backdrop-blur-md">
          <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 text-sm mb-4 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-500" />
            Subject & Category Breakdown
          </h3>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {categoryStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-850 dark:text-neutral-200 truncate pr-4">{stat.name}</span>
                  <span className="font-mono text-neutral-500 dark:text-neutral-400 font-semibold">
                    {stat.completed} completed / {stat.total} total
                  </span>
                </div>
                
                <div className="relative w-full bg-white/20 dark:bg-white/10 h-4 rounded-full overflow-hidden flex items-center border border-white/25 dark:border-white/5">
                  <motion.div 
                    className="bg-indigo-500 h-full rounded-l-full"
                    style={{ width: stat.total > 0 ? `${(stat.completed / stat.total) * 100}%` : '0%' }}
                    initial={{ width: 0 }}
                    animate={{ width: stat.total > 0 ? `${(stat.completed / stat.total) * 100}%` : '0%' }}
                  />
                  {stat.total === 0 && (
                    <span className="absolute left-3 text-[9px] text-neutral-500 dark:text-neutral-400 italic">No assignments active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals & Habits consistency report */}
        <div className="glass-card border border-white/25 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between backdrop-blur-md">
          <div>
            <h3 className="font-semibold text-neutral-850 dark:text-neutral-100 text-sm mb-4 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-indigo-500" />
              Goals & Habits Consistency Index
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
              <div className="relative w-28 h-28 flex items-center justify-center bg-white/20 dark:bg-white/10 rounded-full shrink-0 border border-white/30">
                <Award className="w-12 h-12 text-indigo-500" />
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-neutral-850 dark:text-neutral-200">How consistent are you?</h4>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Your goals and habits consistency score is <b>{habitCompletionRate}%</b>, derived from the streak indices of active tracked habits. Building consecutive daily completions enhances this productivity index.
                </p>
                <div className="flex gap-2 pt-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                  <span className="bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded">
                    🔥 Total Streaks: {habits.reduce((acc, h) => acc + h.streak, 0)} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 dark:bg-black/20 p-3 rounded-xl border border-white/20 dark:border-white/5 flex items-center gap-2.5 text-[10px] text-neutral-600 dark:text-neutral-400 leading-normal">
            <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Statistics are computed locally and sync instantly across spaces when your backup synchronization is active.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
