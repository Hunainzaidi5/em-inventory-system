import { useEffect, useRef, useState } from "react";
import { Bell, Check, X, Loader2, ChevronRight, Clock, AlertCircle } from "lucide-react";
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

  // Get notification type icon
  const getNotificationIcon = (notification: Notification) => {
    if (notification.data?.issuanceId) {
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    } else if (notification.data?.gatePassId) {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    return <Bell className="h-4 w-4 text-blue-600" />;
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
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
        className={`relative p-2.5 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 ${
            isOpen 
            ? 'bg-[#e1d4b1] shadow-lg' 
            : 'hover:bg-[#e1d4b1]/20 hover:shadow-md'
        }`}
        aria-label="Notifications"
        >
        <div className="relative">
            <div className="p-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md ring-2 ring-white/70">
            <Bell className={`h-5 w-5 text-white transition-colors duration-200`} />
            </div>

            {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold shadow-lg animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            )}
        </div>
        </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 border border-[#e1d4b1]/30 dark:bg-slate-900/95 dark:border-slate-700/50">
          {/* Header */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-[#e1d4b1]/20 to-[#e1d4b1]/10 border-b border-[#e1d4b1]/20">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                  Notifications
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#e1d4b1]/30 scrollbar-track-transparent">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#e1d4b1] mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#e1d4b1]/20 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-[#e1d4b1]" />
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No notifications yet
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification, index) => (
                  <div 
                    key={notification.id}
                    className={`group relative px-6 py-4 cursor-pointer transition-all duration-200 ${
                      !notification.read 
                        ? 'bg-gradient-to-r from-blue-50/50 to-[#e1d4b1]/10 dark:from-blue-900/20 dark:to-[#e1d4b1]/5 border-l-4 border-l-blue-500' 
                        : 'hover:bg-[#e1d4b1]/10 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Notification content */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        !notification.read ? 'bg-[#e1d4b1]/20' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {getNotificationIcon(notification)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold text-sm leading-5 ${
                            !notification.read 
                              ? 'text-slate-900 dark:text-slate-100' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(notification.created_at)}
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {!notification.read && (
                          <div className="absolute top-4 right-6">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Divider */}
                    {index < notifications.length - 1 && (
                      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 bg-[#e1d4b1]/10 border-t border-[#e1d4b1]/20">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/notifications');
                }}
                className="w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}