import React, { useState, useRef, useEffect } from 'react';
import { TeamMember } from '../types';
import { Users, Check, X, Search, ChevronDown, UserCheck } from 'lucide-react';

interface AssigneeMultiSelectorProps {
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  assignableMembers: TeamMember[];
  currentUserId?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const AssigneeMultiSelector: React.FC<AssigneeMultiSelectorProps> = ({
  selectedIds = [],
  onChange,
  assignableMembers = [],
  currentUserId,
  placeholder = 'Assign people from plan...',
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter(id => id !== memberId));
    } else {
      onChange([...selectedIds, memberId]);
    }
  };

  const selectAll = () => {
    const allIds = assignableMembers.map(m => m.id);
    onChange(allIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectOnlyMe = () => {
    if (currentUserId) {
      onChange([currentUserId]);
    }
  };

  const filteredMembers = assignableMembers.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMembers = selectedIds
    .map(id => assignableMembers.find(m => m.id === id || (m.email && m.email.toLowerCase() === id.toLowerCase())))
    .filter((m): m is TeamMember => Boolean(m));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button / Selected Summary */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full min-h-[38px] glass-input rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer border hover:border-indigo-500/50 transition-colors ${
          isOpen ? 'ring-2 ring-indigo-500/40 border-indigo-500' : ''
        }`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {selectedMembers.length === 0 ? (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 font-sans">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              {placeholder}
            </span>
          ) : (
            selectedMembers.map(member => (
              <span
                key={member.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMember(member.id);
                }}
                className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 px-2 py-0.5 rounded-lg font-medium shadow-2xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-900 transition-colors cursor-pointer group"
                title={`Click to remove ${member.name}`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[8px]">
                  {member.avatar || member.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate max-w-[110px]">{member.name}</span>
                <X className="w-3 h-3 text-indigo-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0" />
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-neutral-400">
          {selectedMembers.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {selectedMembers.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-[10px]">
            <div className="flex items-center gap-1">
              {currentUserId && (
                <button
                  type="button"
                  onClick={selectOnlyMe}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-neutral-600 dark:text-neutral-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3" />
                  Just Me
                </button>
              )}
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-neutral-600 dark:text-neutral-300 font-medium transition-colors cursor-pointer"
              >
                Select All ({assignableMembers.length})
              </button>
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Input if multiple members */}
          {assignableMembers.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search plan members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-800 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Member List with Checkboxes */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-400">
                No members found
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 font-semibold' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}>
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs">{member.name}</p>
                          {member.rank && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-normal">
                              {member.rank}
                            </span>
                          )}
                        </div>
                        {member.email && (
                          <p className="text-[10px] text-neutral-400 font-normal truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-neutral-300 dark:border-neutral-600 bg-transparent'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
