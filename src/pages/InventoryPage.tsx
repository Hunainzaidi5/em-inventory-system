import { useState } from "react";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SYSTEM_TYPES, ITEM_CATEGORIES, LOCATIONS, ITEM_STATUSES } from "@/lib/constants";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock inventory data
  const mockInventory = [
    {
      id: "1",
      partName: "Elevator Motor Controller",
      partNumber: "EMC-2024-001",
      category: "O&M",
      system: "Elevator",
      location: "GMG Warehouse",
      quantity: 15,
      status: "available",
      unitPrice: 2500,
    },
    {
      id: "2", 
      partName: "Escalator Step Chain",
      partNumber: "ESC-2024-002",
      category: "PMA",
      system: "Escalator",
      location: "Ground Floor Store",
      quantity: 8,
      status: "available", 
      unitPrice: 450,
    },
    {
      id: "3",
      partName: "HVAC Temperature Sensor",
      partNumber: "HTS-2024-003", 
      category: "O&M",
      system: "HVAC",
      location: "2nd Floor Store",
      quantity: 25,
      status: "available",
      unitPrice: 85,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your spare parts inventory</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Part Name</th>
                  <th className="text-left p-4 font-medium">Part Number</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">System</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Quantity</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Unit Price</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{item.partName}</td>
                    <td className="p-4 text-muted-foreground">{item.partNumber}</td>
                    <td className="p-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="p-4">{item.system}</td>
                    <td className="p-4">{item.location}</td>
                    <td className="p-4">{item.quantity}</td>
                    <td className="p-4">
                      <Badge className="status-available">Available</Badge>
                    </td>
                    <td className="p-4">${item.unitPrice}</td>
                    <td className="p-4">
                      <Button variant="outline" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}