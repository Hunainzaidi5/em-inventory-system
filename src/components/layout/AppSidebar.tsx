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

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, exact: true },
  { title: "Availability Overview", url: "/dashboard/availability", icon: BarChart3 },
];

const inventoryMenuItems = [
  { title: "Spare Management", url: "/dashboard/spare-management", icon: HammerIcon },
  { title: "Faulty Returns", url: "/dashboard/faulty-returns", icon: RotateCcw },
  { title: "PPE Items", url: "/dashboard/ppe", icon: Shield },
  { title: "Stationery Items", url: "/dashboard/stationery", icon: Box },
];

const documentsMenuItems = [
  { title: "Requisition", url: "/dashboard/requisition", icon: ListTodo },
  { title: "Gate Pass", url: "/dashboard/gate-pass", icon: Key },
  { title: "Issuance Form", url: "/dashboard/issuance", icon: FileCheck },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout, setUser } = useAuth();
  
  // Debug: Log user data when it changes
  useEffect(() => {
    console.log('User in AppSidebar:', user);
    if (user?.avatar) {
      console.log('Avatar URL:', user.avatar);
      // Test if the avatar URL is accessible
      fetch(user.avatar, { method: 'HEAD' })
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
    return location.pathname.startsWith(path);
  };

  const getNavClassName = (path: string, exact = false) => {
    const baseClasses = "w-full justify-start transition-all duration-200";
    if (isActive(path, exact)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-accent-foreground font-medium`;
    }
    return `${baseClasses} hover:bg-sidebar-accent/50`;
  };

  // Function to handle avatar refresh
  const handleRefreshAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Add a timestamp to the avatar URL to force a refresh
      const avatarWithTimestamp = user?.avatar ? 
        `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${Date.now()}` : 
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
    <Sidebar className={className} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="E&M Inventory Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-sidebar-foreground">E&M Inventory</h1>
              <p className="text-xs text-sidebar-foreground/60">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url, item.exact)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={inventoryOpen} onOpenChange={setInventoryOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex cursor-pointer items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                Spare Management
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />}
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
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={assetOpen} onOpenChange={setAssetOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex cursor-pointer items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                Asset Management
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${assetOpen ? 'rotate-180' : ''}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { title: "Inventory", url: "/dashboard/inventory", icon: Package },
                    { title: "Tools", url: "/dashboard/tools", icon: Wrench },
                    { title: "General Tools", url: "/dashboard/general-tools", icon: Gauge }
                  ].map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex cursor-pointer items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                Documents & Reports
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${documentsOpen ? 'rotate-180' : ''}`} />}
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
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-12 px-3 group">
                <div className="flex items-center space-x-2 w-full">
                  <div className="relative">
                    <Avatar className="h-8 w-8 group-hover:opacity-80 transition-opacity">
                      {user.avatar ? (
                        <>
                          <AvatarImage 
                            src={`${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${Date.now()}`} 
                            alt={user.name}
                            className="object-cover"
                            onError={(e) => {
                              console.error('Error loading avatar in sidebar:', e);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <AvatarFallback className="text-xs bg-muted">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="text-xs bg-muted">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border shadow-sm p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleRefreshAvatar}
                      title="Refresh avatar"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                  {!collapsed && (
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate capitalize">
                        {user.role.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {!collapsed && <ChevronDown className="ml-auto h-4 w-4 opacity-50 shrink-0" />}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {user.role === 'dev' && (
                <DropdownMenuItem onClick={() => navigate('/dashboard/users')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-2 w-full">
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => navigate('/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {!collapsed && 'Sign In'}
            </Button>
            <Button 
              variant="default" 
              className="w-full" 
              size="sm"
              onClick={() => navigate('/register')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {!collapsed && 'Sign Up'}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}