import { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  X, 
  Loader2, 
  Search, 
  Filter, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MoreVertical,
  Archive,
  Trash2,
  RotateCcw,
  Settings
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import notificationService, { NotificationRecord } from "@/services/notificationService";
import { PageContainer } from "@/components/layout/PageContainer";

interface Notification extends Omit<NotificationRecord, 'is_read'> {
  read: boolean;
  data?: {
    issuanceId?: string;
    gatePassId?: string;
  };
}

type FilterType = 'all' | 'unread' | 'read' | 'issuance' | 'gatepass';
type SortType = 'newest' | 'oldest' | 'title';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSeletedSort] = useState<SortType>('newest');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load all notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getRecent(200); // Load more for full page view
      const transformedData = data.map(n => ({
        ...n,
        read: n.is_read,
        data: n.data || {}
      }));
      setNotifications(transformedData);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'read':
        filtered = filtered.filter(n => n.read);
        break;
      case 'issuance':
        filtered = filtered.filter(n => n.data?.issuanceId);
        break;
      case 'gatepass':
        filtered = filtered.filter(n => n.data?.gatePassId);
        break;
    }

    // Apply sorting
    switch (selectedSort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, selectedFilter, selectedSort]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark multiple notifications as read
  const markSelectedAsRead = async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id => notificationService.markRead(id))
      );
      setNotifications(prev => 
        prev.map(n => selectedNotifications.includes(n.id) ? { ...n, read: true, is_read: true } : n)
      );
      setSelectedNotifications([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
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
  };

  // Handle bulk selection
  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedNotifications(filteredNotifications.map(n => n.id));
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  // Get notification icon and color
  const getNotificationMeta = (notification: Notification) => {
    if (notification.data?.issuanceId) {
      return { 
        icon: AlertCircle, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        type: 'Issuance'
      };
    } else if (notification.data?.gatePassId) {
      return { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-50 dark:bg-green-900/20',
        type: 'Gate Pass'
      };
    }
    return { 
      icon: Bell, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      type: 'General'
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Check if there's a specific notification to highlight
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      // Scroll to notification after data loads
      setTimeout(() => {
        const element = document.getElementById(`notification-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-[#e1d4b1]', 'ring-offset-2');
        }
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    setShowBulkActions(selectedNotifications.length > 0);
  }, [selectedNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5ed] to-[#e1d4b1]/30 dark:from-slate-900 dark:to-[#1a1a1a]">
      <PageContainer className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#5c4a30] dark:text-[#e1d4b1] mb-2">
                Notifications
              </h1>
              <p className="text-[#8a7455] dark:text-[#c9b99a]">
                Manage and view all your notifications
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-[#8a7455] dark:text-[#c9b99a] hover:text-[#5c4a30] dark:hover:text-[#e1d4b1] transition-colors duration-200 border border-[#e1d4b1] dark:border-[#8a7455] rounded-lg hover:bg-[#e1d4b1]/20 dark:hover:bg-[#8a7455]/20"
            >
              ← Back
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white rounded-xl p-4 shadow-sm border border-blue-500/20 dark:border-blue-700/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {notifications.length}
                  </p>
                  <p className="text-sm text-blue-100">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-600 to-red-600 dark:from-red-700 dark:to-red-700 text-white rounded-xl p-4 shadow-sm border border-red-500/20 dark:border-red-700/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {notifications.filter(n => !n.read).length}
                  </p>
                  <p className="text-sm text-red-100">Unread</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-600 dark:to-amber-800 text-white rounded-xl p-4 shadow-sm border border-amber-500/20 dark:border-amber-700/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {notifications.filter(n => n.data?.issuanceId).length}
                  </p>
                  <p className="text-sm text-amber-100">Issuance</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 text-white rounded-xl p-4 shadow-sm border border-emerald-500/20 dark:border-emerald-700/50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {notifications.filter(n => n.data?.gatePassId).length}
                  </p>
                  <p className="text-sm text-emerald-100">Gate Pass</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#e1d4b1]/50 dark:border-[#8a7455]/30">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#e1d4b1] dark:border-[#8a7455]/30 rounded-lg bg-white/80 dark:bg-slate-700/80 text-[#5c4a30] dark:text-[#e1d4b1] placeholder-[#a08b6f] dark:placeholder-[#8a7a60] focus:ring-2 focus:ring-[#e1d4b1] focus:border-transparent backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#e1d4b1] dark:border-[#8a7455]/30 rounded-lg bg-white/80 dark:bg-slate-700/80 text-[#5c4a30] dark:text-[#e1d4b1] hover:bg-[#e1d4b1]/20 dark:hover:bg-[#8a7455]/20 transition-colors duration-200 backdrop-blur-sm"
                >
                  <Filter className="h-4 w-4" />
                  Filter: {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isFilterDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                    {[
                      { value: 'all', label: 'All Notifications' },
                      { value: 'unread', label: 'Unread Only' },
                      { value: 'read', label: 'Read Only' },
                      { value: 'issuance', label: 'Issuance' },
                      { value: 'gatepass', label: 'Gate Pass' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedFilter(option.value as FilterType);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                          selectedFilter === option.value ? 'bg-[#e1d4b1]/20 text-[#8B7355]' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#e1d4b1] dark:border-[#8a7455]/30 rounded-lg bg-white/80 dark:bg-slate-700/80 text-[#5c4a30] dark:text-[#e1d4b1] hover:bg-[#e1d4b1]/20 dark:hover:bg-[#8a7455]/20 transition-colors duration-200 backdrop-blur-sm"
                >
                  <Clock className="h-4 w-4" />
                  Sort: {selectedSort.charAt(0).toUpperCase() + selectedSort.slice(1)}
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'title', label: 'Alphabetical' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSeletedSort(option.value as SortType);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                          selectedSort === option.value ? 'bg-[#e1d4b1]/20 text-[#8B7355]' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <div className="mt-4 p-4 bg-[#e1d4b1]/10 rounded-lg border border-[#e1d4b1]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllVisible}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Select all visible
                    </button>
                    <button
                      onClick={markSelectedAsRead}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#e1d4b1] mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#e1d4b1]/20 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-[#e1d4b1]" />
              </div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {searchQuery || selectedFilter !== 'all' ? 'No matching notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'We\'ll notify you when something important happens.'
                }
              </p>
              {(searchQuery || selectedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredNotifications.map((notification) => {
                const meta = getNotificationMeta(notification);
                const Icon = meta.icon;
                
                return (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    className={`group relative p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 ${
                      !notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                      
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      
                      {/* Content */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${
                                !notification.read 
                                  ? 'text-slate-900 dark:text-slate-100' 
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {notification.title}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                meta.color.includes('amber') 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  : meta.color.includes('green')
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {meta.type}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.created_at)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-600 transition-all duration-200"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!isLoading && filteredNotifications.length > 0 && (
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
            {selectedFilter !== 'all' && ` (filtered by ${selectedFilter})`}
            {searchQuery && ` (search: "${searchQuery}")`}
          </div>
        )}
      </PageContainer>
    </div>
  );
}