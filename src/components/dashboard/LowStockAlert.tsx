import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLowStockItems } from "@/services/inventoryService";
import { stockThresholds } from "@/config/inventorySettings";
import { Skeleton } from "@/components/ui/skeleton";

export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  location: string;
  partNumber?: string;
  lastUpdated?: string;
  averageDailyUsage?: number;
  urgency?: UrgencyLevel;
  percentage?: number;
  daysUntilStockout?: number | null;
}

export type UrgencyLevel = keyof typeof stockThresholds;

interface EnhancedLowStockItem extends LowStockItem {
  urgency: UrgencyLevel;
  percentage: number;
  daysUntilStockout: number | null;
}

// 🔹 Force percentage = 10% always
const calculateUrgency = (
  item: LowStockItem
): Omit<EnhancedLowStockItem, keyof LowStockItem> => {
  const percentage = 0.1; // fixed 10%

  // Calculate days until stockout if we have usage data
  let daysUntilStockout = null;
  if (item.averageDailyUsage && item.averageDailyUsage > 0) {
    daysUntilStockout = Math.floor(item.currentStock / item.averageDailyUsage);
  }

  // Urgency logic stays the same
  let urgency: UrgencyLevel = "LOW";
  if (item.currentStock <= 0) {
    urgency = "CRITICAL";
  } else if (
    percentage <= stockThresholds.CRITICAL.percentage ||
    item.currentStock <= stockThresholds.CRITICAL.minItems ||
    (daysUntilStockout !== null && daysUntilStockout <= 7)
  ) {
    urgency = "CRITICAL";
  } else if (
    percentage <= stockThresholds.WARNING.percentage ||
    item.currentStock <= stockThresholds.WARNING.minItems ||
    (daysUntilStockout !== null && daysUntilStockout <= 14)
  ) {
    urgency = "WARNING";
  }

  return {
    urgency,
    percentage: 10, // 🔹 always return 10%
    daysUntilStockout: daysUntilStockout ?? null,
  };
};

export function LowStockAlert() {
  const { data: lowStockItems, isLoading, error, refetch } = useQuery<
    LowStockItem[],
    Error
  >({
    queryKey: ["low-stock-items"],
    queryFn: getLowStockItems,
    select: (data) =>
      data.map((item) => ({
        ...item,
        ...calculateUrgency(item),
      })) as EnhancedLowStockItem[],
  });

  const getUrgencyVariant = (urgency: UrgencyLevel) => {
    return stockThresholds[urgency]?.color || "secondary";
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case "CRITICAL":
        return "text-error";
      case "WARNING":
        return "text-warning";
      case "LOW":
        return "text-info";
      default:
        return "text-muted-foreground";
    }
  };

  const criticalItems =
    lowStockItems?.filter((item) => item.urgency === "CRITICAL").length || 0;
  const warningItems =
    lowStockItems?.filter((item) => item.urgency === "WARNING").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-warning" />
              <span>Loading Low Stock Alerts</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Error Loading Alerts</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load low stock items. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            Low Stock Alerts
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockItems?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>No low stock items found</p>
              <p className="text-sm">Your inventory levels are looking good!</p>
            </div>
          ) : (
            lowStockItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full bg-${getUrgencyVariant(
                      item.urgency
                    )}/10`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 ${getUrgencyColor(item.urgency)}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} • {item.location}
                      {item.partNumber && ` • ${item.partNumber}`}
                    </p>
                    {item.daysUntilStockout !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Stockout in ~{item.daysUntilStockout} day
                        {item.daysUntilStockout !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.currentStock}
                    <span className="text-muted-foreground">
                      {" "}
                      / {item.minStock}
                    </span>
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getUrgencyColor(item.urgency)}`}
                        style={{ width: `10%` }} // 🔹 fixed at 10%
                      />
                    </div>
                    <span
                      className={`text-xs ${getUrgencyColor(item.urgency)}`}
                    >
                      {stockThresholds[item.urgency]?.label}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              View All
            </Button>
            <button className="text-sm text-primary hover:underline">
              View all low stock items →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
