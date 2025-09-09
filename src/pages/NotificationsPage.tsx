import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Settings,
  Mail,
  MailOpen,
  Zap,
  TrendingUp
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// Mock notification service for demo
const mockNotifications = [
  {
    id: "1",
    title: "Material Request Approved",
    message: "Your request for construction materials has been approved and is ready for pickup.",
    created_at: "2025-01-15T10:30:00Z",
    read: false,
    data: { issuanceId: "ISS-001" }
  },
  {
    id: "2", 
    title: "Gate Pass Generated",
    message: "Gate pass GP-2025-001 has been generated for your vehicle entry.",
    created_at: "2025-01-15T09:15:00Z",
    read: true,
    data: { gatePassId: "GP-001" }
  },
  {
    id: "3",
    title: "Inventory Alert",
    message: "Low stock alert for cement bags. Current quantity: 15 units remaining.",
    created_at: "2025-01-14T16:45:00Z",
    read: false,
    data: { issuanceId: "ISS-002" }
  },
  {
    id: "4",
    title: "Security Checkpoint Update",
    message: "Your vehicle has successfully cleared the main security checkpoint.",
    created_at: "2025-01-14T14:20:00Z",
    read: true,
    data: { gatePassId: "GP-002" }
  },
  {
    id: "5",
    title: "Weekly Report Available",
    message: "Your weekly activity report is now available for download.",
    created_at: "2025-01-13T18:00:00Z",
    read: false,
    data: {}
  }
];

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  data?: {
    issuanceId?: string;
    gatePassId?: string;
  };
}

type FilterType = 'all' | 'unread' | 'read' | 'issuance' | 'gatepass';
type SortType = 'newest' | 'oldest' | 'title';

