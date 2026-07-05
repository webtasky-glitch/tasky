import React, { useState, useEffect, useRef } from 'react';
import { useTasky } from '../TaskyContext';
import { Message, TeamMember, Organization } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, ShieldAlert, CheckCircle2, MessageSquare, ArrowLeft, LifeBuoy, Sparkles } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    currentUserProfile, 
    teamMembers, 
    organizations 
  } = useTasky() as any;

  const [activeChannel, setActiveChannel] = useState<'company' | 'support'>('company');
  const [selectedSupportUser, setSelectedSupportUser] = useState<string | null>(null); // For Admin: which user's support chat we are viewing
  const [typedMessage, setTypedMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUserProfile?.rank === 'Admin';
  const myOrgId = currentUserProfile?.orgId;
  const myOrg = organizations.find((o: Organization) => o.id === myOrgId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel, selectedSupportUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !currentUserProfile) return;

    try {
      if (activeChannel === 'company') {
        // Send to company-wide channel
        await sendMessage(typedMessage.trim(), false, undefined, myOrgId);
      } else {
        // Support message
        if (isAdmin) {
          // Admin replies to a specific user's support chat
          if (selectedSupportUser) {
            await sendMessage(typedMessage.trim(), true, selectedSupportUser);
          }
        } else {
          // Normal user messages technical support (the Admin)
          await sendMessage(typedMessage.trim(), true, 'admin-spidereg2010');
        }
      }
      setTypedMessage('');
    } catch (err) {
      console.error(err);
    }
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
    // Keep only if they have sent at least one support message or we want to allow support chats
    const hasSentMsg = messages.some((m: Message) => m.isSupport && m.senderId === tm.id);
    return hasSentMsg && tm.rank !== 'Admin';
  });

  const getOrgName = (orgId?: string) => {
    if (!orgId) return 'Personal Workspace';
    const o = organizations.find((org: Organization) => org.id === orgId);
    return o ? `${o.name} (${o.type})` : 'Private Workspace';
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] overflow-hidden flex h-full shadow-xl select-none">
      
      {/* 1. Chat Left Navigation / Channel Sidebar */}
      <div className="w-64 sm:w-72 border-r border-neutral-200/20 dark:border-white/5 flex flex-col h-full bg-white/10 dark:bg-black/10 shrink-0">
        <div className="p-5 border-b border-neutral-200/20 dark:border-white/5">
          <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Workspace Chat
          </h3>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Realtime messaging & support channels.
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
                onClick={() => setActiveChannel('support')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeChannel === 'support'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/5'
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Tech Support (Admin)</span>
              </button>
            )}
          </div>

          {/* Admin Support Tickets view */}
          {isAdmin && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 px-3 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                SUPPORT TICKETS
              </span>
              {supportUsersList.length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic px-3 pt-1">
                  No active tech support help tickets.
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

      {/* 2. Main Chat Room Canvas */}
      <div className="flex-1 flex flex-col h-full bg-white/5 dark:bg-white/1">
        
        {/* Chat Room Header */}
        <div className="px-6 py-4.5 border-b border-neutral-200/20 dark:border-white/5 flex items-center justify-between">
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
                  <span className="ml-2 bg-indigo-500/10 text-indigo-500 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono font-bold animate-pulse">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    AI Auto-Responder Active
                  </span>
                </>
              )}
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {activeChannel === 'company'
                ? `Welcome to your official company channel. Only members in your organization can read and write here.`
                : isAdmin
                ? 'Providing responsive live technical assistance as system super-administrator.'
                : 'Direct encrypted line to administrative tech support. Ask questions or request server help.'}
            </p>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeChannel === 'support' && isAdmin && !selectedSupportUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-500 space-y-2">
              <LifeBuoy className="w-12 h-12 text-rose-400/55 animate-bounce" />
              <p className="text-xs font-bold font-sans">No Support Ticket Selected</p>
              <p className="text-[10px] max-w-xs">Select a user's help ticket from the support panel in the sidebar to review conversations and reply.</p>
            </div>
          ) : (
            <>
              {(activeChannel === 'company' ? companyMessages : supportMessages).map((m: Message) => {
                const isMe = m.senderId === currentUserProfile?.id;
                return (
                  <div 
                    key={m.id}
                    className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-bold flex items-center justify-center text-xs shrink-0 border border-white/20">
                      {m.senderAvatar}
                    </div>

                    {/* Speech Bubble */}
                    <div className="space-y-0.5">
                      <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'flex-row-reverse justify-start' : ''}`}>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{m.senderName}</span>
                        <span className="text-neutral-400 font-mono text-[9px]">
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-indigo-500 text-white rounded-tr-none' 
                          : 'bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/5 text-neutral-800 dark:text-neutral-200 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        {!(activeChannel === 'support' && isAdmin && !selectedSupportUser) && (
          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-neutral-200/20 dark:border-white/5 bg-white/15 dark:bg-black/5 flex items-center gap-3"
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder={
                activeChannel === 'company' 
                  ? "Message team members in company channel..." 
                  : "Message Technical Support staff..."
              }
              className="flex-1 text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
              required
            />
            <button
              type="submit"
              className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
