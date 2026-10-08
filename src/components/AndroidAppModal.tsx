import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Terminal, Layers, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install Tasky on your Android device:\n\n1. Open Chrome or Edge on Android.\n2. Tap the 3 dots menu (⋮) in the top right.\n3. Tap 'Add to Home screen' or 'Install app'.");
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const capCommands = [
    { title: '1. Build Web Assets', cmd: 'npm run build' },
    { title: '2. Add Android Platform (first time)', cmd: 'npx cap add android' },
    { title: '3. Sync Web Build to Android Project', cmd: 'npx cap sync android' },
    { title: '4. Open in Android Studio to Build APK', cmd: 'npx cap open android' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Tasky Mobile App for Android</h3>
              <p className="text-xs text-indigo-100">Install as PWA or build a native Android APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2 gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Instant Mobile PWA</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Native Android APK (Capacitor)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-800 dark:text-neutral-200">
          {activeTab === 'pwa' ? (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">Android PWA Ready</p>
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Tasky includes Web App Manifest, mobile viewport optimization, touch controls, and offline readiness.
                  </p>
                </div>
              </div>

              {/* Install Action Button */}
              <div className="text-center py-2">
                {isInstalled ? (
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Tasky is Installed on your Device!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install Tasky on Android Home Screen</span>
                  </button>
                )}
              </div>

              {/* Step by Step Manual Instructions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Manual Android Chrome Install Steps:</h4>
                <ol className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 p-2.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span>Open Tasky in <strong>Chrome</strong> or <strong>Edge</strong> on your Android device.</span>
                  </li>
                  <li className="flex items-center gap-2 p-2.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span>Tap the <strong>3 dots menu (⋮)</strong> at the top right of the browser.</span>
                  </li>
                  <li className="flex items-center gap-2 p-2.5 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 text-xs">
                <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Capacitor Android Package Prepared</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    We installed <code className="font-mono font-bold">@capacitor/android</code> and created <code className="font-mono font-bold">capacitor.config.json</code> (<code className="font-mono">com.tasky.app</code>).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Commands to generate Android APK / Android Studio project:</h4>
                
                <div className="space-y-2 font-mono text-xs">
                  {capCommands.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900 text-neutral-100 rounded-xl space-y-1 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 font-sans font-medium flex items-center justify-between">
                        <span>{item.title}</span>
                        <button
                          onClick={() => copyToClipboard(item.cmd, idx)}
                          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy command"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-indigo-400 font-bold">{item.cmd}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                <p className="font-bold text-neutral-800 dark:text-neutral-200">Android Studio Export Note:</p>
                <p>Running <code className="font-mono text-indigo-500">npx cap open android</code> opens the generated native project in Android Studio, where you can select <strong>Build &gt; Build APK / Bundle</strong> to download your <code className="font-mono">.apk</code> file.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
