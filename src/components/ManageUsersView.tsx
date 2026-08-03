import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { TeamMember } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Trash2, Search, Shield, Building2, UserX, AlertTriangle, CheckCircle2, UserPlus } from 'lucide-react';

export const ManageUsersView: React.FC<{ onSwitchToAdd?: () => void }> = ({ onSwitchToAdd }) => {
  const { teamMembers, deleteTeamMember, organizations, userOrganizations, currentUserProfile, setTeamMembers } = useTasky() as any;

  const isSuperAdmin = currentUserProfile?.email?.toLowerCase().trim() === 'webtasky@gmail.com';
  const visibleOrgs = isSuperAdmin ? (organizations || []) : (userOrganizations || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedRankFilter, setSelectedRankFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canAccess = currentUserProfile?.rank === 'Admin' || currentUserProfile?.rank === 'Manager';

  if (!canAccess) {
    return (
      <div className="flex-1 glass-panel rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
        <Shield className="w-16 h-16 text-rose-500/80 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">Access Denied</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md">
          Only administrators and managers have access to the user management and deletion panel.
        </p>
      </div>
    );
  }

  // Filter team members based on admin vs manager and filters
  const availableMembers = (teamMembers || []).filter((member: TeamMember) => {
    const memberOrgs = member.orgIds || (member.orgId ? [member.orgId] : []);

    // If user is a Manager (not Admin), restrict to their own organization
    if (currentUserProfile?.rank === 'Manager' && currentUserProfile?.orgId) {
      if (!memberOrgs.includes(currentUserProfile.orgId)) {
        return false;
      }
    }

    // Search filter
    const matchesSearch =
      !searchTerm.trim() ||
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase()));

    // Org filter
    const matchesOrg =
      selectedOrgFilter === 'all' ||
      (selectedOrgFilter === 'no_org' ? memberOrgs.length === 0 : memberOrgs.includes(selectedOrgFilter));

    // Rank filter
    const activeOrgId = selectedOrgFilter !== 'all' && selectedOrgFilter !== 'no_org'
      ? selectedOrgFilter
      : (currentUserProfile?.orgId || undefined);
    const memberRankInActiveOrg = (activeOrgId && member.orgRanks?.[activeOrgId])
      ? member.orgRanks[activeOrgId]
      : (member.rank || 'User');

    const matchesRank =
      selectedRankFilter === 'all' || memberRankInActiveOrg === selectedRankFilter;

    return matchesSearch && matchesOrg && matchesRank;
  });

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setFeedbackMsg(null);

    try {
      const deleteId = userToDelete.id || userToDelete.email;
      const isManager = currentUserProfile?.rank === 'Manager';
      const targetOrg = isManager ? currentUserProfile?.orgId : undefined;
      
      if (isManager && targetOrg) {
        await deleteTeamMember(deleteId, targetOrg);
        setFeedbackMsg({
          type: 'success',
          text: `User ${userToDelete.name} was removed from your plan (${getOrgName(targetOrg)}).`
        });
      } else {
        await deleteTeamMember(deleteId);
        setFeedbackMsg({
          type: 'success',
          text: `User ${userToDelete.name} (${userToDelete.email || 'No email'}) was deleted from the system.`
        });
      }
      setUserToDelete(null);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to remove user. Please try again.'
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const getOrgName = (orgId?: string) => {
    if (!orgId) return 'Personal / No Org';
    const org = organizations?.find((o: any) => o.id === orgId);
    return org ? `${org.name} (${org.type})` : 'Workspace';
  };

  const getRankBadge = (rank?: string) => {
    switch (rank) {
      case 'Admin':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Manager':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Supervisor':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  const isSuperAdminUser = (email?: string) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'webtasky@gmail.com';
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-xl select-none">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Navigation Tabs between Add & Manage */}
        {onSwitchToAdd && (
          <div className="flex items-center gap-2 p-1 bg-neutral-200/50 dark:bg-white/5 rounded-2xl w-fit">
            <button
              type="button"
              onClick={onSwitchToAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>Manage & Delete Users</span>
            </button>
          </div>
        )}

        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/20 dark:border-white/5 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2.5">
              <UserX className="w-7 h-7 text-rose-500" />
              Manage & Delete Users
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {currentUserProfile?.rank === 'Admin'
                ? 'Full system user administration panel. View, manage, or permanently delete any user or workspace member.'
                : 'Workspace user management panel. Search and remove team members assigned to your company or family group.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {availableMembers.length} Active Users
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full text-xs glass-input rounded-xl pl-9 pr-4 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
            />
          </div>

          {/* Org Filter (for Admins) */}
          {currentUserProfile?.rank === 'Admin' ? (
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
            >
              <option value="all">All Workspaces & Plans</option>
              <option value="no_org">No Workspace (Personal)</option>
              {visibleOrgs?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs glass-input rounded-xl px-4 py-2.5 text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              {visibleOrgs?.find((o: any) => o.id === currentUserProfile?.orgId)?.name || 'Your Workspace'}
            </div>
          )}

          {/* Rank Filter */}
          <select
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
            className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
          >
            <option value="all">All Ranks</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="User">User</option>
          </select>
        </div>

        {/* Users List / Table */}
        {availableMembers.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 dark:text-neutral-500 glass-card rounded-2xl space-y-2">
            <Users className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm font-semibold">No users match your criteria.</p>
            <p className="text-xs">Try clearing search filters or selecting a different workspace.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableMembers.map((member: TeamMember) => {
              const isSuper = isSuperAdminUser(member.email);
              const isSelf = member.id === currentUserProfile?.id || (member.email && member.email.toLowerCase().trim() === currentUserProfile?.email?.toLowerCase().trim());

              return (
                <motion.div
                  key={member.id || member.email}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 glass-card rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-neutral-200/40 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                      {member.avatar || member.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-neutral-800 dark:text-white truncate">
                          {member.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRankBadge(member.rank)}`}>
                          {member.rank || 'User'}
                        </span>
                        {isSuper && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Super Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {member.email || 'No email registered'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                        <span>Role: <strong className="text-neutral-600 dark:text-neutral-300 font-medium">{member.role || 'Member'}</strong></span>
                        <span>•</span>
                        <span>Workspace: <strong className="text-neutral-600 dark:text-neutral-300 font-medium">{getOrgName(member.orgId)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isSuper ? (
                      <span className="text-xs text-neutral-400 font-medium italic px-3 py-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-xl">
                        Protected Super Admin
                      </span>
                    ) : isSelf ? (
                      <span className="text-xs text-neutral-400 font-medium italic px-3 py-1.5 bg-neutral-100 dark:bg-neutral-850 rounded-xl">
                        Current Session
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(member)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {currentUserProfile?.rank === 'Manager' ? 'Kick from Plan' : 'Delete User'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Delete / Kick Confirmation Modal */}
        <AnimatePresence>
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-rose-500">
                  <div className="p-3 bg-rose-500/10 rounded-2xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      {currentUserProfile?.rank === 'Manager' ? 'Kick Member from Plan?' : 'Delete User Permanently?'}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {currentUserProfile?.rank === 'Manager'
                        ? 'Remove this member from your plan workspace.'
                        : 'This action cannot be undone.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                  <p><strong>Name:</strong> {userToDelete.name}</p>
                  <p><strong>Email:</strong> {userToDelete.email || 'None'}</p>
                  <p><strong>Role/Rank:</strong> {userToDelete.role} ({userToDelete.rank || 'User'})</p>
                  <p><strong>Workspace:</strong> {getOrgName(userToDelete.orgId)}</p>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {currentUserProfile?.rank === 'Manager'
                    ? 'Removing this user will revoke their access to your plan. Their personal user account will remain active in Tasky.'
                    : 'Deleting this user will revoke their login access and erase their credentials from the system.'}
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>{currentUserProfile?.rank === 'Manager' ? 'Confirm Kick' : 'Confirm Delete'}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
