'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  Menu,
  Settings,
  TrendingUp,
  X,
  User,
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Transactions', href: '/transactions', icon: CreditCard },
  { label: 'Budgets', href: '/budgets', icon: DollarSign },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Investments', href: '/investments', icon: TrendingUp },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile nav when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleNav = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <header className={cn('lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between', className)}>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">MoneyQuest</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleNav}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={toggleNav}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Panel */}
      <div
        className={cn(
          'lg:hidden fixed top-0 right-0 z-50 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={toggleNav}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Demo User</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => {/* Add upgrade logic */}}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Upgrade to Plus</span>
          </button>
        </div>
      </div>

      {/* Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors min-w-0 flex-1',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}