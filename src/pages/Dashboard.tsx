import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
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
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Simple Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button className="p-6 bg-card rounded-lg border text-left hover:shadow-lg transition" onClick={() => navigate("/inventory") }>
          <h3 className="text-lg font-semibold">Total Items</h3>
          <p className="text-3xl font-bold">2,847</p>
          <p className="text-sm text-muted-foreground">Across all categories</p>
        </button>
        <button className="p-6 bg-card rounded-lg border text-left hover:shadow-lg transition" onClick={() => navigate("/inventory") }>
          <h3 className="text-lg font-semibold">Available Items</h3>
          <p className="text-3xl font-bold">2,156</p>
          <p className="text-sm text-muted-foreground">Ready for use</p>
        </button>
        <button className="p-6 bg-card rounded-lg border text-left hover:shadow-lg transition" onClick={() => navigate("/tools") }>
          <h3 className="text-lg font-semibold">Issued Items</h3>
          <p className="text-3xl font-bold">542</p>
          <p className="text-sm text-muted-foreground">Currently in use</p>
        </button>
        <button className="p-6 bg-card rounded-lg border text-left hover:shadow-lg transition" onClick={() => navigate("/faulty-returns") }>
          <h3 className="text-lg font-semibold">Faulty Items</h3>
          <p className="text-3xl font-bold">60</p>
          <p className="text-sm text-muted-foreground">Need attention</p>
        </button>
      </div>

      {/* Welcome Message */}
      <div className="p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Welcome to E&M Inventory Management System</h2>
        <p className="text-muted-foreground">
          This is your central dashboard for managing inventory, tools, PPE, and all related items.
          Use the sidebar navigation to access different sections of the system.
        </p>
      </div>
    </div>
  );
}