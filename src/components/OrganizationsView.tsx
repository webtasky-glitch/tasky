import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { Organization, TeamMember } from '../types';
import { motion } from 'motion/react';
import { Building2, Plus, Edit2, Trash2, Users, Calendar, Shield, Save, X, Settings2, CheckSquare, Flag, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

const extractDominantColor = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#6366f1');
          return;
        }
        ctx.drawImage(img, 0, 0, 30, 30);
        const imgData = ctx.getImageData(0, 0, 30, 30).data;
        
        let colorCounts: { [hex: string]: number } = {};
        let maxCount = 0;
        let dominantHex = '#6366f1';

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          const a = imgData[i+3];

          // Skip transparent
          if (a < 128) continue;

          // Skip white/light gray/black to find actual colorful pixels
          const brightness = (r + g + b) / 3;
          if (brightness > 240 || brightness < 15) continue;
          
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const saturation = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;
          if (saturation < 0.15) continue;

          const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          if (colorCounts[hex] > maxCount) {
            maxCount = colorCounts[hex];
            dominantHex = hex;
          }
        }

        if (maxCount === 0) {
          colorCounts = {};
          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i+1];
            const b = imgData[i+2];
            const a = imgData[i+3];
            if (a < 128) continue;
            const brightness = (r + g + b) / 3;
            if (brightness > 250 || brightness < 5) continue;

            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            if (colorCounts[hex] > maxCount) {
              maxCount = colorCounts[hex];
              dominantHex = hex;
            }
          }
        }

        resolve(dominantHex);
      } catch (e) {
        console.error("Error extracting color:", e);
        resolve('#6366f1');
      }
    };
    img.onerror = () => {
      resolve('#6366f1');
    };
    img.src = base64Str;
  });
};

