import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Package, AlertTriangle, Shield, TrendingUp, Eye, Filter } from "lucide-react";
import statsService from '@/services/statsService';

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Will be populated live
const initialInventoryData = [
  { name: "Inventory Items", value: 0, color: "#6366f1" },
  { name: "PPE Items", value: 0, color: "#10b981" },
  { name: "Faulty Items", value: 0, color: "#ef4444" },
];

const initialBarData = [
  { name: "Inventory", Available: 0, Faulty: 0, total: 0 },
  { name: "PPE", Available: 0, Faulty: 0, total: 0 },
];

const trendData = [
  { month: "Jan", inventory: 2100, ppe: 300 },
  { month: "Feb", inventory: 2050, ppe: 310 },
  { month: "Mar", inventory: 2200, ppe: 315 },
  { month: "Apr", inventory: 2156, ppe: 320 },
];

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  iconColor = 'text-white',
  iconBg = 'bg-white/20',
  textColor = 'text-white',
  subtitleColor = 'text-white/80',
  trend,
  trendUp = true
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  iconColor?: string;
  iconBg?: string;
  textColor?: string;
  subtitleColor?: string;
  trend?: string;
  trendUp?: boolean;
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBg} backdrop-blur-sm group-hover:opacity-90 transition-all duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          {trend && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              trendUp 
                ? 'bg-green-500/20 text-green-100' 
                : 'bg-red-500/20 text-red-100'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trendUp ? 'text-green-300' : 'text-red-300 rotate-180'}`} />
              {trend}
            </span>
          )}
        </div>
        <div className={textColor}>
          <div className="text-3xl font-bold mb-1">
            {animatedValue.toLocaleString()}
          </div>
          <div className={`font-medium ${textColor}`}>{title}</div>
          {subtitle && (
            <div className={`text-sm mt-1 ${subtitleColor}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, actions }: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <div className="card-surface-dark rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
    <div className="p-6 border-b border-gray-200 bg-white/50">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
    <div className="p-6 text-gray-700">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-600">{entry.dataKey}:</span>
            <span className="font-semibold text-gray-900">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AvailabilityOverview = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [animationKey, setAnimationKey] = useState(0);
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [barData, setBarData] = useState(initialBarData);

  const loadStats = async () => {
    try {
      const counts = await statsService.getDashboardCounts();
      const inv = counts.inventoryItemsTotalQuantity + counts.sparePartsTotalQuantity + counts.toolsTotalQuantity + counts.generalToolsTotalQuantity;
      const ppe = counts.ppeTotalQuantity;
      const faulty = counts.faultyItemsCount;
      setInventoryData([
        { name: 'Inventory Items', value: inv, color: '#6366f1' },
        { name: 'PPE Items', value: ppe, color: '#10b981' },
        { name: 'Faulty Items', value: faulty, color: '#ef4444' },
      ]);
      setBarData([
        { name: 'Inventory', Available: inv, Faulty: Math.min(faulty, inv), total: inv + Math.min(faulty, inv) },
        { name: 'PPE', Available: ppe, Faulty: Math.max(0, faulty - Math.min(faulty, inv)), total: ppe + Math.max(0, faulty - Math.min(faulty, inv)) },
      ]);
    } catch {}
  };

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [selectedView]);

  useEffect(() => {
    loadStats();
    const handler = () => loadStats();
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, []);

  const totalItems = inventoryData.reduce((sum, item) => sum + (item.value || 0), 0);
  const faultyCount = (inventoryData.find(i => i.name === 'Faulty Items')?.value || 0);
  const healthScore = totalItems > 0 ? Math.max(0, Math.round(((totalItems - faultyCount) / totalItems) * 100)) : 100;

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
                Inventory Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Real-time availability and performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedView === 'overview' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setSelectedView('trends')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedView === 'trends' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Trends
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Package}
            title="Total Inventory"
            value={inventoryData.find(i => i.name === 'Inventory Items')?.value || 0}
            subtitle="Items in stock"
            color="from-blue-600 to-blue-800"
            iconColor="text-blue-100"
            iconBg="bg-blue-500/20"
            textColor="text-white"
            subtitleColor="text-gray-200"
            trend="+5.2%"
            trendUp={true}
          />
          <StatCard
            icon={Shield}
            title="PPE Equipment"
            value={inventoryData.find(i => i.name === 'PPE Items')?.value || 0}
            subtitle="Safety items"
            color="from-emerald-600 to-emerald-800"
            iconColor="text-emerald-100"
            iconBg="bg-emerald-500/20"
            textColor="text-white"
            subtitleColor="text-gray-200"
            trend="+2.1%"
            trendUp={true}
          />
          <StatCard
            icon={AlertTriangle}
            title="Faulty Items"
            value={faultyCount}
            subtitle="Needs attention"
            color="from-amber-500 to-amber-700"
            iconColor="text-amber-100"
            iconBg="bg-amber-500/20"
            textColor="text-white"
            subtitleColor="text-gray-200"
            trend="-1.3%"
            trendUp={false}
          />
          <StatCard
            icon={TrendingUp}
            title="Health Score"
            value={healthScore}
            subtitle="System efficiency"
            color="from-red-600 to-red-600"
            iconColor="text-red-100"
            iconBg="bg-red-500/20"
            textColor="text-white"
            subtitleColor="text-gray-200"
            trend="+0.8%"
            trendUp={true}
          />
        </div>

        {selectedView === 'overview' && (
          <div key={`overview-${animationKey}`} className="text-gray-700 grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart */}
            <ChartCard 
              title="Inventory Distribution"
              actions={[
                <button key="filter" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Filter className="w-5 h-5 text-gray-700" />
                </button>
              ]}
            >
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie 
                    data={inventoryData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={120} 
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Bar Chart */}
            <ChartCard title="Available vs Faulty Items">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} barGap={10}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
                  <Legend />
                  <Bar 
                    dataKey="Available" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar 
                    dataKey="Faulty" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    animationBegin={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {selectedView === 'trends' && (
          <div key={`trends-${animationKey}`} className="grid grid-cols-1 gap-8 mb-8">
            <ChartCard title="Inventory Trends Over Time">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="inventoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="ppeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inventory"
                    stroke="#6366f1"
                    fill="url(#inventoryGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ppe"
                    stroke="#10b981"
                    fill="url(#ppeGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-surface-dark rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-transparent group-hover:bg-blue-600 transition-colors">
                <Package className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">98.1%</div>
                <div className="text-sm text-gray-600">Availability</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold text-gray-900">2,156</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{width: '98.1%'}}></div>
              </div>
            </div>
          </div>

          <div className="card-surface-dark rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-transparent group-hover:bg-yellow-500 transition-colors">
                <Shield className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">92.8%</div>
                <div className="text-sm text-gray-600">PPE Ready</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PPE Items</span>
                <span className="font-semibold text-gray-900">320</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full transition-all duration-1000" style={{width: '92.8%'}}></div>
              </div>
            </div>
          </div>

          <div className="card-surface-dark rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-transparent group-hover:bg-red-600 transition-colors">
                <AlertTriangle className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">2.4%</div>
                <div className="text-sm text-gray-600">Faulty Rate</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Issues</span>
                <span className="font-semibold text-red-600">6</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full transition-all duration-1000" style={{width: '2.4%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AvailabilityOverview;