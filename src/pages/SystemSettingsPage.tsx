import React, { useState, useEffect } from "react";
import { 
  Settings, 
  FileText, 
  Trash2, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database,
  Shield,
  Bell,
  Moon,
  Sun,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Globe,
  Lock,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Server,
  Eye,
  EyeOff,
  Filter,
  Search
} from "lucide-react";

const SystemSettingsPage = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [reportType, setReportType] = useState('comprehensive');
  const [lastReportGenerated, setLastReportGenerated] = useState(null);
  const [systemStatus, setSystemStatus] = useState('healthy');
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 67,
    storage: 34,
    network: 89
  });
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'System backup completed', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Security scan initiated', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'Configuration updated', time: '6 hours ago', type: 'warning' },
    { id: 4, action: 'User session expired', time: '8 hours ago', type: 'error' }
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [reportProgress, setReportProgress] = useState(0);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpu: Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        storage: Math.max(20, Math.min(95, prev.storage + (Math.random() - 0.5) * 2)),
        network: Math.max(60, Math.min(100, prev.network + (Math.random() - 0.5) * 15))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportProgress(0);
    
    // Simulate progressive report generation
    const progressInterval = setInterval(() => {
      setReportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    setTimeout(() => {
      setIsGeneratingReport(false);
      setReportProgress(0);
      setLastReportGenerated(new Date().toLocaleString());
      
      // Create and download a more detailed report
      const reportContent = `
SYSTEM REPORT - ${new Date().toLocaleString()}
=====================================

Report Type: ${reportType.toUpperCase()}
System Status: ${systemStatus.toUpperCase()}

PERFORMANCE METRICS:
- CPU Usage: ${systemMetrics.cpu}%
- Memory Usage: ${systemMetrics.memory}%
- Storage Usage: ${systemMetrics.storage}%
- Network Performance: ${systemMetrics.network}%

RECENT ACTIVITIES:
${recentActivities.map(activity => `- ${activity.action} (${activity.time})`).join('\n')}

SYSTEM CONFIGURATION:
- Notifications: ${notifications ? 'Enabled' : 'Disabled'}
- Dark Mode: ${darkMode ? 'Enabled' : 'Disabled'}
- Auto Backup: ${autoBackup ? 'Enabled' : 'Disabled'}
- Maintenance Mode: ${maintenanceMode ? 'Enabled' : 'Disabled'}
- Auto Updates: ${autoUpdates ? 'Enabled' : 'Disabled'}
- Analytics: ${analyticsEnabled ? 'Enabled' : 'Disabled'}

Generated at: ${new Date().toISOString()}
      `.trim();
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${reportType}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Add to recent activities
      setRecentActivities(prev => [{
        id: Date.now(),
        action: `${reportType} report generated`,
        time: 'Just now',
        type: 'success'
      }, ...prev.slice(0, 3)]);
      
    }, 4000);
  };

  const handleClearData = () => {
    setTimeout(() => {
      setShowClearDialog(false);
      setRecentActivities(prev => [{
        id: Date.now(),
        action: 'All system data cleared',
        time: 'Just now',
        type: 'warning'
      }, ...prev.slice(0, 3)]);
    }, 1000);
  };

  const MetricCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-xs text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{trend}%
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{value}%</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                value > 70 ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const typeColors = {
      success: 'bg-green-100 text-green-700 border-green-200',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`w-2 h-2 rounded-full ${
          activity.type === 'success' ? 'bg-green-500' :
          activity.type === 'warning' ? 'bg-yellow-500' :
          activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full border ${typeColors[activity.type]}`}>
          {activity.type}
        </span>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const AdvancedToggle = ({ label, description, value, onChange, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-600" />
        <div>
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-gray-600 text-lg">Advanced system configuration and monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-300">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus === 'healthy' ? 'bg-green-500' :
                systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`} />
              <span className="text-sm font-medium text-gray-700">System {systemStatus}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <TabButton 
            id="overview" 
            label="Overview" 
            icon={BarChart3} 
            isActive={activeTab === 'overview'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="reports" 
            label="Reports" 
            icon={FileText} 
            isActive={activeTab === 'reports'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="data" 
            label="Data Management" 
            icon={Database} 
            isActive={activeTab === 'data'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="security" 
            label="Security" 
            icon={Shield} 
            isActive={activeTab === 'security'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="advanced" 
            label="Advanced" 
            icon={Zap} 
            isActive={activeTab === 'advanced'} 
            onClick={setActiveTab} 
          />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="CPU Usage" 
                value={Math.round(systemMetrics.cpu)} 
                icon={Cpu} 
                color="bg-gradient-to-r from-blue-500 to-blue-600"
                trend={2.1}
              />
              <MetricCard 
                title="Memory" 
                value={Math.round(systemMetrics.memory)} 
                icon={Activity} 
                color="bg-gradient-to-r from-green-500 to-green-600"
                trend={-1.3}
              />
              <MetricCard 
                title="Storage" 
                value={Math.round(systemMetrics.storage)} 
                icon={HardDrive} 
                color="bg-gradient-to-r from-yellow-500 to-yellow-600"
                trend={0.8}
              />
              <MetricCard 
                title="Network" 
                value={Math.round(systemMetrics.network)} 
                icon={Wifi} 
                color="bg-gradient-to-r from-purple-500 to-purple-600"
                trend={5.2}
              />
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {recentActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Advanced Report Generator</h2>
                  <p className="text-gray-600">Generate comprehensive system reports with detailed analytics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Report Configuration
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'comprehensive', label: 'Comprehensive Report', desc: 'Full system analysis with all metrics' },
                        { value: 'performance', label: 'Performance Report', desc: 'Focus on system performance metrics' },
                        { value: 'security', label: 'Security Audit', desc: 'Security vulnerabilities and recommendations' },
                        { value: 'summary', label: 'Executive Summary', desc: 'High-level overview for stakeholders' }
                      ].map(option => (
                        <label key={option.value} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="reportType"
                            value={option.value}
                            checked={reportType === option.value}
                            onChange={(e) => setReportType(e.target.value)}
                            className="mt-1 text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {lastReportGenerated && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Last Report Generated</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">{lastReportGenerated}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {isGeneratingReport && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium text-blue-700">Generating Report...</span>
                      </div>
                      <div className="bg-white rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${reportProgress}%` }}
                        />
                      </div>
                      <p className="text-blue-600 text-sm">{Math.round(reportProgress)}% complete</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Generate & Download Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-50 rounded-lg">
                  <Database className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Data Management</h2>
                  <p className="text-gray-600">Manage system data, backups, and storage</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-semibold text-red-800">Danger Zone</h4>
                        <p className="text-red-700 text-sm">
                          These actions are irreversible and will permanently delete data
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowClearDialog(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All System Data
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Storage Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Database</span>
                        <span>2.4 GB</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Logs</span>
                        <span>890 MB</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cache</span>
                        <span>156 MB</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Security Status</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Firewall</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">SSL Certificate</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">Valid</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700 font-medium">Last Security Scan</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">7 days ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Run Security Scan</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Update Security Policies</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-700">View Audit Logs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Advanced Configuration</h2>
                  <p className="text-gray-600">Fine-tune system behavior and preferences</p>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Preferences</h3>
                  <AdvancedToggle
                    label="Notifications"
                    description="Receive system alerts and updates"
                    value={notifications}
                    onChange={setNotifications}
                    icon={Bell}
                  />
                  <AdvancedToggle
                    label="Dark Mode"
                    description="Switch to dark theme interface"
                    value={darkMode}
                    onChange={setDarkMode}
                    icon={darkMode ? Moon : Sun}
                  />
                  <AdvancedToggle
                    label="Auto Backup"
                    description="Automatically backup system data"
                    value={autoBackup}
                    onChange={setAutoBackup}
                    icon={Database}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
                  <AdvancedToggle
                    label="Maintenance Mode"
                    description="Enable system maintenance mode"
                    value={maintenanceMode}
                    onChange={setMaintenanceMode}
                    icon={Settings}
                  />
                  <AdvancedToggle
                    label="Auto Updates"
                    description="Automatically install system updates"
                    value={autoUpdates}
                    onChange={setAutoUpdates}
                    icon={RefreshCw}
                  />
                  <AdvancedToggle
                    label="Analytics"
                    description="Enable usage analytics and reporting"
                    value={analyticsEnabled}
                    onChange={setAnalyticsEnabled}
                    icon={BarChart3}
                  />
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Developer Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                      <Server className="w-6 h-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">API Debug Mode</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                      <Globe className="w-6 h-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Network Diagnostics</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                      <Activity className="w-6 h-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Performance Monitor</span>
                    </button>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Warning</p>
                        <p className="text-sm text-yellow-700">Developer options may affect system stability. Use with caution.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Clear Data Dialog */}
        {showClearDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Confirm Data Deletion</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• All user data and configurations</li>
                  <li>• System logs and activity history</li>
                  <li>• Generated reports and backups</li>
                  <li>• Custom settings and preferences</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  I understand this action is permanent and irreversible
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearDialog(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8">
          <button className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* System Health Indicator */}
        <div className="fixed bottom-8 left-8">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              systemStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
              systemStatus === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'
            }`} />
            <span className="text-sm font-medium text-gray-700 pr-2">
              {systemStatus === 'healthy' ? 'All Systems Operational' :
               systemStatus === 'warning' ? 'Minor Issues Detected' : 'Critical Issues Found'}
            </span>
          </div>
        </div>

        {/* Background Animation */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SystemSettingsPage;