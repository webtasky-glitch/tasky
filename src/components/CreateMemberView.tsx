import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { UserRank } from '../types';
import { motion } from 'motion/react';
import { UserPlus, UserX, Shield, Briefcase, Mail, Key, Building2, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { SendEmailModal } from './SendEmailModal';
import { DEFAULT_STANDARD_PASSWORD, openGmailCompose, getGmailComposeUrl, generateWelcomeEmailSubject, generateWelcomeEmailBody } from '../utils/emailUtils';

export const CreateMemberView: React.FC<{ onSwitchToManage?: () => void }> = ({ onSwitchToManage }) => {
  const { addTeamMemberWithRank, organizations, userOrganizations, currentUserProfile, teamMembers } = useTasky() as any;

  const [name, setName] = useState('');
  const [role, setRole] = useState(''); // Manually added position/role
  const [rank, setRank] = useState<UserRank>('User');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEFAULT_STANDARD_PASSWORD);
  const [orgId, setOrgId] = useState('');
  const [openGmailAfterCreate, setOpenGmailAfterCreate] = useState(true);
  const [success, setSuccess] = useState(false);
  const [createdUserData, setCreatedUserData] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    rank: string;
    orgName?: string;
  } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!name.trim() || !role.trim()) {
      setErrorMsg('Name and position (role) are required.');
      return;
    }

    const effectivePassword = password.trim() || DEFAULT_STANDARD_PASSWORD;
    const effectiveEmail = email.trim();

    try {
      // If the creator is a manager, automatically assign to their company
      const assignedOrgId = currentUserProfile?.rank === 'Manager' 
        ? currentUserProfile.orgId 
        : (orgId || undefined);

      const targetOrg = organizations?.find((o: any) => o.id === assignedOrgId);

      await addTeamMemberWithRank(
        name.trim(),
        role.trim(),
        rank,
        effectiveEmail || undefined,
        effectivePassword,
        assignedOrgId
      );

      const created = {
        name: name.trim(),
        email: effectiveEmail,
        password: effectivePassword,
        role: role.trim(),
        rank,
        orgName: targetOrg?.name
      };

      setCreatedUserData(created);
      setSuccess(true);

      // If option to open Gmail is selected and email was provided
      if (openGmailAfterCreate && effectiveEmail) {
        const subject = generateWelcomeEmailSubject(created.name);
        const body = generateWelcomeEmailBody({
          name: created.name,
          email: created.email,
          password: created.password,
          role: created.role,
          rank: created.rank,
          orgName: created.orgName
        });
        openGmailCompose({
          to: created.email,
          subject,
          body
        });
      }

      // Reset Form fields
      setName('');
      setRole('');
      setRank('User');
      setEmail('');
      setPassword(DEFAULT_STANDARD_PASSWORD);
      setOrgId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add member.');
    }
  };

  // Only Admin or Manager can access this tab
  const canAccess = currentUserProfile?.rank === 'Admin' || currentUserProfile?.rank === 'Manager';

  if (!canAccess) {
    return (
      <div className="flex-1 glass-panel rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
        <Shield className="w-16 h-16 text-rose-500/80 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">Access Denied</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md">
          Only administrators or organization managers can create new team members or configure workspace access credentials.
        </p>
      </div>
    );
  }

  // Filter organizations shown based on role:
  // Show only user's created or joined plans
  const filteredOrgs = userOrganizations || [];

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-xl select-none">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {onSwitchToManage && (
          <div className="flex items-center gap-2 p-1 bg-neutral-200/50 dark:bg-white/5 rounded-2xl w-fit">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToManage}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>Manage & Delete Users</span>
            </button>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2.5">
            <UserPlus className="w-6.5 h-6.5 text-indigo-500" />
            Add New Member
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Configure system credentials, role rankings, and company plan associations for a new user.
          </p>
        </div>

        {success && createdUserData && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 rounded-3xl space-y-3 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Member Successfully Enrolled!
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                    <strong>{createdUserData.name}</strong> can now log in with email: <code className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[11px] font-mono">{createdUserData.email || 'No email'}</code> and password: <code className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[11px] font-mono">{createdUserData.password}</code>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {createdUserData.email && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                <a
                  href={getGmailComposeUrl({
                    to: createdUserData.email,
                    subject: generateWelcomeEmailSubject(createdUserData.name),
                    body: generateWelcomeEmailBody({
                      name: createdUserData.name,
                      email: createdUserData.email,
                      password: createdUserData.password,
                      role: createdUserData.role,
                      rank: createdUserData.rank,
                      orgName: createdUserData.orgName
                    })
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Gmail with Welcome Email</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-3.5 py-2 bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Customize & Preview Email</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Olivia Smith"
              className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
              required
            />
          </div>

          {/* Role/Position Field - MANUALLY INPUTTED AS REQUESTED */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              Position / Role <span className="text-[10px] text-neutral-400 font-normal">(manual input)</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Designer, Frontend Developer, Family Member"
              className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rank / System Hierarchy */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-neutral-400" />
                Rank Hierarchy
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value as UserRank)}
                className="w-full text-xs glass-input rounded-xl px-3 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
              >
                {currentUserProfile?.rank === 'Admin' && <option value="Admin">Admin (Invisible to all, full access)</option>}
                <option value="Manager">Manager (Manage company/family)</option>
                <option value="Supervisor">Supervisor (Assign tasks to everyone except Manager)</option>
                <option value="User">User (Self task assignment only)</option>
              </select>
            </div>

            {/* Organization Assignment */}
            {currentUserProfile?.rank === 'Admin' ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  Workspace / Organization
                </label>
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="w-full text-xs glass-input rounded-xl px-3 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                >
                  <option value="">No Organization (Single Personal)</option>
                  {filteredOrgs.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  Workspace Plan
                </label>
                <div className="w-full text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200/20 dark:border-white/5 rounded-xl px-4 py-3 text-neutral-500 font-medium">
                  {organizations.find((o: any) => o.id === currentUserProfile?.orgId)?.name || 'Default Personal Workspace'}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200/20 dark:border-white/5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                System Login Credentials
              </h3>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-900/50">
                Default First-Time Password: 123456
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. member@work.com"
                  className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-neutral-400" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(DEFAULT_STANDARD_PASSWORD)}
                    className="text-[10px] text-indigo-500 hover:underline cursor-pointer"
                  >
                    Reset to 123456
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Standard password: 123456"
                  className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium font-mono"
                />
              </div>
            </div>

            {/* Auto Open Gmail Toggle */}
            <div className="mt-4 p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <label htmlFor="openGmailToggle" className="text-xs font-bold text-neutral-800 dark:text-white cursor-pointer block">
                    Auto-Open Gmail Site with Credentials
                  </label>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Immediately prepares a welcome email in Gmail with email, standard password (123456), and login link.
                  </p>
                </div>
              </div>

              <input
                id="openGmailToggle"
                type="checkbox"
                checked={openGmailAfterCreate}
                onChange={(e) => setOpenGmailAfterCreate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="border-t border-neutral-200/20 dark:border-white/5 pt-5 flex items-center justify-between gap-3">
            <p className="text-[11px] text-neutral-400">
              Standard initial password for newly created accounts is <strong className="text-neutral-600 dark:text-neutral-300">123456</strong>.
            </p>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create Team Member
            </button>
          </div>
        </form>

        {/* Email Modal */}
        {createdUserData && (
          <SendEmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            recipientName={createdUserData.name}
            recipientEmail={createdUserData.email}
            initialPassword={createdUserData.password}
            role={createdUserData.role}
            rank={createdUserData.rank}
            orgName={createdUserData.orgName}
          />
        )}
      </div>
    </div>
  );
};
