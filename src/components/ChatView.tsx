import React, { useState, useEffect, useRef } from 'react';
import { useTasky } from '../TaskyContext';
import { Message, TeamMember, Organization, AiSupportQA } from '../types';
import { SavedAnswersView } from './SavedAnswersView';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare, 
  ArrowLeft, 
  LifeBuoy, 
  Sparkles,
  Bot,
  Plus,
  Copy,
  Check,
  X,
  Tag,
  Zap,
  HelpCircle,
  AlertCircle,
  BookmarkPlus,
  BookOpen
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    currentUserProfile, 
    teamMembers, 
    organizations,
    aiSupportQA,
    addOrUpdateAiSupportQA
  } = useTasky() as any;

  const [activeChannel, setActiveChannel] = useState<'company' | 'support' | 'saved-answers'>('company');
  const [selectedSupportUser, setSelectedSupportUser] = useState<string | null>(null); // For Admin: which user's support chat we are viewing
  const [typedMessage, setTypedMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Auto-Reply Popover in Chat Input
  const [showQuickAnswersPopover, setShowQuickAnswersPopover] = useState(false);

  // Modal / Prompt to Save Answer for Auto-Reply
  const [pendingAutoReply, setPendingAutoReply] = useState<{
    question: string;
    answer: string;
    keywords: string;
    category: string;
  } | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const isAdmin = currentUserProfile?.rank === 'Admin';
  const myOrgId = currentUserProfile?.orgId;
  const myOrg = organizations.find((o: Organization) => o.id === myOrgId);

  // Auto scroll to bottom
  useEffect(() => {
    if (activeChannel !== 'saved-answers') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChannel, selectedSupportUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = typedMessage.trim();
    if (!cleanText || !currentUserProfile) return;

    try {
      if (activeChannel === 'company') {
        // Send to company-wide channel
        await sendMessage(cleanText, false, undefined, myOrgId);
      } else {
        // Support message
        if (isAdmin) {
          // Admin replies to a specific user's support chat
          if (selectedSupportUser) {
            await sendMessage(cleanText, true, selectedSupportUser);

            // Find the last question asked by this user to pre-fill the auto-reply trigger
            const userQuestions = messages.filter(
              (m: Message) => m.isSupport && m.senderId === selectedSupportUser && m.senderId !== currentUserProfile.id
            );
            const lastUserQuestion = userQuestions.length > 0 
              ? userQuestions[userQuestions.length - 1].text 
              : 'User support inquiry';

            // ASK ADMIN IF THEY WANT TO SAVE THIS ANSWER FOR AUTO-REPLY!
            setPendingAutoReply({
              question: lastUserQuestion,
              answer: cleanText,
              keywords: '',
              category: 'Technical Help'
            });
          }
        } else {
          // Normal user messages technical support (the Admin)
          await sendMessage(cleanText, true, 'admin-webtasky');
        }
      }
      setTypedMessage('');
      setShowQuickAnswersPopover(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmSaveAutoReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAutoReply || !pendingAutoReply.question.trim() || !pendingAutoReply.answer.trim()) return;

    const keywordsList = pendingAutoReply.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      await addOrUpdateAiSupportQA({
        question: pendingAutoReply.question.trim(),
        answer: pendingAutoReply.answer.trim(),
        keywords: keywordsList,
        category: pendingAutoReply.category || 'General'
      });
      setSaveSuccessToast(`Saved "${pendingAutoReply.question.slice(0, 30)}..." to AI Auto-Replies!`);
      setTimeout(() => setSaveSuccessToast(null), 3500);
      setPendingAutoReply(null);
    } catch (err) {
      console.error('Failed to save auto-reply:', err);
    }
  };

  const handleOpenManualSavePrompt = (question: string, answer: string) => {
    setPendingAutoReply({
      question,
      answer,
      keywords: '',
      category: 'General'
    });
  };

  // Filter messages for company channel
  const companyMessages = messages.filter((m: Message) => !m.isSupport && m.orgId === myOrgId && myOrgId);

  // Filter support messages:
  // - If Admin: we want messages where isSupport is true, and either sender or receiver is the selectedSupportUser
  // - If normal user: we want messages where isSupport is true, and either sender or receiver is current user
  const supportMessages = messages.filter((m: Message) => {
    if (!m.isSupport) return false;
    if (isAdmin) {
      if (!selectedSupportUser) return false;
      return m.senderId === selectedSupportUser || m.receiverId === selectedSupportUser;
    } else {
      return m.senderId === currentUserProfile?.id || m.receiverId === currentUserProfile?.id;
    }
  });

  // Get list of unique users who have messaged Technical Support (for Admin to list in sidebar)
  const supportUsersList = teamMembers.filter((tm: TeamMember) => {
    const hasSentMsg = messages.some((m: Message) => m.isSupport && m.senderId === tm.id);
    return hasSentMsg && tm.rank !== 'Admin';
  });

  const getOrgName = (orgId?: string) => {
    if (!orgId) return 'Personal Workspace';
    const o = organizations.find((org: Organization) => org.id === orgId);
    return o ? `${o.name} (${o.type})` : 'Private Workspace';
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] overflow-hidden flex h-full shadow-xl select-none relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {saveSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Chat Left Navigation / Channel Sidebar */}
      <div className="w-64 sm:w-72 border-r border-neutral-200/20 dark:border-white/5 flex flex-col h-full bg-white/10 dark:bg-black/10 shrink-0">
        <div className="p-5 border-b border-neutral-200/20 dark:border-white/5">
          <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Workspace Chat
          </h3>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Realtime messaging & AI auto-support.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Main Channels (Group Rooms) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 px-3 uppercase tracking-wider block mb-1">
              CHANNELS
            </span>
            {myOrgId && (
              <button
                id="channel-company-btn"
                onClick={() => {
                  setActiveChannel('company');
                  setSelectedSupportUser(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeChannel === 'company'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="truncate">#{myOrg ? myOrg.name : 'Company Chat'}</span>
              </button>
            )}
            
            {!isAdmin && (
              <button
                id="channel-tech-support-btn"
                onClick={() => setActiveChannel('support')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeChannel === 'support'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/5'
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Tech Support (AI + Admin)</span>
              </button>
            )}

            {/* AI Auto-Replies & Saved Answers Library (Admins) */}
            {isAdmin && (
              <button
                id="channel-saved-answers-btn"
                onClick={() => {
                  setActiveChannel('saved-answers');
                  setSelectedSupportUser(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeChannel === 'saved-answers'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Bot className="w-4 h-4 shrink-0" />
                  <span className="truncate font-bold">Saved Auto-Replies</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 dark:bg-white/10 font-bold shrink-0">
                  {aiSupportQA?.length || 0}
                </span>
              </button>
            )}
          </div>

          {/* Admin Support Tickets view */}
          {isAdmin && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 px-3 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                USER HELP TICKETS
              </span>
              {supportUsersList.length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic px-3 pt-1">
                  No active user tickets.
                </p>
              ) : (
                supportUsersList.map((tm: TeamMember) => (
                  <button
                    key={tm.id}
                    onClick={() => {
                      setActiveChannel('support');
                      setSelectedSupportUser(tm.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
                      activeChannel === 'support' && selectedSupportUser === tm.id
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold min-w-0">
                      <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-white/15 text-[9px] flex items-center justify-center shrink-0">
                        {tm.avatar}
                      </div>
                      <span className="truncate">{tm.name}</span>
                    </div>
                    <span className="text-[9px] truncate font-medium opacity-80 pl-6.5">
                      {getOrgName(tm.orgId)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

        </div>

        {/* User Badge Footer */}
        <div className="p-4 border-t border-neutral-200/20 dark:border-white/5 flex items-center gap-2.5 bg-black/5 dark:bg-black/15">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center border border-indigo-200/20 text-xs shrink-0">
            {currentUserProfile?.avatar || '??'}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
              {currentUserProfile?.name}
            </h5>
            <p className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 truncate">
              {currentUserProfile?.role || 'Workspace User'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Room Canvas OR Saved Answers Section */}
      {activeChannel === 'saved-answers' ? (
        <SavedAnswersView 
          onClose={() => setActiveChannel('support')}
          onSelectAnswerToInsert={(ans) => {
            setTypedMessage(ans);
            setActiveChannel('support');
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full bg-white/5 dark:bg-white/1 overflow-hidden">
          
          {/* Chat Room Header */}
          <div className="px-6 py-4.5 border-b border-neutral-200/20 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-black/20">
            <div>
              <h4 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-1.5">
                {activeChannel === 'company' ? (
                  <>
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>#{myOrg ? myOrg.name : 'Company Chat'}</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-4 h-4 text-rose-500" />
                    <span>
                      {isAdmin 
                        ? `Technical Support: ${teamMembers.find((t: any) => t.id === selectedSupportUser)?.name || 'Select Ticket'}`
                        : 'Technical Support (Help Desk)'}
                    </span>
                    <span className="ml-2 bg-indigo-500/10 text-indigo-500 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono font-bold">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      AI Auto-Responder ({aiSupportQA?.length || 0} Knowledge Rules)
                    </span>
                  </>
                )}
              </h4>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {activeChannel === 'company'
                  ? `Welcome to your official company channel. Only members in your organization can read and write here.`
                  : isAdmin
                  ? 'Providing responsive live technical assistance. Every answer you send can be saved into the auto-reply engine.'
                  : 'Direct encrypted line to administrative tech support. Instant answers powered by Tasky AI.'}
              </p>
            </div>

            {/* Quick Button to Open Saved Answers Library */}
            {isAdmin && (
              <button
                id="open-saved-answers-btn"
                onClick={() => setActiveChannel('saved-answers')}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Auto-Reply Library</span>
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeChannel === 'support' && isAdmin && !selectedSupportUser ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-500 space-y-3">
                <LifeBuoy className="w-12 h-12 text-rose-400/55 animate-bounce" />
                <p className="text-xs font-bold font-sans">No Support Ticket Selected</p>
                <p className="text-[10px] max-w-xs">Select a user's help ticket from the support panel in the sidebar to review conversations, reply, and build automated replies.</p>
                <button
                  onClick={() => setActiveChannel('saved-answers')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer mt-2 flex items-center gap-1.5"
                >
                  <Bot className="w-4 h-4" />
                  Manage Auto-Reply Answers
                </button>
              </div>
            ) : (
              <>
                {(activeChannel === 'company' ? companyMessages : supportMessages).map((m: Message) => {
                  const isMe = m.senderId === currentUserProfile?.id;
                  const isAI = m.senderId === 'system-ai' || m.senderAvatar === 'AI';

                  return (
                    <div 
                      key={m.id}
                      className={`group relative flex items-start gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border border-white/20 ${
                        isAI 
                          ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md' 
                          : 'bg-neutral-200/60 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {isAI ? <Bot className="w-4 h-4" /> : m.senderAvatar}
                      </div>

                      {/* Speech Bubble */}
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'flex-row-reverse justify-start' : ''}`}>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                            {m.senderName}
                            {isAI && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono">
                                Auto-Responder
                              </span>
                            )}
                          </span>
                          <span className="text-neutral-400 font-mono text-[9px]">
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div className={`relative p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-indigo-500 text-white rounded-tr-none' 
                            : isAI 
                            ? 'bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 rounded-tl-none'
                            : 'bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/5 text-neutral-800 dark:text-neutral-200 rounded-tl-none'
                        }`}>
                          {m.text}

                          {/* Action overlay on message (Save as Auto-Reply for Admin) */}
                          {isAdmin && !isAI && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 pt-1 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenManualSavePrompt(
                                  isMe ? 'User Question' : m.text,
                                  isMe ? m.text : ''
                                )}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-indigo-600 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                                title="Save this response for automatic AI answering"
                              >
                                <BookmarkPlus className="w-3 h-3" />
                                <span>Save as Auto-Reply</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Answers Popover (Admin) */}
          <AnimatePresence>
            {showQuickAnswersPopover && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-4 mb-2 p-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-white/10 rounded-2xl shadow-2xl space-y-2 max-h-56 overflow-y-auto"
              >
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 border-b border-neutral-200/20 dark:border-white/5 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Insert Saved Auto-Reply
                  </span>
                  <button
                    onClick={() => setShowQuickAnswersPopover(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(aiSupportQA || []).length === 0 ? (
                  <p className="text-xs text-neutral-400 p-2 italic text-center">
                    No saved answers yet. Create some in the Auto-Reply Library!
                  </p>
                ) : (
                  (aiSupportQA || []).map((qa: AiSupportQA) => (
                    <button
                      key={qa.id}
                      onClick={() => {
                        setTypedMessage(qa.answer);
                        setShowQuickAnswersPopover(false);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs transition-all flex flex-col gap-0.5 cursor-pointer border border-transparent hover:border-indigo-200/30"
                    >
                      <span className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                        <span>"{qa.question}"</span>
                        <span className="text-[9px] font-normal px-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          {qa.category || 'General'}
                        </span>
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {qa.answer}
                      </span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          {!(activeChannel === 'support' && isAdmin && !selectedSupportUser) && (
            <form 
              onSubmit={handleSend}
              className="p-4 border-t border-neutral-200/20 dark:border-white/5 bg-white/15 dark:bg-black/5 flex items-center gap-3"
            >
              {/* Quick Auto-Replies Button for Admin */}
              {isAdmin && activeChannel === 'support' && (
                <button
                  type="button"
                  id="quick-auto-reply-btn"
                  onClick={() => setShowQuickAnswersPopover(!showQuickAnswersPopover)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    showQuickAnswersPopover 
                      ? 'bg-amber-500 text-white border-amber-600 shadow' 
                      : 'bg-white/50 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-200/40 dark:border-white/10 hover:bg-amber-500/10 hover:text-amber-600'
                  }`}
                  title="Insert saved auto-reply answer"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}

              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={
                  activeChannel === 'company' 
                    ? "Message team members in company channel..." 
                    : isAdmin
                    ? "Reply to user ticket (you will be asked to save answer for AI auto-reply)..."
                    : "Message Technical Support staff or AI..."
                }
                className="flex-1 text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
                required
              />
              <button
                type="submit"
                id="chat-send-btn"
                className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      )}

      {/* Interactive Prompt Modal: "Save this Answer for AI Auto-Reply?" */}
      <AnimatePresence>
        {pendingAutoReply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/40 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      Save Answer for AI Auto-Reply?
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Teach the AI to automatically reply with this answer next time.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingAutoReply(null)}
                  className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmSaveAutoReply} className="space-y-3.5">
                {/* Trigger Question */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    User Question / Trigger Phrase
                  </label>
                  <input
                    type="text"
                    value={pendingAutoReply.question}
                    onChange={(e) => setPendingAutoReply({ ...pendingAutoReply, question: e.target.value })}
                    placeholder="e.g. How do I reset my password?"
                    className="w-full text-xs glass-input rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    When any user asks this or a similar question, the AI will auto-respond.
                  </p>
                </div>

                {/* Answer Text */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Auto-Reply Answer (What you just sent)
                  </label>
                  <textarea
                    rows={4}
                    value={pendingAutoReply.answer}
                    onChange={(e) => setPendingAutoReply({ ...pendingAutoReply, answer: e.target.value })}
                    className="w-full text-xs glass-input rounded-xl p-3.5 text-neutral-900 dark:text-white leading-relaxed resize-none"
                    required
                  />
                </div>

                {/* Category & Synonyms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Trigger Keywords (Optional)
                    </label>
                    <input
                      type="text"
                      value={pendingAutoReply.keywords}
                      onChange={(e) => setPendingAutoReply({ ...pendingAutoReply, keywords: e.target.value })}
                      placeholder="password, reset, forgot login"
                      className="w-full text-xs glass-input rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={pendingAutoReply.category}
                      onChange={(e) => setPendingAutoReply({ ...pendingAutoReply, category: e.target.value })}
                      className="w-full text-xs glass-input rounded-xl px-3 py-2 text-neutral-900 dark:text-white bg-transparent"
                    >
                      <option value="Technical Help">Technical Help</option>
                      <option value="General">General</option>
                      <option value="Tasks & Workflows">Tasks & Workflows</option>
                      <option value="Projects">Projects</option>
                      <option value="Plans & Teams">Plans & Teams</option>
                      <option value="Account & Auth">Account & Auth</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-neutral-200/30 dark:border-white/10 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingAutoReply(null)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                  >
                    No, Just Send
                  </button>
                  <button
                    type="submit"
                    id="confirm-save-auto-reply-btn"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save to AI Auto-Replies</span>
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
