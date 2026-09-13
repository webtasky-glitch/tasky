import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { isTaskForUser } from '../utils/taskFilter';
const DEFAULT_APP_LOGO = 'https://i.postimg.cc/ZKPq2Nyd/file-00000000c52481f4801a2d88eaae2b34.png';
import { 
  CheckSquare, 
  Calendar, 
  Flame, 
  BarChart3, 
  Users, 
  Sun, 
  Moon, 
  CloudLightning, 
  CloudOff, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Globe, 
  Building2, 
  MessageSquare, 
  UserPlus, 
  UserX, 
  Mail, 
  FolderKanban, 
  ChevronsUpDown, 
  Smartphone, 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  ListTodo, 
  Clock,
  X,
  Camera,
  Settings2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AndroidAppModal } from './AndroidAppModal';
import { AiIntegrationsModal } from './AiIntegrationsModal';

const compressImage = (base64Str: string, maxWidth = 256, maxHeight = 256): Promise<string> => {
  return new Promise((resolve) => {
    if (base64Str.length < 50000) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/png');
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

export const Sidebar: React.FC<{ onClose?: () => void; isMobile?: boolean }> = ({ onClose, isMobile }) => {
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
    user,
    logout,
    currentUserProfile,
    userOrganizations,
    setIsWorkspaceSelectorOpen,
    teamMembers,
    updateTeamMember,
    isProfileModalOpen,
    setIsProfileModalOpen
  } = useTasky() as any;

  const { t } = useTranslation();
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const isGuest = localStorage.getItem('tasky_guest_mode') === 'true';
  const isSuperAdmin = currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com';
  const isAdmin = currentUserProfile?.rank === 'Admin' || isSuperAdmin;
  const myOrg = currentUserProfile?.orgId && (userOrganizations || [])
    ? userOrganizations.find((o: any) => o.id === currentUserProfile.orgId)
    : null;
  const profileName = user 
    ? (user.displayName || user.email?.split('@')[0] || (language === 'el' ? 'Χρήστης' : 'User')) 
    : (isGuest ? (language === 'el' ? 'Επισκέπτης' : 'Guest Explorer') : (language === 'el' ? 'Τοπικό Sandbox' : 'Offline Sandbox'));
  const profileEmail = user ? user.email : (isGuest ? 'guest@tasky.local' : 'sandbox@tasky.local');
  const initial = profileName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    localStorage.removeItem('tasky_guest_mode');
    await logout();
    window.location.reload();
  };

  const userTasks = tasks.filter((t: any) => isTaskForUser(t, currentUserProfile, user, teamMembers));
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t: any) => t.status === 'Completed').length;

  const menuItems: Array<{ id: string; name: string; icon: any }> = [
    { id: 'dashboard', name: t('sidebar.dashboard'), icon: CheckSquare },
    { id: 'all-tasks', name: t('sidebar.allTasks'), icon: ListTodo },
    { id: 'timeline', name: t('sidebar.timeline'), icon: Clock },
    { id: 'projects', name: t('sidebar.projects'), icon: FolderKanban },
    { id: 'calendar', name: t('sidebar.calendar'), icon: Calendar },
    { id: 'habits', name: t('sidebar.habits'), icon: Flame },
    { id: 'statistics', name: t('sidebar.stats'), icon: BarChart3 },
    { id: 'organizations', name: language === 'el' ? 'Πλάνα (Εταιρείες)' : 'Plans', icon: Building2 },
    { id: 'chat', name: t('sidebar.chat'), icon: MessageSquare },
    { id: 'privacy', name: t('sidebar.privacy'), icon: ShieldCheck },
    ...(currentUserProfile?.rank === 'Admin' || currentUserProfile?.rank === 'Manager'
      ? [
          { id: 'create-member', name: t('sidebar.createMember'), icon: UserPlus },
          { id: 'manage-users', name: t('sidebar.manageUsers'), icon: UserX }
        ]
      : []),
    ...(currentUserProfile?.rank === 'Admin' || currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com'
      ? [{ id: 'admin-requests', name: t('sidebar.adminRequests'), icon: Mail }]
      : [])
  ];

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <CloudLightning className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      case 'synced':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-neutral-400" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
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
    <aside className={`flex flex-col h-full overflow-hidden shrink-0 select-none ${isMobile ? 'w-full bg-[#f4f5fa] dark:bg-[#12131f]' : 'w-64 glass-panel rounded-[32px] shadow-xl'}`}>
      {/* Brand Header (Pinned) */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/20 dark:border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {myOrg?.logo ? (
            <img 
              src={myOrg.logo} 
              alt={`${myOrg.name} Logo`} 
              className="w-8 h-8 object-contain rounded-xl shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={DEFAULT_APP_LOGO} 
              alt="Tasky Logo" 
              className="w-8 h-8 object-cover rounded-xl shadow-md shadow-indigo-500/20 shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="font-sans font-bold text-lg tracking-tight text-neutral-800 dark:text-white truncate">
            {myOrg?.name || 'Tasky'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* Sync Indicator Button */}
          <button 
            onClick={triggerSync}
            title={language === 'el' ? 'Μη αυτόματος συγχρονισμός' : 'Click to manually sync'}
            className="p-1.5 rounded-lg hover:bg-white/25 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            {getSyncIcon()}
          </button>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/25 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
              title={language === 'el' ? 'Κλείσιμο' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Workspace Switcher Pill (Pinned) */}
      {userOrganizations && userOrganizations.length > 0 && (
        <div className="px-3 py-2 border-b border-neutral-200/20 dark:border-white/5 bg-indigo-500/5 shrink-0">
          <button
            onClick={() => setIsWorkspaceSelectorOpen(true)}
            className="w-full p-2 bg-white/60 hover:bg-white dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-white/10 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                  {language === 'el' ? `Πλάνο / Εταιρεία (${userOrganizations.length})` : `Company (${userOrganizations.length})`}
                </span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate block mt-0.5">
                  {myOrg?.name || (language === 'el' ? 'Επιλογή Πλάνου' : 'Select Workspace')}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
          </button>
        </div>
      )}

      {/* Profile Section (Pinned) */}
      <div className="px-4 py-3 border-b border-neutral-200/20 dark:border-white/5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              title={language === 'el' ? 'Επεξεργασία προφίλ' : 'Edit profile'}
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200/30 dark:border-indigo-900/30 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all relative group"
            >
              {currentUserProfile?.avatar && (currentUserProfile.avatar.startsWith('data:image/') || currentUserProfile.avatar.startsWith('http') || currentUserProfile.avatar.startsWith('/')) ? (
                <img 
                  src={currentUserProfile.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUserProfile?.avatar || initial
              )}
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </button>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate leading-snug">
                {profileName}
              </h4>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                {profileEmail}
              </p>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title={language === 'el' ? 'Ρυθμίσεις Προφίλ' : 'Profile Settings'}
              className="p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/10 text-neutral-500 hover:text-indigo-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              title={t('sidebar.logout')}
              className="p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/10 text-neutral-500 hover:text-rose-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links (Smoothly Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                isActive 
                  ? 'text-neutral-900 dark:text-white font-bold bg-white/60 dark:bg-white/15 shadow-xs border border-neutral-200/50 dark:border-white/10' 
                  : 'text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 z-10 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-white/40'}`} />
              <span className="z-10 truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Tray (Pinned) */}
      <div className="p-3 border-t border-neutral-200/20 dark:border-white/5 space-y-2 shrink-0 bg-neutral-50/40 dark:bg-neutral-900/40">
        {/* Sync Status Display */}
        <div className="flex items-center justify-between px-1.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            {getSyncIcon()}
            {getSyncText()}
          </span>
          <span>v1.0.0</span>
        </div>

        {/* AI & API Connector Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 to-indigo-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:from-emerald-500/25 hover:to-indigo-500/25 transition-all cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'el' ? 'Πρόσβαση AI & API' : 'AI & API Access'}</span>
          </span>
          <span className="text-[8px] uppercase font-mono px-1 py-0.2 rounded bg-emerald-500 text-white font-extrabold flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            {isAdmin ? 'ADMIN' : 'API KEY'}
          </span>
        </button>

        {/* Android & PWA App Button */}
        <button
          onClick={() => setIsAndroidModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/25 hover:to-purple-500/25 transition-all cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'el' ? 'Εφαρμογή Android / Mobile' : 'Android & Mobile App'}</span>
          </span>
          <span className="text-[8px] uppercase font-mono px-1 py-0.2 rounded bg-indigo-500 text-white font-extrabold">
            APK / PWA
          </span>
        </button>

        {/* Toggle Theme */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/30 dark:bg-white/5 border border-white/35 dark:border-white/5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-1.5">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            {darkMode ? t('sidebar.lightTheme') : t('sidebar.darkTheme')}
          </span>
          <span className="text-[8px] uppercase font-mono px-1 py-0.2 rounded bg-neutral-200/50 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
            {t('sidebar.mode')}
          </span>
        </button>

        {/* Toggle Language */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/30 dark:bg-white/5 border border-white/35 dark:border-white/5 shadow-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              language === 'en'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/30 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('el')}
            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              language === 'el'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/30 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>EL</span>
          </button>
        </div>
      </div>

      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      <AiIntegrationsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </aside>
  );
};
