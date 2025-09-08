import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Wrench,
  Shield,
  Gift,
  AlertTriangle,
  FileCheck,
  FileText,
  BarChart3,
  Users,
  Home,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ListTodo,
  User,
  UserCircle,
  LogIn,
  UserPlus,
  Box,
  Key,
  Gauge,
  HammerIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TbTools } from "react-icons/tb";
import { BsTools } from "react-icons/bs";
import { MdOutlineInventory2 } from "react-icons/md";
import { TfiRulerPencil } from "react-icons/tfi";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaToolbox } from "react-icons/fa6";
import { TbTruckReturn } from "react-icons/tb";
import { GrDocumentUser } from "react-icons/gr";

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, exact: true },
  { title: "Availability Overview", url: "/dashboard/availability", icon: BarChart3 },
];

const inventoryMenuItems = [
  { title: "Spare Management", url: "/dashboard/spare-management", icon: FaToolbox },
  { title: "Issuance Requisition", url: "/dashboard/issuance-requisition", icon: FileText },
  { title: "Faulty Returns", url: "/dashboard/faulty-returns", icon: TbTruckReturn },
  { title: "PPE Items", url: "/dashboard/ppe", icon: FaHelmetSafety },
  { title: "Stationery Items", url: "/dashboard/stationery", icon: TfiRulerPencil },
];

const documentsMenuItems = [
  { title: "Requisition", url: "/dashboard/requisition", icon: ListTodo },
  { title: "Gate Pass", url: "/dashboard/gate-pass", icon: GrDocumentUser },
  { title: "Issuance Form", url: "/dashboard/issuance", icon: FileCheck },
];

interface AppSidebarProps {
  className?: string;
}

