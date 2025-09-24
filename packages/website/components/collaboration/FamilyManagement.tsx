import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Users, UserPlus, Mail, Clock, Check, X, Settings, Shield } from 'lucide-react';
import { useFamilyManagement } from '@/hooks/useFamilyManagement';

export function FamilyManagement() {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const {
    familyMembers,
    isLoading,
    error,
    inviteFamilyMember,
    removeFamilyMember,
    updateMemberPermissions,
    getUsageStats,
    canUseFeature,
  } = useFamilyManagement();

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) return;

    try {
      await inviteFamilyMember(newMemberEmail.trim());
      setNewMemberEmail('');
    } catch (error) {
      console.error('Failed to invite family member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeFamilyMember(memberId);
    } catch (error) {
      console.error('Failed to remove family member:', error);
    }
  };

  const updatePermissions = async (memberId: string, newPermissions: 'view' | 'edit' | 'admin') => {
    try {
      await updateMemberPermissions(memberId, newPermissions);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'declined': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPermissionIcon = (permissions: string) => {
    switch (permissions) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'edit': return <Settings className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <FeatureGate feature="multiUser">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Family & Collaboration
            </CardTitle>
            <p className="text-sm text-gray-600">
              Invite family members to collaborate on budgets and track shared expenses.
            </p>
          </CardHeader>

          <CardContent>
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Add New Member */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">Invite Family Member</h4>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                  className="flex-1"
                />
                <Button
                  onClick={handleInviteMember}
                  disabled={isLoading || !newMemberEmail.trim() || !getUsageStats().canAddMore}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isLoading ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Plus plan allows up to {getUsageStats().limit === -1 ? 'unlimited' : getUsageStats().limit} family members
              </p>
            </div>

            {/* Current Members */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Family Members ({getUsageStats().currentUsage}/{getUsageStats().limit === -1 ? '∞' : getUsageStats().limit})
              </h4>

              {/* Current User */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">You</span>
                  </div>
                  <div>
                    <div className="font-medium">Account Owner</div>
                    <div className="text-sm text-gray-600">Full access to all features</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    Owner
                  </span>
                </div>
              </div>

              {/* Family Members */}
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.name || member.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.name && member.email}
                        {member.status === 'active' && member.joinedAt && (
                          <span className="ml-2">Joined {member.joinedAt.toLocaleDateString()}</span>
                        )}
                        {member.status === 'pending' && (
                          <span className="ml-2">Invited {member.invitedAt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(member.status)}`}>
                      {member.status === 'pending' ? (
                        <Clock className="w-3 h-3 inline mr-1" />
                      ) : member.status === 'active' ? (
                        <Check className="w-3 h-3 inline mr-1" />
                      ) : (
                        <X className="w-3 h-3 inline mr-1" />
                      )}
                      {member.status}
                    </span>

                    {/* Permissions */}
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(member.permissions)}
                      <select
                        value={member.permissions}
                        onChange={(e) => updatePermissions(member.id, e.target.value as any)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Can Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shared Budget Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Shared Budget Settings</CardTitle>
            <p className="text-sm text-gray-600">
              Configure which budgets family members can view or edit.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Shared budget management coming soon!</p>
              <p className="text-sm">Create budgets that family members can collaborate on.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}