import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { UserRank } from '../types';
import { motion } from 'motion/react';
import { UserPlus, Shield, Briefcase, Mail, Key, Building2, CheckCircle2 } from 'lucide-react';

export const CreateMemberView: React.FC = () => {
  const { addTeamMemberWithRank, organizations, currentUserProfile } = useTasky() as any;

  const [name, setName] = useState('');
  const [role, setRole] = useState(''); // Manually added position/role
  const [rank, setRank] = useState<UserRank>('User');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!name.trim() || !role.trim()) {
      setErrorMsg('Name and position (role) are required.');
      return;
    }

    try {
      // If the creator is a manager, automatically assign to their company
      const assignedOrgId = currentUserProfile?.rank === 'Manager' 
        ? currentUserProfile.orgId 
        : (orgId || undefined);

      await addTeamMemberWithRank(
        name.trim(),
        role.trim(),
        rank,
        email.trim() || undefined,
        password || undefined,
        assignedOrgId
      );

      // Reset
      setName('');
      setRole('');
      setRank('User');
      setEmail('');
      setPassword('');
      setOrgId('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
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
  // Admin can select any organization, Manager is restricted to their own (and gets assigned automatically)
  const filteredOrgs = organizations;

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-xl select-none">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2.5">
            <UserPlus className="w-6.5 h-6.5 text-indigo-500" />
            Add New Member
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Configure system credentials, role rankings, and company plan associations for a new user.
          </p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Member was successfully enrolled! They can now log in with their email and password.</span>
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
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-3">System Login Credentials</h3>
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
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-neutral-400" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (minimum 6 chars)"
                  className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none text-neutral-800 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200/20 dark:border-white/5 pt-5 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
