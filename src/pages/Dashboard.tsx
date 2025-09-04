import React, { useState, useEffect } from "react";
import { Package, Wrench, Shield, AlertTriangle, TrendingUp, Users, BarChart3, Bell, Search, Filter, Download, RefreshCw, ArrowUpRight, Activity, Zap, Eye } from "lucide-react";
import statsService from '@/services/statsService';
import requisitionService from '@/services/requisitionService';
import userService from '@/services/userService';
import { spareService } from '@/services/spareService';
import notificationService from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0, 0]);
  const [systemHealth, setSystemHealth] = useState(100);
  const [activeUsers, setActiveUsers] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; item: string; user?: string; time: string; quantity?: number; color: string }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; created_at: string; data?: any }>>([]);

  // Load live counts and animate them
  const loadAndAnimateStats = async () => {
    try {
      const counts = await statsService.getDashboardCounts();
      const targets = [
        counts.sparePartsTotalQuantity,
        counts.toolsTotalQuantity + counts.generalToolsTotalQuantity,
        counts.ppeTotalQuantity,
        counts.faultyItemsCount,
      ];
      const total = targets[0] + targets[1] + targets[2];
      const faulty = targets[3];
      setSystemHealth(total > 0 ? Math.max(0, Math.round(((total - faulty) / total) * 100)) : 100);

      try {
        const lowStock = await spareService.getLowStockSpareParts();
        setAlertsCount((lowStock?.length || 0) + (counts.faultyItemsCount || 0));
      } catch {
        setAlertsCount(counts.faultyItemsCount || 0);
      }
      targets.forEach((target, index) => {
        let current = 0;
        const increment = Math.max(1, Math.floor((target || 0) / 50));
        const timer = setInterval(() => {
          current += increment;
          if (current >= (target || 0)) {
            current = target || 0;
            clearInterval(timer);
          }
          setAnimatedStats(prev => {
            const newStats = [...prev];
            newStats[index] = Math.floor(current);
            return newStats;
          });
        }, 20);
      });
    } catch (e) {
      // noop, keep zeros
    }
  };

  const loadActiveUsers = async () => {
    try {
      const users = await userService.getActiveUsers();
      setActiveUsers(users.length || 0);
    } catch {
      setActiveUsers(0);
    }
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const loadRecentActivity = async () => {
    try {
      const reqs = await requisitionService.getAllRequisitions();
      const sorted = (reqs || []).sort((a: any, b: any) => new Date(b.requested_at || b.created_at || 0).getTime() - new Date(a.requested_at || a.created_at || 0).getTime());
      const top = sorted.slice(0, 8).map((r: any) => {
        const type = r.type?.toLowerCase() || '';
        const typeConfig = {
          issue: { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
          return: { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
          default: { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' }
        };
        
        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.default;
        
        return {
          action: type,
          item: r.item_name,
          user: r.issued_to,
          time: timeAgo(r.requested_at || r.created_at),
          quantity: Number(r.quantity || 0),
          color: config.color,
          textColor: config.text,
          bgColor: config.bg,
          formattedAction: type === 'issue' ? 'issued' : type === 'return' ? 'returned' : type
        };
      });
      setRecentActivity(top);
    } catch {
      setRecentActivity([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getRecent(10);
      // Add consistent styling to notifications
      const formattedList = (list || []).map((n: any) => ({
        ...n,
        bgColor: n.type === 'alert' ? 'bg-yellow-50' : 'bg-blue-50',
        textColor: n.type === 'alert' ? 'text-yellow-700' : 'text-blue-700',
        icon: n.type === 'alert' ? '⚠️' : 'ℹ️'
      }));
      setNotifications(formattedList);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAndAnimateStats();
    loadActiveUsers();
    loadRecentActivity();
    loadNotifications();
    const handler = () => loadAndAnimateStats();
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, []);

  const handleNavigation = (route: string) => {
    if (!route) return;
    navigate(route);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAndAnimateStats()
      .then(() => window.dispatchEvent(new Event('inventory-sync')))
      .finally(() => setTimeout(() => setIsRefreshing(false), 800));
  };

  const statsCards = [
    {
      title: "Spare Parts",
      value: animatedStats[0].toLocaleString(),
      subtitle: "Across all systems",
      icon: Package,
      route: "/dashboard/spare-management",
      color: "text-blue-600",
      iconColor: "text-blue-500 group-hover:text-blue-400",
      trend: "+12%",
      trendUp: true,
      bgGradient: "from-blue-600 to-blue-800"
    },
    {
      title: "Tools",
      value: animatedStats[1].toLocaleString(),
      subtitle: "Available for checkout",
      icon: Wrench,
      route: "/dashboard/inventory",
      color: "text-emerald-600",
      iconColor: "text-emerald-500 group-hover:text-emerald-400",
      trend: "+5%",
      trendUp: true,
      bgGradient: "from-emerald-600 to-emerald-800"
    },
    {
      title: "PPE Items",
      value: animatedStats[2].toLocaleString(),
      subtitle: "In stock",
      icon: Shield,
      route: "/dashboard/ppe",
      color: "text-orange-600",
      iconColor: "text-orange-500 group-hover:text-orange-400",
      trend: "+8%",
      trendUp: true,
      bgGradient: "from-amber-500 to-amber-700"
    },
    {
      title: "Faulty Items",
      value: animatedStats[3].toLocaleString(),
      subtitle: "Needing attention",
      icon: AlertTriangle,
      route: "/dashboard/faulty-returns",
      color: "text-red-600",
      iconColor: "text-red-500 group-hover:text-red-400",
      trend: "-3%",
      trendUp: false,
      bgGradient: "from-red-600 to-red-600"
    }
  ];

  const quickActions = [
    { title: "Add New Item", description: "Register new inventory item", icon: Package, color: "from-blue-600 to-blue-700", route: "/dashboard/inventory" },
    { title: "Check Out Tool", description: "Assign tool to employee", icon: Users, color: "from-emerald-500 to-emerald-600", route: "/dashboard/tools" },
    { title: "Generate Report", description: "Create inventory report", icon: BarChart3, color: "from-orange-500 to-orange-600", route: "/dashboard/availability" },
    { title: "View Analytics", description: "Access detailed insights", icon: TrendingUp, color: "from-red-400 to-red-500", route: "/dashboard/availability" }
  ];

  // recentActivity is now loaded dynamically

  const systemMetrics = [
    { label: "System Health", value: `${systemHealth}%`, icon: Activity, color: "text-green-500" },
    { label: "Active Users", value: String(activeUsers), icon: Users, color: "text-blue-500" },
    { label: "Alerts", value: String(alertsCount), icon: Bell, color: "text-orange-500" }
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-white via-white to-white min-h-screen">
      <div className="space-y-6">
        {/* Welcome Section with Gradient and Grid Pattern */}
        <div className="relative card-surface-dark rounded-2xl shadow-2xl p-10 text-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gray-700/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-24 h-24 bg-gray-700/5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 bg-gray-700/10 rounded-full animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-gray-700/20 backdrop-blur-sm rounded-2xl">
                  <BarChart3 size={32} className="text-gray-700" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">E&M Inventory Management System</h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-900 to-orange-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-blue-100 text-xl font-medium leading-relaxed max-w-2xl text-gray-600">
                  Your comprehensive solution for managing inventory, tools, PPE, and maintenance items 
                  with real-time insights and intelligent automation.
                </p>
                
                {/* System Health Metrics */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-gray-700/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Activity size={18} className="text-green-700" />
                    <span className="text-gray-600 font-medium">System Health: <span className="font-bold">{systemHealth}%</span></span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-700/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Users size={18} className="text-blue-700" />
                    <span className="text-gray-600 font-medium">Active Users: <span className="font-bold">{activeUsers}</span></span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-700/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Bell size={18} className="text-yellow-600" />
                    <span className="text-gray-600 font-medium">Alerts: <span className="font-bold">{alertsCount}</span></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              <div className="w-32 h-32 bg-gray-700/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-gray-700/20 shadow-2xl">
                <div className="w-20 h-20 bg-gray-700/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 size={48} className="text-gray-700/90" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Bell size={16} className="text-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Stats Cards with Advanced Effects */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          const accent = index === 0
            ? 'icon-accent-blue'
            : index === 1
            ? 'icon-accent-emerald'
            : index === 2
            ? 'icon-accent-orange'
            : 'icon-accent-red';
          return (
            <button
              key={index}
              className="group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 p-8 text-left transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
              onClick={() => handleNavigation(card.route)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-100 transition-all duration-500`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className={card.trendUp ? 'text-emerald-600' : 'text-red-600'} />
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      card.trendUp 
                        ? 'text-emerald-200 bg-emerald-600/20 border border-emerald-500/40' 
                        : 'text-red-200 bg-red-600/20 border border-red-500/40'
                    }`}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white transition-colors">
                    {card.title}
                  </h3>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                    <div className="text-sm text-white/80">{card.subtitle}</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <ArrowUpRight size={20} className="text-gray-200" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
  {/* Enhanced Quick Actions */}
  <div className="lg:col-span-1">
    <div className="card-surface-dark rounded-2xl shadow-xl h-full overflow-hidden">
      
      {/* 🔹 Header section (like ChartCard) */}
      <div className="px-6 py-4 bg-white/50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
          Quick Actions
        </h2>
        <Zap size={20} className="text-orange-500" />
      </div>

      {/* 🔹 Body section */}
      <div className="p-8">
        <div className="space-y-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                className="w-full group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/5 transition-all duration-300 border-2 border-transparent hover:border-gray-700/10 hover:shadow-lg"
                onClick={() => action.route && handleNavigation(action.route)}
              >
                <div
                  className={`p-3 bg-gradient-to-r ${action.color} text-gray-700 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                >
                  <IconComponent size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-black group-hover:text-gray-100 transition-colors">
                    {action.title}
                  </p>
                  <p className="text-gray-700 group-hover:text-gray-200 transition-colors">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>

{/* Enhanced Recent Activity */}
<div className="lg:col-span-2">
  <div className="card-surface-dark rounded-2xl shadow-xl h-full overflow-hidden">
    
    {/* 🔹 Header section */}
    <div className="px-6 py-4 bg-white/50 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
          Recent Activity
        </h2>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-700 font-medium">LIVE</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-700/10 rounded-lg transition-colors">
          <Filter size={16} className="text-black" />
        </button>
        <button className="p-2 hover:bg-gray-700/10 rounded-lg transition-colors">
          <Search size={16} className="text-black" />
        </button>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-gray-700/10 rounded-lg transition-colors"
        >
          <Bell size={16} className="text-black" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-gray-700 text-[10px] rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
        <button className="text-sm text-gray-700 font-semibold px-4 py-2 bg-gray-700/10 hover:bg-gray-700/20 rounded-lg transition-all duration-300">
          View all
        </button>
      </div>
    </div>

    {/* 🔹 Body section */}
    <div className="p-8">
      <div className="space-y-4">
        {recentActivity.map((activity, index) => (
          <div
            key={index}
            className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-700/5 transition-all duration-300 border-l-4 border-transparent hover:border-blue-400/50 hover:shadow-md"
          >
            <div className={`w-3 h-3 ${activity.color} rounded-full mt-2 shadow-lg`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-black group-hover:text-gray-100 transition-colors">
                  <span className="capitalize bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    {activity.action}
                  </span>
                  : {activity.item}
                </p>
                <span className="text-xs text-gray-700 whitespace-nowrap ml-2 font-medium">
                  {activity.time}
                </span>
              </div>
              <p className="text-sm text-gray-700 group-hover:text-gray-200 transition-colors">
                {activity.user && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} />
                    By {activity.user}
                  </span>
                )}
                {activity.quantity && `Quantity: ${activity.quantity}`}
              </p>
            </div>
            <Eye
              size={16}
              className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1"
            />
          </div>
        ))}
      </div>
    </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-700/5 transition-all duration-300 border-l-4 border-transparent hover:border-blue-400/50 hover:shadow-md">
                  <div className={`w-3 h-3 ${activity.color} rounded-full mt-2 shadow-lg`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-black group-hover:text-gray-100 transition-colors">
                        <span className="capitalize bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
                          {activity.action}
                        </span>
                        : {activity.item}
                      </p>
                      <span className="text-xs text-gray-700 whitespace-nowrap ml-2 font-medium">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 group-hover:text-gray-200 transition-colors">
                      {activity.user && (
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />
                          By {activity.user}
                        </span>
                      )}
                      {activity.quantity && `Quantity: ${activity.quantity}`}
                      {/* no location field in activity shape */}
                    </p>
                  </div>
                  <Eye size={16} className="text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="bg-[#e1d4b1] backdrop-blur-xl rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button className="text-sm text-blue-600" onClick={loadNotifications}>Refresh</button>
          </div>
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="text-sm text-white py-4">No notifications</div>
            ) : notifications.map(n => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900">{n.title}</div>
                  <div className="text-sm text-gray-700">{n.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {n.data?.issuanceId && (
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => handleNavigation(`/dashboard/issuance?id=${encodeURIComponent(n.data.issuanceId)}`)}>View Issuance</button>
                  )}
                  {n.data?.gatePassId && (
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => handleNavigation(`/dashboard/gate-pass?id=${encodeURIComponent(n.data.gatePassId)}`)}>View Gate Pass</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}