import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("spare-parts-OM");
  const [tabData, setTabData] = useState<Record<string, TabData>>({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>({ name: "", quantity: 0, location: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SparePart; direction: 'asc' | 'desc' } | null>(null);

  // Define the JSON files to load
  const jsonFiles = [
    { key: "spare-parts-OM", name: "O&M Spare Parts", file: "spare-parts-OM.json" },
    { key: "BAS", name: "BAS", file: "bas.json" },
    { key: "FAS", name: "FAS", file: "fas.json" },
    { key: "ESCALATOR", name: "Escalator", file: "escalator.json" },
    { key: "ELEVATOR", name: "Elevator", file: "elevator.json" },
    { key: "FES", name: "FES", file: "fes.json" },
    { key: "HVAC", name: "HVAC", file: "hvac.json" },
    { key: "ILLUMINATION", name: "Illumination", file: "illumination.json" },
    { key: "PSCADA", name: "PSCADA", file: "pscada.json" },
    { key: "PSD", name: "PSD", file: "psd.json" },
    { key: "SANITARY", name: "Sanitary", file: "sanitry.json" },
    { key: "WSD", name: "WSD", file: "wsd.json" }
  ];

  // Load data from JSON files
  useEffect(() => {
    const loadAllData = async () => {
      const newTabData: Record<string, TabData> = {};

      for (const fileInfo of jsonFiles) {
        newTabData[fileInfo.key] = {
          name: fileInfo.name,
          data: [],
          loading: true,
          error: null
        };

        try {
          const response = await fetch(`/${fileInfo.file}`);
          if (!response.ok) throw new Error(`Failed to load ${fileInfo.file}`);
          const data = await response.json();
          
          let formattedParts: SparePart[] = [];

          // Handle different JSON structures
          if (fileInfo.key === "spare-parts-OM") {
            // Handle the O&M spare parts structure
            formattedParts = (data || [])
              .filter((item: any) => item && item["Item Name"] && item["Item Name"] !== "Item Name")
              .map((item: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: item["Item Name"] || "",
                quantity: Number(item["In-stock"]) || 0,
                location: item["Location"] || "C&C Warehouse, Depot",
                itemCode: item["Item Code (Brand)"] || "",
                imisCode: item["IMIS CODE"] || "",
                uom: item["U/M"] || "",
                lastUpdated: new Date().toISOString().split('T')[0]
              }));
          } else if (fileInfo.key === "WSD") {
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
          } else if (fileInfo.key === "SANITARY") {
            // Handle Sanitary structure (key is "sanitary" lowercase)
            const items = data["sanitary"] || [];
            formattedParts = items
              .filter((item: any) => item && item["(Sanitary Items Inventory)"])
              .map((item: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: item["(Sanitary Items Inventory)"] || "",
                quantity: Number(item["Current Balance"]) || 0,
                location: item["Location"] || "C&C Warehouse, Depot",
                itemCode: item["Sr. #"]?.toString() || "",
                imisCode: item["IMIS Codes"] || "",
                uom: item["UOM"] || "",
                partNumber: item["Part #"] || "",
                boqNumber: item["BOQ #"]?.toString() || "",
                lastUpdated: new Date().toISOString().split('T')[0]
              }));
          } else {
            // Handle other JSON structures (BAS, FAS, HVAC, etc.)
            const key = Object.keys(data)[0]; // Get the first key (e.g., "BAS", "Escalator", "HVAC")
            const items = data[key] || [];
            
            formattedParts = items
              .filter((item: any) => {
                // Check for the inventory field with different possible names
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
                // Get the item name from various possible field names
                const itemName = item[key + " (Spares Inventory)"] || 
                               item["(Sanitary Items Inventory)"] ||
                               item["PSCADA System - (Spares Inventory)"] ||
                               item["Item Detail"] ||
                               item["Item_Description"] || 
                               item["Item Description"] ||
                               item["Item Name"] || "";

                // Get quantity from various possible field names
                const quantity = Number(item["Current Balance"]) || 
                               Number(item["Quantity"]) || 
                               Number(item["In-stock"]) || 0;

                // Get IMIS code from various possible field names (including with leading spaces)
                const imisCode = item["IMIS Codes"] || 
                               item[" IMIS Codes"] || // Note the leading space in BAS
                               item["IMIS Code"] || 
                               item["IMIS_Code"] || 
                               item["IMIS CODE"] || "";

                // Get UOM from various possible field names
                const uom = item["UOM"] || 
                           item["U/M"] || 
                           item["UOM"] || "";

                // Get part number from various possible field names (including with leading spaces)
                const partNumber = item["Part #"] || 
                                 item[" Part #"] || // Note the leading space in BAS
                                 item["Part Number"] || 
                                 item["Specification"] || "";

                // Get BOQ number from various possible field names (including with leading spaces)
                const boqNumber = item["BOQ #"] || 
                                item[" BOQ #"] || // Note the leading space in BAS
                                item["BOQ_No"] || 
                                item["BOQ Number"] || "";

                // Get serial number from various possible field names (including with leading spaces)
                const serialNumber = item["Sr. #"] || 
                                   item[" Sr. #"] || // Note the leading space in BAS
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

          newTabData[fileInfo.key] = {
            name: fileInfo.name,
            data: formattedParts,
            loading: false,
            error: null
          };
        } catch (err) {
          console.error(`Error loading ${fileInfo.file}:`, err);
          newTabData[fileInfo.key] = {
            name: fileInfo.name,
            data: [],
            loading: false,
            error: `Failed to load ${fileInfo.name} data`
          };
        }
      }

      setTabData(newTabData);
    };

    loadAllData();
  }, []);

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
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.imisCode && item.imisCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter(item => item.location === selectedLocation);
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

  const currentTabData = tabData[activeTab];
  const filteredItems = currentTabData ? getFilteredItems(currentTabData.data) : [];

  // Get unique locations for filter dropdown
  const locations = currentTabData 
    ? ["all", ...new Set(currentTabData.data.map(item => item.location))]
    : ["all"];

  // Modal handlers
  const openAddModal = () => {
    setForm({ name: "", quantity: 0, location: "" });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = currentTabData?.data.find(item => item.id === id);
    if (item) {
      setForm({
        name: item.name,
        quantity: item.quantity,
        location: item.location
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      setTabData(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          data: prev[activeTab].data.filter(item => item.id !== id)
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
      [activeTab]: {
        ...prev[activeTab],
        data: editId 
          ? prev[activeTab].data.map(item => item.id === editId ? updatedItem : item)
          : [...prev[activeTab].data, updatedItem]
      }
    }));

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof SparePart) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-gray-600">Track and manage your spare parts inventory across all systems</p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New Item
          </button>
        </div>

        {/* Stats Cards */}
        {currentTabData && (
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 mb-6">
            {jsonFiles.map((fileInfo) => (
              <TabsTrigger 
                key={fileInfo.key} 
                value={fileInfo.key}
                className="text-xs px-2 py-1"
              >
                {fileInfo.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {jsonFiles.map((fileInfo) => (
            <TabsContent key={fileInfo.key} value={fileInfo.key}>
              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
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
              {tabData[fileInfo.key]?.loading && (
                <div className="bg-white p-4 rounded-lg shadow mb-6 text-center">
                  <p>Loading {fileInfo.name} data...</p>
                </div>
              )}
              {tabData[fileInfo.key]?.error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                  <p>{tabData[fileInfo.key].error}</p>
                </div>
              )}

              {/* Inventory Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort('name')}
                        >
                          <div className="flex items-center">
                            Item Name {getSortIndicator('name')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => requestSort('quantity')}
                        >
                          <div className="flex items-center">
                            Quantity {getSortIndicator('quantity')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IMIS Code
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                              {item.partNumber && (
                                <div className="text-xs text-gray-500">Part #: {item.partNumber}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${item.quantity < 100 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                {item.quantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.uom}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.imisCode}</div>
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
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            {searchTerm || selectedLocation !== "all" 
                              ? "No items match your filters" 
                              : "No items in inventory"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
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