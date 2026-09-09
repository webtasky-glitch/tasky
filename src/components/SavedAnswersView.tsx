import React, { useState, useMemo } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { AiSupportQA } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Bot, 
  HelpCircle, 
  Tag, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  BarChart2,
  X,
  Play,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface SavedAnswersViewProps {
  onClose?: () => void;
  onSelectAnswerToInsert?: (answerText: string) => void;
}

export const SavedAnswersView: React.FC<SavedAnswersViewProps> = ({ 
  onClose,
  onSelectAnswerToInsert 
}) => {
  const { 
    aiSupportQA, 
    addOrUpdateAiSupportQA, 
    deleteAiSupportQA, 
    testAiResponse,
    currentUserProfile 
  } = useTasky() as any;

  const { t, language } = useTranslation();
  const isEl = language === 'el';

  const defaultCategories = [
    { id: 'All', label: isEl ? 'Όλα' : 'All' },
    { id: 'General', label: isEl ? 'Γενικά' : 'General' },
    { id: 'Tasks & Workflows', label: isEl ? 'Εργασίες & Ροές' : 'Tasks & Workflows' },
    { id: 'Projects', label: isEl ? 'Έργα' : 'Projects' },
    { id: 'Plans & Teams', label: isEl ? 'Πλάνα & Ομάδες' : 'Plans & Teams' },
    { id: 'Account & Auth', label: isEl ? 'Λογαριασμός & Σύνδεση' : 'Account & Auth' },
    { id: 'Technical Help', label: isEl ? 'Τεχνική Βοήθεια' : 'Technical Help' }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQA, setEditingQA] = useState<AiSupportQA | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formError, setFormError] = useState('');

  // Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simQuery, setSimQuery] = useState('');
  const [simResult, setSimResult] = useState<{ match: AiSupportQA | null; score: number } | null>(null);

  // Filtered & Sorted QA List
  const filteredQAs = useMemo(() => {
    return (aiSupportQA || []).filter((qa: AiSupportQA) => {
      const matchesCategory = selectedCategory === 'All' || (qa.category || 'General') === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchQuestion = qa.question.toLowerCase().includes(q);
      const matchAnswer = qa.answer.toLowerCase().includes(q);
      const matchKeywords = qa.keywords?.some(k => k.toLowerCase().includes(q)) ?? false;
      const matchCat = (qa.category || '').toLowerCase().includes(q);

      return matchQuestion || matchAnswer || matchKeywords || matchCat;
    }).sort((a: AiSupportQA, b: AiSupportQA) => {
      // Sort by usageCount descending, then createdAt
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
  }, [aiSupportQA, selectedCategory, searchQuery]);

  const totalUsages = useMemo(() => {
    return (aiSupportQA || []).reduce((acc: number, item: AiSupportQA) => acc + (item.usageCount || 0), 0);
  }, [aiSupportQA]);

  const handleOpenCreateModal = (prefill?: { question?: string; answer?: string; category?: string }) => {
    setEditingQA(null);
    setFormQuestion(prefill?.question || '');
    setFormAnswer(prefill?.answer || '');
    setFormKeywords('');
    setFormCategory(prefill?.category || 'General');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (qa: AiSupportQA) => {
    setEditingQA(qa);
    setFormQuestion(qa.question);
    setFormAnswer(qa.answer);
    setFormKeywords((qa.keywords || []).join(', '));
    setFormCategory(qa.category || 'General');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setFormError(isEl ? 'Παρακαλούμε εισάγετε ερώτηση και απάντηση.' : 'Please provide both a trigger question and the answer text.');
      return;
    }

    const keywordArray = formKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      await addOrUpdateAiSupportQA({
        id: editingQA?.id,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        keywords: keywordArray,
        category: formCategory
      });
      setIsModalOpen(false);
      setEditingQA(null);
    } catch (err) {
      console.error(err);
      setFormError(isEl ? 'Αποτυχία αποθήκευσης. Δοκιμάστε ξανά.' : 'Failed to save auto-reply answer. Please try again.');
    }
  };

  const handleDeleteQA = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isEl ? 'Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτήν την αυτόματη απάντηση; Το AI δεν θα τη χρησιμοποιεί πλέον.' : 'Are you sure you want to delete this auto-reply? The AI will no longer use this answer.')) {
      await deleteAiSupportQA(id);
    }
  };

  const handleCopyAnswer = (qa: AiSupportQA, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(qa.answer);
    setCopiedId(qa.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunSimulator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;
    const res = testAiResponse(simQuery);
    setSimResult(res);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white/40 dark:bg-black/20 overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-4 sm:p-6 border-b border-neutral-200/20 dark:border-white/5 bg-white/40 dark:bg-black/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>{isEl ? 'Αποθηκευμένες Απαντήσεις & Auto-Replies' : 'Saved Answers & Auto-Replies'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  {aiSupportQA?.length || 0} {isEl ? 'ενεργές' : 'active'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                {isEl ? 'Αυτοματοποιημένη βάση γνώσεων για άμεσες απαντήσεις 24/7 από το AI.' : 'Automated knowledge base for instant 24/7 AI answers.'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="toggle-simulator-btn"
            onClick={() => setShowSimulator(!showSimulator)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showSimulator 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                : 'bg-white/50 dark:bg-white/5 border-neutral-200/40 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showSimulator ? (isEl ? 'Κλείσιμο Δοκιμής' : 'Close Test') : (isEl ? 'Δοκιμή AI' : 'Test AI')}</span>
          </button>

          <button
            id="add-saved-answer-btn"
            onClick={() => handleOpenCreateModal()}
            className="px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEl ? 'Νέα Απάντηση' : 'New Reply'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-white/20 transition-all cursor-pointer"
              title={isEl ? 'Πίσω στη Συνομιλία' : 'Back to Chat'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Simulator Sandbox Bar */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-5 overflow-hidden"
          >
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isEl ? 'Προσομοιωτής Αυτόματων Απαντήσεων AI' : 'Live AI Auto-Response Simulator'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isEl ? 'Πληκτρολογήστε τι μπορεί να ρωτήσει ένας χρήστης' : 'Type what a user might ask to see which auto-reply triggers'}
                </span>
              </div>

              <form onSubmit={handleRunSimulator} className="flex gap-2">
                <input
                  type="text"
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  placeholder={isEl ? 'π.χ. Πώς αλλάζω κωδικό; ή η εφαρμογή καθυστερεί' : 'e.g. How do I change my password? or app is lagging'}
                  className="flex-1 text-xs glass-input rounded-xl px-4 py-2.5 focus:outline-none text-neutral-800 dark:text-white bg-white/70 dark:bg-black/40 border border-amber-500/30"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isEl ? 'Έλεγχος' : 'Test Match'}
                </button>
              </form>

              {simResult && (
                <div className="p-3.5 rounded-xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-neutral-200/40 dark:border-white/10 space-y-1.5">
                  {simResult.match ? (
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isEl ? 'Αντιστοιχισμένη Απάντηση:' : 'Matched Auto-Reply:'} "{simResult.match.question}"
                        </span>
                        <span className="font-mono text-neutral-400 text-[10px]">
                          {isEl ? 'Βεβαιότητα:' : 'Confidence:'} {Math.round(simResult.score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 mt-1 bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-lg">
                        {simResult.match.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-rose-500 dark:text-rose-400">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {isEl ? 'Δεν βρέθηκε αντιστοίχιση. Ο χρήστης θα προωθηθεί στην υποστήριξη διαχειριστή.' : 'No matching auto-reply found. The user will be routed directly to the Admin support ticket.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal({ question: simQuery })}
                        className="text-[11px] underline font-bold hover:text-rose-600 cursor-pointer"
                      >
                        {isEl ? '+ Δημιουργία κανόνα γι\' αυτή την ερώτηση' : '+ Create rule for this question'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar: Search & Category Filter */}
      <div className="p-4 border-b border-neutral-200/20 dark:border-white/5 bg-white/20 dark:bg-black/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEl ? 'Αναζήτηση ερωτήσεων, λέξεων-κλειδιών ή απαντήσεων...' : 'Search questions, keywords, or answers...'}
            className="w-full text-xs glass-input rounded-xl pl-9 pr-4 py-2 focus:outline-none text-neutral-800 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {defaultCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List / Grid of Saved Answers */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredQAs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
              {searchQuery 
                ? (isEl ? 'Δεν βρέθηκαν αυτόματες απαντήσεις' : 'No matching auto-replies found') 
                : (isEl ? 'Δεν υπάρχουν αποθηκευμένες απαντήσεις' : 'No Saved Answers Yet')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
              {searchQuery 
                ? (isEl ? 'Δοκιμάστε διαφορετική αναζήτηση ή καθαρίστε τα φίλτρα.' : 'Try a different search query or clear filters to view all answers.') 
                : (isEl ? 'Δημιουργήστε την πρώτη σας αυτοματοποιημένη απάντηση για να εξοικονομήσετε χρόνο.' : 'Create your first automated response to save time and give instant 24/7 technical answers to users.')}
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer mt-2"
            >
              {isEl ? '+ Πρώτη Αυτόματη Απάντηση' : '+ Create First Auto-Reply'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQAs.map((qa: AiSupportQA) => (
              <motion.div
                key={qa.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative p-5 rounded-2xl border border-neutral-200/40 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Category Badge & Usage Stats */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {qa.category || (isEl ? 'Γενικά' : 'General')}
                    </span>
                    
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1" title={isEl ? 'Φορές που απαντήθηκε αυτόματα' : 'Number of times automatically answered'}>
                        <Zap className="w-3 h-3 text-amber-500" />
                        {isEl ? `Ενεργοποιήθηκε ${qa.usageCount || 0}x` : `Triggered ${qa.usageCount || 0}x`}
                      </span>
                    </div>
                  </div>

                  {/* Trigger Question */}
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-start gap-2 leading-snug">
                    <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>"{qa.question}"</span>
                  </h4>

                  {/* Keywords Tag Chips */}
                  {qa.keywords && qa.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2 mb-3">
                      <Tag className="w-3 h-3 text-neutral-400 shrink-0 mr-0.5" />
                      {qa.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Answer Preview Box */}
                  <div className="mt-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/20 dark:border-white/5 text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {qa.answer}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-neutral-200/20 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-neutral-400 font-mono">
                    {qa.updatedAt 
                      ? `${isEl ? 'Ενημερώθηκε' : 'Updated'} ${new Date(qa.updatedAt).toLocaleDateString()}` 
                      : (isEl ? 'Ενεργό' : 'Active')}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Insert into Chat (if used as picker) */}
                    {onSelectAnswerToInsert && (
                      <button
                        onClick={() => onSelectAnswerToInsert(qa.answer)}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        {isEl ? 'Εισαγωγή' : 'Insert in Draft'}
                      </button>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopyAnswer(qa, e)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                      title={isEl ? 'Αντιγραφή απάντησης' : 'Copy answer text'}
                    >
                      {copiedId === qa.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(qa)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                      title={isEl ? 'Επεξεργασία' : 'Edit auto-reply'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteQA(qa.id, e)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      title={isEl ? 'Διαγραφή' : 'Delete auto-reply'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Auto-Reply Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/40 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {editingQA ? (isEl ? 'Επεξεργασία Αυτόματης Απάντησης' : 'Edit Auto-Reply Answer') : (isEl ? 'Νέα Αυτόματη Απάντηση AI' : 'Create New AI Auto-Reply')}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveQA} className="space-y-3.5">
                {/* Trigger Question */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isEl ? 'Ερώτηση Χρήστη / Φράση Έναυσης *' : 'User Question / Trigger Phrase *'}
                  </label>
                  <input
                    type="text"
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder={isEl ? 'π.χ. Πώς αλλάζω τη φωτογραφία προφίλ μου;' : 'e.g. How do I change my profile photo?'}
                    className="w-full text-xs glass-input rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {isEl ? 'Η βασική ερώτηση ή φράση που ενεργοποιεί αυτήν την αυτοματοποιημένη απάντηση.' : 'The primary question or phrase that triggers this automated response.'}
                  </p>
                </div>

                {/* Answer Text */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isEl ? 'Αυτοματοποιημένη Απάντηση AI *' : 'Automated AI Answer *'}
                  </label>
                  <textarea
                    rows={4}
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder={isEl ? 'Πληκτρολογήστε την πλήρη λύση ή οδηγίες που θα στείλει το AI στον χρήστη...' : 'Type the full solution or instructions that the AI will send back to the user...'}
                    className="w-full text-xs glass-input rounded-xl p-3.5 text-neutral-900 dark:text-white leading-relaxed resize-none"
                    required
                  />
                </div>

                {/* Keywords & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isEl ? 'Συνώνυμα / Λέξεις-Κλειδιά' : 'Synonyms / Keywords'}
                    </label>
                    <input
                      type="text"
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      placeholder={isEl ? 'εικόνα, φωτογραφία, προφίλ, αλλαγή' : 'avatar, picture, photo, change icon'}
                      className="w-full text-xs glass-input rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                    />
                    <p className="text-[9px] text-neutral-400 mt-0.5">
                      {isEl ? 'Λέξεις-κλειδιά χωρισμένες με κόμμα.' : 'Comma-separated trigger keywords.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isEl ? 'Κατηγορία' : 'Category'}
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full text-xs glass-input rounded-xl px-3 py-2 text-neutral-900 dark:text-white bg-transparent"
                    >
                      <option value="General">{isEl ? 'Γενικά' : 'General'}</option>
                      <option value="Tasks & Workflows">{isEl ? 'Εργασίες & Ροές' : 'Tasks & Workflows'}</option>
                      <option value="Projects">{isEl ? 'Έργα' : 'Projects'}</option>
                      <option value="Plans & Teams">{isEl ? 'Πλάνα & Ομάδες' : 'Plans & Teams'}</option>
                      <option value="Account & Auth">{isEl ? 'Λογαριασμός & Σύνδεση' : 'Account & Auth'}</option>
                      <option value="Technical Help">{isEl ? 'Τεχνική Βοήθεια' : 'Technical Help'}</option>
                    </select>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="pt-3 border-t border-neutral-200/30 dark:border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    {isEl ? 'Ακύρωση' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{editingQA ? (isEl ? 'Ενημέρωση' : 'Update Answer') : (isEl ? 'Αποθήκευση' : 'Save Auto-Reply')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
