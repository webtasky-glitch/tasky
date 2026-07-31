import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { Habit } from '../types';
import { 
  Flame, 
  Check, 
  Plus, 
  Trash2, 
  Award, 
  Sparkles, 
  X,
  Target,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HabitsView: React.FC = () => {
  const { habits: allHabits, addHabit, toggleHabitDate, deleteHabit, currentUserProfile } = useTasky() as any;
  const habits = allHabits.filter((h: any) => h.userId === currentUserProfile?.id);

  const [showAddForm, setShowAddForm] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly'>('Daily');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Calculate the last 7 dates dynamically (including today)
  const getLast7Days = () => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const last7Days = getLast7Days();

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayLetter = (date: Date) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[date.getDay()];
  };

  const getDayFormatted = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    addHabit(habitName.trim(), frequency);
    setHabitName('');
    setShowAddForm(false);
  };

  // Streaks statistics
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const activeHabitsCount = habits.length;
  const completedTodayCount = habits.filter(h => h.completedDates.includes(formatDateString(new Date()))).length;

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 space-y-6 overflow-y-auto shadow-xl">
      
      {/* Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
            Goals & Habit Tracker
          </h1>
          <p className="text-sm text-neutral-500">
            Build consistent routines, monitor streaks, and establish healthy work-life patterns.
          </p>
        </div>

        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      {/* Overview Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="glass-card border border-white/25 dark:border-white/5 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-mono">Active Goals</p>
            <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{activeHabitsCount}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card border border-white/25 dark:border-white/5 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-mono">Best Streak</p>
            <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{maxStreak} Days</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card border border-white/25 dark:border-white/5 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-mono">Completed Today</p>
            <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
              {completedTodayCount} of {activeHabitsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-5 rounded-[24px] max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-800 dark:text-white text-sm">Create New Routine Goal</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-white/25 dark:hover:bg-white/10 rounded-lg text-neutral-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Goal / Habit Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Code for 30 minutes"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFrequency('Daily')}
                      className={`text-xs py-2 border rounded-xl font-medium text-center cursor-pointer transition-all ${frequency === 'Daily' ? 'border-white/50 dark:border-white/15 bg-white/40 dark:bg-white/15 text-indigo-700 dark:text-indigo-400' : 'border-white/20 dark:border-white/5 bg-transparent hover:bg-white/20 text-neutral-500 dark:text-neutral-400'}`}
                    >
                      Daily Routine
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('Weekly')}
                      className={`text-xs py-2 border rounded-xl font-medium text-center cursor-pointer transition-all ${frequency === 'Weekly' ? 'border-white/50 dark:border-white/15 bg-white/40 dark:bg-white/15 text-indigo-700 dark:text-indigo-400' : 'border-white/20 dark:border-white/5 bg-transparent hover:bg-white/20 text-neutral-500 dark:text-neutral-400'}`}
                    >
                      Weekly Checkin
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Start Tracking Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habits Checklist Grid */}
      <div className="bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 pb-3 border-b border-neutral-200/20 dark:border-white/5">
          <Award className="w-4.5 h-4.5 text-indigo-600" />
          Weekly Routine Progress Grid
        </h2>

        {habits.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {habits.map((habit) => (
              <div 
                key={habit.id} 
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                {/* Info and Streak */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {habit.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-mono font-medium">
                      {habit.frequency}
                    </span>
                  </div>
                  
                  {/* Streak counter */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400 text-xs font-semibold">
                      <Flame className={`w-4.5 h-4.5 ${habit.streak > 0 ? 'fill-current text-amber-500 animate-bounce' : 'text-neutral-400'}`} />
                      <span>{habit.streak} day streak</span>
                    </div>
                    {habit.streak >= 5 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-3 h-3" />
                        Unstoppable!
                      </span>
                    )}
                  </div>
                </div>

                {/* Last 7 Days completion checkoff dots */}
                <div className="flex items-center gap-3 self-center">
                  <div className="flex items-center gap-2">
                    {last7Days.map((day, dIdx) => {
                      const dateStr = formatDateString(day);
                      const isCompleted = habit.completedDates.includes(dateStr);
                      const isToday = dIdx === 6;

                      return (
                        <button
                          key={dIdx}
                          onClick={() => toggleHabitDate(habit.id, dateStr)}
                          title={`${getDayFormatted(day)}: ${isCompleted ? 'Completed' : 'Pending'}`}
                          className={`w-9 h-9 rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                            isCompleted 
                              ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 shadow-sm shadow-emerald-500/10' 
                              : isToday
                              ? 'bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/15 hover:border-indigo-400 text-neutral-700 dark:text-neutral-300 ring-1 ring-white/10'
                              : 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/5 hover:border-indigo-400 text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-[8px] font-bold uppercase select-none opacity-60 leading-none">{getDayLetter(day)}</span>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 mt-0.5" />
                          ) : (
                            <span className="text-[9px] font-bold font-mono mt-0.5">{day.getDate()}</span>
                          )}

                          {/* Hover tooltip */}
                          <span className="absolute bottom-full mb-1 bg-neutral-900 text-white text-[9px] font-mono rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                            {getDayFormatted(day)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete Habit button */}
                  {confirmDeleteId === habit.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-2 py-1 rounded-xl shrink-0">
                      <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300">Delete?</span>
                      <button 
                        onClick={() => {
                          deleteHabit(habit.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(habit.id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/30 dark:border-white/10 rounded-2xl bg-white/5 dark:bg-white/2">
            <p className="text-sm text-neutral-500 italic">No habit goals started yet. Create a goal to build positive momentum!</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Start Your First Habit
            </button>
          </div>
        )}
      </div>

      {/* Streaks & Habits Explanation */}
      <div className="bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/5 p-4 rounded-xl text-xs text-neutral-500 leading-relaxed font-sans space-y-1.5">
        <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">How streaks are tracked:</h4>
        <p>A streak is updated whenever you complete a goal on consecutive days. Toggling dates on or off will recalculate streaks automatically. Missing a day resets the streak counter to zero, emphasizing daily focus and long-term consistency.</p>
      </div>
    </div>
  );
};
