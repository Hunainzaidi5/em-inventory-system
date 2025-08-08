import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const COLORS = ["#2563eb", "#22c55e", "#f59e42", "#ef4444", "#a21caf"];

const inventoryData = [
  { name: "Inventory Items", value: 2156 },
  { name: "PPE Items", value: 320 },
  { name: "Faulty Items", value: 60 },
];

const barData = [
  { name: "Inventory", Available: 2156, Faulty: 20 },
  { name: "PPE", Available: 320, Faulty: 25 },
];

const AvailabilityOverview = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Availability Overview</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Inventory Distribution</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={inventoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {inventoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Available vs Faulty</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Available" fill="#22c55e" />
            <Bar dataKey="Faulty" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <li className="p-4 bg-blue-50 rounded">
          <span className="block text-2xl font-bold text-blue-700">2156</span>
          <span className="text-blue-700">Inventory Items</span>
        </li>
        <li className="p-4 bg-orange-50 rounded">
          <span className="block text-2xl font-bold text-orange-700">320</span>
          <span className="text-orange-700">PPE Items</span>
        </li>
      </ul>
    </div>
  </div>
);

export default AvailabilityOverview; 