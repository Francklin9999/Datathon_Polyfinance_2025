import React, { useState } from 'react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import NotificationToast from './NotificationToast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Check } from 'lucide-react';

export default function NotificationCenter() {
  const { notifications, clearNotifications, dismissNotification, markNotificationAsRead } = useAnalysis();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {/* Notification Button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 relative"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-600 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Notification Panel */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-[600px] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  notifications.forEach(n => markNotificationAsRead(n.id));
                }}
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={clearNotifications}
                title="Clear all"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[500px] p-2">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationToast
                  key={notification.id}
                  notification={notification}
                  onDismiss={dismissNotification}
                  onMarkRead={markNotificationAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

