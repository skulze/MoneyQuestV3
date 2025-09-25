'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FamilyManagement } from '@/components/collaboration/FamilyManagement';

export default function CollaborationPage() {
  const { session, isLoading: authLoading } = useAuthGuard('/collaboration');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // useAuthGuard handles redirect
  }
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