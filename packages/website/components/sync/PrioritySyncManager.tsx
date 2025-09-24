import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import {
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Download,
  Upload
} from 'lucide-react';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  syncQuality: 'high' | 'normal' | 'low';
  totalChanges: number;
  conflictsResolved: number;
}

export function PrioritySyncManager() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    pendingUploads: 3,
    pendingDownloads: 1,
    syncInProgress: false,
    syncQuality: 'high',
    totalChanges: 47,
    conflictsResolved: 2
  });

  const [syncHistory, setSyncHistory] = useState([
    { time: new Date(Date.now() - 5 * 60 * 1000), type: 'auto', status: 'success', changes: 3 },
    { time: new Date(Date.now() - 15 * 60 * 1000), type: 'manual', status: 'success', changes: 7 },
    { time: new Date(Date.now() - 45 * 60 * 1000), type: 'auto', status: 'partial', changes: 12 },
    { time: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'auto', status: 'success', changes: 5 }
  ]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync simulation for Plus users
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncStatus.isOnline && !syncStatus.syncInProgress) {
        // Simulate background sync
        if (Math.random() > 0.7) { // 30% chance of sync activity
          handleAutoSync();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [syncStatus.isOnline, syncStatus.syncInProgress]);

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        pendingUploads: 0,
        pendingDownloads: 0,
        totalChanges: prev.totalChanges + prev.pendingUploads
      }));

      // Add to sync history
      setSyncHistory(prev => [{
        time: new Date(),
        type: 'manual',
        status: 'success',
        changes: syncStatus.pendingUploads + syncStatus.pendingDownloads
      }, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  const handleAutoSync = async () => {
    if (syncStatus.syncInProgress) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const changes = Math.floor(Math.random() * 5) + 1;
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        pendingUploads: Math.max(0, prev.pendingUploads - changes),
        pendingDownloads: Math.max(0, prev.pendingDownloads - 1),
        totalChanges: prev.totalChanges + changes
      }));

      setSyncHistory(prev => [{
        time: new Date(),
        type: 'auto',
        status: 'success',
        changes
      }, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Auto-sync failed:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getSyncQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <FeatureGate feature="multiUser">
      <div className="space-y-6">
        {/* Priority Sync Header */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Plus Feature</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Priority Sync</h3>
                <p className="text-sm text-gray-600">
                  Enhanced sync performance with real-time updates and conflict resolution
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {syncStatus.totalChanges}
                </div>
                <p className="text-sm text-purple-600">Total Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sync Status</span>
              <div className="flex items-center space-x-2">
                {syncStatus.isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">Offline</span>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Sync Quality Indicator */}
              <div className={`p-4 rounded-lg border ${getSyncQualityColor(syncStatus.syncQuality)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium capitalize">
                      {syncStatus.syncQuality} Priority Sync
                    </h4>
                    <p className="text-sm opacity-75">
                      {syncStatus.syncQuality === 'high' && 'Real-time updates with instant conflict resolution'}
                      {syncStatus.syncQuality === 'normal' && 'Regular sync intervals with standard processing'}
                      {syncStatus.syncQuality === 'low' && 'Basic sync with reduced frequency'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {syncStatus.syncQuality === 'high' && '< 5s'}
                      {syncStatus.syncQuality === 'normal' && '< 30s'}
                      {syncStatus.syncQuality === 'low' && '< 2m'}
                    </div>
                    <div className="text-xs opacity-75">Avg sync time</div>
                  </div>
                </div>
              </div>

              {/* Pending Changes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {syncStatus.pendingUploads}
                  </div>
                  <div className="text-sm text-blue-800">Pending Uploads</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Download className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {syncStatus.pendingDownloads}
                  </div>
                  <div className="text-sm text-green-800">Pending Downloads</div>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    {syncStatus.conflictsResolved}
                  </div>
                  <div className="text-sm text-orange-800">Conflicts Resolved</div>
                </div>
              </div>

              {/* Last Sync Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Last Sync</div>
                    <div className="text-xs text-gray-600">
                      {getTimeSince(syncStatus.lastSync)}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleManualSync}
                  disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                  <span>{syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Activity</CardTitle>
            <p className="text-sm text-gray-600">
              Recent synchronization history and performance
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {syncHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {entry.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : entry.status === 'partial' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Cloud className="w-5 h-5 text-gray-500" />
                    )}

                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.type === 'auto' ? 'Automatic Sync' : 'Manual Sync'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {getTimeSince(entry.time)} • {entry.changes} changes
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      entry.status === 'success' ? 'bg-green-100 text-green-800' :
                      entry.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Preferences</CardTitle>
            <p className="text-sm text-gray-600">
              Configure your Priority Sync settings
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Auto-sync Frequency</h4>
                  <p className="text-xs text-gray-600">How often to sync changes automatically</p>
                </div>
                <select className="px-3 py-1 text-sm border rounded-md">
                  <option>Real-time (Plus)</option>
                  <option>Every 5 minutes</option>
                  <option>Every 15 minutes</option>
                  <option>Manual only</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Conflict Resolution</h4>
                  <p className="text-xs text-gray-600">How to handle data conflicts</p>
                </div>
                <select className="px-3 py-1 text-sm border rounded-md">
                  <option>Smart merge (Plus)</option>
                  <option>Last write wins</option>
                  <option>Manual resolution</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Offline Storage</h4>
                  <p className="text-xs text-gray-600">Local cache duration</p>
                </div>
                <select className="px-3 py-1 text-sm border rounded-md">
                  <option>Extended (Plus)</option>
                  <option>30 days</option>
                  <option>7 days</option>
                  <option>1 day</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>✨ Plus users get priority sync with real-time updates</p>
                  <p>🔄 Smart conflict resolution prevents data loss</p>
                  <p>💾 Extended offline support for better reliability</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}