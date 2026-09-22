import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import appLogo from '../assets/app_logo.png';
const DEFAULT_APP_LOGO = appLogo;
import { 
  CheckSquare, 
  Clock, 
  Flame, 
  FolderKanban, 
  ShieldCheck, 
  Users, 
  Building2, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Sun, 
  Moon, 
  Smartphone, 
  MessageSquare, 
  BarChart3, 
  HelpCircle, 
  Heart, 
  Zap, 
  Layers,
  ChevronRight,
  Shield,
  Star,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeLandingViewProps {
  onLaunchApp?: () => void;
  onOpenSignIn?: () => void;
  onOpenRegister?: () => void;
  onOpenCompany?: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onLaunchApp,
  onOpenSignIn,
  onOpenRegister,
  onOpenCompany
}) => {
  const { darkMode, setDarkMode, language, setLanguage, user } = useTasky() as any;
  const { t } = useTranslation();
  const isEl = language === 'el';

  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'dashboard' | 'timeline' | 'projects' | 'habits' | 'privacy'>('dashboard');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simulated interactive task item toggle in the mockup
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: isEl ? 'Επιβεβαίωση παραδοτέων Sprint' : 'Sprint Deliverables Review', done: true, priority: 'Urgent', time: '10:00 AM', tag: 'Engineering' },
    { id: 2, title: isEl ? 'Σχεδιασμός νέου UI χρονοδιαγράμματος' : 'Timeline UI Architecture Spec', done: false, priority: 'High', time: '01:30 PM', tag: 'Design' },
    { id: 3, title: isEl ? 'Καθημερινός έλεγχος συνήθειας (Water & Gym)' : 'Daily Habit Check (Hydration & Focus)', done: true, priority: 'Normal', time: '04:00 PM', tag: 'Habit' },
    { id: 4, title: isEl ? 'Συγχρονισμός με ομάδα υποστήριξης' : 'Team Standup & Sync Call', done: false, priority: 'High', time: '05:30 PM', tag: 'Company' }
  ]);

  const toggleDemoTask = (id: number) => {
    setDemoTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAction = () => {
    if (user && onLaunchApp) {
      onLaunchApp();
    } else if (onOpenSignIn) {
      onOpenSignIn();
    } else if (onLaunchApp) {
      onLaunchApp();
    }
  };

  const faqs = [
    {
      q: isEl ? 'Τι ακριβώς είναι το Tasky;' : 'What exactly is Tasky?',
      a: isEl 
        ? 'Το Tasky είναι μια ενιαία πλατφόρμα παραγωγικότητας και διαχείρισης χρόνου. Συνδυάζει έξυπνη λίστα εργασιών (Tasks), ωριαίο χρονοδιάγραμμα ημέρας (Timeline & Schedule), παρακολούθηση καθημερινών συνηθειών (Habits & Streaks), έργα σε στυλ Kanban (Projects), και πλήρη απομόνωση πλάνων για Προσωπική χρήση, Οικογένεια ή Εταιρεία.'
        : 'Tasky is a unified productivity and schedule ecosystem. It merges intuitive task management, an hour-by-hour timeline schedule, daily habit streak tracking, Kanban project boards, and strict privacy rings for Personal, Family, and Enterprise company plans.'
    },
    {
      q: isEl ? 'Μπορεί ένας χρήστης να αλλάξει την κατάσταση του πλάνου από προσωπικό σε πολλαπλών ατόμων;' : 'Can a user change plan status from personal to multi-people?',
      a: isEl
        ? 'Όχι. Για απόλυτη διασφάλιση των προσωπικών δεδομένων και αποτροπή διαρροής, τα προσωπικά πλάνα (Single) είναι μόνιμα απομονωμένα και κλειδωμένα. Εάν επιθυμείτε ομαδική συνεργασία, δημιουργείτε ξεχωριστό πλάνο Οικογένειας ή Εταιρείας με ειδικούς κωδικούς πρόσκλησης.'
        : 'No. To guarantee strict privacy isolation and zero data contamination, personal (Single) plans are permanently isolated and cannot be converted into multi-people (Company or Family) plans. Collaborative workflows are created as dedicated team/family circles.'
    },
    {
      q: isEl ? 'Πώς λειτουργεί το ωριαίο χρονοδιάγραμμα (Timeline & Schedule);' : 'How does the hour-by-hour Timeline & Schedule work?',
      a: isEl
        ? 'Σας επιτρέπει να ορίσετε ακριβείς ώρες έναρξης και λήξης για κάθε εργασία. Οι εργασίες εμφανίζονται σε έναν οπτικό άξονα 24 ωρών, αποτρέποντας τις επικαλύψεις και βοηθώντας σας να προγραμματίσετε με ακρίβεια την ημέρα σας.'
        : 'It allows you to map tasks directly to specific time slots on a clean 24-hour visual grid. This prevents double-booking, clarifies your daily focus, and aligns deliverables with actual hours.'
    },
    {
      q: isEl ? 'Λειτουργεί το Tasky χωρίς σύνδεση στο διαδίκτυο (Offline);' : 'Does Tasky work offline?',
      a: isEl
        ? 'Ναι! Το Tasky διαθέτει τεχνολογία Offline-First. Όλες οι αλλαγές αποθηκεύονται τοπικά και συγχρονίζονται αυτόματα στο cloud μόλις επανέλθει η σύνδεση στο διαδίκτυο.'
        : 'Yes! Tasky uses an offline-first architecture. All changes are saved securely in your local environment and seamlessly sync with the cloud as soon as connection is restored.'
    },
    {
      q: isEl ? 'Ποιοι ρόλοι και επίπεδα πρόσβασης υποστηρίζονται;' : 'What roles and permission levels are supported?',
      a: isEl
        ? 'Υποστηρίζονται 4 επίπεδα ιεραρχίας: Super Admin, Plan Manager, Supervisor και Member. Κάθε ρόλος βλέπει αυστηρά τα δεδομένα του πλάνου του και τις εξουσιοδοτημένες εργασίες του.'
        : 'Tasky supports 4 permission tiers: Super Admin, Plan Manager, Supervisor, and Member. Each rank operates under strict plan-level data isolation.'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#f8f9fd] dark:bg-[#0d0e17] text-neutral-900 dark:text-neutral-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden font-sans">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/75 dark:bg-[#0d0e17]/80 border-b border-neutral-200/60 dark:border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <img 
                src={DEFAULT_APP_LOGO} 
                alt="Tasky Logo" 
                className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-2xl shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/20"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0d0e17] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  Tasky
                </span>
                <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 hidden sm:inline-block">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 hidden sm:block font-medium">
                {isEl ? 'Ολοκληρωμένο Σύστημα Παραγωγικότητας' : 'Intelligent Productivity Ecosystem'}
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <a 
              href="#what-is-tasky" 
              onClick={(e) => scrollToSection(e, 'what-is-tasky')}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {isEl ? 'Τι είναι το Tasky' : 'What is Tasky'}
            </a>
            <a 
              href="#pictures-showcase" 
              onClick={(e) => scrollToSection(e, 'pictures-showcase')}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isEl ? 'Εικόνες & Προεπισκόπηση' : 'Pictures & Showcase'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {isEl ? 'Πώς Λειτουργεί' : 'How It Works'}
            </a>
            <a 
              href="#plans-privacy" 
              onClick={(e) => scrollToSection(e, 'plans-privacy')}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {isEl ? 'Πλάνα & Ασφάλεια' : 'Plans & Privacy'}
            </a>
            <a 
              href="#faq-section" 
              onClick={(e) => scrollToSection(e, 'faq-section')}
              className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(isEl ? 'en' : 'el')}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all cursor-pointer border border-neutral-200/60 dark:border-white/10"
              title={isEl ? 'Αλλαγή γλώσσας σε Αγγλικά' : 'Switch to Greek'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isEl ? 'EL' : 'EN'}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer border border-neutral-200/60 dark:border-white/10"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* If logged in: single open button */}
            {user ? (
              <button
                onClick={handleAction}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer flex items-center gap-2 transform active:scale-95"
              >
                <span>{isEl ? 'Άνοιγμα Εφαρμογής' : 'Open Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenSignIn}
                  className="px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {isEl ? 'Σύνδεση' : 'Sign In'}
                </button>
                <button
                  onClick={onOpenRegister || handleAction}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer flex items-center gap-1.5 transform active:scale-95"
                >
                  <span>{isEl ? 'Έναρξη' : 'Get Started'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Background glow ornaments */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-violet-500/15 to-pink-500/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 shadow-xs text-xs font-bold text-neutral-800 dark:text-neutral-200"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>{isEl ? 'Το σύγχρονο λογισμικό οργάνωσης για την καθημερινότητά σας' : 'The Next-Gen Operating System for Work & Life'}</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.15]"
          >
            {isEl ? (
              <>
                Οργανώστε κάθε <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">Εργασία</span>, <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Χρονοδιάγραμμα</span> & <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">Ομάδα</span>
              </>
            ) : (
              <>
                What is <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">Tasky</span>? Everything You Need to Master Time & Focus.
              </>
            )}
          </motion.h1>

          {/* Subtitle / What is Tasky description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed font-normal"
          >
            {isEl 
              ? 'Το Tasky αντικαθιστά τα κατακερματισμένα εργαλεία, τις σημειώσεις και τα πολύπλοκα ημερολόγια. Ενοποιεί σε μία κομψή εμπειρία τις εκκρεμότητες, το ωριαίο χρονοδιάγραμμα ημέρας, τις συνήθειες και τα πλάνα σας με αυστηρή προστασία απορρήτου.'
              : 'Tasky unites your daily deliverables, hour-by-hour timeline schedule, habit streaks, Kanban projects, and organizational privacy rings in one unified, distraction-free environment. Built for individuals, families, and businesses.'
            }
          </motion.p>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 pt-2"
          >
            <button
              onClick={user ? handleAction : (onOpenRegister || handleAction)}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{user ? (isEl ? 'Είσοδος στο Workspace' : 'Open Workspace') : (isEl ? 'Ξεκινήστε Δωρεάν στο Tasky' : 'Launch Your Workspace')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user && (
              <button
                onClick={onOpenSignIn}
                className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>{isEl ? 'Σύνδεση Χρήστη' : 'Sign In'}</span>
              </button>
            )}

            <a
              href="#pictures-showcase"
              onClick={(e) => scrollToSection(e, 'pictures-showcase')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{isEl ? 'Δείτε τις Εικόνες & Λειτουργίες' : 'Explore Pictures & Features'}</span>
            </a>
          </motion.div>

          {/* Key Value Points Ticker */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 pt-8 w-full max-w-3xl text-left"
          >
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{isEl ? 'GDPR Ασφάλεια' : 'GDPR Isolation'}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{isEl ? 'Πλήρης προστασία' : 'Zero Data Leak'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 shadow-2xs">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{isEl ? 'Ωριαίο Πρόγραμμα' : 'Hour Timeline'}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{isEl ? 'Καμία επικάλυψη' : 'Slot by Slot'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 shadow-2xs">
              <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{isEl ? 'Συνήθειες & Streaks' : 'Habit Streaks'}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{isEl ? 'Καθημερινή συνέπεια' : 'Milestone Medals'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 shadow-2xs">
              <Zap className="w-5 h-5 text-violet-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{isEl ? 'Συγχρονισμός Cloud' : 'Real-Time Sync'}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{isEl ? 'Και σε Offline mode' : 'Offline Capable'}</p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. SECTION: WHAT IS TASKY? (DEEP DIVE) */}
      <section id="what-is-tasky" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-neutral-200/60 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isEl ? 'Η Φιλοσοφία του Tasky' : 'The Core Architecture'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isEl ? 'Τι είναι το Tasky και γιατί δημιουργήθηκε;' : 'What is Tasky & Why Is It Different?'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {isEl
              ? 'Τα περισσότερα εργαλεία είναι είτε υπερβολικά απλές λίστες είτε υπερβολικά περίπλοκα συστήματα που κουράζουν. Το Tasky σχεδιάστηκε για να προσφέρει τέλεια ισορροπία, χωρίζοντας τη ζωή και την εργασία σε 4 θεμελιώδεις πυλώνες:'
              : 'Most productivity apps are either trivial to-do checklists or bloated project managers. Tasky strikes the ideal balance, anchoring your workflow in 4 core pillars:'
            }
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isEl ? '1. Κεντρικός Κόμβος Εργασιών' : '1. Unified Task Engine'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Οργανώστε τις εκκρεμότητες με προτεραιότητες (Urgent, High, Normal, Low), υπο-εργασίες, αναθέσεις μελών και αυτόματους μετρητές προθεσμιών.'
                : 'Organize tasks with intelligent priority levels, sub-task breakdowns, tags, multi-assignees, and deadline counters.'
              }
            </p>
            <ul className="text-[11px] space-y-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> {isEl ? 'Φίλτρα ανά προτεραιότητα & πλάνο' : 'Filter by priority & plan'}</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> {isEl ? 'Αυτόματος υπολογισμός προόδου' : 'Automated progress calculation'}</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isEl ? '2. Ωριαίο Χρονοδιάγραμμα' : '2. Hour-by-Hour Timeline'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Μην αφήνετε τις εργασίες απλώς σε μια λίστα. Τοποθετήστε τις σε συγκεκριμένα χρονικά διαστήματα στον οπτικό άξονα 24 ωρών.'
                : 'Bridge the gap between lists and calendars. Place tasks directly onto hour-by-hour time slots to eliminate over-scheduling.'
              }
            </p>
            <ul className="text-[11px] space-y-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500" /> {isEl ? 'Οπτικός προγραμματισμός slot' : 'Visual slot scheduling'}</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500" /> {isEl ? 'Προβολή Ημέρας / Εβδομάδας / Μήνα' : 'Day, Week & Month Views'}</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isEl ? '3. Συνήθειες & Σερί (Streaks)' : '3. Habit & Streak Tracker'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Χτίστε καθημερινή συνέπεια για γυμναστήριο, διάβασμα, ενυδάτωση ή εργασία με φλόγες σερί και μετάλλια επιτευγμάτων.'
                : 'Build unbreakable daily consistency for health, reading, hydration, and deep work with streak flames and medals.'
              }
            </p>
            <ul className="text-[11px] space-y-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> {isEl ? 'Μετάλλια επιτευγμάτων' : 'Achievement milestone medals'}</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> {isEl ? 'Εβδομαδιαία στατιστικά συνέπειας' : 'Consistency analytics'}</li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {isEl ? '4. Απομονωμένα Πλάνα & Ρόλοι' : '4. Isolated Workspaces & Roles'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Επιλέξτε Προσωπικό (Single), Οικογενειακό (Family) ή Εταιρικό (Company) πλάνο. Τα προσωπικά δεδομένα μένουν πάντα κλειδωμένα.'
                : 'Choose Single (Personal), Family, or Company workspaces with strict role-based access control and zero data leakage.'
              }
            </p>
            <ul className="text-[11px] space-y-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {isEl ? 'Αυστηρή προστασία GDPR' : 'Strict GDPR Privacy'}</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {isEl ? 'Κλείδωμα προσωπικού πλάνου' : 'Locked personal boundaries'}</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 4. SECTION: PICTURES & INTERACTIVE UI SHOWCASE */}
      <section id="pictures-showcase" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-neutral-200/60 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isEl ? 'Εικόνες της Εφαρμογής' : 'Live Interactive Visuals'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isEl ? 'Δείτε το Tasky στην πράξη' : 'Pictures of Tasky in Action'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isEl
              ? 'Περιηγηθείτε στις πραγματικές οθόνες του συστήματος. Κάντε κλικ στις καρτέλες για να δείτε πώς μοιάζει το περιβάλλον εργασίας.'
              : 'Browse high-fidelity simulated pictures of Tasky’s core interfaces. Click through each module to explore how it looks and operates.'
            }
          </p>
        </div>

        {/* Gallery Tabs Selector */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-6">
          <button
            onClick={() => setActiveShowcaseTab('dashboard')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeShowcaseTab === 'dashboard'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isEl ? 'Εικόνα 1: Dashboard' : 'Picture 1: Dashboard'}</span>
          </button>

          <button
            onClick={() => setActiveShowcaseTab('timeline')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeShowcaseTab === 'timeline'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{isEl ? 'Εικόνα 2: Χρονοδιάγραμμα' : 'Picture 2: Timeline Schedule'}</span>
          </button>

          <button
            onClick={() => setActiveShowcaseTab('projects')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeShowcaseTab === 'projects'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>{isEl ? 'Εικόνα 3: Έργα (Projects)' : 'Picture 3: Agile Projects'}</span>
          </button>

          <button
            onClick={() => setActiveShowcaseTab('habits')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeShowcaseTab === 'habits'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isEl ? 'Εικόνα 4: Συνήθειες' : 'Picture 4: Habits & Goals'}</span>
          </button>

          <button
            onClick={() => setActiveShowcaseTab('privacy')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeShowcaseTab === 'privacy'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isEl ? 'Εικόνα 5: Πλάνα & Ασφάλεια' : 'Picture 5: Workspaces'}</span>
          </button>
        </div>

        {/* The Picture / Interactive Mockup Frame */}
        <div className="bg-white dark:bg-[#121320] border border-neutral-200/90 dark:border-white/10 rounded-[32px] p-4 sm:p-8 shadow-2xl overflow-hidden max-w-5xl mx-auto">
          
          {/* Simulated Browser Header */}
          <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-neutral-400 ml-2">
                tasky.app/{activeShowcaseTab}
              </span>
            </div>
            <div className="text-xs font-bold text-neutral-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isEl ? 'Ζωντανή Προεπισκόπηση Συστήματος' : 'Interactive System Snapshot'}</span>
            </div>
          </div>

          {/* TAB 1: DASHBOARD PICTURE */}
          {activeShowcaseTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Dashboard Hero Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/20">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-200 font-bold">
                    {isEl ? 'ΚΑΛΩΣ ΗΡΘΑΤΕ ΣΤΟ WORKSPACE' : 'WELCOME TO YOUR WORKSPACE'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    {isEl ? 'Καλημέρα! Έχετε 4 σημαντικές εργασίες σήμερα' : 'Good Morning! You have 4 active focus tasks today'}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1">
                    {isEl ? 'Συνολική πρόοδος ημέρας: 65% ολοκληρωμένη' : 'Overall daily progress: 65% completed on schedule'}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                    <p className="text-lg font-bold font-mono">14</p>
                    <p className="text-[10px] uppercase font-bold text-indigo-200">{isEl ? 'Ολοκληρώθηκαν' : 'Completed'}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                    <p className="text-lg font-bold font-mono text-amber-300">4</p>
                    <p className="text-[10px] uppercase font-bold text-indigo-200">{isEl ? 'Σε εξέλιξη' : 'In Progress'}</p>
                  </div>
                </div>
              </div>

              {/* Task Items Interactive List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {isEl ? 'Διαδραστικές Εργασίες Ημέρας (Κάντε κλικ για δοκιμή):' : 'Interactive Focus Tasks (Click checkmark to test):'}
                  </h4>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {demoTasks.filter(t => t.done).length} / {demoTasks.length} {isEl ? 'έτοιμες' : 'done'}
                  </span>
                </div>

                {demoTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => toggleDemoTask(task.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      task.done 
                        ? 'bg-neutral-100/70 dark:bg-white/5 border-neutral-200/60 dark:border-white/5 opacity-75' 
                        : 'bg-white dark:bg-neutral-800/40 border-neutral-200/80 dark:border-white/10 hover:border-indigo-500/50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        type="button"
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          task.done 
                            ? 'bg-emerald-500 text-white' 
                            : 'border-2 border-neutral-300 dark:border-white/20 hover:border-indigo-500'
                        }`}
                      >
                        {task.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <span className={`text-xs sm:text-sm font-semibold truncate ${
                        task.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-100'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline-block">
                        {task.time}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        task.priority === 'Urgent' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40' 
                          : task.priority === 'High'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: TIMELINE SCHEDULE PICTURE */}
          {activeShowcaseTab === 'timeline' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold">{isEl ? 'Ωριαίος Άξονας Προγραμματισμού (09:00 - 18:00)' : 'Hourly Schedule Grid (09:00 - 18:00)'}</span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-white dark:bg-white/10 px-2 py-0.5 rounded-lg">
                  {isEl ? 'Σήμερα' : 'Today'}
                </span>
              </div>

              {/* Hourly Slots simulation */}
              <div className="space-y-2 divide-y divide-neutral-200/40 dark:divide-white/5">
                
                {/* 09:00 */}
                <div className="pt-2 flex items-start gap-4">
                  <span className="text-xs font-mono font-bold text-neutral-400 w-12 shrink-0">09:00</span>
                  <div className="flex-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{isEl ? 'Πρωινός Συντονισμός Ομάδας (Daily Standup)' : 'Morning Team Standup & Sync'}</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">09:00 - 09:45 • Room A</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white">Company</span>
                  </div>
                </div>

                {/* 11:00 */}
                <div className="pt-2 flex items-start gap-4">
                  <span className="text-xs font-mono font-bold text-neutral-400 w-12 shrink-0">11:00</span>
                  <div className="flex-1 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{isEl ? 'Αρχιτεκτονική Νέου Feature (Deep Focus)' : 'Feature Architecture Deep Focus'}</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">11:00 - 13:00 • Personal Workspace</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">Personal</span>
                  </div>
                </div>

                {/* 14:30 */}
                <div className="pt-2 flex items-start gap-4">
                  <span className="text-xs font-mono font-bold text-neutral-400 w-12 shrink-0">14:30</span>
                  <div className="flex-1 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{isEl ? 'Οικογενειακές Υποχρεώσεις & Αγορές' : 'Family Supplies & Routine Tasks'}</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">14:30 - 15:30 • Family Circle</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600 text-white">Family</span>
                  </div>
                </div>

                {/* 16:30 */}
                <div className="pt-2 flex items-start gap-4">
                  <span className="text-xs font-mono font-bold text-neutral-400 w-12 shrink-0">16:30</span>
                  <div className="flex-1 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{isEl ? 'Έλεγχος Παραδοτέων Sprint & QA' : 'Sprint Delivery Review & QA Test'}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">16:30 - 17:30 • Project Board</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">Deliverable</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: PROJECTS KANBAN PICTURE */}
          {activeShowcaseTab === 'projects' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {/* Column 1: To Do */}
              <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{isEl ? 'Προς Εκτέλεση' : 'To Do'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 font-bold">2</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-white/10 shadow-xs space-y-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600">Frontend</span>
                  <p className="text-xs font-bold text-neutral-800 dark:text-white">Implement offline data caching</p>
                  <p className="text-[10px] text-neutral-400">Due in 2 days</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-white/10 shadow-xs space-y-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600">Design</span>
                  <p className="text-xs font-bold text-neutral-800 dark:text-white">Dark mode contrast checks</p>
                  <p className="text-[10px] text-neutral-400">Due tomorrow</p>
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{isEl ? 'Σε Εξέλιξη' : 'In Progress'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 font-bold">1</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800/40 shadow-xs space-y-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600">Urgent</span>
                  <p className="text-xs font-bold text-neutral-800 dark:text-white">Role-based permission gating</p>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-3/4 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isEl ? 'Ολοκληρωμένα' : 'Completed'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 font-bold">3</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-800/40 shadow-xs space-y-1 opacity-80">
                  <p className="text-xs font-bold text-neutral-800 dark:text-white line-through">Bilingual translation matrix</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Verified & Shipped</p>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: HABITS PICTURE */}
          {activeShowcaseTab === 'habits' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Habit 1 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-white">Morning Exercise & Stretch</h4>
                        <p className="text-[10px] text-neutral-500">Every morning • 30 mins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-amber-500">18</span>
                      <p className="text-[9px] uppercase font-bold text-neutral-400">Day Streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <div key={i} className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold ${
                        i < 5 ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'
                      }`}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habit 2 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-white">Deep Work Code Sprint</h4>
                        <p className="text-[10px] text-neutral-500">Workdays • 90 mins focus</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-indigo-500">12</span>
                      <p className="text-[9px] uppercase font-bold text-neutral-400">Day Streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <div key={i} className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold ${
                        i < 4 ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'
                      }`}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 5: PRIVACY RINGS PICTURE */}
          {activeShowcaseTab === 'privacy' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Single Plan */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                      Single / Personal
                    </span>
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{isEl ? 'Προσωπικός Χώρος' : 'Personal Workspace'}</h4>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    {isEl 
                      ? '100% ιδιωτικό. Οι εργασίες δεν φαίνονται από κανέναν. Η κατάσταση του πλάνου είναι κλειδωμένη και δεν μπορεί να μετατραπεί σε multi-people.'
                      : '100% private. Isolated data perimeter. Cannot be converted into multi-people to preserve privacy integrity.'}
                  </p>
                </div>

                {/* Family Plan */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-600 text-white">
                      Family Circle
                    </span>
                    <Heart className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{isEl ? 'Οικογενειακό Πλάνο' : 'Family Circle'}</h4>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    {isEl
                      ? 'Κοινές οικιακές εργασίες, λίστες σούπερ μάρκετ και οικογενειακό πρόγραμμα με ειδικούς ρόλους γονέα, εφήβου και παιδιού.'
                      : 'Shared household chores, events, and groceries with parent, teen, and child safety safeguards.'}
                  </p>
                </div>

                {/* Company Plan */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      Company Enterprise
                    </span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{isEl ? 'Εταιρικό Πλάνο' : 'Corporate Enterprise'}</h4>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    {isEl
                      ? 'Εταιρική ιεραρχία (Admin, Manager, Supervisor, User), ανάθεση εργασιών, εταιρικό chatroom και διαχείριση sprints.'
                      : 'Corporate role hierarchy (Admin, Manager, Supervisor, Member), project assignments, and team chat.'}
                  </p>
                </div>

              </div>
            </motion.div>
          )}

        </div>
      </section>

      {/* 5. SECTION: HOW IT WORKS (4 STEPS) */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-neutral-200/60 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isEl ? 'Οδηγός Χρήσης' : 'Simple Workflow'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isEl ? 'Πώς Λειτουργεί το Tasky σε 4 Βήματα' : 'How Tasky Works in 4 Steps'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isEl
              ? 'Χρειάζονται λιγότερο από 60 δευτερόλεπτα για να οργανώσετε ολόκληρη την ημέρα σας.'
              : 'Zero complex setup. It takes under 60 seconds to transform chaos into structured daily execution.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="relative p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-3xl font-extrabold font-mono text-indigo-600/30 dark:text-indigo-400/30">
              01
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEl ? 'Επιλέξτε το Πλάνο σας' : 'Choose Your Plan'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Επιλέξτε Προσωπικό χώρο για ιδιωτική χρήση, ή δημιουργήστε Οικογενειακό/Εταιρικό πλάνο για να συνεργαστείτε με άλλα άτομα.'
                : 'Start with a Single personal plan for individual focus, or join a Family circle or Company enterprise workspace.'
              }
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-3xl font-extrabold font-mono text-violet-600/30 dark:text-violet-400/30">
              02
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEl ? 'Καταγράψτε Εργασίες & Προτεραιότητες' : 'Capture & Prioritize'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Προσθέστε τις εκκρεμότητές σας, επιλέξτε προτεραιότητα (Urgent, High, Normal) και οργανώστε τις σε κατηγορίες ή έργα.'
                : 'Input your deliverables with priority tags, deadlines, sub-tasks, and required assignees.'
              }
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-3xl font-extrabold font-mono text-pink-600/30 dark:text-pink-400/30">
              03
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEl ? 'Τοποθετήστε στο Χρονοδιάγραμμα' : 'Schedule on Timeline'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Ανοίξτε το ωριαίο χρονοδιάγραμμα και ορίστε ακριβείς ώρες. Αποφύγετε τις επικαλύψεις και ξέρετε ακριβώς τι κάνετε κάθε ώρα.'
                : 'Drop tasks onto exact hourly time slots on your day timeline to balance workload and prevent meeting fatigue.'
              }
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-3xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 shadow-sm space-y-3">
            <span className="text-3xl font-extrabold font-mono text-emerald-600/30 dark:text-emerald-400/30">
              04
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {isEl ? 'Παρακολουθήστε την Πρόοδο' : 'Track & Achieve'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isEl
                ? 'Σημειώστε ολοκληρωμένες εργασίες, διατηρήστε το σερί των συνηθειών σας και συγχρονίστε τα πάντα σε πραγματικό χρόνο.'
                : 'Check off deliverables, keep daily habit streaks alive, and view productivity metrics in real-time.'
              }
            </p>
          </div>

        </div>
      </section>

      {/* 6. SECTION: PLANS ARCHITECTURE & SECURITY */}
      <section id="plans-privacy" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-neutral-200/60 dark:border-white/5">
        <div className="bg-gradient-to-br from-indigo-900/10 via-violet-900/10 to-transparent border border-indigo-200/60 dark:border-indigo-800/40 rounded-[36px] p-6 sm:p-12 space-y-8">
          
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isEl ? 'Απομόνωση & Πολιτική Απορρήτου' : 'Privacy & Workspace Isolation'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {isEl ? 'Αυστηρό Κλείδωμα Προσωπικών Πλάνων' : 'Strict Personal Plan Protection'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {isEl
                ? 'Στο Tasky, ο χρήστης δεν μπορεί να αλλάξει την κατάσταση του πλάνου από προσωπικό (Single) σε πολλαπλών ατόμων (Company ή Family). Αυτός ο κανόνας είναι σχεδιασμένος ώστε τα προσωπικά σας αρχεία, σημειώσεις και συνήθειες να μην κινδυνεύουν ποτέ να εκτεθούν σε συναδέλφους ή μέλη ομάδας.'
                : 'In Tasky, users cannot convert plan status from Personal (Single) to multi-people (Company or Family). This architectural boundary guarantees that your private notes, habits, and deliverables can never be accidentally shared with colleagues.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{isEl ? 'Προσωπικό (Single)' : 'Personal Plan'}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {isEl 
                    ? 'Μόνιμα κλειδωμένο για 1 άτομο. Καμία δυνατότητα προσθήκης μελών, απόλυτη ηρεμία.'
                    : 'Permanently locked to one individual. Zero member invitations, complete peace of mind.'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={user ? onLaunchApp : (onOpenRegister || handleAction)}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/60 dark:border-indigo-800/40"
              >
                <span>{isEl ? 'Έναρξη Προσωπικού' : 'Start Personal Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{isEl ? 'Οικογενειακό (Family)' : 'Family Plan'}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {isEl 
                    ? 'Κοινόχρηστο πλάνο για το σπίτι. Πρόσκληση μελών με ρόλους γονέα, εφήβου ή παιδιού.'
                    : 'Shared household circle. Invite family members with parent, teen, and child roles.'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={user ? onLaunchApp : (onOpenRegister || handleAction)}
                className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200/60 dark:border-purple-800/40"
              >
                <span>{isEl ? 'Δημιουργία Family Plan' : 'Create Family Circle'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{isEl ? 'Εταιρικό (Company)' : 'Company Plan'}</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {isEl 
                    ? 'Επαγγελματικό πλάνο με ρόλους Manager, Supervisor και Member. Εταιρικό chat & projects.'
                    : 'Enterprise plan with Manager, Supervisor, and Member ranks. Built-in chat & sprints.'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCompany || handleAction}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/40"
              >
                <span>{isEl ? 'Αίτηση Εταιρικού Χώρου' : 'Request Company Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq-section" className="py-16 sm:py-24 px-4 sm:px-8 max-w-4xl mx-auto border-t border-neutral-200/60 dark:border-white/5">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isEl ? 'Συχνές Ερωτήσεις' : 'Frequently Asked Questions'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isEl ? 'Όλα όσα θέλετε να γνωρίζετε για το Tasky' : 'Everything You Need to Know'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl bg-white dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 overflow-hidden shadow-2xs"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${expandedFaq === idx ? 'rotate-90 text-indigo-500' : ''}`} />
              </button>
              
              {expandedFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl shadow-indigo-500/25 relative overflow-hidden">
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {isEl ? 'Έτοιμοι να ζήσετε την εμπειρία του Tasky;' : 'Ready to Experience Total Focus with Tasky?'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {isEl
                ? 'Εισέλθετε τώρα στο προσωπικό ή εταιρικό σας περιβάλλον εργασίας. Χωρίς περίπλοκες ρυθμίσεις.'
                : 'Launch your isolated workspace now. No complicated onboarding, zero friction.'
              }
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleAction}
                className="px-8 py-4 bg-white text-indigo-700 hover:bg-neutral-100 font-extrabold text-sm rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2 transform active:scale-95"
              >
                <span>{user ? (isEl ? 'Είσοδος στο Dashboard' : 'Go to My Dashboard') : (isEl ? 'Είσοδος στο Σύστημα' : 'Open Tasky Workspace')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-neutral-200/60 dark:border-white/10 py-10 px-4 sm:px-8 max-w-7xl mx-auto text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={DEFAULT_APP_LOGO} 
            alt="Tasky" 
            className="w-5 h-5 rounded-lg object-cover" 
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-neutral-700 dark:text-neutral-300">Tasky</span>
          <span>© eliasgeorgiou. {isEl ? 'Όλα τα δικαιώματα διατηρούνται.' : 'All rights reserved.'}</span>
        </div>

        <div className="flex items-center gap-4 font-semibold">
          <a 
            href="#what-is-tasky" 
            onClick={(e) => scrollToSection(e, 'what-is-tasky')}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {isEl ? 'Τι είναι το Tasky' : 'What is Tasky'}
          </a>
          <a 
            href="#pictures-showcase" 
            onClick={(e) => scrollToSection(e, 'pictures-showcase')}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {isEl ? 'Εικόνες' : 'Pictures'}
          </a>
          <a 
            href="#how-it-works" 
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {isEl ? 'Πώς λειτουργεί' : 'How it works'}
          </a>
          <a 
            href="#faq-section" 
            onClick={(e) => scrollToSection(e, 'faq-section')}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            FAQ
          </a>
        </div>
      </footer>

    </div>
  );
};
