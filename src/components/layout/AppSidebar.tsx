import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
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
} from "lucide-react";

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
  { title: "Dashboard", url: "/", icon: Home, exact: true },
  { title: "Availability Overview", url: "/availability", icon: BarChart3 },
];

const inventoryMenuItems = [
  { title: "Inventory Items", url: "/inventory", icon: Package },
  { title: "Tools", url: "/tools", icon: Wrench },
  { title: "PPE Items", url: "/ppe", icon: Shield },
  { title: "General Items", url: "/general", icon: Gift },
];

const documentsMenuItems = [
  { title: "Gate Pass", url: "/gate-pass", icon: FileCheck },
  { title: "Issuance Form", url: "/issuance", icon: FileCheck },
];

const systemMenuItems = [
  { title: "System Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);

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

  // Mock user data
  const currentUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Engineer",
    avatar: "",
  };

  return (
    <Sidebar className={className} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
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
                Inventory Management
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

        <SidebarGroup>
          <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex cursor-pointer items-center justify-between hover:bg-sidebar-accent/30 px-2 py-1 rounded">
                System Administration
                {!collapsed && <ChevronDown className={`h-4 w-4 transition-transform ${systemOpen ? 'rotate-180' : ''}`} />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemMenuItems.map((item) => (
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-auto p-2 hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</span>
                  <span className="text-xs text-sidebar-foreground/60">{currentUser.role}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}