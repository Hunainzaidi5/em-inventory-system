import React, { useState, useEffect } from "react";
import { Package, Wrench, Shield, AlertTriangle, TrendingUp, Clock, Users, BarChart3, Bell, Search, Filter, Download, RefreshCw, ArrowUpRight, Activity, Zap, Eye } from "lucide-react";
import statsService from '@/services/statsService';
import requisitionService from '@/services/requisitionService';
import userService from '@/services/userService';
import { spareService } from '@/services/spareService';
import notificationService from '@/services/notificationService';

export default function Dashboard() {
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
      const top = sorted.slice(0, 8).map((r: any) => ({
        action: r.type,
        item: r.item_name,
        user: r.issued_to,
        time: timeAgo(r.requested_at || r.created_at),
        quantity: Number(r.quantity || 0),
        color: r.type === 'issue' ? 'bg-blue-500' : r.type === 'return' ? 'bg-green-500' : 'bg-orange-500',
      }));
      setRecentActivity(top);
    } catch {
      setRecentActivity([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getRecent(10);
      setNotifications(list as any);
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

  const handleNavigation = (route) => {
    console.log(`Navigating to: ${route}`);
    // Replace with your navigation logic
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAndAnimateStats().finally(() => setTimeout(() => setIsRefreshing(false), 800));
  };

  const statsCards = [
    {
      title: "Spare Parts",
      value: animatedStats[0].toLocaleString(),
      subtitle: "Across all systems",
      icon: Package,
      route: "/dashboard/spare-management",
      color: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200",
      trend: "+12%",
      trendUp: true,
      bgGradient: "from-blue-500/10 to-blue-600/10"
    },
    {
      title: "Tools",
      value: animatedStats[1].toLocaleString(),
      subtitle: "Available for checkout",
      icon: Wrench,
      route: "/dashboard/inventory",
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-200",
      trend: "+5%",
      trendUp: true,
      bgGradient: "from-emerald-500/10 to-emerald-600/10"
    },
    {
      title: "PPE Items",
      value: animatedStats[2].toLocaleString(),
      subtitle: "In stock",
      icon: Shield,
      route: "/dashboard/ppe",
      color: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200",
      trend: "+8%",
      trendUp: true,
      bgGradient: "from-purple-500/10 to-purple-600/10"
    },
    {
      title: "Faulty Items",
      value: animatedStats[3].toLocaleString(),
      subtitle: "Needing attention",
      icon: AlertTriangle,
      route: "/dashboard/faulty-returns",
      color: "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200",
      trend: "-3%",
      trendUp: false,
      bgGradient: "from-red-500/10 to-red-600/10"
    }
  ];

  const quickActions = [
    { title: "Add New Item", description: "Register new inventory item", icon: Package, color: "from-blue-500 to-blue-600", route: "/dashboard/inventory" },
    { title: "Check Out Tool", description: "Assign tool to employee", icon: Users, color: "from-emerald-500 to-emerald-600", route: "/dashboard/tools" },
    { title: "Generate Report", description: "Create inventory report", icon: BarChart3, color: "from-purple-500 to-purple-600", route: "/dashboard/availability" },
    { title: "View Analytics", description: "Access detailed insights", icon: TrendingUp, color: "from-orange-500 to-orange-600", route: "/dashboard/availability" }
  ];

  // recentActivity is now loaded dynamically

  const systemMetrics = [
    { label: "System Health", value: `${systemHealth}%`, icon: Activity, color: "text-green-500" },
    { label: "Active Users", value: String(activeUsers), icon: Users, color: "text-blue-500" },
    { label: "Alerts", value: String(alertsCount), icon: Bell, color: "text-orange-500" }
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      <div className="space-y-6">
        {/* Premium Welcome Section with Advanced Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-10 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-20 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <BarChart3 size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">E&M Inventory Management System</h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-blue-100 text-xl font-medium leading-relaxed max-w-2xl">
                  Your comprehensive solution for managing inventory, tools, PPE, and maintenance items 
                  with real-time insights and intelligent automation.
                </p>
                
                {/* System Health Metrics */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Activity size={18} className="text-green-400" />
                    <span className="text-blue-50 font-medium">System Health: <span className="font-bold">{systemHealth}%</span></span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Users size={18} className="text-blue-300" />
                    <span className="text-blue-50 font-medium">Active Users: <span className="font-bold">{activeUsers}</span></span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Bell size={18} className="text-yellow-400" />
                    <span className="text-blue-50 font-medium">Alerts: <span className="font-bold">{alertsCount}</span></span>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white transition-colors rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 font-medium shadow-sm"
                  >
                    <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                    <Clock size={16} />
                    <span className="font-medium">
                      {currentTime.toLocaleTimeString()}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 size={48} className="text-white/90" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Bell size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Stats Cards with Advanced Effects */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <button
              key={index}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 p-8 text-left transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
              onClick={() => handleNavigation(card.route)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${card.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <IconComponent size={28} />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className={card.trendUp ? 'text-emerald-500' : 'text-red-500'} />
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      card.trendUp 
                        ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' 
                        : 'text-red-600 bg-red-50 border border-red-200'
                    }`}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-600 group-hover:text-gray-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                    {card.subtitle}
                  </p>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <ArrowUpRight size={20} className="text-gray-400" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Enhanced Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <Zap size={20} className="text-yellow-500" />
            </div>
            <div className="space-y-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full group flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 border-2 border-transparent hover:border-gray-100 hover:shadow-lg"
                    onClick={() => action.route && (window.location.assign(action.route))}
                  >
                    <div className={`p-3 bg-gradient-to-r ${action.color} text-white rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-medium">LIVE</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter size={16} className="text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Search size={16} className="text-gray-400" />
                </button>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell size={16} className="text-gray-400" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notifications.length}</span>
                  )}
                </button>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-300">
                  View all
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 border-l-4 border-transparent hover:border-blue-300 hover:shadow-md">
                  <div className={`w-3 h-3 ${activity.color} rounded-full mt-2 shadow-lg`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                        <span className="capitalize bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {activity.action}
                        </span>
                        : {activity.item}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2 font-medium">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
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
                  <Eye size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showNotifications && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button className="text-sm text-blue-600" onClick={loadNotifications}>Refresh</button>
          </div>
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="text-sm text-gray-500 py-4">No notifications</div>
            ) : notifications.map(n => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {n.data?.issuanceId && (
                    <a className="text-sm text-blue-600 hover:underline" href={`/dashboard/issuance`} target="_blank" rel="noreferrer">View Issuance</a>
                  )}
                  {n.data?.gatePassId && (
                    <a className="text-sm text-blue-600 hover:underline" href={`/dashboard/gate-pass`} target="_blank" rel="noreferrer">View Gate Pass</a>
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