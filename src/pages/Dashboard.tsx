import { 
    Package, 
    CheckCircle, 
    ArrowUpCircle, 
    XCircle, 
    AlertTriangle,
    TrendingUp,
    Users,
    Clock
  } from "lucide-react";
  import { StatsCard } from "@/components/dashboard/StatsCard";
  import { RecentActivity } from "@/components/dashboard/RecentActivity";
  import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
  
  export default function Dashboard() {
    // Mock data - in real app this would come from your backend
    const stats = {
      totalItems: 2847,
      availableItems: 2156,
      issuedItems: 542,
      consumedItems: 89,
      faultyItems: 60,
      lowStockItems: 23,
      pendingReturns: 18,
      activeUsers: 45,
    };
  
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your inventory management system
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
  
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Items"
            value={stats.totalItems.toLocaleString()}
            description="Across all categories"
            icon={<Package />}
            trend={{
              value: 8.2,
              isPositive: true
            }}
            variant="default"
          />
          
          <StatsCard
            title="Available Items"
            value={stats.availableItems.toLocaleString()}
            description="Ready for use"
            icon={<CheckCircle />}
            trend={{
              value: 5.1,
              isPositive: true
            }}
            variant="success"
          />
          
          <StatsCard
            title="Issued Items"
            value={stats.issuedItems.toLocaleString()}
            description="Currently in use"
            icon={<ArrowUpCircle />}
            trend={{
              value: 12.3,
              isPositive: true
            }}
            variant="info"
          />
          
          <StatsCard
            title="Faulty Items"
            value={stats.faultyItems}
            description="Need attention"
            icon={<XCircle />}
            trend={{
              value: 2.8,
              isPositive: false
            }}
            variant="error"
          />
        </div>
  
        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Low Stock Alerts"
            value={stats.lowStockItems}
            description="Below minimum level"
            icon={<AlertTriangle />}
            variant="warning"
          />
          
          <StatsCard
            title="Pending Returns"
            value={stats.pendingReturns}
            description="Awaiting return"
            icon={<Clock />}
            variant="default"
          />
          
          <StatsCard
            title="Items Consumed"
            value={stats.consumedItems}
            description="This month"
            icon={<TrendingUp />}
            variant="default"
          />
          
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            description="Currently online"
            icon={<Users />}
            variant="default"
          />
        </div>
  
        {/* Charts and Activity Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          
          {/* Low Stock Alerts - Takes 1 column */}
          <div className="lg:col-span-1">
            <LowStockAlert />
          </div>
        </div>
  
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Add New Item</h3>
                <p className="text-sm text-muted-foreground">Add inventory item</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <ArrowUpCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-medium">Issue Items</h3>
                <p className="text-sm text-muted-foreground">Create new issue</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <h3 className="font-medium">Generate Report</h3>
                <p className="text-sm text-muted-foreground">Create inventory report</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-medium">Alert Settings</h3>
                <p className="text-sm text-muted-foreground">Manage notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }