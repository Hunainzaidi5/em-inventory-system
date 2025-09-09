import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Settings, User, ChevronRight, Home } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AppLayoutProps {
  children: ReactNode;
}

interface SystemHealth {
  system: boolean;
  network: boolean;
  database: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  // State for live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'offline'>('degraded');
  const [isChecking, setIsChecking] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    system: false,
    network: false,
    database: false
  });
  
  // Mock health check functions - replace with actual API calls
  const checkSystemHealth = async (): Promise<boolean> => {
    try {
      // Replace this with actual system health endpoint
      // Example: const response = await fetch('/api/health/system');
      // return response.ok;
      
      // Simulate API call with random success/failure for demo
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      return Math.random() > 0.2; // 80% success rate for demo
    } catch (error) {
      console.error('System health check failed:', error);
      return false;
    }
  };
  
  const checkNetworkHealth = async (): Promise<boolean> => {
    try {
      // Replace this with actual network health check
      // Example: const response = await fetch('/api/health/network');
      // return response.ok;
      
      // Simulate network check
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      return Math.random() > 0.15; // 85% success rate for demo
    } catch (error) {
      console.error('Network health check failed:', error);
      return false;
    }
  };
  
  const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
      // Replace this with actual database health check
      // Example: const response = await fetch('/api/health/database');
      // return response.ok;
      
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
      return Math.random() > 0.1; // 90% success rate for demo
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  };
  
  // Check system status
  const checkSystemStatus = async () => {
    try {
      setIsChecking(true);
      
      // Run all health checks concurrently
      const [systemOk, networkOk, dbOk] = await Promise.all([
        checkSystemHealth(),
        checkNetworkHealth(),
        checkDatabaseHealth()
      ]);
      
      // Update individual health states
      setSystemHealth({
        system: systemOk,
        network: networkOk,
        database: dbOk
      });
      
      // Determine overall system status
      if (systemOk && networkOk && dbOk) {
        setSystemStatus('healthy');
      } else if (!systemOk || (!networkOk && !dbOk)) {
        setSystemStatus('offline');
      } else {
        setSystemStatus('degraded');
      }
      
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus('offline');
      setSystemHealth({
        system: false,
        network: false,
        database: false
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  // Update time every second and check system status periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Initial status check
    checkSystemStatus();
    
    // Check status every 5 minutes
    const statusCheckInterval = setInterval(checkSystemStatus, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      clearInterval(timer);
      clearInterval(statusCheckInterval);
    };
  }, []);
  
  // Get current location
  const location = useLocation();
  
  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [];
    
    // Add Home as the first breadcrumb
    breadcrumbs.push({
      name: 'Home',
      path: '/dashboard',
      isCurrent: pathnames.length === 0
    });
    
    // Generate breadcrumbs from path
    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Skip 'dashboard' from breadcrumb
      if (name === 'dashboard') return;
      
      // Format name for display
      const displayName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        name: displayName,
        path: currentPath,
        isCurrent: index === pathnames.length - 1
      });
    });
    
    return breadcrumbs;
  };
  
  // Format time and date
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
  
  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Get status colors and animations
  const getStatusStyles = () => {
    if (isChecking) {
      return {
        containerClass: 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-300/60 dark:border-amber-700/50',
        dotClass: 'bg-amber-500 animate-pulse',
        pingClass: 'bg-amber-400 animate-ping'
      };
    }
    
    switch (systemStatus) {
      case 'healthy':
        return {
          containerClass: 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300/60 dark:border-emerald-700/50',
          dotClass: 'bg-emerald-500 animate-pulse',
          pingClass: 'bg-emerald-400 animate-pulse'
        };
      case 'degraded':
        return {
          containerClass: 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-300/60 dark:border-amber-700/50',
          dotClass: 'bg-amber-500 animate-pulse',
          pingClass: 'bg-amber-400 animate-ping'
        };
      case 'offline':
        return {
          containerClass: 'bg-red-100/60 dark:bg-red-900/40 border-red-300/60 dark:border-red-700/50',
          dotClass: 'bg-red-500 animate-bounce',
          pingClass: 'bg-red-400 animate-ping'
        };
      default:
        return {
          containerClass: 'bg-gray-100/60 dark:bg-gray-900/40 border-gray-300/60 dark:border-gray-700/50',
          dotClass: 'bg-gray-500',
          pingClass: 'bg-gray-400'
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Sidebar - Fixed positioning */}
        <AppSidebar />
        
        {/* Main content area that accounts for sidebar */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Professional Header */}
          <header className="sticky top-0 z-40 flex h-20 items-center border-b border-slate-200/40 dark:border-slate-700/40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/85 dark:supports-[backdrop-filter]:bg-slate-950/85 px-6 lg:px-8">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                {/* Show sidebar trigger only on mobile */}
                <div className="lg:hidden">
                  <SidebarTrigger className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 hover:scale-105" />
                </div>
                
                {/* Enhanced Branding & Navigation */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-4">
                    <div className=" flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-indigo-500/25">
                    </div>
                    
                    <div className="flex flex-col">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent tracking-tight leading-none">
                        E&M Inventory
                      </h1>
                      <div className="text-xs bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent font-medium tracking-wide">
                        Management System
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic Breadcrumb */}
                  <nav className="hidden lg:flex items-center text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    <ol className="flex items-center space-x-2">
                      {generateBreadcrumbs().map((breadcrumb, index) => (
                        <li key={breadcrumb.path} className="flex items-center">
                          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 mx-1" />}
                          {breadcrumb.isCurrent ? (
                            <span className={`${index === 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                              {index === 0 ? <Home className="h-3.5 w-3.5" /> : breadcrumb.name}
                            </span>
                          ) : (
                            <Link 
                              to={breadcrumb.path}
                              className="text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition-colors"
                            >
                              {index === 0 ? <Home className="h-3.5 w-3.5" /> : breadcrumb.name}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Live Time & Date Display */}
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formattedTime}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {formattedDate}
                  </div>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <NotificationDropdown />
                </div>

                {/* System Status Indicator */}
                <div className="hidden md:flex items-center group relative">
                  <button
                    onClick={() => checkSystemStatus()}
                    className={`relative flex items-center justify-center h-8 w-8 rounded-full 
                      backdrop-blur-md shadow-md border transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 ${statusStyles.containerClass} ${
                        systemStatus === 'healthy' ? 'focus:ring-emerald-500' : 
                        systemStatus === 'degraded' ? 'focus:ring-amber-500' : 
                        'focus:ring-red-500'
                      }`}
                    title={isChecking 
                      ? 'Checking system status...' 
                      : systemStatus === 'healthy' 
                        ? 'All systems operational - Click to refresh' 
                        : systemStatus === 'degraded'
                          ? 'System degraded - some services may be affected - Click to refresh'
                          : 'System offline - critical failure - Click to refresh'}
                  >
                    {/* Status indicator dot */}
                    <div className={`h-4 w-4 rounded-full shadow-lg ${statusStyles.dotClass}`} />
                    
                    {/* Ping effect */}
                    <div className={`absolute h-4 w-4 rounded-full ${statusStyles.pingClass}`} />
                  </button>
                  
                  {/* Enhanced Status tooltip */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 text-sm text-slate-700 dark:text-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold mb-3 text-base">System Status</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-3 ${
                            isChecking ? 'bg-amber-500 animate-pulse' : 
                            systemHealth.system ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                          }`}></div>
                          System
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isChecking ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                          systemHealth.system ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {isChecking ? 'Checking...' : systemHealth.system ? 'OK' : 'Error'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-3 ${
                            isChecking ? 'bg-amber-500 animate-pulse' : 
                            systemHealth.network ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                          }`}></div>
                          Network
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isChecking ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                          systemHealth.network ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {isChecking ? 'Checking...' : systemHealth.network ? 'Stable' : 'Issues'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-3 ${
                            isChecking ? 'bg-amber-500 animate-pulse' : 
                            systemHealth.database ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                          }`}></div>
                          Database
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isChecking ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                          systemHealth.database ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {isChecking ? 'Checking...' : systemHealth.database ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last checked: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content Container */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}