import { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '@/services/notificationService';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const list = await notificationService.getRecent(10);
      const formattedList = (list || []).map((n: any) => ({
        ...n,
        isRead: false,
        createdAt: n.created_at || new Date().toISOString()
      }));
      setNotifications(formattedList);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (notification.data?.issuanceId) {
      navigate(`/dashboard/issuance?id=${encodeURIComponent(notification.data.issuanceId)}`);
    } else if (notification.data?.gatePassId) {
      navigate(`/dashboard/gate-pass?id=${encodeURIComponent(notification.data.gatePassId)}`);
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[#e1d4b1] dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 border-brown-500 fill-yellow-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#e1d4b1] rounded-2xl shadow-xl overflow-hidden z-50 border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                disabled={unreadCount === 0}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark all read
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadNotifications();
                }}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {notification.message}
                        </p>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 ml-2 flex-shrink-0" />
                      )}
                    </div>
                    {(notification.data?.issuanceId || notification.data?.gatePassId) && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Click to view details
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
