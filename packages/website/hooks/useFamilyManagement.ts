import { useState, useEffect } from 'react';
import { useDataEngine } from '@/hooks/useDataEngine';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeRequiredError } from '@moneyquest/shared/src/data-engine/LocalDataEngine';

export interface FamilyMember {
  id: string;
  email: string;
  name?: string;
  relationshipType: 'family' | 'partner' | 'roommate';
  status: 'pending' | 'active' | 'declined';
  permissions: 'view' | 'edit' | 'admin';
  joinedAt?: Date;
  invitedAt: Date;
}

export function useFamilyManagement() {
  const { dataEngine } = useDataEngine();
  const { subscription, canUseFeature } = useSubscription();

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load family members on mount
  useEffect(() => {
    loadFamilyMembers();
  }, [dataEngine]);

  const loadFamilyMembers = async () => {
    if (!dataEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll use mock data since the backend isn't fully implemented
      // In the future, this would call: dataEngine.getFamilyMembers()
      const mockMembers: FamilyMember[] = [
        {
          id: '1',
          email: 'sarah@example.com',
          name: 'Sarah Johnson',
          relationshipType: 'partner',
          status: 'active',
          permissions: 'edit',
          joinedAt: new Date(2024, 8, 15),
          invitedAt: new Date(2024, 8, 10),
        },
        {
          id: '2',
          email: 'mike@example.com',
          relationshipType: 'family',
          status: 'pending',
          permissions: 'view',
          invitedAt: new Date(2024, 9, 20),
        },
      ];

      setFamilyMembers(mockMembers);
    } catch (err) {
      console.error('Failed to load family members:', err);
      setError('Failed to load family members');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteFamilyMember = async (email: string, permissions: 'view' | 'edit' = 'view') => {
    if (!dataEngine) {
      throw new Error('Data engine not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check subscription permissions
      if (!canUseFeature('multiUser')) {
        throw new UpgradeRequiredError('Family sharing requires Plus ($2.99/month)');
      }

      // Call LocalDataEngine method
      const relationship = await dataEngine.addFamilyMember(email);

      // Create new family member
      const newMember: FamilyMember = {
        id: relationship.id,
        email,
        relationshipType: 'family',
        status: 'pending',
        permissions,
        invitedAt: new Date(),
      };

      setFamilyMembers(prev => [...prev, newMember]);

      return newMember;
    } catch (err) {
      console.error('Failed to invite family member:', err);
      if (err instanceof UpgradeRequiredError) {
        setError(err.message);
        throw err;
      }
      setError('Failed to invite family member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFamilyMember = async (memberId: string) => {
    if (!dataEngine) {
      throw new Error('Data engine not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Remove from backend (would be implemented in LocalDataEngine)
      // await dataEngine.removeFamilyMember(memberId);

      // Remove from local state
      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      console.error('Failed to remove family member:', err);
      setError('Failed to remove family member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberPermissions = async (memberId: string, permissions: 'view' | 'edit' | 'admin') => {
    if (!dataEngine) {
      throw new Error('Data engine not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update in backend (would be implemented in LocalDataEngine)
      // await dataEngine.updateFamilyMemberPermissions(memberId, permissions);

      // Update local state
      setFamilyMembers(prev =>
        prev.map(member =>
          member.id === memberId
            ? { ...member, permissions }
            : member
        )
      );
    } catch (err) {
      console.error('Failed to update member permissions:', err);
      setError('Failed to update member permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendInvitation = async (memberId: string) => {
    if (!dataEngine) {
      throw new Error('Data engine not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Resend invitation via backend
      // await dataEngine.resendFamilyInvitation(memberId);

      // Update invitation date in local state
      setFamilyMembers(prev =>
        prev.map(member =>
          member.id === memberId
            ? { ...member, invitedAt: new Date() }
            : member
        )
      );
    } catch (err) {
      console.error('Failed to resend invitation:', err);
      setError('Failed to resend invitation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageStats = () => {
    const currentUsage = familyMembers.length + 1; // +1 for account owner
    const limit = subscription?.limits.users || 1;

    return {
      currentUsage,
      limit,
      percentage: limit > 0 ? (currentUsage / limit) * 100 : 0,
      canAddMore: limit === -1 || currentUsage < limit,
    };
  };

  return {
    familyMembers,
    isLoading,
    error,
    inviteFamilyMember,
    removeFamilyMember,
    updateMemberPermissions,
    resendInvitation,
    loadFamilyMembers,
    getUsageStats,
    canUseFeature: canUseFeature('multiUser'),
  };
}