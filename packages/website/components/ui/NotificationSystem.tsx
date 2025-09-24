'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Duration in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 5
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit number of notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove notification if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setReadNotifications(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setReadNotifications(new Set());
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
  };

  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        unreadCount,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

interface NotificationToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationToast({ notification, onRemove }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    // Wait for exit animation before removing
    setTimeout(() => onRemove(notification.id), 200);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-200 transform',
        getColors(),
        isVisible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount, markAllAsRead, notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className={cn(
          'relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      {(() => {
                        switch (notification.type) {
                          case 'success':
                            return <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />;
                          case 'error':
                            return <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />;
                          case 'warning':
                            return <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />;
                          case 'info':
                            return <Info className="h-4 w-4 text-blue-500 mt-0.5" />;
                        }
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions for common notification types
export function createNotificationHelpers(addNotification: NotificationContextType['addNotification']) {
  return {
    success: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ ...options, type: 'success', title, message }),

    error: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ ...options, type: 'error', title, message, duration: 0 }),

    warning: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ ...options, type: 'warning', title, message }),

    info: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ ...options, type: 'info', title, message }),

    budgetAlert: (categoryName: string, percentage: number) =>
      addNotification({
        type: percentage >= 100 ? 'error' : 'warning',
        title: percentage >= 100 ? 'Budget Exceeded!' : 'Budget Alert',
        message: `You've spent ${percentage}% of your ${categoryName} budget this month.`,
        duration: 0,
        action: {
          label: 'View Budget',
          onClick: () => window.location.href = '/budgets'
        }
      }),

    transactionAdded: (amount: string, description: string) =>
      addNotification({
        type: 'success',
        title: 'Transaction Added',
        message: `${amount} - ${description}`,
        duration: 3000
      }),

    backupCompleted: () =>
      addNotification({
        type: 'success',
        title: 'Backup Completed',
        message: 'Your data has been securely backed up to the cloud.',
        duration: 4000
      }),
  };
}