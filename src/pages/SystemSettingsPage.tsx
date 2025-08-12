import React, { useState } from 'react';
import { Settings, Download, Trash2, AlertTriangle, CheckCircle, FileText, Database, Shield, Bell } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 
          notification.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'warning' && <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          </div>
          <p className="text-gray-600">Manage system reports and data maintenance</p>
        </div>

        <div className="grid gap-6">
          {/* Report Generator Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Report Generator</h2>
              </div>
              <p className="text-blue-100 mt-1">Generate comprehensive system reports</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'full', label: 'Full Report', desc: 'Complete system overview' },
                    { value: 'security', label: 'Security', desc: 'Security-focused analysis' },
                    { value: 'performance', label: 'Performance', desc: 'Performance metrics' }
                  ].map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setReportType(type.value)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        reportType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-medium ${reportType === type.value ? 'text-blue-700' : 'text-gray-900'}`}>
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                  isGeneratingReport
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                } text-white`}
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">System Maintenance</h2>
              </div>
              <p className="text-purple-100 mt-1">Optimize performance and manage resources</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cache Optimization */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-800">Cache Optimization</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-4">Clear temporary files and optimize system cache for better performance</p>
                  <button
                    onClick={() => {
                      setIsGeneratingReport(true);
                      setTimeout(() => {
                        setIsGeneratingReport(false);
                        showNotification('Cache optimized successfully! System performance improved.');
                      }, 1500);
                    }}
                    disabled={isGeneratingReport}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Optimize Cache
                  </button>
                </div>

                {/* System Cleanup */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-800">System Cleanup</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">Remove old logs and unused files to free up storage space</p>
                  <button
                    onClick={() => {
                      setIsGeneratingReport(true);
                      setTimeout(() => {
                        setIsGeneratingReport(false);
                        showNotification('System cleanup completed! 2.3 GB of storage freed.');
                      }, 2000);
                    }}
                    disabled={isGeneratingReport}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Run Cleanup
                  </button>
                </div>
              </div>

              {/* Advanced Maintenance */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800">Complete System Reset</h3>
                      <p className="text-amber-700 text-sm mt-1">Reset all system settings to factory defaults</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="py-2 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
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

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm System Reset</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              This will reset all system settings to factory defaults and clear all configuration data. This action cannot be undone.
            </p>
            
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-2">This will reset:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                <li>System preferences and configurations</li>
                <li>User interface customizations</li>
                <li>Application settings and cache</li>
                <li>All temporary and log files</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearData}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;