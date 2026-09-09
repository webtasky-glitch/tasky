import React from 'react';
import { useTasky } from '../TaskyContext';
import { Organization } from '../types';
import { Building2, Check, X, ArrowRight, Shield, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WorkspaceSelectorModal: React.FC = () => {
  const { 
    userOrganizations, 
    selectedOrgId, 
    selectCompanyWorkspace, 
    isWorkspaceSelectorOpen, 
    setIsWorkspaceSelectorOpen 
  } = useTasky() as any;

  if (!isWorkspaceSelectorOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#181a28] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Switch Company Workspace
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select the company or plan workspace you want to view tasks and data for.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsWorkspaceSelectorOpen(false)}
              className="p-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company List */}
          <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
            {userOrganizations.length === 0 ? (
              <div className="p-6 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-white/5">
                <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  No linked company workspaces found.
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  You are currently in your personal sandbox view.
                </p>
              </div>
            ) : (
              userOrganizations.map((org: Organization) => {
                const isActive = selectedOrgId === org.id;

                return (
                  <motion.div
                    key={org.id}
                    onClick={() => selectCompanyWorkspace(org.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-white/5 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {org.logo ? (
                        <img 
                          src={org.logo} 
                          alt={org.name} 
                          className="w-10 h-10 object-contain rounded-xl border border-neutral-200/50 dark:border-white/10" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
                          style={{ backgroundColor: org.themeColor || '#6366f1' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          {org.name}
                          {isActive && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-extrabold uppercase rounded-full">
                              Active
                            </span>
                          )}
                        </h3>
                        <span className="text-[11px] text-neutral-400 capitalize">
                          {org.type || 'Company'} Workspace
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 text-neutral-400 hover:text-indigo-500">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-neutral-200/50 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <span> Belong to {userOrganizations.length} company workspace(s)</span>
            <button
              onClick={() => setIsWorkspaceSelectorOpen(false)}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
