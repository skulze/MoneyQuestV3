'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MobileOptimizedCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function MobileOptimizedCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  onClick,
  className,
  variant = 'default'
}: MobileOptimizedCardProps) {
  const isClickable = Boolean(onClick);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200',
          isClickable && 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {Icon && (
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {isClickable && (
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200',
          isClickable && 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            {Icon && (
              <div className="flex-shrink-0 mt-1">
                <Icon className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && trendValue && (
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon()}
                  <span className={cn('text-sm font-medium', getTrendColor())}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
          {isClickable && (
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-5 transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={cn('text-sm font-medium', getTrendColor())}>
                {trendValue}
              </span>
            </div>
          )}
          {isClickable && (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

interface MobileCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function MobileCardGrid({ children, columns = 2, className }: MobileCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}