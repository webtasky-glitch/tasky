import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { Task, TaskPriority } from '../types';
import { TaskModal } from './TaskModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckSquare, 
  Tag, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ViewMode = 'Month' | 'Week' | 'Day';

export const CalendarView: React.FC = () => {
  const { tasks, categories, addTask, currentUserProfile } = useTasky() as any;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Selected task for detailing
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // Quick task adding state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  // Filter tasks to only those assigned to current user
  const myTasks = tasks.filter((t: any) => t.assignedTo === currentUserProfile?.id);

  // Date utilities
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate dates
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Month') {
      nextDate.setMonth(month - 1);
    } else if (viewMode === 'Week') {
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
    } else if (viewMode === 'Week') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Convert date object to YYYY-MM-DD
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Month Grid Calculation
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((daysInMonth + firstDayIndex) / 7) * 7;

  const calendarDays: { date: Date | null; isCurrentMonth: boolean }[] = [];

  // Populate preceding empty days or previous month's trailing days
  const prevMonthDaysCount = getDaysInMonth(year, month - 1);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthDaysCount - i);
    calendarDays.push({ date: prevDate, isCurrentMonth: false });
  }

  // Populate current month's days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    calendarDays.push({ date, isCurrentMonth: true });
  }

  // Populate remaining trailing days of next month
  const remainingCells = totalCells - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarDays.push({ date: nextDate, isCurrentMonth: false });
  }

  // Tasks mapped by date string for O(1) matching
  const tasksByDate = myTasks.reduce((acc, task) => {
    if (!acc[task.dueDate]) acc[task.dueDate] = [];
    acc[task.dueDate].push(task);
    return acc;
  }, {} as { [key: string]: Task[] });

  // Get tasks for a specific day
  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = formatDateString(date);
    return tasksByDate[dateStr] || [];
  };

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
      description: 'Quickly added via calendar view.',
      dueDate: selectedDateStr,
      priority: 'Medium',
      categoryId: categories[0]?.id || '',
      status: 'Todo',
      recurring: 'None',
      assignedTo: currentUserProfile?.id
    });

    setQuickTitle('');
    setShowQuickAdd(false);
    
    // Update selected list immediately
    setTimeout(() => {
      const updatedTasks = tasksByDate[selectedDateStr] || [];
      setSelectedDayTasks([...updatedTasks]);
    }, 100);
  };

  // Week Grid Calculation (Sunday to Saturday)
  const getWeekDays = (baseDate: Date) => {
    const startOfWeek = new Date(baseDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(currentDate);

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-neutral-400';
    }
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row gap-6 overflow-y-auto shadow-xl">
      
      {/* Calendar Area */}
      <div className="flex-1 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col select-none backdrop-blur-md">
        
        {/* Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight min-w-44">
              {viewMode === 'Month' ? `${monthNames[month]} ${year}` : viewMode === 'Week' ? `Week of ${weekDays[0].toLocaleDateString([], {month: 'short', day: 'numeric'})}` : currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-950">
              <button onClick={handlePrev} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleToday} className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                Today
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 border-l border-neutral-200 dark:border-neutral-800 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Toggles */}
          <div className="flex bg-white/15 dark:bg-black/20 p-1 rounded-xl border border-white/20 dark:border-white/5 w-fit self-end sm:self-auto">
            {(['Month', 'Week', 'Day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === mode 
                    ? 'bg-white/50 dark:bg-white/15 text-neutral-900 dark:text-white shadow-sm border border-white/40 dark:border-white/10' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Body Rendering */}
        {viewMode === 'Month' && (
          <div className="flex-1 flex flex-col min-h-[480px]">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-neutral-400 dark:text-neutral-500 text-xs py-2">
              {dayNames.map(day => <div key={day}>{day}</div>)}
            </div>

            {/* Monthly Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 mt-1">
              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const dayTasks = getTasksForDate(date);
                const hasTasks = dayTasks.length > 0;
                const isSelected = selectedDateStr && date && formatDateString(date) === selectedDateStr;
                const isToday = date && formatDateString(date) === formatDateString(new Date());

                return (
                  <div
                    key={idx}
                    onClick={() => date && handleDayClick(date)}
                    className={`min-h-[75px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-white/40 dark:bg-white/15 shadow-sm ring-1 ring-indigo-500'
                        : isToday
                        ? 'border-indigo-500 bg-white/25 dark:bg-white/10 ring-1 ring-indigo-500'
                        : isCurrentMonth 
                        ? 'border-white/25 dark:border-white/5 bg-white/10 dark:bg-white/5 hover:bg-white/25 dark:hover:bg-white/10'
                        : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/2 opacity-40 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${
                        isToday 
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold' 
                          : isCurrentMonth 
                          ? 'text-neutral-700 dark:text-neutral-300' 
                          : 'text-neutral-400'
                      }`}>
                        {date ? date.getDate() : ''}
                      </span>
                      {hasTasks && (
                        <span className="text-[9px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded-md">
                          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                    </div>

                    {/* Miniature horizontal list of tasks */}
                    <div className="mt-2 space-y-1 overflow-hidden max-h-12">
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} className="flex items-center gap-1 text-[9px] truncate text-neutral-600 dark:text-neutral-400 font-sans leading-tight">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityColor(t.priority)}`} />
                          <span className={`truncate ${t.status === 'Completed' ? 'line-through text-neutral-400' : ''}`}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[8px] font-bold text-indigo-500 font-mono">+{dayTasks.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'Week' && (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-7 gap-3 mt-4">
            {weekDays.map((date, idx) => {
              const dayTasks = getTasksForDate(date);
              const isToday = formatDateString(date) === formatDateString(new Date());
              const isSelected = selectedDateStr === formatDateString(date);

              return (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  className={`border rounded-xl p-3 flex flex-col cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-sm'
                      : isToday
                      ? 'border-indigo-200 bg-indigo-50/20 dark:bg-indigo-950/10 dark:border-indigo-900/50'
                      : 'border-neutral-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850/50'
                  }`}
                >
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2 text-center">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      {dayNames[date.getDay()]}
                    </p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {date.getDate()}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-72">
                    {dayTasks.map(t => (
                      <div 
                        key={t.id} 
                        className={`p-2 rounded-lg border text-left text-xs ${
                          t.status === 'Completed' 
                            ? 'border-neutral-100 bg-neutral-50 dark:border-neutral-900 opacity-60' 
                            : 'border-neutral-150 bg-neutral-50 dark:border-neutral-800'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(t.priority)}`} />
                          <span className="text-[9px] font-bold text-neutral-400 font-mono uppercase tracking-wider">{t.priority}</span>
                        </div>
                        <p className={`font-semibold text-neutral-800 dark:text-neutral-200 truncate ${t.status === 'Completed' ? 'line-through text-neutral-400' : ''}`}>
                          {t.title}
                        </p>
                      </div>
                    ))}
                    {dayTasks.length === 0 && (
                      <p className="text-[10px] text-neutral-400 italic text-center pt-4">No tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'Day' && (
          <div className="flex-1 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-850/60 rounded-xl p-5 mt-4 text-center">
            <div className="max-w-md mx-auto text-left space-y-4">
              <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">Detailed Agenda</span>
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mt-1">
                  {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2">
                {getTasksForDate(currentDate).map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedTask(t)}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(t.priority)}`} />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">{t.priority}</span>
                      </div>
                      <h4 className={`text-sm font-semibold text-neutral-800 dark:text-neutral-100 mt-1 ${t.status === 'Completed' ? 'line-through text-neutral-400' : ''}`}>
                        {t.title}
                      </h4>
                      {t.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{t.description}</p>}
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      t.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : t.status === 'InProgress' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}

                {getTasksForDate(currentDate).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-neutral-500 italic">No assignments scheduled for today.</p>
                    <button 
                      onClick={() => {
                        setSelectedDateStr(formatDateString(currentDate));
                        setShowQuickAdd(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Details Drawer (Right Side) */}
      <div className="w-full md:w-80 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between shrink-0 select-none backdrop-blur-md">
        <div>
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3.5 mb-4">
            <h3 className="font-sans font-bold text-sm text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Schedule Details
            </h3>
            {selectedDateStr && (
              <button 
                onClick={() => setShowQuickAdd(true)}
                className="p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded text-indigo-600 dark:text-indigo-400 cursor-pointer"
                title="Add task for this day"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected Date Header */}
          {selectedDateStr ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Selected Date</p>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Quick Add Form inside panel */}
              {showQuickAdd && (
                <form onSubmit={handleQuickAddSubmit} className="bg-white/20 dark:bg-white/5 p-3 rounded-xl border border-white/25 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-150/25 dark:border-white/5 pb-1">
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Quick Assignment</span>
                    <button type="button" onClick={() => setShowQuickAdd(false)} className="text-[10px] text-neutral-400 hover:text-neutral-600">Close</button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Assignment title..."
                    required
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full text-xs glass-input rounded-xl px-2.5 py-2 focus:outline-none text-neutral-800 dark:text-white"
                  />
                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Schedule Assignment
                  </button>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {(selectedDayTasks || []).map((t) => {
                  const category = categories.find(c => c.id === t.categoryId);
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTask(t)}
                      className="group p-3 border border-white/20 dark:border-white/5 bg-white/10 dark:bg-white/2 hover:bg-white/30 dark:hover:bg-white/10 rounded-xl text-xs transition-colors cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {category && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border leading-none font-medium truncate max-w-[100px] ${category.color}`}>
                            {category.name}
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(t.priority)}`} />
                      </div>
                      <h4 className={`font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate ${t.status === 'Completed' ? 'line-through text-neutral-400' : ''}`}>
                        {t.title}
                      </h4>
                      {t.description && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{t.description}</p>}
                    </div>
                  );
                })}

                {(selectedDayTasks || []).length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs text-neutral-400 italic">No tasks scheduled for this day.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xs text-neutral-400 italic">Click on any calendar day cell to view or schedule assignments.</p>
            </div>
          )}
        </div>

        {/* Sync alert banner */}
        <div className="bg-white/10 dark:bg-black/20 p-3 rounded-xl border border-white/20 dark:border-white/5 text-[10px] text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
          ⚡ <b>Smart Scheduler:</b> Changing deadlines inside Tasky updates your synchronized schedules across all connected browser spaces instantly.
        </div>
      </div>

      {/* Selected Task Details Popup */}
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
