import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ExternalLink, Copy, Check, X, ShieldAlert, Sparkles, Send } from 'lucide-react';
import {
  generateWelcomeEmailSubject,
  generateWelcomeEmailBody,
  getGmailComposeUrl,
  openGmailCompose,
  getMailtoUrl,
  DEFAULT_STANDARD_PASSWORD
} from '../utils/emailUtils';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  initialPassword?: string;
  role?: string;
  rank?: string;
  orgName?: string;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientEmail,
  initialPassword,
  role,
  rank,
  orgName
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const password = initialPassword || DEFAULT_STANDARD_PASSWORD;

  useEffect(() => {
    if (isOpen) {
      setSubject(generateWelcomeEmailSubject(recipientName));
      setBody(
        generateWelcomeEmailBody({
          name: recipientName,
          email: recipientEmail,
          password: password,
          role,
          rank,
          orgName
        })
      );
      setCopied(false);
    }
  }, [isOpen, recipientName, recipientEmail, initialPassword, role, rank, orgName]);

  if (!isOpen) return null;

  const handleOpenGmail = () => {
    openGmailCompose({
      to: recipientEmail,
      subject: subject,
      body: body
    });
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Compose Welcome Email
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  Gmail Web
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Review email content with credentials before opening Gmail in your browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient & Password Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/50 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-0.5">
              Recipient
            </span>
            <span className="font-semibold text-neutral-800 dark:text-white truncate block">
              {recipientName} ({recipientEmail || 'No email'})
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-0.5">
              Standard Password Included
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
              {password}
            </span>
          </div>
        </div>

        {/* Email Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs glass-input rounded-xl px-3.5 py-2.5 focus:outline-none text-neutral-800 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Email Body Message
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Body'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs glass-input rounded-xl p-3.5 focus:outline-none text-neutral-800 dark:text-white font-mono leading-relaxed resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href={getMailtoUrl({ to: recipientEmail, subject, body })}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors flex items-center gap-1.5 order-2 sm:order-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Use Default Email App</span>
          </a>

          <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <a
              href={getGmailComposeUrl({ to: recipientEmail, subject, body })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 no-underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Gmail</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
