'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  installPrompt: PWAInstallPrompt | null;
  install: () => Promise<void>;
  isStandalone: boolean;
  isIOSPWA: boolean;
  canInstall: boolean;
}

export const usePWA = (): PWAState => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOSPWA, setIsIOSPWA] = useState(false);

  useEffect(() => {
    // Check if app is installed/standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      const androidPWA = document.referrer.includes('android-app://');

      setIsStandalone(standalone);
      setIsIOSPWA(iosStandalone);
      setIsInstalled(standalone || iosStandalone || androidPWA);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  useEffect(() => {
    // Handle online/offline status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as PWAInstallPrompt);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setInstallPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
      throw error;
    }
  }, [installPrompt]);

  const canInstall = isInstallable && !isInstalled && !!installPrompt;

  return {
    isInstalled,
    isInstallable,
    isOnline,
    installPrompt,
    install,
    isStandalone,
    isIOSPWA,
    canInstall,
  };
};

export default usePWA;