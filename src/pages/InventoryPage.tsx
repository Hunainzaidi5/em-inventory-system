import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiChevronDown, FiChevronRight, FiRefreshCw } from "react-icons/fi";

interface SparePart {
  id?: string;
  name: string;
  quantity: number;
  location: string;
  lastUpdated?: string;
  itemCode?: string;
  imisCode?: string;
  uom?: string;
  partNumber?: string;
  boqNumber?: string;
}

interface TabData {
  name: string;
  data: SparePart[];
  loading: boolean;
  error: string | null;
}

interface SystemCategory {
  key: string;
  name: string;
  omFile: string;  // O&M JSON file
  pmaFile: string; // PMA JSON file
  type: 'om' | 'pma' | 'both'; // Indicates which tabs this category appears in
}

const InventoryPage = () => {
  const [activeMainTab, setActiveMainTab] = useState("O&M");
  const [activeSubTab, setActiveSubTab] = useState("BAS");
  const [tabData, setTabData] = useState<Record<string, TabData>>({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>({ 
    name: "", 
    quantity: 0, 
    location: "", 
    uom: "", 
    imisCode: "", 
    boqNumber: "",
    itemCode: "",
    partNumber: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SparePart; direction: 'asc' | 'desc' } | null>(null);

  // Define system categories with separate O&M and PMA categories
  const systemCategories: SystemCategory[] = [
    // O&M Categories
    { key: "BAS", name: "BAS", omFile: "om/bas.json", pmaFile: "", type: 'om' },
    { key: "BATTERIES", name: "BATTERIES", omFile: "om/batteries.json", pmaFile: "", type: 'om' },
    { key: "ELEVATOR", name: "ELEVATOR", omFile: "om/elevator.json", pmaFile: "", type: 'om' },
    { key: "ESCALATOR", name: "ESCALATOR", omFile: "om/escalator.json", pmaFile: "", type: 'om' },
    { key: "FAS", name: "FAS", omFile: "om/fas.json", pmaFile: "", type: 'om' },
    { key: "FES", name: "FES", omFile: "om/fes.json", pmaFile: "", type: 'om' },
    { key: "GENERAL_ITEMS", name: "GENERAL ITEMS", omFile: "om/general_items.json", pmaFile: "", type: 'om' },
    { key: "HVAC", name: "HVAC", omFile: "om/hvac.json", pmaFile: "", type: 'om' },
    { key: "ILLUMINATION", name: "ILLUMINATION", omFile: "om/illumination.json", pmaFile: "", type: 'om' },
    { key: "PSD", name: "PSD", omFile: "om/psd.json", pmaFile: "", type: 'om' },
    { key: "WSD", name: "WSD", omFile: "om/wsd.json", pmaFile: "", type: 'om' },
    
    // PMA Categories (keeping the original ones)
    { key: "PMA_BAS", name: "BAS", omFile: "", pmaFile: "pma/bas.json", type: 'pma' },
    { key: "PMA_FAS", name: "FAS", omFile: "", pmaFile: "pma/fas.json", type: 'pma' },
    { key: "PMA_FES", name: "FES", omFile: "", pmaFile: "pma/fes.json", type: 'pma' },
    { key: "PMA_PSCADA", name: "PSCADA", omFile: "", pmaFile: "pma/pscada.json", type: 'pma' },
    { key: "PMA_ELEVATOR", name: "ELEVATOR", omFile: "", pmaFile: "pma/elevator.json", type: 'pma' },
    { key: "PMA_ESCALATOR", name: "ESCALATOR", omFile: "", pmaFile: "pma/escalator.json", type: 'pma' },
    { key: "PMA_PSD", name: "PSD", omFile: "", pmaFile: "pma/psd.json", type: 'pma' },
    { key: "PMA_HVAC", name: "HVAC", omFile: "", pmaFile: "pma/hvac.json", type: 'pma' },
    { key: "PMA_WSD", name: "WSD", omFile: "", pmaFile: "pma/wsd.json", type: 'pma' },
    { key: "PMA_ILLUMINATION", name: "ILLUMINATION", omFile: "", pmaFile: "pma/illumination.json", type: 'pma' }
  ];

  // Get categories for current main tab
  const getCurrentTabCategories = () => {
    return systemCategories.filter(cat => 
      activeMainTab === "O&M" ? cat.type === 'om' : cat.type === 'pma'
    );
  };

  // Update active sub tab when main tab changes
  useEffect(() => {
    const currentCategories = getCurrentTabCategories();
    if (currentCategories.length > 0 && !currentCategories.find(cat => cat.key === activeSubTab)) {
      setActiveSubTab(currentCategories[0].key);
    }
  }, [activeMainTab]);

  // Load data for a specific tab
  const loadTabData = async (tabKey: string, mainTab: string) => {
    const category = systemCategories.find(cat => cat.key === tabKey);
    if (!category) return;

    const tabId = `${mainTab}_${tabKey}`;
    
    setTabData(prev => ({
      ...prev,
      [tabId]: {
        name: category.name,
        data: [],
        loading: true,
        error: null
      }
    }));

    try {
      const fileName = mainTab === "O&M" ? category.omFile : category.pmaFile;
      if (!fileName) {
        throw new Error(`No data file configured for ${mainTab} ${category.name}`);
      }
      
      const response = await fetch(`/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }
      
      const data = await response.json();
      let formattedParts: SparePart[] = [];

      if (category.key === "WSD" || category.key === "PMA_WSD") {
        // Handle WSD structure (array format)
        formattedParts = (data || [])
          .filter((item: any) => item && item["Item_Description"])
          .map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: item["Item_Description"] || "",
            quantity: Number(item["Quantity"]) || 0,
            location: item["Location"] || "C&C Warehouse, Depot",
            itemCode: item["Sr_No"]?.toString() || "",
            imisCode: item["IMIS_Code"] || "",
            uom: item["UOM"] || "",
            partNumber: item["Specification"] || "",
            boqNumber: item["BOQ_No"]?.toString() || "",
            lastUpdated: new Date().toISOString().split('T')[0]
          }));
      } else {
        // Handle other JSON structures
        const key = Object.keys(data)[0];
        const items = data[key] || [];
        
        formattedParts = items
          .filter((item: any) => {
            const inventoryField = item[key + " (Spares Inventory)"] || 
                                item["(Sanitary Items Inventory)"] ||
                                item["PSCADA System - (Spares Inventory)"] ||
                                item["Item Detail"] ||
                                item["Item_Description"] || 
                                item["Item Description"] ||
                                item["Item Name"];
            return item && inventoryField && inventoryField !== "-";
          })
          .map((item: any) => {
            const itemName = item[key + " (Spares Inventory)"] || 
                           item["(Sanitary Items Inventory)"] ||
                           item["PSCADA System - (Spares Inventory)"] ||
                           item["Item Detail"] ||
                           item["Item_Description"] || 
                           item["Item Description"] ||
                           item["Item Name"] || "";

            const quantity = Number(item["Quantity"]) || 
                           Number(item["Current Balance"]) || 
                           Number(item["In-stock"]) || 0;

            const imisCode = item["IMIS Codes"] || 
                           item[" IMIS Codes"] ||
                           item["IMIS Code"] || 
                           item["IMIS_Code"] || 
                           item["IMIS CODE"] || "";

            const uom = item["UOM"] || 
                       item["U/M"] || "";

            const partNumber = item["Part #"] || 
                             item[" Part #"] ||
                             item["Part Number"] || 
                             item["Specification"] || "";

            const boqNumber = item["BOQ #"] || 
                            item[" BOQ #"] ||
                            item["BOQ_No"] || 
                            item["BOQ Number"] || "";

            const serialNumber = item["Sr. #"] || 
                               item[" Sr. #"] ||
                               item["Sr_No"] || 
                               item["Serial Number"] || "";

            return {
              id: Math.random().toString(36).substr(2, 9),
              name: itemName,
              quantity: quantity,
              location: item["Location"] || "C&C Warehouse, Depot",
              itemCode: serialNumber?.toString() || "",
              imisCode: imisCode,
              uom: uom,
              partNumber: partNumber,
              boqNumber: boqNumber?.toString() || "",
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          });
      }

      setTabData(prev => ({
        ...prev,
        [tabId]: {
          name: category.name,
          data: formattedParts,
          loading: false,
          error: null
        }
      }));
    } catch (err) {
      console.error(`Error loading ${tabKey} data for ${mainTab}:`, err);
      setTabData(prev => ({
        ...prev,
        [tabId]: {
          name: category.name,
          data: [],
          loading: false,
          error: `Failed to load ${mainTab} ${category.name} data`
        }
      }));
    }
  };

  // Load data when main tab or sub tab changes
  useEffect(() => {
    if (activeMainTab && activeSubTab) {
      loadTabData(activeSubTab, activeMainTab);
    }
  }, [activeMainTab, activeSubTab]);

  // Handle sorting
  const requestSort = (key: keyof SparePart) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: SparePart[]) => {
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.imisCode && item.imisCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedLocation !== "all") {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
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

  const currentTabId = `${activeMainTab}_${activeSubTab}`;
  const currentTabData = tabData[currentTabId];
  const filteredItems = currentTabData ? getFilteredItems(currentTabData.data) : [];

  // Get unique locations for filter dropdown
  const locations = currentTabData 
    ? ["all", ...new Set(currentTabData.data.map(item => item.location))]
    : ["all"];

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      name: "", 
      quantity: 0, 
      location: "", 
      uom: "", 
      imisCode: "", 
      boqNumber: "",
      itemCode: "",
      partNumber: ""
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = currentTabData?.data.find(item => item.id === id);
    if (item) {
      setForm({
        name: item.name,
        quantity: item.quantity,
        location: item.location,
        uom: item.uom || "",
        imisCode: item.imisCode || "",
        boqNumber: item.boqNumber || "",
        itemCode: item.itemCode || "",
        partNumber: item.partNumber || ""
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      setTabData(prev => ({
        ...prev,
        [currentTabId]: {
          ...prev[currentTabId],
          data: prev[currentTabId].data.filter(item => item.id !== id)
        }
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.quantity < 0 || !form.location.trim()) return;

    const updatedItem = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setTabData(prev => ({
      ...prev,
      [currentTabId]: {
        ...prev[currentTabId],
        data: editId 
          ? prev[currentTabId].data.map(item => item.id === editId ? updatedItem : item)
          : [...prev[currentTabId].data, updatedItem]
      }
    }));

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof SparePart) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Refresh current tab data
  const refreshCurrentTab = () => {
    if (activeMainTab && activeSubTab) {
      loadTabData(activeSubTab, activeMainTab);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Spare Management</h1>
            <p className="text-gray-600">Track and manage your spare parts inventory across all systems</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={refreshCurrentTab}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={currentTabData?.loading}
            >
              <FiRefreshCw className={`mr-2 ${currentTabData?.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus className="mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {currentTabData && !currentTabData.loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 font-medium">Total Items</h3>
              <p className="text-2xl font-bold">{currentTabData.data.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 font-medium">Total Quantity</h3>
              <p className="text-2xl font-bold">
                {currentTabData.data.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 font-medium">Warehouses</h3>
              <p className="text-2xl font-bold">
                {new Set(currentTabData.data.map(item => item.location)).size}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 font-medium">Low Stock Items</h3>
              <p className="text-2xl font-bold text-red-600">
                {currentTabData.data.filter(item => item.quantity < 100).length}
              </p>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          {/* Main Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveMainTab("O&M")}
              className={`px-6 py-4 font-medium text-sm border-r ${
                activeMainTab === "O&M" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              O&M (Operations & Maintenance)
            </button>
            <button
              onClick={() => setActiveMainTab("PMA")}
              className={`px-6 py-4 font-medium text-sm ${
                activeMainTab === "PMA" 
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              PMA (Punjab Mass Transit Authority)
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {getCurrentTabCategories().map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveSubTab(category.key)}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeSubTab === category.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-shrink-0">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeMainTab} - {currentTabData?.name || activeSubTab}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeMainTab === "O&M" ? "Operations & Maintenance Inventory" : "Punjab Mass Transit Authority Inventory"}
                </p>
              </div>
              <div className="relative flex-grow">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </div>
              <div className="w-full md:w-48">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>
                      {loc === "all" ? "All Locations" : loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
          {currentTabData?.loading && (
            <div className="bg-white p-8 rounded-lg shadow mb-6 text-center">
              <FiRefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-600">Loading {currentTabData.name} data...</p>
            </div>
          )}
          
          {currentTabData?.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <FiX className="mr-2" />
                <p>{currentTabData.error}</p>
                <button
                  onClick={refreshCurrentTab}
                  className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          {!currentTabData?.loading && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('name')}
                      >
                        <div className="flex items-center">
                          Item Name {getSortIndicator('name')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IMIS Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BOQ Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UOM
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('quantity')}
                      >
                        <div className="flex items-center">
                          Quantity {getSortIndicator('quantity')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('location')}
                      >
                        <div className="flex items-center">
                          Location {getSortIndicator('location')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.itemCode && (
                              <div className="text-xs text-gray-500">Code: {item.itemCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.imisCode || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.boqNumber || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.partNumber || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.uom || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${
                              item.quantity < 10 ? 'text-red-600 font-bold' : 
                              item.quantity < 100 ? 'text-orange-600 font-medium' : 
                              'text-gray-500'
                            }`}>
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEditModal(item.id!)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleRemove(item.id!)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                          {currentTabData?.error 
                            ? "Failed to load data"
                            : searchTerm || selectedLocation !== "all" 
                              ? "No items match your filters" 
                              : "No items found in inventory"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-lg font-semibold">
                  {editId ? "Edit Inventory Item" : "Add New Inventory Item"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UOM
                    </label>
                    <input
                      name="uom"
                      value={form.uom}
                      onChange={(e) => setForm({ ...form, uom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., PCS, KG, M"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMIS Code
                    </label>
                    <input
                      name="imisCode"
                      value={form.imisCode}
                      onChange={(e) => setForm({ ...form, imisCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="IMIS Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BOQ Number
                    </label>
                    <input
                      name="boqNumber"
                      value={form.boqNumber}
                      onChange={(e) => setForm({ ...form, boqNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="BOQ Number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Code
                    </label>
                    <input
                      name="itemCode"
                      value={form.itemCode}
                      onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Number
                    </label>
                    <input
                      name="partNumber"
                      value={form.partNumber}
                      onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Part Number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editId ? "Save Changes" : "Add Item"}
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