import { Task, TeamMember } from '../types';

export const isTaskForUser = (
  task: Task,
  currentUserProfile: TeamMember | null,
  user: any,
  teamMembers: TeamMember[] = []
): boolean => {
  if (!currentUserProfile) {
    if (user && (task.assignedTo === user.uid || task.createdBy === user.uid)) return true;
    return !task.assignedTo;
  }

  // 1. Super Admin in default global view (not impersonating)
  if ((currentUserProfile.id === 'admin-webtasky' || currentUserProfile.rank === 'Admin' || currentUserProfile.email?.toLowerCase().trim() === 'webtasky@gmail.com') && !currentUserProfile.isImpersonated) {
    return true;
  }

  // 2. User / Manager belonging to an Organization / Plan
  if (currentUserProfile.orgId) {
    if (task.orgId && task.orgId === currentUserProfile.orgId) return true;
    if (task.assignedTo === currentUserProfile.id || task.createdBy === currentUserProfile.id) return true;

    if (task.assignedTo) {
      const orgMemberIds = teamMembers
        .filter(tm => tm.orgId === currentUserProfile.orgId)
        .map(tm => tm.id);
      if (orgMemberIds.includes(task.assignedTo)) return true;
    }

    if (!task.orgId && !task.assignedTo) {
      if (!task.createdBy || task.createdBy === currentUserProfile.id) return true;
    }

    return false;
  }

  // 3. Personal User Account (no orgId)
  if (task.assignedTo === currentUserProfile.id || task.createdBy === currentUserProfile.id) return true;
  if (user && (task.assignedTo === user.uid || task.createdBy === user.uid)) return true;

  if (!task.orgId && !task.assignedTo) {
    if (!task.createdBy || task.createdBy === currentUserProfile.id) return true;
  }

  return false;
};
