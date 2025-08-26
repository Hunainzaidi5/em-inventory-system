import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiPackage, FiMapPin, FiTool, FiUser, FiUsers, FiBriefcase, FiBox, FiDatabase, FiRefreshCw } from "react-icons/fi";

interface IssuedTo {
  name: string;
  olt: string;
  designation: string;
  group: string;
}

interface InventoryItem {
  id?: string;
  itemName: string;
  itemDescription: string;
  itemLocation: string;
  quantity: number;
  issuedTo: IssuedTo;
  lastUpdated?: string;
  isTagged?: boolean; // New field to distinguish tagged/untagged assets
}

const InventoryPage = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tagged" | "untagged">("tagged");
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>({ 
    itemName: "", 
    itemDescription: "", 
    itemLocation: "", 
    quantity: 0, 
    issuedTo: {
      name: "",
      olt: "",
      designation: "",
      group: ""
    },
    isTagged: true
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('inventoryItems');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Add isTagged field to existing items if not present
        const updatedData = parsedData.map((item: InventoryItem) => ({
          ...item,
          isTagged: item.isTagged !== undefined ? item.isTagged : Math.random() > 0.3 // Randomly assign for demo
        }));
        setInventoryItems(updatedData);
      } catch (error) {
        console.error('Error loading Inventory data:', error);
      }
    }
  }, []);

  // Listen to inventory-sync events to reload local data so counts update after requisition.
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('inventoryItems');
      if (saved) {
        try { 
          const parsedData = JSON.parse(saved);
          const updatedData = parsedData.map((item: InventoryItem) => ({
            ...item,
            isTagged: item.isTagged !== undefined ? item.isTagged : Math.random() > 0.3
          }));
          setInventoryItems(updatedData); 
        } catch {}
      }
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  // Handle sorting
  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get filtered items based on active tab
  const getFilteredItems = (data: InventoryItem[]) => {
    let filtered = [...data];
    
    // Filter by tagged/untagged status
    filtered = filtered.filter(item => {
      if (activeTab === "tagged") {
        return item.isTagged === true;
      } else {
        return item.isTagged === false || item.isTagged === undefined;
      }
    });
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.olt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.group.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply group filter
    if (selectedGroup !== "all") {
      filtered = filtered.filter(item => item.issuedTo.group === selectedGroup);
    }
    
    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  const filteredItems = getFilteredItems(inventoryItems);

  // Get unique groups for filter dropdown
  const groups = ["all", ...new Set(inventoryItems.map(item => item.issuedTo.group))];

  // Get stats for current tab
  const getCurrentTabStats = () => {
    const currentTabItems = inventoryItems.filter(item => {
      if (activeTab === "tagged") {
        return item.isTagged === true;
      } else {
        return item.isTagged === false || item.isTagged === undefined;
      }
    });

    return {
      totalItems: currentTabItems.length,
      totalQuantity: currentTabItems.reduce((sum, item) => sum + item.quantity, 0),
      activeUsers: new Set(currentTabItems.map(item => item.issuedTo.name)).size,
      locations: new Set(currentTabItems.map(item => item.itemLocation)).size
    };
  };

  const currentStats = getCurrentTabStats();

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      itemName: "", 
      itemDescription: "", 
      itemLocation: "", 
      quantity: 0, 
      issuedTo: {
        name: "",
        olt: "",
        designation: "",
        group: ""
      },
      isTagged: activeTab === "tagged"
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = inventoryItems.find(item => item.id === id);
    if (item) {
      setForm({
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        itemLocation: item.itemLocation,
        quantity: item.quantity,
        issuedTo: {
          name: item.issuedTo.name,
          olt: item.issuedTo.olt,
          designation: item.issuedTo.designation,
          group: item.issuedTo.group
        },
        isTagged: item.isTagged
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this inventory item?")) {
      setInventoryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim() || form.quantity < 0 || !form.itemLocation.trim()) return;

    const updatedItem = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editId) {
      setInventoryItems(prev => prev.map(item => item.id === editId ? updatedItem : item));
    } else {
      setInventoryItems(prev => [...prev, updatedItem]);
    }

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof InventoryItem) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Refresh data
  const refreshData = () => {
    const savedData = localStorage.getItem('inventoryItems');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const updatedData = parsedData.map((item: InventoryItem) => ({
          ...item,
          isTagged: item.isTagged !== undefined ? item.isTagged : Math.random() > 0.3
        }));
        setInventoryItems(updatedData);
      } catch (error) {
        console.error('Error refreshing Inventory data:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <FiDatabase className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Inventory Management
              </h1>
            </div>
            <p className="text-slate-600 ml-11">Track and manage all inventory items and their assignments</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              className="flex items-center bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FiPlus className="mr-2 w-5 h-5" />
              Add New Inventory Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total Items</h3>
                <p className="text-3xl font-bold text-slate-800">{currentStats.totalItems}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FiDatabase className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total Quantity</h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {currentStats.totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FiPackage className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Active Users</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {currentStats.activeUsers}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Locations</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {currentStats.locations}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiMapPin className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("tagged")}
              className={`px-8 py-5 font-semibold text-sm border-r border-gray-200 transition-all duration-200 ${
                activeTab === "tagged" 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600" 
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === "tagged" ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <span>Tagged Assets</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("untagged")}
              className={`px-8 py-5 font-semibold text-sm transition-all duration-200 ${
                activeTab === "untagged" 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600" 
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === "untagged" ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <span>Untagged Assets</span>
              </div>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">
                  {activeTab === "tagged" ? "Tagged Assets" : "Untagged Assets"}
                </h3>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                {activeTab === "tagged" ? "Assets with proper identification and tracking" : "Assets requiring identification and tagging"}
              </p>
            </div>
            
            {/* Enhanced Search Bar */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inventory items, descriptions, locations, or assigned users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              )}
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2 text-xs text-gray-500">
                    Searching: "{searchTerm}"
                  </div>
                </div>
              )}
            </div>
            
            {/* Group Filter */}
            <div className="w-full lg:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700"
              >
                {groups.map(group => (
                  <option key={group} value={group}>
                    {group === "all" ? "👥 All Groups" : `👥 ${group}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => requestSort('itemName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Item Name</span>
                      <span className="text-slate-400">{getSortIndicator('itemName')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => requestSort('itemDescription')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      <span className="text-slate-400">{getSortIndicator('itemDescription')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => requestSort('itemLocation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Location</span>
                      <span className="text-slate-400">{getSortIndicator('itemLocation')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => requestSort('quantity')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Quantity</span>
                      <span className="text-slate-400">{getSortIndicator('quantity')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200/50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{item.itemName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-xs truncate" title={item.itemDescription}>
                          {item.itemDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <FiMapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{item.itemLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          <div className="font-medium text-slate-900">{item.issuedTo.name}</div>
                          <div className="text-xs text-slate-500">{item.issuedTo.designation}</div>
                          <div className="text-xs text-slate-500">{item.issuedTo.group}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isTagged 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.isTagged ? 'Tagged' : 'Untagged'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(item.id!)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 rounded hover:bg-indigo-50"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id!)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                      {searchTerm || selectedGroup !== "all" 
                        ? "No items match your filters" 
                        : `No ${activeTab} assets found in inventory`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Item Name *</label>
                    <input
                      type="text"
                      value={form.itemName}
                      onChange={(e) => setForm({...form, itemName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={form.itemDescription}
                    onChange={(e) => setForm({...form, itemDescription: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Describe the inventory item and its specifications..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={form.itemLocation}
                    onChange={(e) => setForm({...form, itemLocation: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., Warehouse A, Storage Room B"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Asset Status</label>
                  <select
                    value={form.isTagged ? "tagged" : "untagged"}
                    onChange={(e) => setForm({...form, isTagged: e.target.value === "tagged"})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="tagged">Tagged Asset</option>
                    <option value="untagged">Untagged Asset</option>
                  </select>
                </div>
                
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-md font-medium text-slate-900 mb-4">Assigned To</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={form.issuedTo.name}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, name: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">OLT</label>
                      <input
                        type="text"
                        value={form.issuedTo.olt}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, olt: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={form.issuedTo.designation}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, designation: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Group</label>
                      <input
                        type="text"
                        value={form.issuedTo.group}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, group: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editId ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage; 