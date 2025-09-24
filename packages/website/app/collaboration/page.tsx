'use client';

import { FamilyManagement } from '@/components/collaboration/FamilyManagement';

export default function CollaborationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Family Collaboration
        </h1>
        <p className="text-gray-600 mt-2">
          Share budgets and manage finances together with family members.
        </p>
      </div>

      <FamilyManagement />
    </div>
  );
}