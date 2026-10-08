import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { 
  X, 
  Zap, 
  Plus, 
  Clock, 
  Calendar, 
  Sparkles, 
  AlertTriangle,
  User,
  Layers,
  FileText,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskPriority } from '../types';

export const QuickTaskModal: React.FC = () => {
  const {
    isQuickTaskOpen,
    setIsQuickTaskOpen,
    categories,
    addCategory,
    addTask,
    currentUserProfile,
    teamMembers,
    language
  } = useTasky() as any;

  const { t } = useTranslation();
  const isEl = language === 'el';

  // Form fields
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  
  const getTodayString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [dueDate, setDueDate] = useState(() => getTodayString());
  const [assignees, setAssignees] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState('1.5');
  const [focusBlock, setFocusBlock] = useState<'MorningFocus' | 'AfternoonDeep' | 'QuickAdmin' | 'EveningReview'>('MorningFocus');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Set default category on mount/load
  const [categoryId, setCategoryId] = useState('');
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickTaskOpen) {
        setIsQuickTaskOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickTaskOpen, setIsQuickTaskOpen]);

  // Reset fields when opening/closing
  useEffect(() => {
    if (isQuickTaskOpen) {
      setTitle('');
      setDesc('');
      setSubjectName('');
      setDueDate(getTodayString());
      setPriority('Medium');
      setAssignees([]);
      setEstimatedHours('1.5');
      setFocusBlock('MorningFocus');
      setShowAssigneeDropdown(false);
    }
  }, [isQuickTaskOpen]);

  const setDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${y}-${m}-${day}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let resolvedCategoryId = '';
      const cleanSubject = subjectName.trim();
      
      if (cleanSubject) {
        const existingCat = categories.find(
          (c: any) => c.name.toLowerCase() === cleanSubject.toLowerCase()
        );
        if (existingCat) {
          resolvedCategoryId = existingCat.id;
        } else {
          try {
            resolvedCategoryId = await addCategory(cleanSubject, '#6366f1', 'Subject');
          } catch (err) {
            console.error("Failed to auto-create category in Quick Task:", err);
            resolvedCategoryId = categories[0]?.id || '';
          }
        }
      } else if (categoryId) {
        resolvedCategoryId = categoryId;
      } else {
        resolvedCategoryId = categories[0]?.id || '';
      }

      await addTask({
        title: title.trim(),
        description: desc.trim(),
        dueDate: dueDate || getTodayString(),
        priority,
        categoryId: resolvedCategoryId,
        status: 'Todo',
        recurring: 'None',
        assignedTo: assignees[0] || currentUserProfile?.id,
        assignedToIds: assignees.length > 0 ? assignees : (currentUserProfile?.id ? [currentUserProfile.id] : []),
        createdBy: currentUserProfile?.id,
        orgId: currentUserProfile?.orgId || undefined,
        focusBlock,
        estimatedHours: parseFloat(estimatedHours) || 1.5,
        attachments: []
      });

      setIsQuickTaskOpen(false);
    } catch (err) {
      console.error("Failed to quick create task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (id: string) => {
    if (assignees.includes(id)) {
      setAssignees(prev => prev.filter(item => item !== id));
    } else {
      setAssignees(prev => [...prev, id]);
    }
  };

  if (!isQuickTaskOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsQuickTaskOpen(false);
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel w-full max-w-lg shadow-2xl rounded-3xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 overflow-hidden flex flex-col backdrop-blur-xl text-neutral-800 dark:text-neutral-100 font-sans"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>{isEl ? 'Γρήγορη Δημιουργία Εργασίας' : 'Quick Create Task'}</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                    ⚡ {isEl ? 'Άμεσα' : 'In-Place'}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
                  {isEl ? 'Προσθέστε στον χώρο εργασίας σας από οποιαδήποτε σελίδα' : 'Add to your workspace instantly from any view'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQuickTaskOpen(false)}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={isEl ? 'Κλείσιμο (Esc)' : 'Close (Esc)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>{isEl ? 'Τίτλος Εργασίας' : 'Task Title'} <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-neutral-400 font-normal">{isEl ? 'Πατήστε Enter για αποθήκευση' : 'Press Enter to save'}</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder={isEl ? 'π.χ. Ολοκλήρωση αναφοράς έργου' : 'e.g., Finalize project report or Review pull request'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm font-medium glass-input rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
              />
            </div>

            {/* Category & Due Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{isEl ? 'Κατηγορία / Θέμα' : 'Category / Subject'}</span>
                </label>
                <input
                  type="text"
                  placeholder={isEl ? 'π.χ. Εργασία, Διοίκηση, Σχεδιασμός' : 'e.g. Work, Admin, Design'}
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  list="quick-category-suggestions-global"
                  className="w-full text-xs font-medium glass-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                />
                <datalist id="quick-category-suggestions-global">
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Due Date & Quick Offset Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{t('dashboard.dueDate') || (isEl ? 'Ημερομηνία' : 'Due Date')}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDateOffset(0)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        dueDate === getTodayString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {t('timeline.today') || (isEl ? 'Σήμερα' : 'Today')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateOffset(1)}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      +1{isEl ? 'ημ' : 'd'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateOffset(7)}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      +1{isEl ? 'εβδ' : 'w'}
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium glass-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                />
              </div>
            </div>

            {/* Priority & Estimate row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Priority Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isEl ? 'Επίπεδο Προτεραιότητας' : 'Priority Level'}
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 dark:bg-black/25 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {(['Low', 'Medium', 'High', 'Urgent'] as TaskPriority[]).map((p) => {
                    const isSelected = priority === p;
                    let activeStyles = 'bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white shadow-xs';
                    if (isSelected) {
                      if (p === 'Low') activeStyles = 'bg-sky-500 text-white font-bold';
                      if (p === 'Medium') activeStyles = 'bg-indigo-500 text-white font-bold';
                      if (p === 'High') activeStyles = 'bg-amber-500 text-white font-bold';
                      if (p === 'Urgent') activeStyles = 'bg-rose-500 text-white font-bold';
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`text-[10px] py-1.5 rounded-lg text-center font-medium cursor-pointer transition-all ${
                          isSelected 
                            ? activeStyles 
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        {p === 'Low' && (isEl ? 'Χαμηλή' : 'Low')}
                        {p === 'Medium' && (isEl ? 'Μέτρια' : 'Medium')}
                        {p === 'High' && (isEl ? 'Υψηλή' : 'High')}
                        {p === 'Urgent' && (isEl ? 'Επείγον' : 'Urgent')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workload Estimate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>{isEl ? 'Εκτιμώμενες Ώρες' : 'Est. Hours'}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{estimatedHours} {isEl ? 'ώρες' : 'hrs'}</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full text-xs font-medium glass-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                />
              </div>
            </div>

            {/* Team/Assignee Multi-Selector & Focus Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Assign To */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{isEl ? 'Ανάθεση σε' : 'Assign To'}</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded-full">
                    {assignees.length} {isEl ? 'επιλέχθηκαν' : 'selected'}
                  </span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full text-xs text-left font-medium glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20 flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">
                    {assignees.length === 0 
                      ? (isEl ? 'Ανάθεση σε μέλη...' : 'Assign plan members...')
                      : assignees.map(id => teamMembers.find((m: any) => m.id === id)?.name).filter(Boolean).join(', ')
                    }
                  </span>
                  <span className="text-[10px] text-neutral-400">▼</span>
                </button>

                {showAssigneeDropdown && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 z-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-2 max-h-40 overflow-y-auto space-y-1">
                    {teamMembers.map((member: any) => {
                      const isChecked = assignees.includes(member.id);
                      return (
                        <label 
                          key={member.id} 
                          className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-lg text-xs cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssignee(member.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{member.name} ({member.role})</span>
                        </label>
                      );
                    })}
                    {teamMembers.length === 0 && (
                      <p className="text-[10px] text-neutral-400 text-center py-2">
                        {isEl ? 'Δεν βρέθηκαν μέλη στο πλάνο σας' : 'No plan members found'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Focus Block */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{isEl ? 'Ζώνη Εστίασης' : 'Focus Block'}</span>
                </label>
                <select
                  value={focusBlock}
                  onChange={(e: any) => setFocusBlock(e.target.value)}
                  className="w-full text-xs font-medium glass-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20"
                >
                  <option value="MorningFocus">{isEl ? '🌅 Πρωινή Εστίαση (Morning)' : '🌅 Morning Focus'}</option>
                  <option value="AfternoonDeep">{isEl ? '💻 Απογευματινή Εργασία (Afternoon)' : '💻 Afternoon Deep Work'}</option>
                  <option value="QuickAdmin">{isEl ? '⚡ Γρήγορη Διαχείριση (Quick Admin)' : '⚡ Quick Admin'}</option>
                  <option value="EveningReview">{isEl ? '🌙 Βραδινή Ανασκόπηση (Evening)' : '🌙 Evening Review'}</option>
                </select>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>{isEl ? 'Σύντομη Περιγραφή / Σημειώσεις (Προαιρετικό)' : 'Short Description / Notes (Optional)'}</span>
              </label>
              <textarea
                rows={2}
                placeholder={isEl ? 'Σύντομες σημειώσεις, σύνδεσμος ή πλαίσιο...' : 'Brief notes, link, or context...'}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full text-xs font-medium glass-input rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsQuickTaskOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel') || (isEl ? 'Ακύρωση' : 'Cancel')}
              </button>
              
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isEl ? 'Δημιουργία...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEl ? 'Δημιουργία Εργασίας' : 'Create Task'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
