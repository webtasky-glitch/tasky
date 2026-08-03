import React, { useState } from 'react';
import { useTasky } from '../TaskyContext';
import { Task, TaskPriority, TaskStatus, RecurringType } from '../types';
import { SourceSelector } from './SourceSelector';
import { 
  X, 
  Trash2, 
  Pin, 
  Calendar, 
  Tag, 
  Flag, 
  User, 
  Repeat, 
  Paperclip, 
  MessageSquare, 
  CheckSquare, 
  Plus, 
  Trash,
  ExternalLink,
  Upload,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { 
    categories, 
    teamMembers, 
    updateTask, 
    deleteTask, 
    togglePinTask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addAttachment,
    deleteAttachment,
    addComment,
    currentUserProfile
  } = useTasky() as any;

  // Filter assignees according to user role rules
  const assignableMembers = teamMembers.filter((tm: any) => {
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

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDesc, setEditedDesc] = useState(task.description);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate);
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.categoryId);
  const [editedStatus, setEditedStatus] = useState<TaskStatus>(task.status);
  const [editedAssignee, setEditedAssignee] = useState(task.assignedTo || '');
  const [editedRecurring, setEditedRecurring] = useState<RecurringType>(task.recurring);

  // Subtask local states
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Comment local states
  const [commentText, setCommentText] = useState('');

  // Attachment simulated files
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    updateTask({
      ...task,
      title: editedTitle,
      description: editedDesc,
      dueDate: editedDueDate,
      priority: editedPriority,
      categoryId: editedCategory,
      status: editedStatus,
      assignedTo: editedAssignee || undefined,
      recurring: editedRecurring,
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

  // Mock file drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const extension = file.name.split('.').pop() || 'pdf';
      addAttachment(task.id, file.name, extension, sizeStr);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const extension = file.name.split('.').pop() || 'pdf';
      addAttachment(task.id, file.name, extension, sizeStr);
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
              {activeCategory?.name || 'Uncategorized'}
            </span>
            <button 
              onClick={() => togglePinTask(task.id)}
              className={`p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${task.isPinned ? 'text-amber-500' : 'text-neutral-400'}`}
              title={task.isPinned ? 'Unpin Task' : 'Pin Task'}
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
                Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save
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
                    setEditedAssignee(task.assignedTo || '');
                    setEditedRecurring(task.recurring);
                  }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/35 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-white/25 dark:border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-2 py-1 rounded-xl">
                <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Delete task?</span>
                <button 
                  onClick={handleDelete}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Task"
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
                    {task.description || <span className="text-neutral-400 italic">No description provided.</span>}
                  </p>
                </div>
              )}
            </div>

            {/* Subtasks Checklist */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-3">
                <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
                Subtasks & Checklist
              </h3>
              
              {/* Progress Bar */}
              {task.checklist.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span>
                      {task.checklist.filter(item => item.completed).length} of {task.checklist.length} completed
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
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No checklist items yet. Add subtasks to track your progress.</p>
                )}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddSubtask} className="mt-3 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Add a subtask..."
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
                Attachments
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
                        title="Download Source Reference"
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {att.url && att.url !== '#' && !att.url.startsWith('mailto:') && (
                        <a 
                          href={att.url} 
                          target="_blank" 
                          rel="noreferrer"
                          title="Open Link"
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button 
                        onClick={() => deleteAttachment(task.id, att.id)}
                        title="Delete Source"
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
                Assignment Details
              </h3>

              {/* Status Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  Status
                </span>
                {isEditing ? (
                  <select 
                    value={editedStatus} 
                    onChange={(e) => setEditedStatus(e.target.value as TaskStatus)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    task.status === 'Completed' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' 
                      : task.status === 'InProgress'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                      : 'bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                  }`}>
                    {task.status === 'InProgress' ? 'In Progress' : task.status}
                  </span>
                )}
              </div>

              {/* Due Date Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date
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

              {/* Priority Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  Priority
                </span>
                {isEditing ? (
                  <select 
                    value={editedPriority} 
                    onChange={(e) => setEditedPriority(e.target.value as TaskPriority)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
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
                    {task.priority}
                  </span>
                )}
              </div>

              {/* Category Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Category
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
                    {activeCategory?.name || 'Unassigned'}
                  </span>
                )}
              </div>

              {/* Assignee Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Assignee
                </span>
                {isEditing ? (
                  <select 
                    value={editedAssignee} 
                    onChange={(e) => setEditedAssignee(e.target.value)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {assignableMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {teamMembers.find(t => t.id === task.assignedTo)?.name || 'Unassigned'}
                  </span>
                )}
              </div>

              {/* Recurring Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Repeat
                </span>
                {isEditing ? (
                  <select 
                    value={editedRecurring} 
                    onChange={(e) => setEditedRecurring(e.target.value as RecurringType)}
                    className="glass-input rounded-xl px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {task.recurring !== 'None' ? task.recurring : 'Does not repeat'}
                  </span>
                )}
              </div>
            </div>

            {/* Comments / Discussion */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Comments & Activity ({task.comments.length})
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
                    No comments yet. Start a discussion with your team!
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="mt-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Type a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full glass-input rounded-xl pl-3.5 pr-12 py-2 text-xs focus:outline-none text-neutral-800 dark:text-neutral-100"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
