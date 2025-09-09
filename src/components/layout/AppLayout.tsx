import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Settings, User, ChevronRight, Home } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // State for live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'offline'>('degraded');
  const [isChecking, setIsChecking] = useState(true);
  
  // Check system status
  const checkSystemStatus = async () => {
    try {
      setIsChecking(true);
      // Simulate API calls to check system health
      const [systemOk, networkOk, dbOk] = await Promise.all([
        checkSystemHealth(),
        checkNetworkHealth(),
        checkDatabaseHealth()
      ]);
      
      if (systemOk && networkOk && dbOk) {
        setSystemStatus('healthy');
      } else if (!systemOk || !networkOk || !dbOk) {
        setSystemStatus('degraded');
      } else {
        setSystemStatus('offline');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus('offline');
    } finally {
      setIsChecking(false);
    }
  };
  
  // Mock health check functions - replace with actual API calls
  const checkSystemHealth = async (): Promise<boolean> => {
    // Replace with actual system health check
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
  };
  
  const checkNetworkHealth = async (): Promise<boolean> => {
    // Replace with actual network health check
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
  };
  
  const checkDatabaseHealth = async (): Promise<boolean> => {
    // Replace with actual database health check
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
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
              </div>
            </div>

            {/* System Status Indicator */}
            <div className="hidden md:flex items-center group relative">
              <div 
                className={`relative flex items-center justify-center h-6 w-6 rounded-full 
                  backdrop-blur-md shadow-md border transition-all duration-300 ${
                    isChecking 
                      ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-300/60 dark:border-amber-700/50'
                      : systemStatus === 'healthy' 
                        ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300/60 dark:border-emerald-700/50'
                        : systemStatus === 'degraded'
                          ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-300/60 dark:border-amber-700/50'
                          : 'bg-red-100/60 dark:bg-red-900/40 border-red-300/60 dark:border-red-700/50'
                  }`}
                title={isChecking 
                  ? 'Checking system status...' 
                  : systemStatus === 'healthy' 
                    ? 'All systems operational' 
                    : systemStatus === 'degraded'
                      ? 'System degraded - some services may be affected'
                      : 'System offline - critical failure'}
              >
                {/* Status indicator dot */}
                <div 
                  className={`h-3 w-3 rounded-full shadow-lg ${
                    isChecking 
                      ? 'bg-amber-500 animate-pulse' 
                      : systemStatus === 'healthy' 
                        ? 'bg-emerald-500 animate-pulse' 
                        : systemStatus === 'degraded'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-red-500 animate-pulse'
                  }`}
                />
                {/* Ping effect */}
                <div 
                  className={`absolute h-3 w-3 rounded-full ${
                    isChecking 
                      ? 'bg-amber-400 animate-ping' 
                      : systemStatus === 'healthy' 
                        ? 'bg-emerald-400' 
                        : systemStatus === 'degraded'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                  }`}
                />
              </div>
              
              {/* Status tooltip */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 text-sm text-slate-700 dark:text-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-slate-200 dark:border-slate-700">
                <div className="font-medium mb-2">System Status</div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      isChecking ? 'bg-amber-500' : systemStatus === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                    <span>System: {isChecking ? 'Checking...' : systemStatus === 'healthy' ? 'Operational' : 'Issues Detected'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
                    <span>Network: {isChecking ? 'Checking...' : 'Stable'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
                    <span>Database: {isChecking ? 'Checking...' : 'Connected'}</span>
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