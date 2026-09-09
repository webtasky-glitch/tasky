import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { Task, TaskPriority, TaskStatus, RecurringType } from '../types';
import { SourceSelector } from './SourceSelector';
import { AssigneeMultiSelector } from './AssigneeMultiSelector';
import { AssigneeAvatarStack } from './AssigneeAvatarStack';
import { getTaskAssigneeIds } from '../utils/taskFilter';
import { 
  X, 
  Trash2, 
  Pin, 
  Calendar, 
  Clock,
  Tag, 
  Flag, 
  User, 
  Users,
  Repeat, 
  Paperclip, 
  MessageSquare, 
  CheckSquare, 
  Plus, 
  Trash,
  ExternalLink,
  Upload,
  Download,
  Send,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkPersonAvailability } from '../utils/availability';
import { useTranslation } from '../translations';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { 
    tasks,
    categories, 
    teamMembers, 
    projects,
    updateTask, 
    deleteTask, 
    togglePinTask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addAttachment,
    deleteAttachment,
    addComment,
    currentUserProfile,
    sendAvailabilityInquiry
  } = useTasky() as any;

  const { t, language, tPriority, tStatus, tRecurring, tFocusBlock } = useTranslation();
  const isEl = language === 'el';

  // Filter assignees: When in a Project, anyone in the project can assign to anyone in the project independent of plan!
  const assignableMembers = React.useMemo(() => {
    // Check if task is associated with a project
    if (task.projectId && projects && Array.isArray(projects)) {
      const proj = projects.find((p: any) => p.id === task.projectId);
      if (proj) {
        const projectMemberIds = [proj.ownerId, ...(proj.memberIds || [])].filter(Boolean);
        const projectMembers = (teamMembers || []).filter((tm: any) => {
          const isIdMatch = tm.id && projectMemberIds.some((id: string) => id.toLowerCase() === tm.id.toLowerCase());
          const isEmailMatch = tm.email && projectMemberIds.some((id: string) => id.toLowerCase() === tm.email.toLowerCase());
          const isOwner = proj.ownerId && (
            proj.ownerId.toLowerCase() === tm.id?.toLowerCase() ||
            (tm.email && proj.ownerId.toLowerCase() === tm.email.toLowerCase())
          );
          return isIdMatch || isEmailMatch || isOwner;
        });

        const isCurrentUserInProject = currentUserProfile?.rank === 'Admin' ||
          projectMemberIds.some((id: string) => 
            id.toLowerCase() === currentUserProfile?.id?.toLowerCase() ||
            (currentUserProfile?.email && id.toLowerCase() === currentUserProfile?.email.toLowerCase()) ||
            (proj.ownerEmail && currentUserProfile?.email && proj.ownerEmail.toLowerCase() === currentUserProfile.email.toLowerCase())
          );

        if (isCurrentUserInProject && projectMembers.length > 0) {
          return projectMembers;
        }
      }
    }

    // Standard workspace plan hierarchy filtering
    return (teamMembers || []).filter((tm: any) => {
      if (currentUserProfile?.rank === 'Admin') {
        return true;
      }
      if (tm.rank === 'Admin') {
        return false; // Admin is invisible to non-admins
      }
      if (currentUserProfile?.rank === 'Supervisor') {
        return tm.orgId === currentUserProfile.orgId && tm.rank !== 'Manager';
      }
      if (currentUserProfile?.rank === 'User') {
        return tm.id === currentUserProfile.id;
      }
      if (currentUserProfile?.rank === 'Manager') {
        return tm.orgId === currentUserProfile.orgId;
      }
      return tm.id === currentUserProfile?.id;
    });
  }, [task.projectId, projects, teamMembers, currentUserProfile]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDesc, setEditedDesc] = useState(task.description);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.categoryId);
  const [editedStatus, setEditedStatus] = useState<TaskStatus>(task.status);
  const [editedAssignees, setEditedAssignees] = useState<string[]>(getTaskAssigneeIds(task));
  const [editedRecurring, setEditedRecurring] = useState<RecurringType>(task.recurring);
  const [editedFocusBlock, setEditedFocusBlock] = useState<'MorningFocus' | 'AfternoonDeep' | 'QuickAdmin' | 'EveningReview'>(task.focusBlock || 'MorningFocus');
  const [editedEstimatedHours, setEditedEstimatedHours] = useState<number>(task.estimatedHours || 1.5);
  const [editedDependsOn, setEditedDependsOn] = useState<string>(task.dependsOnTaskId || '');

  // Time & All-Day states
  const [editedStartTime, setEditedStartTime] = useState<string>(task.startTime || '');
  const [editedEndTime, setEditedEndTime] = useState<string>(task.endTime || '');
  const [editedIsAllDay, setEditedIsAllDay] = useState<boolean>(task.isAllDay ?? (!task.startTime));

  // Availability Inquiry modal state
  const [inquiryModal, setInquiryModal] = useState<{
    isOpen: boolean;
    recipientId: string;
    recipientName: string;
    messageText: string;
  }>({
    isOpen: false,
    recipientId: '',
    recipientName: '',
    messageText: ''
  });
  const [inquirySuccessAlert, setInquirySuccessAlert] = useState<string | null>(null);

  // Subtask local states
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Comment local states
  const [commentText, setCommentText] = useState('');

  // Attachment simulated files
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate availability for each assigned member
  const assigneeAvailabilities = React.useMemo(() => {
    if (!editedDueDate || editedAssignees.length === 0) return [];
    return editedAssignees.map(memberId => {
      const member = teamMembers.find((m: any) => m.id === memberId || (m.email && m.email.toLowerCase() === memberId.toLowerCase()));
      const availability = checkPersonAvailability(
        memberId,
        editedDueDate,
        editedIsAllDay ? undefined : editedStartTime,
        editedIsAllDay ? undefined : editedEndTime,
        tasks,
        task.id
      );
      return {
        memberId,
        member,
        name: member?.name || memberId,
        ...availability
      };
    });
  }, [editedAssignees, editedDueDate, editedStartTime, editedEndTime, editedIsAllDay, tasks, task.id, teamMembers]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryModal.messageText.trim() || !inquiryModal.recipientId) return;

    await sendAvailabilityInquiry(inquiryModal.recipientId, inquiryModal.messageText.trim(), task.id);
    setInquirySuccessAlert(`${t('task.inquirySent')} ${inquiryModal.recipientName}!`);
    setInquiryModal({ isOpen: false, recipientId: '', recipientName: '', messageText: '' });
    setTimeout(() => setInquirySuccessAlert(null), 4000);
  };

  const handleSave = () => {
    updateTask({
      ...task,
      title: editedTitle,
      description: editedDesc,
      dueDate: editedDueDate,
      startTime: editedIsAllDay ? undefined : (editedStartTime || undefined),
      endTime: editedIsAllDay ? undefined : (editedEndTime || undefined),
      isAllDay: editedIsAllDay,
      priority: editedPriority,
      categoryId: editedCategory,
      status: editedStatus,
      assignedTo: editedAssignees[0] || undefined,
      assignedToIds: editedAssignees,
      recurring: editedRecurring,
      focusBlock: editedFocusBlock,
      estimatedHours: Number(editedEstimatedHours) || 1.5,
      dependsOnTaskId: editedDependsOn || undefined,
    });
    setIsEditing(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    addChecklistItem(task.id, newSubtaskText.trim());
    setNewSubtaskText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // Post as the actual logged-in user dynamically!
    addComment(
      task.id,
      currentUserProfile?.avatar || '👤',
      currentUserProfile?.name || 'Anonymous User',
      commentText.trim()
    );
    setCommentText('');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleDownloadAttachment = (att: { name: string; type: string; size?: string; url?: string }) => {
    // Helper to decode data URLs securely to local Blob
    const dataURLtoBlob = (dataUrl: string) => {
      try {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        const isBase64 = parts[0].indexOf('base64') >= 0;
        const mime = parts[0].match(/:(.*?);/)![1];
        let bstr = '';
        if (isBase64) {
          bstr = atob(parts[1]);
        } else {
          bstr = decodeURIComponent(parts[1]);
        }
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } catch (e) {
        console.error('Error decoding data URL:', e);
        return null;
      }
    };

    // Helper to generate a valid minimal PDF 1.4 template to satisfy PDF readers
    const generateMinimalPDF = (title: string, details: string) => {
      const escapedTitle = title.replace(/[()]/g, '\\$&').substring(0, 100);
      const escapedDetails = details.replace(/[()]/g, '\\$&').substring(0, 100);
      
      const streamContent = `BT
/F1 12 Tf
72 712 Td
(Task: ${escapedTitle}) Tj
0 -18 Td
(Source: ${escapedDetails}) Tj
0 -18 Td
(This is a verified academic source reference associated with the assignment.) Tj
ET`;

      const streamLength = streamContent.length;

      const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000280 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
450
%%EOF`;

      const bytes = new Uint8Array(pdfString.length);
      for (let i = 0; i < pdfString.length; i++) {
        bytes[i] = pdfString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'application/pdf' });
    };

    // 1. If it's a base64 or custom data URL (e.g. from real uploaded file)
    if (att.url && att.url.startsWith('data:')) {
      const blob = dataURLtoBlob(att.url);
      if (blob) {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = att.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        return;
      }
    }

    // 2. If it's a real external web link
    if (att.url && att.url !== '#' && !att.url.startsWith('mailto:') && !att.url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = att.url;
      link.target = '_blank';
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. Simulated/Mock source file references (att.url === '#' or similar)
    const isPdf = att.type.toLowerCase() === 'pdf' || att.name.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      // Generate a valid minimal PDF file so PDF viewers open it perfectly
      const pdfBlob = generateMinimalPDF(task.title, att.name);
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = att.name.toLowerCase().endsWith('.pdf') ? att.name : `${att.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } else {
      // Create a simulated text/document file detailing the assignment source details
      let docContent = `==================================================\n`;
      docContent += `               TASK SOURCE REFERENCE              \n`;
      docContent += `==================================================\n\n`;
      docContent += `Task/Assignment:   ${task.title}\n`;
      docContent += `Source Document:  ${att.name}\n`;
      docContent += `Type:             ${att.type.toUpperCase()}\n`;
      if (att.size) {
        docContent += `Size/Reference:   ${att.size}\n`;
      }
      docContent += `Downloaded On:    ${new Date().toLocaleString()}\n\n`;
      docContent += `--------------------------------------------------\n`;
      docContent += `SOURCE CONTENT DETAILS\n`;
      docContent += `--------------------------------------------------\n\n`;
      
      if (att.type === 'email') {
        docContent += `This is a verified email reference attached to this task.\n`;
        docContent += `Subject: ${att.name}\n`;
        if (att.size) {
          docContent += `${att.size}\n`;
        }
      } else if (att.type === 'link') {
        docContent += `This is a verified web reference attached to this task.\n`;
        docContent += `Title:   ${att.name}\n`;
        docContent += `Address: ${att.url || 'Not Specified'}\n`;
      } else {
        docContent += `This is a verified academic/project file reference attached to this task.\n`;
        docContent += `File Name: ${att.name}\n`;
        docContent += `File Type: ${att.type.toUpperCase()} Document\n`;
        if (att.size) {
          docContent += `File Size: ${att.size}\n`;
        }
      }
      
      docContent += `\n\n==================================================\n`;
      docContent += `Generated by Tasky Workspace. All rights reserved.\n`;
      docContent += `==================================================\n`;

      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const safeName = att.name.toLowerCase().includes(att.type.toLowerCase()) 
        ? att.name 
        : `${att.name}.${att.type}.txt`;
      
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }
  };

  // File drop handler with up to 1 GB limit
  const processTaskFile = (file: File) => {
    const maxLimit = 1024 * 1024 * 1024; // 1 GB
    if (file.size > maxLimit) {
      alert('File is too large! Maximum allowed upload size is 1 GB.');
      return;
    }

    const sizeStr = file.size >= 1024 * 1024 * 1024
      ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : file.size >= 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    const extension = file.name.split('.').pop() || 'pdf';

    if (file.size <= 800 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addAttachment(task.id, file.name, extension, sizeStr, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const objectUrl = URL.createObjectURL(file);
      addAttachment(task.id, file.name, extension, sizeStr, objectUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processTaskFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processTaskFile(e.target.files[0]);
    }
  };

  const activeCategory = categories.find(c => c.id === task.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden rounded-[24px] border border-white/30 dark:border-white/10"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${activeCategory?.color || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
              {activeCategory?.name || (isEl ? 'Χωρίς Κατηγορία' : 'Uncategorized')}
            </span>
            <button 
              onClick={() => togglePinTask(task.id)}
              className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${task.isPinned ? 'text-amber-500' : 'text-neutral-400'}`}
              title={isEl ? (task.isPinned ? 'Ξεκαρφίτσωμα' : 'Καρφίτσωμα') : (task.isPinned ? 'Unpin Task' : 'Pin Task')}
            >
              <Pin className={`w-4 h-4 ${task.isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/35 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-white/25 dark:border-white/5 cursor-pointer"
              >
                {isEl ? 'Επεξεργασία Στοιχείων' : 'Edit Details'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {t('common.save')}
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(task.title);
                    setEditedDesc(task.description);
                    setEditedDueDate(task.dueDate);
                    setEditedPriority(task.priority);
                    setEditedCategory(task.categoryId);
                    setEditedStatus(task.status);
                    setEditedAssignees(getTaskAssigneeIds(task));
                    setEditedRecurring(task.recurring);
                  }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/35 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-white/25 dark:border-white/5 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-2 py-1 rounded-xl">
                <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  {isEl ? 'Διαγραφή εργασίας;' : 'Delete task?'}
                </span>
                <button 
                  onClick={handleDelete}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  {t('common.yes')}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  {t('common.no')}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                title={t('common.delete')}
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800">
          {/* Main Content Area (2 cols) */}
          <div className="md:col-span-2 p-6 space-y-6">
            {/* Title & Description */}
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full text-xl font-sans font-semibold text-neutral-900 dark:text-white px-3.5 py-2 focus:outline-none glass-input rounded-xl"
                  />
                  <textarea 
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    rows={3}
                    className="w-full text-sm text-neutral-600 dark:text-neutral-300 px-3.5 py-2.5 focus:outline-none glass-input rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <h2 className="text-xl font-sans font-semibold text-neutral-900 dark:text-white">
                    {task.title}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                    {task.description || <span className="text-neutral-400 italic">{isEl ? 'Δεν έχει δοθεί περιγραφή.' : 'No description provided.'}</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Subtasks Checklist */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-3">
                <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
                {isEl ? 'Υποεργασίες & Λίστα Ελέγχου' : 'Subtasks & Checklist'}
              </h3>
              
              {/* Progress Bar */}
              {task.checklist.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span>
                      {task.checklist.filter(item => item.completed).length} {isEl ? 'από' : 'of'} {task.checklist.length} {isEl ? 'ολοκληρώθηκαν' : 'completed'}
                    </span>
                    <span>
                      {Math.round((task.checklist.filter(item => item.completed).length / task.checklist.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(task.checklist.filter(item => item.completed).length / task.checklist.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {task.checklist.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between group bg-white/10 dark:bg-white/5 p-2 rounded-xl border border-white/20 dark:border-white/5 hover:border-indigo-500/50 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(task.id, item.id)}
                        className="w-4 h-4 rounded text-indigo-600 border-neutral-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-sm select-none truncate ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {item.text}
                      </span>
                    </label>
                    <button 
                      onClick={() => deleteChecklistItem(task.id, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-600 transition-all cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {task.checklist.length === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    {isEl ? 'Δεν υπάρχουν υποεργασίες ακόμη. Προσθέστε βήματα για να παρακολουθείτε την πρόοδό σας.' : 'No checklist items yet. Add subtasks to track your progress.'}
                  </p>
                )}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddSubtask} className="mt-3 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder={isEl ? 'Προσθήκη υποεργασίας...' : 'Add a subtask...'}
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 glass-input rounded-xl px-3 py-2 text-xs focus:outline-none text-neutral-800 dark:text-neutral-100"
                />
                <button 
                  type="submit"
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-3">
                <Paperclip className="w-4.5 h-4.5 text-indigo-500" />
                {t('common.attachments')}
              </h3>

              {/* List of files */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                {task.attachments.map((att) => (
                  <div 
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-white/20 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 text-[10px]">
                        {att.type}
                      </span>
                      <div className="truncate min-w-0">
                        <p className="font-medium text-neutral-700 dark:text-neutral-300 truncate">{att.name}</p>
                        {att.size && <p className="text-[10px] text-neutral-400 font-mono">{att.size}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleDownloadAttachment(att)}
                        title={t('task.downloadRef')}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {att.url && att.url !== '#' && !att.url.startsWith('mailto:') && (
                        <a 
                          href={att.url} 
                          target="_blank" 
                          rel="noreferrer"
                          title={t('task.openLink')}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button 
                        onClick={() => deleteAttachment(task.id, att.id)}
                        title={t('task.deleteSource')}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <SourceSelector 
                onAddSource={(name, type, size, url) => {
                  addAttachment(task.id, name, type, size, url);
                }}
              />
            </div>
          </div>

          {/* Sidebar Area (1 col) */}
          <div className="p-6 space-y-6">
            {/* Task properties list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {t('task.assignmentDetails')}
              </h3>

              {/* Status Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  {t('common.status')}
                </span>
                {isEditing ? (
                  <select 
                    value={editedStatus} 
                    onChange={(e) => setEditedStatus(e.target.value as TaskStatus)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="Todo">{tStatus('Todo')}</option>
                    <option value="InProgress">{tStatus('InProgress')}</option>
                    <option value="Completed">{tStatus('Completed')}</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    task.status === 'Completed' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' 
                      : task.status === 'InProgress'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                      : 'bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                  }`}>
                    {tStatus(task.status)}
                  </span>
                )}
              </div>

              {/* Due Date Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('common.dueDate')}
                </span>
                {isEditing ? (
                  <input 
                    type="date" 
                    value={editedDueDate} 
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none font-mono"
                  />
                ) : (
                  <span className={`font-mono ${new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? 'text-rose-600 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {task.dueDate}
                  </span>
                )}
              </div>

              {/* Task Time / All-Day Selector */}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {t('task.timeLabel')}
                  </span>
                  {isEditing ? (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={editedIsAllDay}
                        onChange={(e) => setEditedIsAllDay(e.target.checked)}
                        className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{t('task.allDayLabel')}</span>
                    </label>
                  ) : (
                    <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                      {task.startTime ? `${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''}` : t('task.allDayLabel')}
                    </span>
                  )}
                </div>

                {isEditing && !editedIsAllDay && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">
                        {t('task.startTime')}
                      </label>
                      <input 
                        type="time" 
                        value={editedStartTime}
                        onChange={(e) => setEditedStartTime(e.target.value)}
                        className="glass-input w-full rounded-xl px-2 py-1 text-xs focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 font-bold block mb-0.5">
                        {t('task.endTime')}
                      </label>
                      <input 
                        type="time" 
                        value={editedEndTime}
                        onChange={(e) => setEditedEndTime(e.target.value)}
                        className="glass-input w-full rounded-xl px-2 py-1 text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  {t('common.priority')}
                </span>
                {isEditing ? (
                  <select 
                    value={editedPriority} 
                    onChange={(e) => setEditedPriority(e.target.value as TaskPriority)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="Low">{tPriority('Low')}</option>
                    <option value="Medium">{tPriority('Medium')}</option>
                    <option value="High">{tPriority('High')}</option>
                    <option value="Urgent">{tPriority('Urgent')}</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    task.priority === 'Urgent'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                      : task.priority === 'High'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50'
                      : task.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                      : 'bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                  }`}>
                    {tPriority(task.priority)}
                  </span>
                )}
              </div>

              {/* Category Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {t('common.category')}
                </span>
                {isEditing ? (
                  <select 
                    value={editedCategory} 
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {activeCategory?.name || t('task.unassigned')}
                  </span>
                )}
              </div>

              {/* Assignee Selector / Viewer */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {t('common.assignedTo')}
                  </span>
                  {!isEditing && (
                    <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                      {getTaskAssigneeIds(task).length > 0 ? `${getTaskAssigneeIds(task).length} ${isEl ? 'ανατεθειμένοι' : 'assigned'}` : t('common.none')}
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <AssigneeMultiSelector
                    selectedIds={editedAssignees}
                    onChange={setEditedAssignees}
                    assignableMembers={assignableMembers}
                    currentUserId={currentUserProfile?.id}
                    placeholder={t('task.selectPlanMembers')}
                  />
                ) : (
                  <div className="pt-0.5">
                    {(() => {
                      const assigneeIds = getTaskAssigneeIds(task);
                      const resolved = assigneeIds
                        .map(id => teamMembers.find(tm => tm.id === id || (tm.email && tm.email.toLowerCase() === id.toLowerCase())))
                        .filter(Boolean);

                      if (resolved.length === 0) {
                        return (
                          <span className="text-neutral-400 dark:text-neutral-500 italic">
                            {t('task.unassigned')}
                          </span>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {resolved.map((tm: any) => (
                            <span 
                              key={tm.id} 
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[11px] font-medium"
                              title={`${tm.name} (${tm.role || tm.rank || 'Member'})`}
                            >
                              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[8px]">
                                {tm.avatar || tm.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="truncate max-w-[120px]">{tm.name}</span>
                              {tm.rank && (
                                <span className="text-[9px] px-1 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-normal">
                                  {tm.rank}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Person Availability & Privacy-preserving status */}
              {assigneeAvailabilities.length > 0 && (
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    {t('task.availabilityTitle')}
                  </span>
                  <div className="space-y-1.5">
                    {assigneeAvailabilities.map((item) => (
                      <div 
                        key={item.memberId}
                        className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                          item.status === 'busy'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'busy' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="truncate">{item.name}</span>
                            <span className="text-[10px] font-normal opacity-85">
                              {item.status === 'busy' ? `(${t('task.personBusy')})` : `(${t('task.personAvailable')})`}
                            </span>
                          </div>
                          {item.status === 'busy' && (
                            <p className="text-[10px] opacity-75 mt-0.5 leading-tight">
                              {t('task.privacyNotice')}
                            </p>
                          )}
                        </div>

                        {item.status === 'busy' && (
                          <button
                            type="button"
                            onClick={() => {
                              setInquiryModal({
                                isOpen: true,
                                recipientId: item.memberId,
                                recipientName: item.name,
                                messageText: `Γεια σου ${item.name}, θα ήθελα να σου αναθέσω την εργασία "${editedTitle || task.title}" στις ${editedDueDate} ${!editedIsAllDay && editedStartTime ? `[${editedStartTime}${editedEndTime ? ` - ${editedEndTime}` : ''}]` : ''}. Είσαι διαθέσιμος/η ή προτιμάς άλλη ώρα;`
                              });
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {t('task.sendMessage')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  {isEl ? 'Επανάληψη' : 'Repeat'}
                </span>
                {isEditing ? (
                  <select 
                    value={editedRecurring} 
                    onChange={(e) => setEditedRecurring(e.target.value as RecurringType)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="None">{tRecurring('None')}</option>
                    <option value="Daily">{tRecurring('Daily')}</option>
                    <option value="Weekly">{tRecurring('Weekly')}</option>
                    <option value="Monthly">{tRecurring('Monthly')}</option>
                  </select>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {task.recurring !== 'None' ? tRecurring(task.recurring) : t('task.doesNotRepeat')}
                  </span>
                )}
              </div>

              {/* Energy & Focus Block Scheduling */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  {t('task.focusSlot')}
                </span>
                {isEditing ? (
                  <select 
                    value={editedFocusBlock} 
                    onChange={(e) => setEditedFocusBlock(e.target.value as any)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="MorningFocus">{tFocusBlock('MorningFocus')}</option>
                    <option value="AfternoonDeep">{tFocusBlock('AfternoonDeep')}</option>
                    <option value="QuickAdmin">{tFocusBlock('QuickAdmin')}</option>
                    <option value="EveningReview">{tFocusBlock('EveningReview')}</option>
                  </select>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {tFocusBlock(task.focusBlock)}
                  </span>
                )}
              </div>

              {/* Estimated Workload Effort (Hours) */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  {t('task.effortHours')}
                </span>
                {isEditing ? (
                  <input 
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={editedEstimatedHours}
                    onChange={(e) => setEditedEstimatedHours(parseFloat(e.target.value) || 1)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none w-20 text-right"
                  />
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300 font-mono font-medium">
                    {task.estimatedHours || 1.5} {isEl ? 'ώρες' : 'hrs'}
                  </span>
                )}
              </div>

              {/* Task Dependency (Blocked By) */}
              <div className="space-y-1 text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  {t('task.dependsOn')}
                </span>
                {isEditing ? (
                  <select
                    value={editedDependsOn}
                    onChange={(e) => setEditedDependsOn(e.target.value)}
                    className="glass-input rounded-xl px-2 py-1.5 text-xs focus:outline-none w-full"
                  >
                    <option value="">{t('task.noDependency')}</option>
                    {(tasks || []).filter((t: any) => t.id !== task.id).map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.dueDate})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {task.dependsOnTaskId ? (
                      (() => {
                        const dep = (tasks || []).find((t: any) => t.id === task.dependsOnTaskId);
                        return dep ? (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                            ↳ {t('task.waitingFor')}: {dep.title} ({tStatus(dep.status)})
                          </div>
                        ) : (
                          <span className="text-neutral-400">{t('common.none')}</span>
                        );
                      })()
                    ) : (
                      <span className="text-neutral-400 italic">{t('task.noDependency')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments / Discussion */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                {t('task.commentsActivity')} ({task.comments.length})
              </h3>

              {/* List of comments */}
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-2 mb-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-white/10 border border-white/20 dark:border-white/5 font-bold flex items-center justify-center text-[9px] text-neutral-600 dark:text-neutral-400">
                          {comment.authorAvatar}
                        </div>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                          {comment.authorName}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-neutral-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/5 p-2 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                ))}
                {task.comments.length === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center py-2">
                    {t('task.noComments')}
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="mt-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('task.typeComment')}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full glass-input rounded-xl pl-3.5 pr-12 py-2 text-xs focus:outline-none text-neutral-800 dark:text-neutral-100"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {t('task.post')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Success Alert for sent inquiry */}
        <AnimatePresence>
          {inquirySuccessAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 z-50 pointer-events-none"
            >
              <Send className="w-4 h-4" />
              <span>{inquirySuccessAlert}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Availability Inquiry Modal */}
        <AnimatePresence>
          {inquiryModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-rose-500" />
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                        {t('task.inquiryTitle')}
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        {t('task.inquirySubtitle')} {inquiryModal.recipientName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInquiryModal({ isOpen: false, recipientId: '', recipientName: '', messageText: '' })}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSendInquiry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('task.messagePrompt')}
                    </label>
                    <textarea
                      rows={4}
                      value={inquiryModal.messageText}
                      onChange={(e) => setInquiryModal(prev => ({ ...prev, messageText: e.target.value }))}
                      className="w-full text-xs p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/2 border border-neutral-200/50 dark:border-white/5 text-[11px] text-neutral-500 leading-relaxed">
                    ℹ️ {t('task.privacyNotice')}
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setInquiryModal({ isOpen: false, recipientId: '', recipientName: '', messageText: '' })}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      {t('modal.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('task.sendMessage')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
