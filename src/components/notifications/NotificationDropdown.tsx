import { useEffect, useRef, useState } from "react";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import notificationService, { NotificationRecord } from "@/services/notificationService";

interface Notification extends Omit<NotificationRecord, 'is_read'> {
  read: boolean; // Alias for is_read for easier use in the component
  data?: {
    issuanceId?: string;
    gatePassId?: string;
  };
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getRecent(50); // Get up to 50 most recent notifications
      // Transform the data to match our component's interface
      const transformedData = data.map(n => ({
        ...n,
        read: n.is_read,
        data: n.data || {}
      }));
      setNotifications(transformedData);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return; // Nothing to do
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadIds.map(id => notificationService.markRead(id))
      );
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => ({
          ...n,
          read: true,
          is_read: true
        }))
      );
      
      setUnreadCount(0);
      
      // Refresh notifications to ensure consistency
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Revert optimistic update on error
      loadNotifications();
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.data?.issuanceId) {
      navigate(`/dashboard/issuance?id=${encodeURIComponent(notification.data.issuanceId)}`);
    } else if (notification.data?.gatePassId) {
      navigate(`/dashboard/gate-pass?id=${encodeURIComponent(notification.data.gatePassId)}`);
    }
    
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load notifications on component mount and when dropdown is opened
  useEffect(() => {
    // Load notifications immediately on component mount
    loadNotifications();

    // Set up a refresh interval (e.g., every 30 seconds)
    const intervalId = setInterval(loadNotifications, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Also refresh notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#e1d4b1] rounded-xl shadow-xl overflow-hidden z-50 border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
              >
                Mark all as read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
