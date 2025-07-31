import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  location: string;
  urgency: 'critical' | 'warning' | 'low';
}

const mockLowStockItems: LowStockItem[] = [
  {
    id: '1',
    name: 'Elevator Door Motor',
    category: 'Elevator',
    currentStock: 2,
    minStock: 5,
    location: 'GMG Warehouse',
    urgency: 'critical',
  },
  {
    id: '2',
    name: 'Safety Helmet Yellow',
    category: 'PPE',
    currentStock: 8,
    minStock: 15,
    location: 'Ground Floor Store',
    urgency: 'warning',
  },
  {
    id: '3',
    name: 'HVAC Filter Cartridge',
    category: 'HVAC',
    currentStock: 12,
    minStock: 20,
    location: '2nd Floor Store',
    urgency: 'low',
  },
  {
    id: '4',
    name: 'Fire Detector Sensor',
    category: 'FAS',
    currentStock: 3,
    minStock: 10,
    location: 'GMG Warehouse',
    urgency: 'critical',
  },
  {
    id: '5',
    name: 'Electrical Wire 2.5mm',
    category: 'LV',
    currentStock: 45,
    minStock: 100,
    location: 'Ground Floor Store',
    urgency: 'warning',
  },
];

export function LowStockAlert() {
  const getUrgencyVariant = (urgency: LowStockItem['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUrgencyColor = (urgency: LowStockItem['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'low':
        return 'text-info';
      default:
        return 'text-muted-foreground';
    }
  };

  const criticalItems = mockLowStockItems.filter(item => item.urgency === 'critical').length;
  const warningItems = mockLowStockItems.filter(item => item.urgency === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Low Stock Alerts
          </div>
          <div className="flex items-center gap-2">
            {criticalItems > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalItems} Critical
              </Badge>
            )}
            {warningItems > 0 && (
              <Badge variant="default" className="text-xs">
                {warningItems} Warning
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockLowStockItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <Package className={`h-4 w-4 ${getUrgencyColor(item.urgency)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground truncate">
                      {item.name}
                    </span>
                    <Badge variant={getUrgencyVariant(item.urgency)} className="text-xs">
                      {item.urgency}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div>{item.category} • {item.location}</div>
                    <div className="mt-1">
                      Stock: <span className={getUrgencyColor(item.urgency)}>{item.currentStock}</span> / Min: {item.minStock}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="ml-3">
                Reorder
              </Button>
            </div>
          ))}
          
          <div className="text-center pt-2">
            <button className="text-sm text-primary hover:underline">
              View all low stock items →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}