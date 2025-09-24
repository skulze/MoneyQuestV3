import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button, Card, CardContent } from '@/components/ui';
import { Lock, Crown, Zap } from 'lucide-react';

interface FeatureGateProps {
  requiredTier?: 'FREE' | 'PLUS' | 'PREMIUM';
  feature?: 'multiUser' | 'ocrReceipts' | 'bankConnections' | 'investmentSync' | 'prioritySync' | 'enhancedInvestments';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({
  requiredTier,
  feature,
  children,
  fallback,
  showUpgrade = true
}: FeatureGateProps) {
  const { canAccess, canUseFeature, getUpgradeMessage, upgrade, subscription } = useSubscription();

  // Map features to required tiers
  const getRequiredTier = (featureName?: string): 'FREE' | 'PLUS' | 'PREMIUM' => {
    if (!featureName) return requiredTier || 'FREE';

    switch (featureName) {
      case 'multiUser':
      case 'ocrReceipts':
      case 'prioritySync':
      case 'enhancedInvestments':
        return 'PLUS';
      case 'bankConnections':
      case 'investmentSync':
        return 'PREMIUM';
      default:
        return requiredTier || 'FREE';
    }
  };

  const effectiveRequiredTier = getRequiredTier(feature);

  // Check access either by tier or by feature
  const hasAccess = feature ? canUseFeature(feature) : canAccess(effectiveRequiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLUS':
        return <Zap className="w-6 h-6 text-purple-500" />;
      case 'PREMIUM':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      default:
        return <Lock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLUS':
        return 'border-purple-200 bg-purple-50';
      case 'PREMIUM':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleUpgrade = async () => {
    if (effectiveRequiredTier === 'FREE') return;

    try {
      await upgrade(effectiveRequiredTier);
    } catch (error) {
      console.error('Failed to start upgrade:', error);
    }
  };

  return (
    <Card className={`${getTierColor(effectiveRequiredTier)} border-2`}>
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-4">
          {getTierIcon(effectiveRequiredTier)}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {effectiveRequiredTier} Required
        </h3>

        <p className="text-gray-600 mb-4">
          {feature
            ? `The ${feature} feature requires a ${effectiveRequiredTier.toLowerCase()} subscription.`
            : getUpgradeMessage(effectiveRequiredTier)
          }
        </p>

        {effectiveRequiredTier !== 'FREE' && (
          <Button onClick={handleUpgrade} className="mb-2">
            Upgrade to {effectiveRequiredTier}
          </Button>
        )}

        <p className="text-xs text-gray-500">
          {subscription?.tier === 'FREE'
            ? 'Start your free trial today'
            : 'Upgrade anytime, cancel anytime'
          }
        </p>
      </CardContent>
    </Card>
  );
}

interface UsageLimitGateProps {
  resource: 'users' | 'accounts' | 'budgets' | 'categories';
  currentCount: number;
  children: React.ReactNode;
  resourceName?: string;
}

export function UsageLimitGate({
  resource,
  currentCount,
  children,
  resourceName
}: UsageLimitGateProps) {
  const { canAddResource, getResourceLimit, subscription, needsUpgrade } = useSubscription();

  if (canAddResource(resource, currentCount)) {
    return <>{children}</>;
  }

  const limit = getResourceLimit(resource);
  const displayName = resourceName || resource;
  const requiredTier = subscription?.tier === 'FREE' ? 'PLUS' : 'PREMIUM';

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <Lock className="w-6 h-6 text-orange-500" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {displayName} Limit Reached
        </h3>

        <p className="text-gray-600 mb-4">
          You've reached your limit of {limit} {displayName.toLowerCase()}.
          {needsUpgrade(requiredTier) && (
            <> Upgrade to {requiredTier} for more capacity.</>
          )}
        </p>

        {needsUpgrade(requiredTier) && (
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface FeaturePromptProps {
  feature: 'multiUser' | 'ocrReceipts' | 'bankConnections' | 'investmentSync';
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function FeaturePrompt({
  feature,
  title,
  description,
  children
}: FeaturePromptProps) {
  const { canUseFeature, subscription } = useSubscription();

  if (canUseFeature(feature)) {
    return children ? <>{children}</> : null;
  }

  const requiredTier = feature === 'multiUser' || feature === 'ocrReceipts' ? 'PLUS' : 'PREMIUM';
  const tierPrice = requiredTier === 'PLUS' ? '$2.99' : '$9.99';

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {requiredTier === 'PLUS' ? (
              <Zap className="w-5 h-5 text-purple-500 mt-0.5" />
            ) : (
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
            )}
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              {description}
            </p>

            <Button
              size="sm"
              onClick={() => window.location.href = '/pricing'}
              className="text-xs"
            >
              Upgrade to {requiredTier} ({tierPrice}/month)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}