export const OrganizationsView: React.FC = () => {
  const { 
    organizations, 
    addOrganization, 
    updateOrganization, 
    deleteOrganization, 
    currentUserProfile,
    teamMembers,
    tasks,
    impersonateUser,
    impersonateOrgAsManager,
    stopImpersonating,
    deleteTeamMember,
    updateTeamMember
  } = useTasky() as any;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'Company' | 'Family' | 'Single'>('Company');

  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'Company' | 'Family' | 'Single'>('Company');
  const [editLogo, setEditLogo] = useState('');
  const [editThemeColor, setEditThemeColor] = useState('#6366f1');
  const [isDragging, setIsDragging] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [selectedOrgIdForDetail, setSelectedOrgIdForDetail] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'members' | 'tasks'>('members');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');
  const [editMemberRank, setEditMemberRank] = useState<string>('User');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPassword, setEditMemberPassword] = useState('');
  const [editMemberOrgId, setEditMemberOrgId] = useState('');

  const isAdmin = currentUserProfile?.rank === 'Admin';
  const isManager = currentUserProfile?.rank === 'Manager';
  const isSupervisor = currentUserProfile?.rank === 'Supervisor';
  const myOrg = isManager ? organizations.find((o: Organization) => o.id === currentUserProfile?.orgId) : null;
  const isSinglePlan = currentUserProfile?.orgId ? organizations.find((o: Organization) => o.id === currentUserProfile?.orgId)?.type === 'Single' : true;

  useEffect(() => {
    if (myOrg) {
      setEditingOrg(myOrg);
      setEditName(myOrg.name || '');
      setEditType(myOrg.type || 'Company');
      setEditLogo(myOrg.logo || '');
      setEditThemeColor(myOrg.themeColor || '#6366f1');
    }
  }, [myOrg]);

  useEffect(() => {
    if (isAdmin && organizations.length > 0 && !selectedOrgIdForDetail) {
      setSelectedOrgIdForDetail(organizations[0].id);
    } else if ((isManager || isSupervisor) && currentUserProfile?.orgId && !selectedOrgIdForDetail) {
      setSelectedOrgIdForDetail(currentUserProfile.orgId);
    }
  }, [organizations, isAdmin, isManager, isSupervisor, currentUserProfile, selectedOrgIdForDetail]);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEditLogo(base64);
        if (!editingOrg && isManager && myOrg) {
          setEditingOrg(myOrg);
        }
        // Auto extract color!
        const extracted = await extractDominantColor(base64);
        setEditThemeColor(extracted);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newOrgName.trim()) return;

    try {
      await addOrganization(newOrgName.trim(), newOrgType);
      setNewOrgName('');
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add organization');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !editName.trim()) return;

    try {
      await updateOrganization({
        ...editingOrg,
        name: editName.trim(),
        type: editType,
        logo: editLogo,
        themeColor: editThemeColor
      });
      if (isAdmin) {
        setEditingOrg(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update organization');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id);
      setDeletingOrgId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete organization');
    }
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editMemberName.trim() || !editMemberRole.trim()) return;

    try {
      const updated: any = {
        ...editingMember,
        name: editMemberName.trim(),
        role: editMemberRole.trim(),
        rank: editMemberRank,
        email: editMemberEmail.trim(),
        password: editMemberPassword,
      };
      
      if (editMemberOrgId) {
        updated.orgId = editMemberOrgId;
      } else {
        delete updated.orgId;
      }

      await updateTeamMember(updated);
      setEditingMember(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member');
    }
  };

  const getOrgMembersCount = (orgId: string) => {
    return teamMembers.filter((tm: TeamMember) => tm.orgId === orgId).length;
  };

  return (
    <div className="flex-1 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-xl select-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-6.5 h-6.5 text-indigo-500" />
              Plans & Organizations
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {isAdmin 
                ? "Administer active tenant accounts, corporate groups, and domestic family plans." 
                : "Manage and configure settings for your organization or personal plan."}
            </p>
          </div>

          {isAdmin && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* 1. Admin Organization Creation Form */}
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white/20 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-2xl shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" />
              New Organization Plan
            </h3>
            <form onSubmit={handleAddOrg} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Google, The Johnsons"
                  className="w-full text-xs glass-input rounded-xl px-4 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Plan Type</label>
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value as any)}
                  className="w-full text-xs glass-input rounded-xl px-3 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                >
                  <option value="Company">Company (Multi-user enterprise)</option>
                  <option value="Family">Family (Multi-user home plan)</option>
                  <option value="Single">Single (Individual private use)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end sm:justify-start">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 bg-white/10 dark:bg-white/5 hover:bg-white/20 border border-neutral-200/20 dark:border-white/5 text-xs font-bold rounded-xl text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Add Plan
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* 2. Admin List of All Plans */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map((org: Organization) => {
              const isEditing = editingOrg?.id === org.id;
              const count = getOrgMembersCount(org.id);

              return (
                <div 
                  key={org.id}
                  onClick={() => setSelectedOrgIdForDetail(org.id)}
                  className={`glass-card border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden cursor-pointer ${
                    selectedOrgIdForDetail === org.id 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-500/60' 
                      : 'border-white/35 dark:border-white/5'
                  }`}
                >
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Edit Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs glass-input rounded-xl px-3 py-2 focus:outline-none font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Edit Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as any)}
                          className="w-full text-xs glass-input rounded-xl px-2 py-2 focus:outline-none font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                        >
                          <option value="Company">Company</option>
                          <option value="Family">Family</option>
                          <option value="Single">Single</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Company Logo</label>
                        <div 
                          className={`border border-dashed rounded-xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isDragging 
                              ? 'border-indigo-500 bg-indigo-50/10' 
                              : 'border-neutral-200/40 dark:border-white/10 hover:border-indigo-500/50 bg-white/5'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById(`logo-upload-admin-${org.id}`)?.click()}
                        >
                          <input 
                            type="file" 
                            id={`logo-upload-admin-${org.id}`}
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleLogoChange} 
                          />
                          {editLogo ? (
                            <div className="flex items-center gap-2">
                              <img 
                                src={editLogo} 
                                alt="Logo preview" 
                                className="w-8 h-8 object-contain rounded-lg bg-white/10 p-0.5 border border-white/20" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[9px] text-neutral-400">
                                Click or drag to replace
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-neutral-400">
                              Upload Logo (Click or drag)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Brand Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editThemeColor}
                            onChange={(e) => setEditThemeColor(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[9px] font-mono font-bold uppercase text-neutral-600 dark:text-neutral-400">
                            {editThemeColor}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingOrg(null)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg bg-indigo-500 text-white"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {deletingOrgId === org.id ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono font-extrabold text-rose-500">
                              Confirm Delete
                            </span>
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-snug">
                              Are you sure you want to delete <span className="font-bold text-neutral-900 dark:text-white">"{org.name}"</span>? All assigned team members will lose their workspace link.
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setDeletingOrgId(null)}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-750 dark:text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(org.id)}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm shadow-rose-500/10 hover:shadow-rose-500/20 transition-all"
                            >
                              Delete Plan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={`text-[9px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                                org.type === 'Company' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40'
                                  : org.type === 'Family'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40'
                                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-850'
                              }`}>
                                {org.type}
                              </span>
                              <h4 className="text-base font-bold text-neutral-800 dark:text-white mt-2 leading-snug">
                                {org.name}
                              </h4>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingOrg(org);
                                  setEditName(org.name);
                                  setEditType(org.type);
                                  setEditLogo(org.logo || '');
                                  setEditThemeColor(org.themeColor || '#6366f1');
                                }}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 hover:text-indigo-500 transition-colors cursor-pointer"
                                title="Edit Plan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingOrgId(org.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-neutral-200/20 dark:border-white/5 pt-3.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-4 h-4 text-neutral-400" />
                              {count} member{count === 1 ? '' : 's'}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                              {org.createdAt ? org.createdAt.split('T')[0] : 'N/A'}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-neutral-200/20 dark:border-white/5 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                impersonateOrgAsManager(org.id);
                              }}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              Sign In as Guest Manager
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Plan Detail (Members & Tasks tabs for Admin, Manager, Supervisor) */}
        {(isAdmin || isManager || isSupervisor) && selectedOrgIdForDetail && (
          (() => {
            const selectedOrg = organizations.find((o: Organization) => o.id === selectedOrgIdForDetail);
            if (!selectedOrg) return null;

            const orgMembers = teamMembers.filter((m: TeamMember) => m.orgId === selectedOrg.id);
            const orgMemberIds = orgMembers.map((m: TeamMember) => m.id);
            const orgTasks = tasks.filter((t: any) => t.assignedTo && orgMemberIds.includes(t.assignedTo));

            const getRankValue = (rank: string) => {
              if (rank === 'Admin') return 4;
              if (rank === 'Manager') return 3;
              if (rank === 'Supervisor') return 2;
              return 1;
            };

            return (
              <div className="border border-white/30 dark:border-white/10 rounded-3xl p-6 sm:p-8 bg-white/10 dark:bg-white/5 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/20 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-bold">
                      {selectedOrg.logo ? (
                        <img src={selectedOrg.logo} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400">
                        {selectedOrg.type} Plan Details
                      </span>
                      <h3 className="text-lg font-bold text-neutral-800 dark:text-white leading-tight">
                        {selectedOrg.name}
                      </h3>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-xl gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setDetailActiveTab('members')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                        detailActiveTab === 'members'
                          ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Members ({orgMembers.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailActiveTab('tasks')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                        detailActiveTab === 'tasks'
                          ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Tasks ({orgTasks.length})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab Content: Members */}
                {detailActiveTab === 'members' && (
                  <div className="space-y-4">
                    {orgMembers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {orgMembers.map((member: TeamMember) => {
                          const currentRankVal = getRankValue(currentUserProfile?.rank || 'User');
                          const memberRankVal = getRankValue(member.rank || 'User');
                          const doesOutrank = currentRankVal > memberRankVal;

                          return (
                            <React.Fragment key={member.id}>
                              <div className="p-4 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                                    {member.avatar || member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                                        {member.name}
                                      </h4>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-neutral-100 dark:bg-white/5 text-neutral-500 rounded font-mono font-medium">
                                        {member.rank || 'User'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 truncate">
                                      {member.email}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* View Tasks only if outranked */}
                                  {doesOutrank ? (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                                      className="px-2.5 py-1.5 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      {expandedMemberId === member.id ? 'Hide Tasks' : 'View Tasks'}
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-neutral-400 italic font-medium px-2 py-1 bg-neutral-100/40 dark:bg-white/5 rounded-lg border border-neutral-200/20 dark:border-white/5">
                                      Same or higher rank
                                    </span>
                                  )}

                                  {/* Sign in impersonation as other user for super admin */}
                                  {isAdmin && member.email && member.email !== currentUserProfile?.email && (
                                    <button
                                      type="button"
                                      onClick={() => impersonateUser(member.email)}
                                      className="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      title={`Sign in as ${member.name}`}
                                    >
                                      Sign In
                                    </button>
                                  )}

                                  {/* Edit member button if user is manager of this organization or system admin */}
                                  {(isAdmin || (isManager && currentUserProfile?.orgId === selectedOrg.id)) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMember(member);
                                        setEditMemberName(member.name || '');
                                        setEditMemberRole(member.role || '');
                                        setEditMemberRank(member.rank || 'User');
                                        setEditMemberEmail(member.email || '');
                                        setEditMemberPassword(member.password || '');
                                        setEditMemberOrgId(member.orgId || '');
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center justify-center border border-amber-500/20"
                                      title="Edit Member Details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete member button if user is manager of this organization or system admin, and member is not themselves */}
                                  {(isAdmin || (isManager && currentUserProfile?.orgId === selectedOrg.id)) && member.id !== currentUserProfile?.id && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete ${member.name}'s account from this plan? This action cannot be undone.`)) {
                                          deleteTeamMember(member.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center border border-rose-500/20"
                                      title="Delete Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <span className="text-[10px] px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg font-mono font-bold shrink-0">
                                    {member.role || 'Member'}
                                  </span>
                                </div>
                              </div>

                              {/* Expanded member tasks list */}
                              {expandedMemberId === member.id && doesOutrank && (
                                (() => {
                                  const memberTasks = tasks.filter((t: any) => t.assignedTo === member.id);
                                  return (
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/20 dark:border-white/5 rounded-2xl space-y-2 mt-[-8px] mb-2">
                                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                        {member.name}'s Assigned Tasks ({memberTasks.length})
                                      </h5>
                                      {memberTasks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {memberTasks.map((t: any) => (
                                            <div key={t.id} className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-150/30 dark:border-neutral-750 flex items-center justify-between gap-3 text-xs">
                                              <div className="min-w-0">
                                                <p className="font-bold text-neutral-800 dark:text-white truncate">{t.title}</p>
                                                <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">Due: {t.dueDate} | Priority: {t.priority}</p>
                                              </div>
                                              <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${
                                                t.status === 'Completed'
                                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                                                  : t.status === 'InProgress'
                                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                                                  : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/25'
                                              }`}>
                                                {t.status}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-neutral-400 italic">No tasks assigned to this user.</p>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-400 text-xs">
                        No team members registered under this plan yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab Content: Tasks */}
                {detailActiveTab === 'tasks' && (
                  <div className="space-y-4">
                    {orgTasks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {orgTasks.map((task: any) => {
                          const assignee = orgMembers.find(m => m.id === task.assignedTo);
                          const isOverdue = (() => {
                            if (task.status === 'Completed') return false;
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const due = new Date(task.dueDate);
                            due.setHours(0,0,0,0);
                            return due < today;
                          })();

                          return (
                            <div key={task.id} className="p-4 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-2xl space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-white leading-snug">
                                  {task.title}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                                  task.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                                    : task.status === 'InProgress'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                                    : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/25'
                                }`}>
                                  {task.status}
                                </span>
                              </div>

                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                {task.description || 'No notes/description provided.'}
                              </p>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/10 text-[10px] text-neutral-400">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Assigned: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{assignee?.name || 'Unassigned'}</span></span>
                                </div>
                                <div className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>
                                    Due: {task.dueDate} {isOverdue && '(Overdue)'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-400 text-xs">
                        No assignments have been created or assigned to members of this plan yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* 3. Manager View for their Specific Organization */}
        {isManager && myOrg && (
          <div className="max-w-xl mx-auto w-full glass-card border border-white/35 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-500">
                  Active {myOrg.type} Plan
                </span>
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white leading-tight">
                  {myOrg.name}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 border-t border-neutral-200/20 dark:border-white/5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Change Plan Display Name</label>
                <input
                  type="text"
                  value={editName || myOrg.name}
                  onChange={(e) => {
                    if (!editingOrg) setEditingOrg(myOrg);
                    setEditName(e.target.value);
                  }}
                  className="w-full text-xs glass-input rounded-xl px-4 py-3 focus:outline-none font-medium text-neutral-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Change Plan Subtype</label>
                <select
                  value={editType || myOrg.type}
                  onChange={(e) => {
                    if (!editingOrg) setEditingOrg(myOrg);
                    setEditType(e.target.value as any);
                  }}
                  className="w-full text-xs glass-input rounded-xl px-3 py-3 focus:outline-none font-medium text-neutral-800 dark:text-white [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                >
                  <option value="Company">Company (Corporate Multi-user)</option>
                  <option value="Family">Family (Domestic Household Plan)</option>
                </select>
              </div>

              {/* Company Branding Settings */}
              <div className="space-y-3 border-t border-neutral-200/20 dark:border-white/5 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Company Branding & Colors
                </h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Company Logo
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50/10' 
                        : 'border-neutral-200/40 dark:border-white/10 hover:border-indigo-500/50 bg-white/5'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('logo-upload-manager')?.click()}
                  >
                    <input 
                      type="file" 
                      id="logo-upload-manager" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoChange} 
                    />
                    {editLogo ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={editLogo} 
                          alt="Logo preview" 
                          className="w-20 h-20 object-contain rounded-2xl bg-white/10 p-1 border border-white/20" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-medium text-neutral-500">
                          Click or drag to replace logo
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-white/5 rounded-full flex items-center justify-center text-indigo-500">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Upload Company Logo
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Drag and drop an image or click to choose
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={editThemeColor}
                      onChange={(e) => {
                        if (!editingOrg && isManager && myOrg) {
                          setEditingOrg(myOrg);
                        }
                        setEditThemeColor(e.target.value);
                      }}
                      className="w-12 h-12 rounded-2xl cursor-pointer border-0 bg-transparent"
                      title="Choose brand color manually"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold font-mono text-neutral-800 dark:text-white uppercase">
                        {editThemeColor}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Automatically extracted from uploaded logo or set manually
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Workspace Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Single Workspace Plan / Personal Management */}
        {((!isAdmin && !isManager && !isSupervisor) || isSinglePlan) && (
          <div className="max-w-xl mx-auto w-full glass-card border border-white/35 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-500">
                  Single Account Workspace
                </span>
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white leading-tight">
                  {currentUserProfile?.name || 'Personal Account'}
                </h3>
              </div>
            </div>

            <div className="border-t border-neutral-200/20 dark:border-white/5 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-neutral-500">Account Type</p>
                  <p className="font-medium text-neutral-800 dark:text-white mt-0.5">Single / Individual Plan</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-500">Current Position</p>
                  <p className="font-medium text-neutral-800 dark:text-white mt-0.5">{currentUserProfile?.role || 'Standalone User'}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-500">Role Rank</p>
                  <p className="font-medium text-neutral-800 dark:text-white mt-0.5">{currentUserProfile?.rank || 'User'}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-500">Email Address</p>
                  <p className="font-medium text-neutral-800 dark:text-white mt-0.5 font-mono text-[10px]">{currentUserProfile?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-700 dark:text-indigo-300">
                You are on a **Single Account Workspace**. All created tasks, categories, and personal habits remain fully isolated and secure within your own secure account profile.
              </div>
            </div>
          </div>
        )}
      </div>

      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/20 dark:border-white/5 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-500" />
                  Edit Member Details
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Update profile, credentials and access rank for this team member.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editMemberName}
                    onChange={(e) => setEditMemberName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                    Position / Role
                  </label>
                  <input
                    type="text"
                    required
                    value={editMemberRole}
                    onChange={(e) => setEditMemberRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="e.g. Lead Designer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editMemberEmail}
                    onChange={(e) => setEditMemberEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                    Password
                  </label>
                  <input
                    type="text"
                    value={editMemberPassword}
                    onChange={(e) => setEditMemberPassword(e.target.value)}
                    placeholder="Set/Update password"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                    Rank / Permissions
                  </label>
                  <select
                    value={editMemberRank}
                    disabled={!isAdmin && editingMember.id === currentUserProfile?.id}
                    onChange={(e) => setEditMemberRank(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="User">User (Standard Access)</option>
                    <option value="Supervisor">Supervisor (Task Management)</option>
                    <option value="Manager">Manager (Full Plan Control)</option>
                    {isAdmin && <option value="Admin">Admin (System Super-User)</option>}
                  </select>
                </div>

                {isAdmin && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 block">
                      Associated Plan / Org
                    </label>
                    <select
                      value={editMemberOrgId}
                      onChange={(e) => setEditMemberOrgId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">No Organization / Freelance</option>
                      {organizations.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-white/5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
