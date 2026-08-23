import React, { useState } from 'react';
import { TaskyProvider, useTasky } from './TaskyContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { HabitsView } from './components/HabitsView';
import { StatisticsView } from './components/StatisticsView';
import { CreateMemberView } from './components/CreateMemberView';
import { ManageUsersView } from './components/ManageUsersView';
import { OrganizationsView } from './components/OrganizationsView';
import { ChatView } from './components/ChatView';
import { LoginView } from './components/LoginView';
import { AdminRequestsView } from './components/AdminRequestsView';
import { ProjectsView } from './components/ProjectsView';
import { WorkspaceSelectorModal } from './components/WorkspaceSelectorModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  CheckSquare, 
  Calendar, 
  Flame, 
  MessageSquare, 
  Cloud, 
  CloudLightning, 
  CheckCircle2, 
  CloudOff, 
  AlertCircle,
  FolderKanban
} from 'lucide-react';
import { useTranslation } from './translations';

const adjustHexColor = (hex: string, percent: number): string => {
  try {
    if (!hex || !hex.startsWith('#')) return hex;
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, R + percent));
    G = Math.min(255, Math.max(0, G + percent));
    B = Math.min(255, Math.max(0, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  } catch {
    return hex;
  }
};

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    user, 
    authLoading, 
    currentUserProfile, 
    organizations, 
    userOrganizations,
    stopImpersonating,
    syncStatus,
    triggerSync
  } = useTasky() as any;
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isGuest = localStorage.getItem('tasky_guest_mode') === 'true';

  const userOrg = currentUserProfile?.orgId && (userOrganizations || [])
    ? userOrganizations.find((o: any) => o.id === currentUserProfile.orgId)
    : null;
  const brandColor = userOrg?.themeColor || '#6366f1';
  const darkerColor = adjustHexColor(brandColor, -25);
  const lighterColor = adjustHexColor(brandColor, 40);
  const ultraLighterColor = adjustHexColor(brandColor, 180);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#e0e4f5] via-[#f5e1e7] to-[#e8eaf6] dark:from-[#131524] dark:via-[#311424] dark:to-[#0a0b10] transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/25 border-t-indigo-600 rounded-full animate-spin shadow-md" />
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-sans tracking-wider uppercase">Loading Workspace</span>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView key="dashboard" />;
      case 'projects':
        return <ProjectsView key="projects" />;
      case 'calendar':
        return <CalendarView key="calendar" />;
      case 'habits':
        return <HabitsView key="habits" />;
      case 'statistics':
        return <StatisticsView key="statistics" />;
      case 'organizations':
        return <OrganizationsView key="organizations" />;
      case 'chat':
        return <ChatView key="chat" />;
      case 'create-member':
        return <CreateMemberView key="create-member" onSwitchToManage={() => setActiveTab('manage-users')} />;
      case 'manage-users':
        return <ManageUsersView key="manage-users" onSwitchToAdd={() => setActiveTab('create-member')} />;
      case 'admin-requests':
        return <AdminRequestsView key="admin-requests" />;
      default:
        return <DashboardView key="dashboard" />;
    }
  };

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
      default:
        return <Cloud className="w-4 h-4 text-neutral-400" />;
    }
  };

  const mobileTabs = [
    { id: 'dashboard', name: t('sidebar.dashboard') || 'Tasks', icon: CheckSquare },
    { id: 'projects', name: 'Projects', icon: FolderKanban },
    { id: 'calendar', name: t('sidebar.calendar') || 'Calendar', icon: Calendar },
    { id: 'habits', name: t('sidebar.habits') || 'Habits', icon: Flame },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-[#e0e4f5] via-[#f5e1e7] to-[#e8eaf6] dark:from-[#1a1c2c] dark:via-[#4a192c] dark:to-[#12141d] text-neutral-800 dark:text-neutral-100 font-sans overflow-hidden p-3 gap-3 md:p-6 md:gap-6 flex-col md:flex-row transition-all duration-500">
      {/* Dynamic Brand Color Injection */}
      <style>{`
        :root {
          --color-primary: ${brandColor};
        }
        .text-indigo-500 { color: ${brandColor} !important; }
        .text-indigo-600 { color: ${darkerColor} !important; }
        .text-indigo-700 { color: ${darkerColor} !important; }
        .bg-indigo-50 { background-color: ${ultraLighterColor} !important; }
        .bg-indigo-100 { background-color: ${lighterColor} !important; }
        .bg-indigo-500 { background-color: ${brandColor} !important; }
        .bg-indigo-600 { background-color: ${darkerColor} !important; }
        .border-indigo-200 { border-color: ${lighterColor} !important; }
        .border-indigo-500 { border-color: ${brandColor} !important; }
        .hover\\:bg-indigo-600:hover { background-color: ${darkerColor} !important; }
        .hover\\:text-indigo-500:hover { color: ${brandColor} !important; }
        .hover\\:border-indigo-500:hover { border-color: ${brandColor} !important; }
        .focus\\:border-indigo-500:focus { border-color: ${brandColor} !important; }
        .focus\\:ring-indigo-500:focus { --tw-ring-color: ${brandColor} !important; }
        .shadow-indigo-500\\/30 { box-shadow: 0 10px 15px -3px ${brandColor}4D, 0 4px 6px -2px ${brandColor}1A !important; }
        .shadow-indigo-500\\/10 { box-shadow: 0 4px 6px -1px ${brandColor}1A, 0 2px 4px -1px ${brandColor}0D !important; }
      `}</style>

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {userOrg?.logo ? (
              <img 
                src={userOrg.logo} 
                alt={`${userOrg.name} Logo`} 
                className="w-7 h-7 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                {userOrg?.name ? userOrg.name.charAt(0).toUpperCase() : 'T'}
              </div>
            )}
            <span className="font-sans font-bold text-sm tracking-tight text-neutral-800 dark:text-white">
              {userOrg?.name || 'Tasky'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerSync}
          className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center"
          title="Sync now"
        >
          {getSyncIcon()}
        </button>
      </header>

      {/* Navigation Sidebar (Desktop) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 h-full bg-[#f4f5fa] dark:bg-[#12131f] shadow-2xl z-10 flex"
            >
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} isMobile={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentUserProfile?.isImpersonated && (
          <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-4 flex items-center justify-between gap-4 shrink-0 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs font-semibold leading-normal">
                Impersonating <span className="font-bold">{currentUserProfile.name}</span> ({currentUserProfile.rank} role). All views and actions act on this user profile.
              </p>
            </div>
            <button
              onClick={stopImpersonating}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/10 shrink-0"
            >
              Switch back to Admin
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden flex items-center justify-around bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 py-1.5 px-3 shrink-0 shadow-md">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 relative cursor-pointer"
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-bold' 
                  : 'text-neutral-400 dark:text-white/40 hover:text-neutral-600 dark:hover:text-white'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-medium mt-0.5 ${
                isActive ? 'text-indigo-500 dark:text-indigo-400 font-bold' : 'text-neutral-400 dark:text-white/40'
              }`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Workspace Selector Modal for Multi-Company Accounts */}
      <WorkspaceSelectorModal />
    </div>
  );
};

export default function App() {
  return (
    <TaskyProvider>
      <AppContent />
    </TaskyProvider>
  );
}

