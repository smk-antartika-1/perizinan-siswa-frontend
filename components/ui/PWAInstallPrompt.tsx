'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    
    // Check if app is already installed (standalone mode)
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    setIsStandalone(isAppStandalone);

    if (isAppStandalone || hasDismissed === 'true') {
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    
    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 flex flex-col gap-3"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full p-1"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <img src="/icons/icon-192.png" alt="E-Izin" className="w-8 h-8 rounded-md" />
          </div>
          <div className="flex-1 pr-6">
            <h4 className="font-bold text-slate-800 text-sm">Install E-Izin Siswa</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Install aplikasi ini di layar utama Anda untuk akses lebih cepat dan penggunaan offline.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl flex flex-col gap-2 mt-1">
            <p className="font-semibold flex items-center gap-1.5">
              Cara install di iPhone/iPad:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>Tap ikon <Share size={12} className="inline mx-1" /> (Share) di menu bawah</li>
              <li>Pilih <strong>Add to Home Screen</strong></li>
            </ol>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Install Aplikasi Sekarang
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
