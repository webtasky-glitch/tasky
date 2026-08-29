import React from 'react';
import { Task, TeamMember } from '../types';
import { getTaskAssigneeIds } from '../utils/taskFilter';
import { Users } from 'lucide-react';

interface AssigneeAvatarStackProps {
  task?: Task;
  assigneeIds?: string[];
  teamMembers: TeamMember[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  showNames?: boolean;
}

export const AssigneeAvatarStack: React.FC<AssigneeAvatarStackProps> = ({
  task,
  assigneeIds: propAssigneeIds,
  teamMembers = [],
  max = 3,
  size = 'sm',
  showNames = false
}) => {
  const ids = propAssigneeIds || (task ? getTaskAssigneeIds(task) : []);
  if (!ids || ids.length === 0) return null;

  const resolvedMembers = ids
    .map(id => teamMembers.find(tm => tm.id === id || (tm.email && tm.email.toLowerCase() === id.toLowerCase())))
    .filter((tm): tm is TeamMember => Boolean(tm));

  if (resolvedMembers.length === 0) {
    return (
      <div 
        title={`Assigned to (${ids.length}) members`}
        className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium"
      >
        <Users className="w-3 h-3 text-indigo-500" />
        <span>{ids.length} assigned</span>
      </div>
    );
  }

  const visibleMembers = resolvedMembers.slice(0, max);
  const remainingCount = resolvedMembers.length - max;
  const allNames = resolvedMembers.map(m => m.name || m.email || 'Member').join(', ');

  const sizeClasses = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-6 h-6 text-[11px]'
  }[size];

  return (
    <div className="flex items-center gap-1.5" title={`Assigned to: ${allNames}`}>
      <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
        {visibleMembers.map((member, idx) => (
          <div
            key={member.id || idx}
            title={`${member.name} (${member.role || member.rank || 'Member'})`}
            className={`${sizeClasses} rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shrink-0 shadow-xs select-none`}
          >
            {member.avatar || (member.name ? member.name.slice(0, 2).toUpperCase() : 'U')}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            title={`+${remainingCount} more: ${resolvedMembers.slice(max).map(m => m.name).join(', ')}`}
            className={`${sizeClasses} rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shrink-0 text-[8px] select-none`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {showNames && (
        <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[200px]">
          {resolvedMembers.length === 1 
            ? resolvedMembers[0].name 
            : `${resolvedMembers[0].name} +${resolvedMembers.length - 1}`}
        </span>
      )}
    </div>
  );
};
