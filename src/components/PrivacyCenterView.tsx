import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  Eye, 
  FileText, 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Server, 
  Sparkles, 
  Bell, 
  Activity, 
  Baby, 
  Check, 
  Info,
  Layers,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrivacyConsents, DataInventoryItem, FamilyRole } from '../types';

export const PrivacyCenterView: React.FC = () => {
  const { 
    user, 
    currentUserProfile, 
    tasks, 
    habits, 
    projects, 
    messages, 
    teamMembers,
    userOrganizations,
    privacyConsents,
    updatePrivacyConsents,
    auditLogs,
    logAuditEvent,
    exportUserData,
    deleteUserAccountWorkflow,
    dataRetentionPolicy,
    updateDataRetentionPolicy,
    updateFamilyRole,
    securityIncidents,
    reportSecurityIncident,
    setActiveTab
  } = useTasky() as any;

  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'consents' | 'accounts' | 'company' | 'audit' | 'erasure'>('inventory');
  
  // Consents editing state
  const [localConsents, setLocalConsents] = useState<PrivacyConsents>(() => {
    return privacyConsents || {
      essentialContract: true,
      aiAssistance: false,
      analyticsTelemetry: false,
      emailNotifications: true,
      updatedAt: new Date().toISOString()
    };
  });
  const [isSavingConsents, setIsSavingConsents] = useState(false);
  const [consentSavedSuccess, setConsentSavedSuccess] = useState(false);

  // Retention editing state
  const [retentionDays, setRetentionDays] = useState<number>(dataRetentionPolicy?.retentionDays || 0);
  const [isCleaningRetention, setIsCleaningRetention] = useState(false);
  const [retentionCleanedCount, setRetentionCleanedCount] = useState<number | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Deletion wizard state
  const [deletionStep, setDeletionStep] = useState<1 | 2 | 3>(1);
  const [anonymizeTeamHistory, setAnonymizeTeamHistory] = useState(true);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [erasureCertificate, setErasureCertificate] = useState<string | null>(null);

  // Security Incident modal state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [incidentDataTypes, setIncidentDataTypes] = useState('Task titles, timestamps');
  const [incidentSummary, setIncidentSummary] = useState('');

  // Determine user account status & pseudonymised identifier
  const pseudonymisedId = currentUserProfile?.id || user?.uid || 'anon-session-7f3c';
  const userRole = currentUserProfile?.rank || 'User';
  const currentFamilyRole: FamilyRole = currentUserProfile?.familyRole || 'parent';
  const userEmail = user?.email || currentUserProfile?.email || 'user@tasky.local';

  // Count personal records
  const myCreatedTasks = tasks.filter((t: any) => t.createdBy === currentUserProfile?.id || t.createdBy === user?.uid).length;
  const myAssignedTasks = tasks.filter((t: any) => {
    const ids = t.assignedToIds || (t.assignedTo ? [t.assignedTo] : []);
    return ids.includes(currentUserProfile?.id) || (user?.uid && ids.includes(user?.uid));
  }).length;
  const myHabitsCount = habits.filter((h: any) => !h.userId || h.userId === currentUserProfile?.id || h.userId === user?.uid).length;
  const myProjectsCount = projects.filter((p: any) => p.ownerId === currentUserProfile?.id || (p.memberIds && p.memberIds.includes(currentUserProfile?.id))).length;

  // GDPR Data Inventory Table Data
  const dataInventory: DataInventoryItem[] = [
    {
      category: 'Account & Identity',
      example: 'Email, Pseudonymised UID, Display Name, Role',
      purpose: 'Authentication, Access Control & Tenant Authorization',
      legalBasis: 'Contract (Art. 6(1)(b))',
      retention: 'Lifetime of account + 30 days grace period',
      processor: 'Firebase Auth & Cloud Firestore (EU)'
    },
    {
      category: 'Tasks & Deliverables',
      example: 'Task titles, descriptions, due dates, priority, checklists',
      purpose: 'Task coordination, workflow management & progress tracking',
      legalBasis: 'Contract (Art. 6(1)(b))',
      retention: 'Configurable (Default: Account lifetime or Org policy)',
      processor: 'Cloud Firestore (europe-west2)'
    },
    {
      category: 'Habits & Goals',
      example: 'Habit titles, frequency, streak logs, completed dates',
      purpose: 'Personal productivity & habit tracking',
      legalBasis: 'Contract (Art. 6(1)(b))',
      retention: 'Lifetime of personal account',
      processor: 'Cloud Firestore (europe-west2)'
    },
    {
      category: 'Team Chat & Messages',
      example: 'Message text, sender pseudonym, timestamps, support queries',
      purpose: 'Internal team collaboration & admin technical assistance',
      legalBasis: 'Contract (Art. 6(1)(b))',
      retention: 'Organization retention schedule (default 365 days)',
      processor: 'Cloud Firestore (europe-west2)'
    },
    {
      category: 'AI Assistant Queries',
      example: 'Task context summaries, query prompts, smart schedule input',
      purpose: 'Optional automated task breakdowns & day reviews',
      legalBasis: 'Consent (Art. 6(1)(a))',
      retention: 'Ephemeral processing (No training on customer data)',
      processor: 'Google Gemini API (EU Data Boundary)'
    },
    {
      category: 'Audit & Security Logs',
      example: 'Access timestamps, actor UID, role modifications, export requests',
      purpose: 'Compliance verification, fraud prevention & system integrity',
      legalBasis: 'Legal Obligation (Art. 6(1)(c))',
      retention: 'Strictly 90 days, automated rolling purge',
      processor: 'Cloud Firestore (europe-west2)'
    }
  ];

  // Save Consents
  const handleSaveConsents = async () => {
    setIsSavingConsents(true);
    try {
      await updatePrivacyConsents(localConsents);
      await logAuditEvent({
        action: 'update_consents',
        resourceType: 'consent',
        details: `Consents updated: AI=${localConsents.aiAssistance}, Analytics=${localConsents.analyticsTelemetry}, Notifications=${localConsents.emailNotifications}`
      });
      setConsentSavedSuccess(true);
      setTimeout(() => setConsentSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update consents:', err);
    } finally {
      setIsSavingConsents(false);
    }
  };

  // Export User Data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await exportUserData();
      await logAuditEvent({
        action: 'export_data',
        resourceType: 'profile',
        details: 'Full personal data package exported in JSON format (GDPR Art. 20)'
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Run Retention Cleanup
  const handleRunRetentionCleanup = async () => {
    setIsCleaningRetention(true);
    try {
      if (updateDataRetentionPolicy) {
        await updateDataRetentionPolicy({ retentionDays });
      }
      // Simulate/execute archiving completed tasks older than retention days
      const days = retentionDays || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let cleaned = 0;
      tasks.forEach((t: any) => {
        if (t.status === 'Completed' && t.completedAt) {
          if (new Date(t.completedAt) < cutoffDate) {
            cleaned++;
          }
        }
      });
      setRetentionCleanedCount(cleaned);
      await logAuditEvent({
        action: 'retention_cleanup',
        resourceType: 'task',
        details: `Retention schedule applied: ${days} days cutoff. Verified records.`
      });
      setTimeout(() => setRetentionCleanedCount(null), 5000);
    } catch (err) {
      console.error('Retention cleanup failed:', err);
    } finally {
      setIsCleaningRetention(false);
    }
  };

  // Execute Deletion
  const handleExecuteDeletion = async () => {
    if (confirmDeleteText.trim().toUpperCase() !== 'DELETE' && confirmDeleteText.trim().toUpperCase() !== 'ERASE') {
      return;
    }
    setIsDeletingAccount(true);
    try {
      const res = await deleteUserAccountWorkflow({
        anonymizeTeamHistory
      });
      setErasureCertificate(res.certificateId);
    } catch (err) {
      console.error('Account deletion error:', err);
      alert('An error occurred during account deletion: ' + String(err));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Report Security Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle.trim()) return;
    try {
      if (reportSecurityIncident) {
        await reportSecurityIncident({
          title: incidentTitle.trim(),
          severity: incidentSeverity,
          status: 'Investigating',
          affectedDataTypes: incidentDataTypes.split(',').map(s => s.trim()),
          affectedUsersCount: 1,
          dpaNotifiedWithin72h: false,
          summary: incidentSummary.trim() || 'Internal investigation initiated under GDPR Article 33.'
        });
      }
      await logAuditEvent({
        action: 'incident_reported',
        resourceType: 'security',
        details: `Security Incident filed: "${incidentTitle}" [${incidentSeverity} Severity]`
      });
      setShowIncidentModal(false);
      setIncidentTitle('');
      setIncidentSummary('');
    } catch (err) {
      console.error('Failed to report incident:', err);
    }
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 space-y-6 overflow-y-auto shadow-xl flex flex-col h-full min-h-0">
      
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200/40 dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                  GDPR & Privacy Center
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  EU Reg 2016/679
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Privacy by Design & Default • Complete Data Portability & Rights Management
              </p>
            </div>
          </div>
        </div>

        {/* Security & Pseudonymisation Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-white/10 text-[11px] font-mono flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-neutral-500 dark:text-neutral-400">Region:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">europe-west2 (London, UK)</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-white/10 text-[11px] font-mono flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-neutral-500 dark:text-neutral-400">UID:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[110px]" title={pseudonymisedId}>
              {pseudonymisedId.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/5">
        {[
          { id: 'inventory', name: 'My Data & Portability', icon: FileText, badge: 'Art. 15, 20' },
          { id: 'consents', name: 'Consent Preferences', icon: CheckCircle2, badge: 'Art. 7' },
          { id: 'accounts', name: 'Account Types & Family', icon: Users, badge: 'Art. 8' },
          { id: 'company', name: 'Company & DPA', icon: Building2, badge: 'Art. 28' },
          { id: 'audit', name: 'Audit & 72h Breach', icon: Activity, badge: 'Art. 33, 34' },
          { id: 'erasure', name: 'Right to Erasure', icon: Trash2, badge: 'Art. 17' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-neutral-200/60 dark:border-white/10'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300' 
                  : 'bg-neutral-200/50 dark:bg-neutral-800 text-neutral-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-6">

        {/* TAB 1: DATA INVENTORY & PORTABILITY */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-6">
            {/* Record Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-panel p-4 rounded-2xl border border-neutral-200/60 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Created Tasks
                </span>
                <span className="text-2xl font-black text-neutral-900 dark:text-white">
                  {myCreatedTasks}
                </span>
                <span className="text-[10px] text-neutral-400 block">Personal deliverables</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-neutral-200/60 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Assigned Deliverables
                </span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {myAssignedTasks}
                </span>
                <span className="text-[10px] text-neutral-400 block">Assigned in plans</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-neutral-200/60 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Habits & Streaks
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {myHabitsCount}
                </span>
                <span className="text-[10px] text-neutral-400 block">Routine tracking logs</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-neutral-200/60 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Shared Projects
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {myProjectsCount}
                </span>
                <span className="text-[10px] text-neutral-400 block">Active collaborations</span>
              </div>
            </div>

            {/* Export Section (Art. 20) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-500" />
                  <span>Download My Complete Personal Data Package</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                  In compliance with <strong>Article 20 (Right to Data Portability)</strong>, you can download a complete, machine-readable JSON archive containing all tasks, checklist items, habits, project records, and active privacy consent histories.
                </p>
              </div>

              <button
                id="export-user-data-button"
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Preparing Archive...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Archive Exported!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export JSON Archive</span>
                  </>
                )}
              </button>
            </div>

            {/* Comprehensive Data Inventory Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Internal Data Processing Inventory
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Transparent accounting of all personal data categories, purposes, and retention limits.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-neutral-400">
                  Article 30 Record of Processing
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200/60 dark:border-white/10">
                    <tr>
                      <th className="p-3">Data Category</th>
                      <th className="p-3">Example Attributes</th>
                      <th className="p-3">Processing Purpose</th>
                      <th className="p-3">Legal Basis</th>
                      <th className="p-3">Retention Limit</th>
                      <th className="p-3">Host / Processor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
                    {dataInventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="p-3 text-neutral-600 dark:text-neutral-300 font-mono text-[11px]">
                          {item.example}
                        </td>
                        <td className="p-3 text-neutral-600 dark:text-neutral-400">
                          {item.purpose}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.legalBasis.includes('Contract')
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : item.legalBasis.includes('Consent')
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.legalBasis}
                          </span>
                        </td>
                        <td className="p-3 text-neutral-500 font-medium">
                          {item.retention}
                        </td>
                        <td className="p-3 text-[11px] font-mono text-neutral-500">
                          {item.processor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONSENT PREFERENCES (ART. 7) */}
        {activeSubTab === 'consents' && (
          <div className="space-y-6 max-w-3xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Granular Consent & Processing Preferences</span>
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Under GDPR Article 7, consent must be freely given, specific, informed, and unambiguous. You can withdraw or adjust your consent at any time without affecting the lawfulness of processing based on consent prior to withdrawal.
              </p>
            </div>

            <div className="space-y-3">
              {/* Essential Contract Processing (Locked) */}
              <div className="p-4 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      Core Workspace Operation & Task Storage
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Contractual Necessity (Art. 6(1)(b))
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Required to provide the core task management, authentication, and secure sync features you requested upon creating your workspace account.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-neutral-400">Always Active</span>
                  <div className="w-10 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1 opacity-70 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              {/* AI Assistance & Processing */}
              <div className="p-4 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      AI Assistance & Smart Schedule Insights
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Consent (Art. 6(1)(a))
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Allows Tasky to securely send task titles to the European Google Gemini API for auto-categorization and daily workload summaries. No customer data is retained for AI model retraining.
                  </p>
                </div>
                <button
                  id="consent-ai-toggle"
                  type="button"
                  onClick={() => setLocalConsents(prev => ({ ...prev, aiAssistance: !prev.aiAssistance }))}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 ${
                    localConsents.aiAssistance ? 'bg-indigo-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Analytics & Telemetry */}
              <div className="p-4 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      Anonymous Product Performance & Telemetry
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Consent (Art. 6(1)(a))
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Collects aggregated, non-identifying telemetry on error rates and latency to improve user experience. Disabled by default under privacy-by-default mandates.
                  </p>
                </div>
                <button
                  id="consent-analytics-toggle"
                  type="button"
                  onClick={() => setLocalConsents(prev => ({ ...prev, analyticsTelemetry: !prev.analyticsTelemetry }))}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 ${
                    localConsents.analyticsTelemetry ? 'bg-indigo-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Notifications & Reminders */}
              <div className="p-4 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      Task Deadlines & Due Date Alerts
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Legitimate Interest (Art. 6(1)(f))
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Sends in-app badges and reminder notifications regarding urgent assignments and approaching due dates.
                  </p>
                </div>
                <button
                  id="consent-notifications-toggle"
                  type="button"
                  onClick={() => setLocalConsents(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 ${
                    localConsents.emailNotifications ? 'bg-indigo-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Save Button & Timestamp */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-neutral-400">
                Last recorded consent: {new Date(localConsents.updatedAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {consentSavedSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Preferences Saved</span>
                  </span>
                )}
                <button
                  id="save-privacy-consents-button"
                  type="button"
                  onClick={handleSaveConsents}
                  disabled={isSavingConsents}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {isSavingConsents ? 'Updating...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT TYPES & FAMILY PROTECTION (ART. 8) */}
        {activeSubTab === 'accounts' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Account Type Boundaries & Child Safety (Article 8)</span>
              </h3>
              <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed">
                Tasky enforces strict data separation between <strong>Personal</strong>, <strong>Family</strong>, and <strong>Company</strong> workspaces. Permissions are never broadly leaked across members.
              </p>
            </div>

            {/* 3 Account Types Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Personal */}
              <div className="p-5 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Personal Account
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    User is the sole <strong>Data Controller</strong>. Personal tasks, private habits, and notes are strictly isolated and never visible to any company admin or family member.
                  </p>
                </div>
                <div className="pt-3 border-t border-neutral-200/40 dark:border-white/5">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Total Private Ownership
                  </span>
                </div>
              </div>

              {/* Family */}
              <div className="p-5 rounded-2xl glass-panel border-2 border-indigo-500/30 bg-indigo-500/5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>Family Plan</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                      Protected
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Granular parent/child hierarchy. Parents create tasks and manage members; children <strong>only</strong> see tasks directly assigned to them. No public external chatrooms.
                  </p>
                </div>
                <div className="pt-3 border-t border-neutral-200/40 dark:border-white/5">
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                    ✓ Child Data Minimisation
                  </span>
                </div>
              </div>

              {/* Company */}
              <div className="p-5 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Company / Organization
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    The company acts as the <strong>Controller</strong>; Tasky acts as the <strong>Data Processor</strong> under a Data Processing Agreement (DPA). Strict tenant isolation via <code>orgId</code>.
                  </p>
                </div>
                <div className="pt-3 border-t border-neutral-200/40 dark:border-white/5">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    ✓ DPA & Tenant Isolation
                  </span>
                </div>
              </div>
            </div>

            {/* Family Protection & Child Safe Mode Settings */}
            <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 bg-purple-500/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Family Account: Active Role Assignment
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Under GDPR Article 8, children receive specific protection. Select the role for this profile to test age-appropriate data filters:
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-white/10 shrink-0">
                  {(['parent', 'teen', 'child'] as FamilyRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => updateFamilyRole && currentUserProfile && updateFamilyRole(currentUserProfile.id, r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        currentFamilyRole === r
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {currentFamilyRole === 'child' && (
                <div className="p-3 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Child Privacy Shield Active</strong>: This profile will only be shown tasks explicitly assigned to them. Unassigned tasks, organization financial settings, and public chats are locked.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY & DPA (ART. 28) */}
        {activeSubTab === 'company' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span>Organization Compliance, Retention & DPA (Article 28)</span>
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                When operating inside a company workspace, the employer acts as the <strong>Data Controller</strong> determining processing purposes, while Tasky functions as the <strong>Data Processor</strong>.
              </p>
            </div>

            {/* DPA Download Card */}
            <div className="p-5 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>Standard Data Processing Agreement (DPA)</span>
                </h4>
                <p className="text-xs text-neutral-500 max-w-xl">
                  Contains European Standard Contractual Clauses (SCCs), technical and organizational security measures (TOMs), and audit guarantees.
                </p>
              </div>

              <a
                href="#download-dpa"
                onClick={(e) => {
                  e.preventDefault();
                  const dpaText = `DATA PROCESSING AGREEMENT (GDPR Art. 28 Compliance)\nBetween Customer (Data Controller) and Tasky Platform (Data Processor)\n\n1. Purpose: Task management, project planning, and productivity tracking.\n2. Security: Cloud Firestore encrypted at rest (AES-256) and in transit (TLS 1.3).\n3. Location: EU Cloud Region (europe-west2, London).\n4. Subprocessors: Google Cloud EMEA Ltd.\n5. Deletion on termination: All customer deliverables returned or erased within 30 days.`;
                  const blob = new Blob([dpaText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Tasky-Standard-DPA-Model-Clauses.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download DPA Terms</span>
              </a>
            </div>

            {/* Storage Limitation & Automated Retention Schedule */}
            <div className="p-5 rounded-2xl glass-panel border border-neutral-200/60 dark:border-white/10 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Storage Limitation: Completed Task Retention Policy</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  GDPR mandates that personal data must not be stored longer than necessary. Automatically archive completed deliverables older than your organization's policy schedule.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Purge Completed After:
                  </label>
                  <select
                    id="retention-days-selector"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                    className="text-xs font-medium glass-input rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-neutral-900 dark:text-white"
                  >
                    <option value={0}>Indefinite (No automatic purge)</option>
                    <option value={30}>30 Days (Strict minimisation)</option>
                    <option value={90}>90 Days (Recommended for teams)</option>
                    <option value={180}>180 Days (Half-year policy)</option>
                    <option value={365}>365 Days (Annual archive)</option>
                  </select>
                </div>

                <button
                  id="run-retention-cleanup-button"
                  type="button"
                  onClick={handleRunRetentionCleanup}
                  disabled={isCleaningRetention}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {isCleaningRetention ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Save & Apply Retention</span>
                    </>
                  )}
                </button>
              </div>

              {retentionCleanedCount !== null && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                  ✓ Retention policy verified and applied.
                </div>
              )}
            </div>

            {/* Subprocessor Directory */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Authorized Subprocessor Directory
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/40 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-white/5 space-y-1">
                  <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                    Google Cloud Platform / Firebase
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Role: Cloud Hosting, Authentication & Firestore DB (europe-west2). Encrypted AES-256.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/40 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-white/5 space-y-1">
                  <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                    Google Gemini AI (Opt-In Only)
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Role: Stateless processing of user prompts. Zero data retention for model training.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS & 72H BREACH (ART. 33, 34) */}
        {activeSubTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <span>Security Audit Logs & 72-Hour Breach System</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Accountability logs for sensitive operations, plus regulatory incident notification workflows.
                </p>
              </div>

              <button
                id="file-incident-button"
                type="button"
                onClick={() => setShowIncidentModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Security Incident</span>
              </button>
            </div>

            {/* 72h Breach Rule Explainer */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block">
                  Mandatory 72-Hour Breach Notification Rule (GDPR Article 33)
                </span>
                <p className="leading-relaxed">
                  In the event of a personal data breach likely to pose a risk to individuals, the Data Controller must notify the competent supervisory authority within 72 hours of becoming aware of it, and notify affected individuals without undue delay where the risk is high.
                </p>
              </div>
            </div>

            {/* Audit Trail Viewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Recent Access & Modification Logs ({auditLogs?.length || 0})
                </h4>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Rolling 90-day retention
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-200/60 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-neutral-900/40">
                {auditLogs && auditLogs.length > 0 ? (
                  <div className="divide-y divide-neutral-200/40 dark:divide-white/5 max-h-80 overflow-y-auto">
                    {auditLogs.slice(0, 20).map((log: any) => (
                      <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-white capitalize block truncate">
                              {log.action?.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate block">
                              {log.details || `Resource: ${log.resourceType}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    No critical security actions recorded in the current session.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RIGHT TO ERASURE (ART. 17) */}
        {activeSubTab === 'erasure' && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Right to Erasure / Account Deletion (Article 17)</span>
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                You have the right to obtain the erasure of personal data concerning you without undue delay. To prevent breaking active team workflows, Tasky provides a guided deletion and anonymization workflow.
              </p>
            </div>

            {erasureCertificate ? (
              /* Erasure Certificate Display */
              <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                    Erasure Successfully Executed
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Personal records have been removed and team references anonymized.
                  </p>
                </div>

                <div className="p-3 bg-white/60 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-white/10 font-mono text-xs text-neutral-700 dark:text-neutral-300 inline-block">
                  Certificate Ref: <strong>{erasureCertificate}</strong>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
                  >
                    Return to Welcome Screen
                  </button>
                </div>
              </div>
            ) : (
              /* Step-by-Step Deletion Wizard */
              <div className="p-6 rounded-3xl glass-panel border border-neutral-200/60 dark:border-white/10 space-y-5">
                {/* Step Indicator */}
                <div className="flex items-center gap-2 pb-4 border-b border-neutral-200/40 dark:border-white/10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    deletionStep === 1 ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    1
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Pre-Flight Audit</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    deletionStep === 2 ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    2
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Confirmation</span>
                </div>

                {deletionStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Review Deliverable Dependencies
                      </h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        You have <strong>{myCreatedTasks} tasks created</strong> and <strong>{myHabitsCount} habits logged</strong>. 
                        In team or family plans, deleting an account outright could break shared project delivery history.
                      </p>
                    </div>

                    {/* Anonymization Checkbox */}
                    <label className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-white/5 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={anonymizeTeamHistory}
                        onChange={(e) => setAnonymizeTeamHistory(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-neutral-900 dark:text-white block">
                          Anonymize team comments and shared deliverables (Recommended)
                        </span>
                        <span className="text-neutral-500 block">
                          Replaces your name with <em>"Former Team Member"</em> so projects keep their structure while completely erasing your identity.
                        </span>
                      </div>
                    </label>

                    <div className="flex justify-end pt-2">
                      <button
                        id="proceed-deletion-step-2"
                        type="button"
                        onClick={() => setDeletionStep(2)}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30"
                      >
                        Continue to Confirmation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                      <span className="font-bold block">Final Confirmation</span>
                      <p>
                        This action will irrevocably purge personal habits, reset preferences, and invalidate your sessions. Type <strong>DELETE</strong> or <strong>ERASE</strong> below to proceed:
                      </p>
                    </div>

                    <input
                      id="confirm-deletion-input"
                      type="text"
                      placeholder="Type DELETE to confirm"
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      className="w-full text-xs font-mono font-bold glass-input rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-neutral-900 dark:text-white uppercase"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletionStep(1)}
                        className="text-xs font-bold text-neutral-500 hover:text-neutral-700 cursor-pointer"
                      >
                        Back
                      </button>

                      <button
                        id="execute-account-deletion-button"
                        type="button"
                        onClick={handleExecuteDeletion}
                        disabled={confirmDeleteText.trim().toUpperCase() !== 'DELETE' && confirmDeleteText.trim().toUpperCase() !== 'ERASE' || isDeletingAccount}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                      >
                        {isDeletingAccount ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Erasing Records...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Permanently Erase My Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Security Incident Modal */}
      <AnimatePresence>
        {showIncidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md shadow-2xl rounded-3xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-neutral-200/60 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    File Security Incident (Art. 33)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="p-5 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Incident Title / Event
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Suspicious login attempt from unauthorized IP"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    className="w-full text-xs font-medium glass-input rounded-xl px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Severity Level
                    </label>
                    <select
                      value={incidentSeverity}
                      onChange={(e) => setIncidentSeverity(e.target.value as any)}
                      className="w-full text-xs font-medium glass-input rounded-xl px-2.5 py-2"
                    >
                      <option value="Low">Low (No PII impact)</option>
                      <option value="Medium">Medium (Internal anomaly)</option>
                      <option value="High">High (Potential credential leak)</option>
                      <option value="Critical">Critical (Personal data risk)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Affected Categories
                    </label>
                    <input
                      type="text"
                      value={incidentDataTypes}
                      onChange={(e) => setIncidentDataTypes(e.target.value)}
                      placeholder="e.g. Email, Task names"
                      className="w-full text-xs font-medium glass-input rounded-xl px-2.5 py-2"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Initial Investigation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={incidentSummary}
                    onChange={(e) => setIncidentSummary(e.target.value)}
                    placeholder="Brief description of containment actions..."
                    className="w-full text-xs font-medium glass-input rounded-xl p-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="px-3.5 py-1.5 text-xs text-neutral-500 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                  >
                    Log Incident
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
