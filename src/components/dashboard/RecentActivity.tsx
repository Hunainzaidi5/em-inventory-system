import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { 
  Package, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle,
  User,
  Clock
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'issue' | 'return' | 'consume' | 'fault';
  itemName: string;
  itemType: 'inventory' | 'tool' | 'ppe' | 'general';
  quantity: number;
  user: string;
  timestamp: string;
  description?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'issue',
    itemName: 'Safety Helmet Yellow',
    itemType: 'ppe',
    quantity: 5,
    user: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    description: 'Issued for maintenance work at Station A',
  },
  {
    id: '2',
    type: 'return',
    itemName: 'Hydraulic Pump Motor',
    itemType: 'inventory',
    quantity: 1,
    user: 'Sarah Wilson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    description: 'Returned after elevator maintenance',
  },
  {
    id: '3',
    type: 'fault',
    itemName: 'Digital Multimeter',
    itemType: 'tool',
    quantity: 1,
    user: 'Mike Chen',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    description: 'Display malfunction reported',
  },
  {
    id: '4',
    type: 'consume',
    itemName: 'Electrical Tape',
    itemType: 'general',
    quantity: 10,
    user: 'David Brown',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    description: 'Used for cable management project',
  },
  {
    id: '5',
    type: 'issue',
    itemName: 'Safety Goggles',
    itemType: 'ppe',
    quantity: 3,
    user: 'Emma Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    description: 'Issued for welding operations',
  },
];

export function RecentActivity() {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'issue':
        return <ArrowUpCircle className={`${iconClass} text-info`} />;
      case 'return':
        return <ArrowDownCircle className={`${iconClass} text-success`} />;
      case 'consume':
        return <Package className={`${iconClass} text-warning`} />;
      case 'fault':
        return <AlertTriangle className={`${iconClass} text-error`} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    const variants = {
      issue: 'default',
      return: 'default',
      consume: 'secondary',
      fault: 'destructive',
    } as const;

    const labels = {
      issue: 'Issued',
      return: 'Returned',
      consume: 'Consumed',
      fault: 'Faulty',
    };

    return (
      <Badge variant={variants[type]} className="text-xs">
        {labels[type]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground truncate">
                    {activity.itemName}
                  </span>
                  {getActivityBadge(activity.type)}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>Qty: {activity.quantity}</span>
                </div>
                
                {activity.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          
          <div className="text-center">
            <button className="text-sm text-primary hover:underline">
              View all activities →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}