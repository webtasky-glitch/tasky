import React, { useState } from 'react';
import { Mail, Link2, FileText, Upload, Plus } from 'lucide-react';

interface SourceSelectorProps {
  onAddSource: (name: string, type: string, size?: string, url?: string) => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ onAddSource }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'email' | 'link'>('file');

  // File states
  const [dragOver, setDragOver] = useState(false);
  const [manualFileName, setManualFileName] = useState('');
  const [manualFileSize, setManualFileSize] = useState('1.2 MB');

  // Email states
  const [emailSubject, setEmailSubject] = useState('');
  const [emailSender, setEmailSender] = useState('');
  const [emailPreview, setEmailPreview] = useState('');

  // Link states
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const processFile = (file: File) => {
    if (file.size > 800 * 1024) {
      alert('File is too large! Please upload files smaller than 800 KB to fit in the database.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
        const extension = file.name.split('.').pop() || 'pdf';
        onAddSource(file.name, extension, sizeStr, event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAddManualFile = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!manualFileName.trim()) return;
    let name = manualFileName.trim();
    const ext = name.split('.').pop() || 'pdf';
    if (!name.includes('.')) {
      name += '.pdf';
    }
    onAddSource(name, ext, manualFileSize || '1.0 MB', '#');
    setManualFileName('');
  };

  const handleAddEmail = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!emailSubject.trim()) return;
    const senderInfo = emailSender.trim() ? `From: ${emailSender.trim()}` : 'Email Reference';
    const desc = emailPreview.trim() ? ` - "${emailPreview.trim()}"` : '';
    onAddSource(
      `📧 ${emailSubject.trim()}`,
      'email',
      senderInfo + desc,
      'mailto:' + (emailSender.trim() || 'workspace@tasky.local')
    );
    setEmailSubject('');
    setEmailSender('');
    setEmailPreview('');
  };

  const handleAddLink = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!linkTitle.trim()) return;
    let url = linkUrl.trim() || 'https://';
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    onAddSource(`🔗 ${linkTitle.trim()}`, 'link', 'Web URL', url);
    setLinkTitle('');
    setLinkUrl('');
  };

  return (
    <div className="bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-200/30 dark:border-white/5 pb-2">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Add Task Source</span>
        
        {/* Source Type Navigation */}
        <div className="flex gap-1 bg-neutral-200/50 dark:bg-neutral-950/40 p-0.5 rounded-lg text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              activeTab === 'file' 
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FileText className="w-3 h-3" />
            File / PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              activeTab === 'email' 
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Mail className="w-3 h-3" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              activeTab === 'link' 
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Link2 className="w-3 h-3" />
            Web Link
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'file' && (
        <div className="space-y-3.5">
          {/* Drag and drop file zone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
              dragOver 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : 'border-neutral-200 dark:border-white/10 hover:border-neutral-300'
            }`}
          >
            <Upload className="w-5 h-5 text-neutral-400 mb-1" />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
              Drag file here, or <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">browse<input type="file" className="hidden" onChange={handleFileSelect} /></label>
            </p>
          </div>

          <div className="relative flex items-center my-1.5 text-center">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-[9px] text-neutral-400 font-medium uppercase tracking-wider">or specify manually</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* Manual File Creation */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">File Name</label>
              <input
                type="text"
                placeholder="e.g. syllabus_physics.pdf"
                value={manualFileName}
                onChange={(e) => setManualFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualFile(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div className="w-20 space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">Size</label>
              <input
                type="text"
                placeholder="1.2 MB"
                value={manualFileSize}
                onChange={(e) => setManualFileSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualFile(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddManualFile()}
              disabled={!manualFileName.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 h-9 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">Email Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Feedback on Lab 3"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">Sender / From</label>
              <input
                type="text"
                placeholder="e.g. prof.smith@university.edu"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 font-medium">Brief Snippet / Highlight</label>
            <input
              type="text"
              placeholder="e.g. 'Please check section 3 and re-submit by Friday...'"
              value={emailPreview}
              onChange={(e) => setEmailPreview(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmail(e);
                }
              }}
              className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleAddEmail()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Email Source
            </button>
          </div>
        </div>
      )}

      {activeTab === 'link' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">Link Title / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shared Google Doc"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-medium">Link URL</label>
              <input
                type="text"
                required
                placeholder="e.g. docs.google.com/document/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink(e);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-100 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleAddLink()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Link Source
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
