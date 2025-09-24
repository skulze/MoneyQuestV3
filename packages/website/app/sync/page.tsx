'use client';

import { PrioritySyncManager } from '@/components/sync/PrioritySyncManager';

export default function SyncPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Data Synchronization
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your data sync preferences and monitor synchronization activity.
        </p>
      </div>

      <PrioritySyncManager />
    </div>
  );
}