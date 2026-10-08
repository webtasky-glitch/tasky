import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { JoinRequest, Organization, TeamMember } from '../types';
import { useTasky } from '../TaskyContext';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquareCode, 
  Check, 
  X,
  Search,
  ArrowUpRight,
  ShieldAlert,
  Heart,
  Smile,
  Edit2,
  Trash2,
  Shield,
  Globe,
  Laptop,
  Smartphone,
  Monitor,
  Download,
  RefreshCw,
  Copy,
  MapPin,
  Activity,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SendEmailModal } from './SendEmailModal';
import { getCountryFlag } from '../utils/ipTracker';
import { SignInLog } from '../types';

export const AdminRequestsView: React.FC = () => {
  const { 
    impersonateUser, 
    deleteTeamMember, 
    updateTeamMember, 
    currentUserProfile,
    signInLogs,
    recordSignInEvent,
    clearSignInLogs,
    user
  } = useTasky() as any;
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const [activeTab, setActiveTab] = useState<'requests' | 'family-personal' | 'users' | 'signins'>('requests');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // IP Tracking and Sign-in logs state
  const [ipSearchTerm, setIpSearchTerm] = useState('');
  const [ipMethodFilter, setIpMethodFilter] = useState('all');
  const [copiedIpId, setCopiedIpId] = useState<string | null>(null);
  const [isRecordingCurrentIp, setIsRecordingCurrentIp] = useState(false);
  const [ipFeedbackMsg, setIpFeedbackMsg] = useState<string | null>(null);

  const handleCopyIp = (ip: string, id: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIpId(id);
    setTimeout(() => setCopiedIpId(null), 2000);
  };

  const handleRecordCurrentIpNow = async () => {
    setIsRecordingCurrentIp(true);
    try {
      const activeUser = user || {
        uid: currentUserProfile?.id || 'admin-webtasky',
        email: currentUserProfile?.email || 'webtasky@gmail.com',
        displayName: currentUserProfile?.name || 'Super Admin'
      };
      const res = await recordSignInEvent(activeUser, 'admin_check');
      if (res) {
        setIpFeedbackMsg(`Successfully logged IP: ${res.ip} (${res.city || ''} ${res.country || ''})`);
      } else {
        setIpFeedbackMsg('Recorded sign-in event.');
      }
    } catch (e: any) {
      setIpFeedbackMsg('Failed to fetch IP: ' + (e.message || 'Network error'));
    } finally {
      setIsRecordingCurrentIp(false);
      setTimeout(() => setIpFeedbackMsg(null), 4000);
    }
  };

  const handleExportIpLogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(signInLogs || [], null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `tasky-signin-ip-logs-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');
  const [editMemberRank, setEditMemberRank] = useState<string>('User');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPassword, setEditMemberPassword] = useState('');
  const [editMemberOrgId, setEditMemberOrgId] = useState('');

  const [emailModalUser, setEmailModalUser] = useState<any | null>(null);

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
      alert(err.message || 'Failed to update member');
    }
  };

  useEffect(() => {
    // 1. Subscribe to join_requests
    const unsubRequests = onSnapshot(collection(db, 'join_requests'), (snapshot) => {
      const list: JoinRequest[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as JoinRequest);
      });
      // Sort by creation date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error reading join requests:", error);
      setLoading(false);
    });

    // 2. Subscribe to organizations
    const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
      const list: Organization[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Organization);
      });
      setOrganizations(list);
    });

    // 3. Subscribe to team members to fetch manager details and counts
    const unsubTeam = onSnapshot(collection(db, 'team'), (snapshot) => {
      const list: TeamMember[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TeamMember);
      });
      setTeamMembers(list);
    });

    return () => {
      unsubRequests();
      unsubOrgs();
      unsubTeam();
    };
  }, []);

  const handleApprove = async (req: JoinRequest) => {
    try {
      // Update status to approved
      await updateDoc(doc(db, 'join_requests', req.id), {
        status: 'approved'
      });

      // Automatically seed organization
      const orgId = `org-company-${Date.now()}`;
      await setDoc(doc(db, 'organizations', orgId), {
        id: orgId,
        name: req.companyName,
        type: 'Company',
        createdAt: new Date().toISOString()
      });

      // Create primary Manager user
      const memberId = `tm-${Date.now()}`;
      await setDoc(doc(db, 'team', memberId), {
        id: memberId,
        name: req.contactName,
        role: 'Company Admin / Manager',
        rank: 'Manager',
        avatar: req.contactName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CM',
        email: req.email.toLowerCase().trim(),
        password: 'password123', // temporary default password
        orgId
      });

      alert(`Request approved! Organization "${req.companyName}" has been created, and Manager profile was set up for ${req.contactName} (${req.email}).`);
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Failed to approve request.");
    }
  };

  const handleDecline = async (reqId: string) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    try {
      await updateDoc(doc(db, 'join_requests', reqId), {
        status: 'declined'
      });
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleDeleteRequest = async (reqId: string) => {
    if (!window.confirm("Are you sure you want to delete this log permanently?")) return;
    try {
      await deleteDoc(doc(db, 'join_requests', reqId));
    } catch (err) {
      console.error("Error deleting request log:", err);
    }
  };

  // Filter lists based on search
  const filteredRequests = requests.filter(req => 
    req.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter newly registered personal/family plans
  const personalFamilyOrgs = organizations.filter(org => org.type === 'Family' || org.type === 'Single');

  const getOrgManager = (orgId: string) => {
    return teamMembers.find(tm => tm.orgId === orgId && tm.rank === 'Manager');
  };

  const getOrgMembersCount = (orgId: string) => {
    return teamMembers.filter(tm => tm.orgId === orgId).length;
  };

  const getOrgMembers = (orgId: string) => {
    return teamMembers.filter(tm => tm.orgId === orgId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Requests & Registrations
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Super Administrator panel to manage company join requests and personal/family user sign-ins.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 p-1 rounded-2xl gap-1 self-start sm:self-auto shadow-sm flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Company Join Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('family-personal')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'family-personal'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Family & Personal Plans ({personalFamilyOrgs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            User Directory ({teamMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signins')}
            className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'signins'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Sign-in & IP Logs ({signInLogs?.length || 0})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'requests' ? (
          /* SECTION 1: Company Join Requests */
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Search and Alert */}
            <div className="flex flex-col md:flex-row gap-3 items-center shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company, contact name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none text-neutral-800 dark:text-white transition-all font-medium placeholder-neutral-400"
                />
              </div>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-2 rounded-xl flex items-center gap-1.5 w-full md:w-auto">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Companies must send an actual manual confirmation email to webtasky@gmail.com.</span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-3 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
                  {filteredRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="p-5 sm:p-6 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Status badge & title */}
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-200/10 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-neutral-800 dark:text-white leading-tight">
                                {req.companyName}
                              </h3>
                              <span className="text-[10px] text-neutral-400">
                                Submitted {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {req.status === 'approved' ? (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </div>
                            ) : req.status === 'declined' ? (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-500/20">
                                <XCircle className="w-3 h-3" />
                                Declined
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Pending Email
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Contact Person</span>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-neutral-400" />
                              {req.contactName}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Expected Members</span>
                            <p className="font-mono font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-neutral-400" />
                              {req.membersCount || 0} Members
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</span>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 break-all">
                              <Mail className="w-3.5 h-3.5 text-neutral-400" />
                              {req.email}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Phone Number</span>
                            <p className="font-mono font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" />
                              {req.phone}
                            </p>
                          </div>
                        </div>

                        {/* Message */}
                        {req.message && (
                          <div className="mt-4 space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                              <MessageSquareCode className="w-3.5 h-3.5" />
                              Request Details
                            </span>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-black/10 dark:bg-black/20 p-3 rounded-2xl font-sans whitespace-pre-wrap leading-relaxed border border-neutral-200/5">
                              {req.message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Panel */}
                      <div className="mt-5 pt-4 border-t border-neutral-200/10 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id)}
                          className="px-3 py-1.5 hover:bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Delete Log
                        </button>

                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecline(req.id)}
                              className="px-3.5 py-1.5 border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <X className="w-3 h-3" />
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-indigo-500/10 cursor-pointer transition-all"
                            >
                              <Check className="w-3 h-3" />
                              Approve & Provision
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/10 dark:bg-white/5 rounded-[32px] border border-white/20 dark:border-white/10 text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
                  <Building2 className="w-9 h-9 text-neutral-500 opacity-60" />
                  <span>No company registration requests match your search query.</span>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'family-personal' ? (
          /* SECTION 2: Family & Personal Workspaces (New Sign-Ins) */
          <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-1 pb-6">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-5 flex items-start gap-4 text-indigo-800 dark:text-indigo-300 shrink-0">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                <Smile className="w-5 h-5 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  Family & Personal Circles Explorer
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  Below is a real-time monitor of active family circles and individual personal workspaces signed in on the system. Family/Personal plans are pre-configured to only contain Managers (workspace creators) and Users (their family members/assignees) to keep sharing private and safe.
                </p>
              </div>
            </div>

            {personalFamilyOrgs.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {personalFamilyOrgs.map((org) => {
                  const manager = getOrgManager(org.id);
                  const memberCount = getOrgMembersCount(org.id);
                  const members = getOrgMembers(org.id);

                  return (
                    <div 
                      key={org.id}
                      className="p-5 sm:p-6 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-neutral-200/10 pb-3">
                        <div className="flex gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/5 text-rose-500 flex items-center justify-center shrink-0">
                            <Heart className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-neutral-800 dark:text-white leading-tight">
                              {org.name}
                            </h3>
                            <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              Created {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Plan Type Badge */}
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          org.type === 'Family' 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {org.type === 'Family' ? 'Family Plan' : 'Personal Plan'}
                        </div>
                      </div>

                      {/* Manager Details */}
                      <div className="space-y-2 text-xs">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-500">
                          Workspace Creator / Manager
                        </span>
                        {manager ? (
                          <div className="flex items-center gap-2.5 p-3 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-2xl">
                            <div className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-300">
                              {manager.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-neutral-800 dark:text-white leading-tight">{manager.name}</h4>
                              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{manager.email}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-neutral-400 italic">No primary Manager found for this workspace yet.</p>
                        )}
                      </div>

                      {/* Member list section */}
                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">
                            Registered Users ({memberCount})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {members.map((member) => (
                            <div 
                              key={member.id}
                              className="px-2.5 py-1.5 bg-neutral-100/50 dark:bg-white/5 border border-neutral-200/25 dark:border-white/5 rounded-xl flex items-center gap-1.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300"
                            >
                              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                                {member.avatar}
                              </div>
                              <span>{member.name} ({member.rank})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/10 dark:bg-white/5 rounded-[32px] border border-white/20 dark:border-white/10 text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
                <Heart className="w-9 h-9 text-neutral-500 opacity-60" />
                <span>No family or personal circles have registered yet.</span>
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          /* SECTION 3: User Directory */
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name, email, role, or rank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none text-neutral-800 dark:text-white transition-all font-medium placeholder-neutral-400"
              />
            </div>

            {/* Users Grid */}
            <div className="flex-1 overflow-y-auto pr-1 pb-6">
              {teamMembers.filter(m => 
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (m.role && m.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                m.rank.toLowerCase().includes(searchTerm.toLowerCase())
              ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {teamMembers.filter(m => 
                    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (m.role && m.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    m.rank.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((m) => {
                    const org = organizations.find((o: any) => o.id === m.orgId);
                    return (
                      <div 
                        key={m.id}
                        className="p-4 sm:p-5 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-3xl flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">
                              {m.avatar || m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                                  {m.name}
                                </h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                  m.rank === 'Admin' 
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                    : m.rank === 'Manager' 
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : m.rank === 'Supervisor'
                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 rounded font-mono font-medium'
                                }`}>
                                  {m.rank}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                {m.email}
                              </p>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-lg font-mono font-semibold mt-1 inline-block">
                                {m.role || 'Member'}
                              </span>
                              {m.lastSignInIp && (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Last IP: {m.lastSignInIp} {m.lastSignInLocation ? `(${m.lastSignInLocation})` : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-neutral-200/10 pt-3.5 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-neutral-400 truncate font-medium">
                            Plan: <span className="text-indigo-500 dark:text-indigo-400 font-bold">{org ? org.name : 'Freelance / Personal'}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Impersonation button */}
                            {m.email && m.email !== currentUserProfile?.email && (
                              <button
                                type="button"
                                onClick={() => impersonateUser(m.email)}
                                className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                                title={`Sign in as ${m.name}`}
                              >
                                Sign In
                              </button>
                            )}

                            {/* Send Welcome Email / Gmail button */}
                            {m.email && (
                              <button
                                type="button"
                                onClick={() => setEmailModalUser(m)}
                                className="p-1 rounded-lg bg-neutral-50 dark:bg-neutral-850 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center border border-red-500/20"
                                title="Compose Welcome Email (Gmail)"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit member button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMember(m);
                                setEditMemberName(m.name || '');
                                setEditMemberRole(m.role || '');
                                setEditMemberRank(m.rank || 'User');
                                setEditMemberEmail(m.email || '');
                                setEditMemberPassword(m.password || '');
                                setEditMemberOrgId(m.orgId || '');
                              }}
                              className="p-1 rounded-lg bg-neutral-50 dark:bg-neutral-850 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center justify-center border border-amber-500/20"
                              title="Edit User Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete member button */}
                            {m.id !== currentUserProfile?.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to permanently delete user ${m.name}? This cannot be undone.`)) {
                                    deleteTeamMember(m.id || m.email);
                                    setTeamMembers(prev => prev.filter(item => item.id !== m.id && (!m.email || item.email !== m.email)));
                                  }
                                }}
                                className="p-1 rounded-lg bg-neutral-50 dark:bg-neutral-850 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center border border-rose-500/20"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/10 dark:bg-white/5 rounded-[32px] border border-white/20 dark:border-white/10 text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
                  <Users className="w-9 h-9 text-neutral-500 opacity-60" />
                  <span>No registered users match your search query.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SECTION 4: Sign-in & IP Logs (Καταγραφή Συνδέσεων & IP) */
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Header & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-2xl">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Sign-in IP Activity & Audit Logs (Ιστορικό IP Συνδέσεων)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Live real-time monitoring of user logins, IP addresses, city & country location, and client devices.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live IP Tracking Active
                </span>

                <button
                  type="button"
                  onClick={handleRecordCurrentIpNow}
                  disabled={isRecordingCurrentIp}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecordingCurrentIp ? 'animate-spin' : ''}`} />
                  <span>{isRecordingCurrentIp ? 'Tracking...' : 'Log Current IP'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportIpLogs}
                  className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-neutral-800 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                {signInLogs && signInLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear the local IP log history?")) {
                        clearSignInLogs && clearSignInLogs();
                      }
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-500/20 cursor-pointer"
                    title="Clear IP logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Feedback notification */}
            {ipFeedbackMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{ipFeedbackMsg}</span>
              </motion.div>
            )}

            {/* Metric Statistics Cards */}
            {(() => {
              const logsList = signInLogs || [];
              const totalEvents = logsList.length;
              const uniqueIps = new Set(logsList.map((l: any) => l.ip)).size;
              const uniqueEmails = new Set(logsList.map((l: any) => l.userEmail)).size;
              const uniqueCountries = new Set(logsList.map((l: any) => l.country).filter(Boolean)).size;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/5">
                    <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">Total Sign-ins</span>
                    <span className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 block">{totalEvents}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/5">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 block">Unique IP Addresses</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{uniqueIps}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/5">
                    <span className="text-[10px] uppercase font-mono font-bold text-indigo-500 block">Unique Accounts</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{uniqueEmails}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/5">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-500 block">Active Countries</span>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{uniqueCountries || (totalEvents > 0 ? 1 : 0)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by IP address (e.g. 192.168), email, username, city, or country..."
                  value={ipSearchTerm}
                  onChange={(e) => setIpSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none text-neutral-800 dark:text-white transition-all font-medium placeholder-neutral-400"
                />
              </div>

              <select
                value={ipMethodFilter}
                onChange={(e) => setIpMethodFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-xl text-neutral-800 dark:text-white focus:outline-none shrink-0"
              >
                <option value="all">All Sign-in Methods</option>
                <option value="admin">Super Admin Portal</option>
                <option value="password">Password Sign-in</option>
                <option value="registration">Registration</option>
                <option value="session_resume">Active Session</option>
              </select>
            </div>

            {/* List of IP Sign-in Logs */}
            {(() => {
              const logsList = signInLogs || [];
              const filtered = logsList.filter((log: any) => {
                const q = ipSearchTerm.toLowerCase().trim();
                const matchesSearch = !q ||
                  (log.ip && log.ip.toLowerCase().includes(q)) ||
                  (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
                  (log.userName && log.userName.toLowerCase().includes(q)) ||
                  (log.city && log.city.toLowerCase().includes(q)) ||
                  (log.country && log.country.toLowerCase().includes(q)) ||
                  (log.device && log.device.toLowerCase().includes(q));
                const matchesMethod = ipMethodFilter === 'all' || log.method === ipMethodFilter;
                return matchesSearch && matchesMethod;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 bg-white/10 dark:bg-white/5 rounded-[32px] border border-white/20 dark:border-white/10 text-neutral-400 text-xs flex flex-col items-center justify-center gap-3">
                    <Globe className="w-10 h-10 text-emerald-500/60" />
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {logsList.length === 0 ? 'No sign-in IP events captured yet.' : 'No sign-in records match your filter criteria.'}
                    </span>
                    <p className="text-[11px] text-neutral-500 max-w-md">
                      Every time a user signs in, Tasky automatically captures their IP address, location, and device details for security auditing.
                    </p>
                    <button
                      type="button"
                      onClick={handleRecordCurrentIpNow}
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Record Current Session IP</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((log: any) => {
                      const flag = getCountryFlag(log.countryCode);
                      const isMobile = /Mobile|Android|iPhone/i.test(log.device || '');
                      const formattedTime = new Date(log.timestamp).toLocaleString();

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 shadow-xs"
                        >
                          {/* Top: User info + Method badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                {log.userName ? log.userName.slice(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                  {log.userName || log.userEmail.split('@')[0]}
                                </h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                  {log.userEmail}
                                </p>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                              log.method === 'admin'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                : log.method === 'registration'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : log.method === 'session_resume'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                            }`}>
                              {log.method === 'admin' ? 'Admin Portal' : log.method === 'registration' ? 'New Registration' : log.method === 'session_resume' ? 'Active Session' : 'Password'}
                            </span>
                          </div>

                          {/* Middle: IP Address (Copyable) & Location */}
                          <div className="p-3 bg-white/40 dark:bg-neutral-850/60 rounded-xl border border-neutral-200/40 dark:border-white/5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">IP:</span>
                                <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white bg-neutral-200/60 dark:bg-white/10 px-2 py-0.5 rounded-lg select-all">
                                  {log.ip}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopyIp(log.ip, log.id)}
                                className="px-2 py-1 bg-white/60 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                title="Copy IP to clipboard"
                              >
                                {copiedIpId === log.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Location line */}
                            <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                              <span className="text-base leading-none">{flag}</span>
                              <span className="truncate">
                                {[log.city, log.region, log.country].filter(Boolean).join(', ') || 'Unknown Location'}
                              </span>
                            </div>

                            {/* Client device line */}
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                              {isMobile ? (
                                <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                              <span className="truncate">{log.device || 'Web Browser'}</span>
                            </div>
                          </div>

                          {/* Bottom: Date & Timestamp */}
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formattedTime}
                            </span>
                            <span>ID: {log.id.slice(0, 14)}...</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
                  Edit User Details
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Update profile, credentials and access rank for this user.
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
                    disabled={editingMember.id === currentUserProfile?.id}
                    onChange={(e) => setEditMemberRank(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  >
                    <option value="User">User (Standard Access)</option>
                    <option value="Supervisor">Supervisor (Task Management)</option>
                    <option value="Manager">Manager (Full Plan Control)</option>
                    <option value="Admin">Admin (System Super-User)</option>
                  </select>
                </div>

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

      {emailModalUser && (
        <SendEmailModal
          isOpen={!!emailModalUser}
          onClose={() => setEmailModalUser(null)}
          recipientName={emailModalUser.name}
          recipientEmail={emailModalUser.email}
          initialPassword={emailModalUser.password || '123456'}
          role={emailModalUser.role}
          rank={emailModalUser.rank}
          orgName={organizations.find((o: any) => o.id === emailModalUser.orgId)?.name}
        />
      )}
    </div>
  );
};