export default function NotificationsPage() {
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

  // Load all notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // Use your actual notification service here
      // const data = await notificationService.getRecent(200);
      // const transformedData = data.map(n => ({
      //   ...n,
      //   read: n.is_read,
      //   data: n.data || {}
      // }));
      // setNotifications(transformedData);
      
      // For demo purposes, start with empty array
      setNotifications([]);
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
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Mark multiple notifications as read
  const markSelectedAsRead = async () => {
    setNotifications(prev => 
      prev.map(n => selectedNotifications.includes(n.id) ? { ...n, read: true } : n)
    );
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.data?.issuanceId) {
      console.log(`Navigate to issuance: ${notification.data.issuanceId}`);
    } else if (notification.data?.gatePassId) {
      console.log(`Navigate to gate pass: ${notification.data.gatePassId}`);
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
        color: 'text-amber-700 dark:text-amber-400', 
        bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30',
        ring: 'ring-amber-200 dark:ring-amber-800',
        type: 'Issuance',
        priority: 'high'
      };
    } else if (notification.data?.gatePassId) {
      return { 
        icon: CheckCircle, 
        color: 'text-emerald-700 dark:text-emerald-400', 
        bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30',
        ring: 'ring-emerald-200 dark:ring-emerald-800',
        type: 'Gate Pass',
        priority: 'normal'
      };
    }
    return { 
      icon: Bell, 
      color: 'text-slate-600 dark:text-slate-400', 
      bg: 'bg-gradient-to-br from-amber-50/30 to-amber-100/50 dark:from-slate-800/50 dark:to-slate-700/30',
      ring: 'ring-amber-200/50 dark:ring-slate-700',
      type: 'General',
      priority: 'low'
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    setShowBulkActions(selectedNotifications.length > 0);
  }, [selectedNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const issuanceCount = notifications.filter(n => n.data?.issuanceId).length;
  const gatepassCount = notifications.filter(n => n.data?.gatePassId).length;
  
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-amber-100/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg">
                  <Bell className="h-6 w-6" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-amber-800 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-amber-400 bg-clip-text text-transparent">
                  Notifications
                </h1>
              </div>
              <p className="text-amber-800/70 dark:text-amber-300/70 ml-11">
                Stay updated with your latest activities and alerts
              </p>
            </div>
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-all duration-200 border border-amber-300 dark:border-amber-600 rounded-xl hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <span className="transition-transform group-hover:-translate-x-0.5">←</span>
              Back
            </button>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Notifications */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-white/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">
                    {notifications.length}
                  </p>
                  <p className="text-blue-100 font-medium">Total Notifications</p>
                </div>
              </div>
            </div>

            {/* Unread Notifications */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <MailOpen className="h-6 w-6 text-white" />
                  </div>
                  {unreadCount > 0 && <Zap className="h-5 w-5 text-white/80 animate-pulse" />}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">
                    {unreadCount}
                  </p>
                  <p className="text-red-100 font-medium">Unread</p>
                </div>
              </div>
            </div>

            {/* Issuance Notifications */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  {issuanceCount > 0 && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">
                    {issuanceCount}
                  </p>
                  <p className="text-amber-100 font-medium">Issuance</p>
                </div>
              </div>
            </div>

            {/* Gate Pass Notifications */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  {gatepassCount > 0 && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">
                    {gatepassCount}
                  </p>
                  <p className="text-emerald-100 font-medium">Gate Pass</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-amber-200/60 dark:border-slate-700/60">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="h-5 w-5 text-amber-600 group-focus-within:text-amber-700 transition-colors duration-200" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search notifications by title or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-amber-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-amber-600/60 dark:placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-3 border border-amber-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-amber-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm min-w-[140px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">{selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isFilterDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-amber-200 dark:border-slate-700 z-20 overflow-hidden">
                      <div className="p-2">
                        {[
                          { value: 'all', label: 'All Notifications', icon: Bell, count: notifications.length },
                          { value: 'unread', label: 'Unread Only', icon: MailOpen, count: unreadCount },
                          { value: 'read', label: 'Read Only', icon: Mail, count: notifications.length - unreadCount },
                          { value: 'issuance', label: 'Issuance', icon: AlertCircle, count: issuanceCount },
                          { value: 'gatepass', label: 'Gate Pass', icon: CheckCircle, count: gatepassCount }
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedFilter(option.value as FilterType);
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                                selectedFilter === option.value ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4" />
                                <span className="font-medium">{option.label}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                selectedFilter === option.value ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                                {option.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-3 border border-amber-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-amber-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm min-w-[120px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{selectedSort.charAt(0).toUpperCase() + selectedSort.slice(1)}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isSortDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-amber-200 dark:border-slate-700 z-20 overflow-hidden">
                      <div className="p-2">
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
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors duration-200 font-medium ${
                              selectedSort === option.value ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {showBulkActions && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100/80 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800">
                      <Check className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllVisible}
                      className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors duration-200"
                    >
                      Select all visible
                    </button>
                    <button
                      onClick={markSelectedAsRead}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-slate-400 hover:text-amber-900 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-600 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="bg-white/95 dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-200/50 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 animate-pulse" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-white" />
              </div>
              <p className="text-amber-700 dark:text-amber-400 mt-4 font-medium">Loading your notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <Bell className="h-10 w-10 text-amber-600 dark:text-slate-500" />
                </div>
                {searchQuery || selectedFilter !== 'all' ? (
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                ) : null}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {searchQuery || selectedFilter !== 'all' ? 'No matching notifications found' : 'Your inbox is empty'}
              </h3>
              <p className="text-amber-700/70 dark:text-slate-400 mb-6 max-w-md">
                {searchQuery || selectedFilter !== 'all' 
                  ? 'Try adjusting your search terms or filter criteria to find what you\'re looking for.' 
                  : 'We\'ll notify you here when there\'s something important to share with you.'
                }
              </p>
              {(searchQuery || selectedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-amber-100/50 dark:divide-slate-700/50">
              {filteredNotifications.map((notification) => {
                const meta = getNotificationMeta(notification);
                const Icon = meta.icon;
                const isSelected = selectedNotifications.includes(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    className={`group relative transition-all duration-200 hover:bg-amber-50/50 dark:hover:bg-slate-700/30 ${
                      !notification.read ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                    } ${isSelected ? 'ring-2 ring-amber-500/20 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Enhanced Checkbox */}
                        <div className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleNotificationSelection(notification.id)}
                            className="w-4 h-4 text-amber-600 bg-white dark:bg-slate-700 border-amber-300 dark:border-slate-600 rounded focus:ring-amber-500 focus:ring-2 transition-colors duration-200"
                          />
                        </div>
                        
                        {/* Enhanced Icon */}
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg} ring-1 ${meta.ring} shadow-sm`}>
                          <Icon className={`h-5 w-5 ${meta.color}`} />
                          {!notification.read && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 ring-2 ring-white dark:ring-slate-800" />
                          )}
                        </div>
                        
                        {/* Enhanced Content */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Header Row */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className={`font-semibold text-lg leading-snug ${
                                  !notification.read 
                                    ? 'text-slate-900 dark:text-slate-100' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {notification.title}
                                </h3>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                  meta.color.includes('amber') 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    : meta.color.includes('emerald')
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-100/50 text-amber-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {meta.type}
                                </span>
                                {meta.priority === 'high' && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                                    <Zap className="h-3 w-3" />
                                    Urgent
                                  </div>
                                )}
                              </div>
                              
                              {/* Message */}
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed pr-4">
                                {notification.message}
                              </p>
                              
                              {/* Metadata Row */}
                              <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <time dateTime={notification.created_at}>
                                    {formatDate(notification.created_at)}
                                  </time>
                                </div>
                                {!notification.read && (
                                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="font-medium">New</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="group/btn p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
                                  title="Mark as read"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                              )}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-amber-50 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all duration-200">
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
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

        {/* Enhanced Results Summary */}
        {!isLoading && filteredNotifications.length > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full border border-amber-200/50 dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-700 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredNotifications.length}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{notifications.length}</span> notifications
                {selectedFilter !== 'all' && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium"> (filtered by {selectedFilter})</span>
                )}
                {searchQuery && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium"> (search: "{searchQuery}")</span>
                )}
              </span>
            </div>
          </div>
        )}
    </PageContainer>
  );
}