// Grid pattern style for the overlay
const gridPatternStyle: React.CSSProperties = {
  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\' width=\'32\' height=\'32\' fill=\'none\' stroke=\'rgba(255,255,255,0.2)\'>%3cpath d=\'M0 .5H31.5V32\'/%3e%3c/svg>")',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.2,
  pointerEvents: 'none',
  zIndex: 1
};

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(state === "collapsed");
  const collapsed = isCollapsed;
  const location = useLocation();
  const { user, logout, setUser } = useAuth();
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Debug: Log user data when it changes
  useEffect(() => {
    console.log('User in AppSidebar:', user);
    if (user?.avatar_url) {
      console.log('Avatar URL:', user.avatar_url);
      // Test if the avatar URL is accessible
      fetch(user.avatar_url, { method: 'HEAD' })
        .then(res => {
          console.log('Avatar URL status:', res.status);
          if (res.ok) {
            console.log('Avatar is accessible');
          } else {
            console.error('Avatar URL not accessible:', res.status, res.statusText);
          }
        })
        .catch(error => {
          console.error('Error checking avatar URL:', error);
        });
    }
  }, [user]);
  const navigate = useNavigate();
  const [mainOpen, setMainOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [assetOpen, setAssetOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    // For non-exact matches, check if the path matches exactly or is followed by a forward slash
    return location.pathname === path || 
           (location.pathname.startsWith(path) && 
            (location.pathname[path.length] === '/' || location.pathname[path.length] === '?' || location.pathname[path.length] === undefined));
  };

  const getNavClassName = (path: string, exact = false) => {
    const baseClasses = `w-full justify-${collapsed ? 'center' : 'start'} transition-all duration-200 rounded-md px-3 py-2`;
    if (isActive(path, exact)) {
      return `${baseClasses} bg-sidebar-accent/80 text-black font-medium border-l-4 border-sidebar-accent-foreground`;
    }
    return `${baseClasses} hover:bg-sidebar-accent/40 text-gray-600`;
  };

  // Function to handle avatar refresh
  const handleRefreshAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Add a timestamp to the avatar URL to force a refresh
      const avatarWithTimestamp = user?.avatar_url ? 
        `${user.avatar_url}${user.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}` : 
        '';
      
      // Update the avatar URL in the user object
      if (user) {
        setUser({
          ...user,
          avatar: avatarWithTimestamp
        });
      }
    } catch (error) {
      console.error('Error refreshing avatar:', error);
    }
  };

  return (
    <Sidebar 
      className={`${className} ${isCollapsed ? 'w-20' : 'w-72'} flex flex-col bg-gradient-to-br from-[#e1d4b1] via-[#e1d4b1] to-[#e1d4b1] transition-all duration-300 ease-in-out`} 
      style={{
        '--sidebar-background': 'radial-gradient(circle, #1e3a8a 0%, #1e40af 50%, #ea580c 100%)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        minWidth: isCollapsed ? '5rem' : '18rem'
      } as React.CSSProperties}
      collapsible="icon"
    >
      {/* Grid Pattern Overlay */}
      <div style={gridPatternStyle}></div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <SidebarHeader className="h-20 border-b border-sidebar-border p-4 bg-gradient-to-r from-sidebar-accent/10 to-transparent relative z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img 
                  src="/eminventory.png" 
                  alt="E&M Inventory Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <h1 className="text-sm font-semibold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">E&M Inventory</h1>
                  <p className="text-xs bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">Management System</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-full hover:bg-sidebar-accent/20 transition-colors duration-200"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2 space-y-2 relative z-10">
        {/* Main Menu Items */}
        <SidebarGroup>
          {collapsed ? (
            // When collapsed, show all items as individual icons with tooltips
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClassName(item.url, item.exact)} title={item.title}>
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible group
            <Collapsible open={mainOpen} onOpenChange={setMainOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex cursor-pointer text-black items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                  Main
                  <ChevronDown className={`h-4 w-4 transition-transform ${mainOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {mainMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClassName(item.url, item.exact)}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>

        {/* Spare Management Section */}
        <SidebarGroup>
          {collapsed ? (
            // When collapsed, show all items as individual icons with tooltips
            <SidebarGroupContent>
              <SidebarMenu>
                {inventoryMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClassName(item.url)} title={item.title}>
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible group
            <Collapsible open={inventoryOpen} onOpenChange={setInventoryOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex cursor-pointer text-black items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                  Spare Management
                  <ChevronDown className={`h-4 w-4 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {inventoryMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClassName(item.url)}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>

        {/* Asset Management Section */}
        <SidebarGroup>
          {collapsed ? (
            // When collapsed, show all items as individual icons with tooltips
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { title: "Inventory", url: "/dashboard/inventory", icon: MdOutlineInventory2 },
                  { title: "Tools", url: "/dashboard/tools", icon: BsTools },
                  { title: "General Tools", url: "/dashboard/general-tools", icon: TbTools }
                ].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClassName(item.url)} title={item.title}>
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible group
            <Collapsible open={assetOpen} onOpenChange={setAssetOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex cursor-pointer text-black items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                  Asset Management
                  <ChevronDown className={`h-4 w-4 transition-transform ${assetOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {[
                      { title: "Inventory", url: "/dashboard/inventory", icon: MdOutlineInventory2 },
                      { title: "Tools", url: "/dashboard/tools", icon: BsTools },
                      { title: "General Tools", url: "/dashboard/general-tools", icon: TbTools }
                    ].map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClassName(item.url)}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>

        {/* Documents & Reports Section */}
        <SidebarGroup>
          {collapsed ? (
            // When collapsed, show all items as individual icons with tooltips
            <SidebarGroupContent>
              <SidebarMenu>
                {documentsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClassName(item.url)} title={item.title}>
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            // When expanded, show collapsible group
            <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex cursor-pointer text-black items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                  Documents & Reports
                  <ChevronDown className={`h-4 w-4 transition-transform ${documentsOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {documentsMenuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClassName(item.url)}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`p-4 border-t border-border/40 bg-gradient-to-br from-background/95 via-background/90 to-accent/10 backdrop-blur-md relative z-10 shadow-lg ${collapsed ? 'px-2' : ''}`}>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full justify-center h-16 ${collapsed ? 'px-3' : 'px-4'} group hover:bg-accent/20 transition-all duration-500 ease-out rounded-2xl border border-border/20 hover:border-primary/30 hover:shadow-lg active:scale-[0.98] bg-gradient-to-r from-background/50 to-accent/5`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3 w-full'}`}>
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md"></div>
                    
                    {/* Avatar with gradient border */}
                    <Avatar className={`relative ${collapsed ? 'h-10 w-10' : 'h-11 w-11'} ring-2 ring-border/50 group-hover:ring-primary/40 transition-all duration-500 shadow-md group-hover:shadow-lg group-hover:scale-105`}>
                      {user.avatar_url ? (
                        <>
                          <AvatarImage 
                            src={getAvatarUrl(user.id, user.avatar_url)}
                            alt={user.display_name || user.email}
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              console.error('Error loading avatar in sidebar:', e);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                            {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                          {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </Avatar>
                    
                    {/* Refresh button - only show when not collapsed */}
                    {!collapsed && (
                      <button 
                        type="button"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-border shadow-xl p-0 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-accent hover:scale-110 active:scale-95 flex items-center justify-center hover:border-primary/50"
                        onClick={handleRefreshAvatar}
                        title="Refresh avatar"
                      >
                        <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors duration-300" />
                      </button>
                    )}
                  </div>
                  
                  {!collapsed && (
                    <div className="text-left flex-1 min-w-0 transition-all duration-500 group-hover:translate-x-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.display_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role || 'User Role'}
                      </p>
                    </div>
                  )}
                  
                  {!collapsed && (
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-72 p-3 bg-background/98 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-4 duration-500 zoom-in-95"
            >
              {/* User info header */}
              <div className="px-3 py-3 mb-2 bg-gradient-to-r from-accent/10 to-primary/5 rounded-xl border border-border/30">
                <p className="text-sm font-bold text-foreground">{user.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
              </div>
              
              <DropdownMenuSeparator className="my-2 bg-border/40" />
              
              <DropdownMenuItem 
                onClick={() => navigate('/dashboard/profile')}
                className="mx-1 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-accent/30 focus:bg-accent/30 group hover:shadow-sm"
              >
                <User className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => navigate('/dashboard/settings')}
                className="mx-1 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-accent/30 focus:bg-accent/30 group hover:shadow-sm"
              >
                <Settings className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2 bg-border/40" />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="mx-1 px-4 py-3 rounded-xl cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive-foreground transition-colors duration-200 group"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-3 w-full">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-2 border-border/40 hover:border-primary/50 bg-background/60 hover:bg-accent/20 transition-all duration-500 group hover:shadow-lg active:scale-[0.98] font-semibold justify-center"
              size="sm"
              onClick={() => navigate('/login')}
              title={collapsed ? 'Sign In' : undefined}
            >
              <LogIn className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-500" />
              {!collapsed && <span className="ml-3">Sign In</span>}
            </Button>
            
            <Button 
              variant="default" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary hover:to-primary/90 shadow-xl hover:shadow-2xl transition-all duration-500 group active:scale-[0.98] border-0 font-bold justify-center"
              size="sm"
              onClick={() => navigate('/register')}
              title={collapsed ? 'Get Started' : undefined}
            >
              <UserPlus className="h-4 w-4 transition-all duration-500 group-hover:scale-110" />
              {!collapsed && <span className="ml-3">Get Started</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
      </div>
    </Sidebar>
  );
}