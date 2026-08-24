import { Task, TeamMember } from '../types';

export const getTaskAssigneeIds = (task: Task): string[] => {
  const ids: string[] = [];
  if (task.assignedToIds && Array.isArray(task.assignedToIds)) {
    for (const id of task.assignedToIds) {
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  if (task.assignedTo && !ids.includes(task.assignedTo)) {
    ids.push(task.assignedTo);
  }
  return ids;
};

export const isTaskAssignedToUser = (
  task: Task,
  memberId?: string | null,
  uid?: string | null
): boolean => {
  const assigneeIds = getTaskAssigneeIds(task);
  if (memberId && assigneeIds.includes(memberId)) return true;
  if (uid && assigneeIds.includes(uid)) return true;
  return false;
};

export const isTaskForUser = (
  task: Task,
  currentUserProfile: TeamMember | null,
  user: any,
  teamMembers: TeamMember[] = []
): boolean => {
  const assigneeIds = getTaskAssigneeIds(task);
  const isUnassigned = assigneeIds.length === 0;

  if (!currentUserProfile) {
    if (user && (assigneeIds.includes(user.uid) || task.createdBy === user.uid)) return true;
    return isUnassigned;
  }

  const isSuperAdmin = currentUserProfile.id === 'admin-webtasky' ||
                       currentUserProfile.rank === 'Admin' ||
                       currentUserProfile.email?.toLowerCase().trim() === 'webtasky@gmail.com';

  // 1. Super Admin in default global view (no specific org selected and not impersonating)
  if (isSuperAdmin && !currentUserProfile.isImpersonated && !currentUserProfile.orgId) {
    return true;
  }

  // 2. Active Organization / Plan View
  if (currentUserProfile.orgId) {
    // Task belongs to a different plan/company -> DO NOT SHOW in this plan ("not to every plan")
    if (task.orgId && task.orgId !== currentUserProfile.orgId) {
      return false;
    }

    // Task has no orgId (personal task) -> only show if user is creator or assignee
    if (!task.orgId) {
      const isAssigned = isTaskAssignedToUser(task, currentUserProfile.id, user?.uid);
      return isAssigned || task.createdBy === currentUserProfile.id || (user && task.createdBy === user.uid);
    }

    // Task belongs to current active orgId
    if (isSuperAdmin && !currentUserProfile.isImpersonated) {
      return true;
    }

    // Check rank within this specific active organization
    const currentMemberRankInOrg = (currentUserProfile.orgRanks && currentUserProfile.orgRanks[currentUserProfile.orgId])
      ? currentUserProfile.orgRanks[currentUserProfile.orgId]
      : currentUserProfile.rank;

    // Admins, Managers, and Supervisors of this org see all tasks in their plan
    if (currentMemberRankInOrg === 'Admin' || currentMemberRankInOrg === 'Manager' || currentMemberRankInOrg === 'Supervisor') {
      return true;
    }

    // Regular users: show task ONLY if assigned to them, created by them, or unassigned ("not to every person")
    if (!isUnassigned) {
      const isAssigned = isTaskAssignedToUser(task, currentUserProfile.id, user?.uid);
      return isAssigned || task.createdBy === currentUserProfile.id || (user && task.createdBy === user.uid);
    }

    return true;
  }

  // 3. Personal Account View (no active orgId selected)
  if (task.orgId) {
    return false;
  }

  if (isTaskAssignedToUser(task, currentUserProfile.id, user?.uid) || task.createdBy === currentUserProfile.id) return true;
  if (user && task.createdBy === user.uid) return true;

  if (isUnassigned) {
    return !task.createdBy || task.createdBy === currentUserProfile.id || (user && task.createdBy === user.uid);
  }

  return false;
};

