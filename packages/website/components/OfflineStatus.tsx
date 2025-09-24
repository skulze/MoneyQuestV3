'use client';

import React from 'react';
import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const OfflineStatus: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <WifiOff className="h-4 w-4 mr-2 flex-shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-sm font-medium">
            You're offline
          </span>
          <span className="hidden sm:inline text-sm ml-2 opacity-90">
            • All changes are saved locally and will sync when you're back online
          </span>
        </div>
      </div>
    </div>
  );
};

export const OnlineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = usePWA();

  return (
    <div className={`flex items-center ${className}`}>
      {isOnline ? (
        <div className="flex items-center text-green-600">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-xs">Online</span>
        </div>
      ) : (
        <div className="flex items-center text-orange-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs">Offline</span>
        </div>
      )}
    </div>
  );
};

export const SyncStatus: React.FC<{
  hasUnsyncedChanges: boolean;
  lastSyncTime?: Date;
  className?: string;
}> = ({ hasUnsyncedChanges, lastSyncTime, className = '' }) => {
  const { isOnline } = usePWA();

  const formatSyncTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`flex items-center text-xs ${className}`}>
      {hasUnsyncedChanges ? (
        <div className="flex items-center text-amber-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>
            {isOnline ? 'Syncing...' : 'Changes saved locally'}
          </span>
        </div>
      ) : (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span>
            {lastSyncTime ? `Synced ${formatSyncTime(lastSyncTime)}` : 'Synced'}
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;