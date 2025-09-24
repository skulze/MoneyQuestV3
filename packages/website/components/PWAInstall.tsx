'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPWACapable, setIsPWACapable] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isAndroidPWA = document.referrer.includes('android-app://');

    if (isStandalone || isInWebAppiOS || isAndroidPWA) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Check PWA capabilities
    const isPWASupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsPWACapable(isPWASupported);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay to not overwhelm users
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        const hasDeclined = localStorage.getItem('pwa-install-declined');

        if (!hasSeenPrompt && !hasDeclined) {
          setShowPrompt(true);
        }
      }, 10000); // Wait 10 seconds after page load
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('pwa-install-accepted', 'true');
      } else {
        localStorage.setItem('pwa-install-declined', 'true');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');

    // Show again after 7 days
    const dismissedDate = new Date();
    dismissedDate.setDate(dismissedDate.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed-until', dismissedDate.toISOString());
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari) {
      return {
        title: 'Install MoneyQuest on iOS',
        steps: [
          'Tap the Share button at the bottom of Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner'
        ]
      };
    }

    if (isAndroid) {
      return {
        title: 'Install MoneyQuest on Android',
        steps: [
          'Tap the menu button (⋮) in Chrome',
          'Tap "Add to Home screen"',
          'Tap "Install" to confirm'
        ]
      };
    }

    return {
      title: 'Install MoneyQuest',
      steps: [
        'Click the install icon in your browser\'s address bar',
        'Click "Install" to add MoneyQuest to your desktop'
      ]
    };
  };

  // Don't show if already installed or not PWA capable
  if (isInstalled || !isPWACapable || !showPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center mb-4">
          {deviceType === 'mobile' ? (
            <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
          ) : (
            <Monitor className="h-8 w-8 text-blue-600 mr-3" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Install MoneyQuest App
            </h3>
            <p className="text-sm text-gray-600">
              Get the full app experience
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">{instructions.title}</h4>
          <ul className="space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-blue-900 mb-2">Benefits of installing:</h5>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Works offline - manage finances anywhere</li>
            <li>• Faster loading and better performance</li>
            <li>• Home screen access with app icon</li>
            <li>• Push notifications for budget alerts</li>
            <li>• Native app-like experience</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstall;