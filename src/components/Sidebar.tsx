import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import appLogo from '../assets/app_logo.jpg';
import { 
  CheckSquare, 
  Calendar, 
  Flame, 
  BarChart3, 
  Users, 
  Sun, 
  Moon, 
  Cloud, 
  CloudLightning, 
  CloudOff, 
  CheckCircle2,
  AlertCircle,
  LogOut,
  Scan,
  Globe,
  Building2,
  MessageSquare,
  UserPlus,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    darkMode, 
    setDarkMode, 
    language,
    setLanguage,
    tasks, 
    syncStatus, 
    triggerSync, 
    isOnline,
    user,
    logout,
    currentUserProfile,
    organizations
  } = useTasky() as any;

  const { t } = useTranslation();

  const isGuest = localStorage.getItem('tasky_guest_mode') === 'true';
  const myOrg = currentUserProfile?.orgId && organizations
    ? organizations.find((o: any) => o.id === currentUserProfile.orgId)
    : null;
  const profileName = user 
    ? (user.displayName || user.email?.split('@')[0] || 'User') 
    : (isGuest ? 'Guest Explorer' : 'Offline Sandbox');
  const profileEmail = user ? user.email : (isGuest ? 'guest@tasky.local' : 'sandbox@tasky.local');
  const initial = profileName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    localStorage.removeItem('tasky_guest_mode');
    await logout();
    window.location.reload();
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const menuItems: Array<{ id: string; name: string; icon: any }> = [
    { id: 'dashboard', name: t('sidebar.dashboard'), icon: CheckSquare },
    { id: 'calendar', name: t('sidebar.calendar'), icon: Calendar },
    { id: 'habits', name: t('sidebar.habits'), icon: Flame },
    { id: 'statistics', name: t('sidebar.stats'), icon: BarChart3 },
    { id: 'organizations', name: 'Plans', icon: Building2 },
    { id: 'chat', name: 'Chatroom', icon: MessageSquare },
    ...(currentUserProfile?.rank === 'Admin' || currentUserProfile?.rank === 'Manager'
      ? [{ id: 'create-member', name: 'Add Member', icon: UserPlus }]
      : []),
    ...(currentUserProfile?.email?.toLowerCase().trim() === 'spidereg2010@gmail.com'
      ? [{ id: 'admin-requests', name: t('sidebar.adminRequests'), icon: Mail }]
      : [])
  ];

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <CloudLightning className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-neutral-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'syncing': return t('sidebar.syncing');
      case 'synced': return t('sidebar.cloudSynced');
      case 'offline': return t('sidebar.offline');
      case 'error': return t('sidebar.syncFailed');
    }
  };

  return (
    <aside className="w-64 glass-panel rounded-[32px] flex flex-col h-full overflow-y-auto shrink-0 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-neutral-200/20 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {myOrg?.logo ? (
            <img 
              src={myOrg.logo} 
              alt={`${myOrg.name} Logo`} 
              className="w-9 h-9 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={appLogo} 
              alt="Tasky Logo" 
              className="w-9 h-9 object-cover rounded-xl shadow-lg shadow-indigo-500/20"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="font-sans font-bold text-xl tracking-tight text-neutral-800 dark:text-white">
            {myOrg?.name || 'Tasky'}
          </span>
        </div>
        
        {/* Sync Indicator Button */}
        <button 
          onClick={triggerSync}
          title="Click to manually sync"
          className="p-1.5 rounded-lg hover:bg-white/25 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer flex items-center gap-1 text-xs"
        >
          {getSyncIcon()}
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-5 border-b border-neutral-200/20 dark:border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center border border-indigo-200/30 dark:border-indigo-900/30 shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-snug">
                {profileName}
              </h4>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                {profileEmail}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={handleLogout}
              title={t('sidebar.logout')}
              className="p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/10 text-neutral-500 hover:text-rose-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative cursor-pointer ${
                isActive 
                  ? 'text-neutral-900 dark:text-white font-semibold' 
                  : 'text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 bg-white/50 dark:bg-white/15 border border-white/60 dark:border-white/10 rounded-2xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-4.5 h-4.5 z-10 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-white/40'}`} />
              <span className="z-10">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Tray: Theme Selector & Sync Indicator Details */}
      <div className="p-4 border-t border-neutral-200/20 dark:border-white/5 space-y-3">
        {/* Sync Status Display */}
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            {getSyncIcon()}
            {getSyncText()}
          </span>
          <span>v1.0.0</span>
        </div>

        {/* Toggle Theme */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/25 dark:bg-white/5 border border-white/35 dark:border-white/5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-sm"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            {darkMode ? t('sidebar.lightTheme') : t('sidebar.darkTheme')}
          </span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-200/50 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
            {t('sidebar.mode')}
          </span>
        </button>

        {/* Toggle Language */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/25 dark:bg-white/5 border border-white/35 dark:border-white/5 shadow-sm">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              language === 'en'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/30 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('el')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              language === 'el'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/30 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>EL</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
