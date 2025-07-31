import React from "react";

const SystemSettingsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">System Settings</h1>
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Report Generator</h2>
      <p className="text-muted-foreground mb-2">Generate system reports and export data.</p>
      <button className="px-4 py-2 bg-primary text-white rounded">Generate Report</button>
    </div>
    <div>
      <h2 className="text-xl font-semibold mb-2">Clear Data</h2>
      <p className="text-muted-foreground mb-2">Clear all system data (irreversible).</p>
      <button className="px-4 py-2 bg-error text-white rounded">Clear Data</button>
    </div>
  </div>
);

export default SystemSettingsPage; 