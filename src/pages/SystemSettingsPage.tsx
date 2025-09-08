import React, { useState } from 'react';
import { Settings, Download, Trash2, AlertTriangle, CheckCircle, FileText, Database, Shield, Bell } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

const SystemSettingsPage = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [reportType, setReportType] = useState('full');
  const [dataCategories, setDataCategories] = useState({
    userProfiles: true,
    analytics: true,
    logs: false,
    cache: true
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create and download a mock report
    const reportData = {
      timestamp: new Date().toISOString(),
      type: reportType,
      systemInfo: {
        version: '2.1.4',
        uptime: '127 days',
        users: 1247,
        storage: '78.2 GB'
      },
      categories: Object.entries(dataCategories)
        .filter(([_, included]) => included)
        .map(([category]) => category)
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsGeneratingReport(false);
    showNotification('Report generated and downloaded successfully!');
  };

  const clearData = async () => {
    const selectedCategories = Object.entries(dataCategories)
      .filter(([_, selected]) => selected)
      .map(([category]) => category);
    
    if (selectedCategories.length === 0) {
      showNotification('Please select at least one data category to clear.', 'warning');
      return;
    }
    
    // Simulate data clearing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setShowClearConfirm(false);
    setDataCategories({
      userProfiles: false,
      analytics: false,
      logs: false,
      cache: false
    });
    showNotification(`Cleared ${selectedCategories.length} data categories successfully!`);
  };

  const handleDataCategoryChange = (category) => {
    setDataCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Color definitions based on the base color #e1d4b1
  const colorPalette = {
    base: '#e1d4b1',
    baseLight: '#f0e9d9',
    baseLighter: '#f8f5ed',
    baseDark: '#c9b98d',
    baseDarker: '#b19f77',
    text: '#2d2a24',
    textLight: '#5a5343',
    accent: '#8b7c5a',
    accentDark: '#6b6149',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-[#f8f5ed] via-[#f0e9d9] to-[#e8e0c9] p-8 mx-auto" style={{ maxWidth: '125rem' }}>
        {/* Notification */}
        {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 transform hover:scale-105 ${
            notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' : 
            notification.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' : 
            'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {notification.type === 'success' && <CheckCircle size={20} className="text-white" />}
          {notification.type === 'warning' && <AlertTriangle size={20} className="text-white" />}
          <span className="font-medium">{notification.message}</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#e8e0c9] rounded-lg shadow-sm">
              <Settings className="w-6 h-6 text-[#6b6149]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2d2a24]">System Settings</h1>
          </div>
          <p className="text-[#5a5343]">Manage system reports and data maintenance</p>
        </div>

        <div className="grid gap-6">
          {/* Report Generator Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/50">
            <div className="px-6 py-4 border-b border-[#e1d4b1] bg-white/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#e1d4b1] rounded-lg">
                  <FileText className="w-5 h-5 text-[#6b6149]" />
                </div>
                <h2 className="text-xl font-semibold text-[#2d2a24]">Report Generator</h2>
              </div>
              <p className="text-[#5a5343] mt-1">Generate comprehensive system reports</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'full', label: 'Full Report', desc: 'Complete system overview', color: 'from-blue-600 to-blue-800' },
                    { value: 'security', label: 'Security', desc: 'Security-focused analysis', color: 'from-emerald-600 to-emerald-800' },
                    { value: 'performance', label: 'Performance', desc: 'Performance metrics', color: 'from-amber-500 to-amber-700' }
                  ].map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setReportType(type.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        reportType === type.value
                          ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-md`
                          : 'bg-white/80 border-[#e1d4b1] hover:border-[#b19f77] hover:shadow-sm'
                      }`}
                    >
                      <div className={`font-medium ${reportType === type.value ? 'text-white' : 'text-[#2d2a24]'}`}>
                        {type.label}
                      </div>
                      <div className={`text-sm mt-1 ${reportType === type.value ? 'text-white/90' : 'text-[#5a5343]'}`}>{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                  isGeneratingReport
                    ? 'bg-[#e1d4b1] cursor-not-allowed text-[#6b6149]'
                    : 'bg-gradient-to-r from-[#8b7c5a] to-[#6b6149] hover:from-[#7a6d4f] hover:to-[#5a5343] hover:shadow-lg transform hover:-translate-y-0.5 text-white'
                }`}
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Generate & Download Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Maintenance Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/50">
            <div className="px-6 py-4 border-b border-[#e1d4b1] bg-white/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#e1d4b1] rounded-lg">
                  <Shield className="w-5 h-5 text-[#6b6149]" />
                </div>
                <h2 className="text-xl font-semibold text-[#2d2a24]">System Maintenance</h2>
              </div>
              <p className="text-[#5a5343] mt-1">Optimize performance and manage resources</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cache Optimization */}
                <div className="bg-white/80 p-6 rounded-2xl border border-[#e1d4b1] hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#e1d4b1] rounded-lg">
                      <Database className="w-5 h-5 text-[#6b6149]" />
                    </div>
                    <h3 className="font-semibold text-[#2d2a24]">Cache Optimization</h3>
                  </div>
                  <p className="text-[#5a5343] text-sm mb-4">Clear temporary files and optimize system cache for better performance</p>
                  <button
                    onClick={() => {
                      setIsGeneratingReport(true);
                      setTimeout(() => {
                        setIsGeneratingReport(false);
                        showNotification('Cache optimized successfully! System performance improved.');
                      }, 1500);
                    }}
                    disabled={isGeneratingReport}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      'Optimize Cache'
                    )}
                  </button>
                </div>

                {/* System Cleanup */}
                <div className="bg-white/80 p-6 rounded-2xl border border-[#e1d4b1] hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#e1d4b1] rounded-lg">
                      <Bell className="w-5 h-5 text-[#6b6149]" />
                    </div>
                    <h3 className="font-semibold text-[#2d2a24]">System Cleanup</h3>
                  </div>
                  <p className="text-[#5a5343] text-sm mb-4">Remove old logs and unused files to free up storage space</p>
                  <button
                    onClick={() => {
                      setIsGeneratingReport(true);
                      setTimeout(() => {
                        setIsGeneratingReport(false);
                        showNotification('System cleanup completed! 2.3 GB of storage freed.');
                      }, 2000);
                    }}
                    disabled={isGeneratingReport}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      'Run Cleanup'
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced Maintenance */}
              <div className="bg-gradient-to-r from-white/90 to-[#f8f5ed] p-6 rounded-2xl border border-[#e1d4b1] shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2d2a24]">Complete System Reset</h3>
                      <p className="text-amber-700 text-sm mt-1">Reset all system settings to factory defaults</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md"
                  >
                    <Trash2 size={16} />
                    Reset System
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#2d2a24]">Confirm System Reset</h3>
            </div>
            
            <p className="text-[#5a5343] mb-6">
              This will reset all system settings to factory defaults and clear all configuration data. This action cannot be undone.
            </p>
            
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm font-medium text-red-700 mb-2">This will reset:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                <li>System preferences and configurations</li>
                <li>User interface customizations</li>
                <li>Application settings and cache</li>
                <li>All temporary and log files</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-[#e1d4b1] bg-white hover:bg-gray-50 rounded-lg font-medium text-[#5a5343] transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={clearData}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default SystemSettingsPage;