import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";

interface SparePart {
  id?: string;
  name: string;
  quantity: number;
  location: string;
  lastUpdated?: string;
}

const sampleSpareParts: SparePart[] = [
  {
    name: "Cable 1.5 mm / Single Core 450/750-Volt (Red)",
    quantity: 805,
    location: "Warehouse A",
    lastUpdated: "2023-05-15"
  },
  {
    name: "Cable 10 mm / Single Core 450/750-V (Red)",
    quantity: 1000,
    location: "Warehouse B",
    lastUpdated: "2023-06-20"
  },
  {
    name: "Cable 2.5 mm / Single Core 450/750-V (Green)",
    quantity: 1000,
    location: "Warehouse A",
    lastUpdated: "2023-07-10"
  },
  {
    name: "Cable 4.0 mm / Single Core (Yellow)",
    quantity: 1000,
    location: "Warehouse C",
    lastUpdated: "2023-08-05"
  },
  {
    name: "Alken CH Cool",
    quantity: 120,
    location: "Warehouse D",
    lastUpdated: "2023-09-12"
  },
  {
    name: "Descaler SP-100",
    quantity: 450,
    location: "Warehouse B",
    lastUpdated: "2023-10-18"
  },
  {
    name: "Rust Remover WD40 (Multi Use)",
    quantity: 120,
    location: "Warehouse A",
    lastUpdated: "2023-11-22"
  }
];

const InventoryPage = () => {
  const [spareParts, setSpareParts] = useState<SparePart[]>(sampleSpareParts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>({ name: "", quantity: 0, location: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SparePart; direction: 'asc' | 'desc' } | null>(null);

  // Load data from API/JSON
  useEffect(() => {
    const loadSpareParts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/spare-parts-OM.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        
        const formattedParts = (data["O&M Spare Part"] || [])
          .filter((item: any) => item?.Column2 && item.Column2 !== "Item Name")
          .map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: item.Column2,
            quantity: Number(item.Column9) || 0,
            location: item.location || "Warehouse A",
            lastUpdated: new Date().toISOString().split('T')[0]
          }));
        
        if (formattedParts.length) setSpareParts(formattedParts);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Using sample data.');
        setLoading(false);
      }
    };
    loadSpareParts();
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
  const getFilteredItems = () => {
    let filtered = [...spareParts];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const filteredItems = getFilteredItems();

  // Get unique locations for filter dropdown
  const locations = ["all", ...new Set(spareParts.map(item => item.location))];

  // Modal handlers
  const openAddModal = () => {
    setForm({ name: "", quantity: 0, location: "" });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = spareParts.find(item => item.id === id);
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
      setSpareParts(prev => prev.filter(item => item.id !== id));
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

    setSpareParts(prev => 
      editId 
        ? prev.map(item => item.id === editId ? updatedItem : item)
        : [...prev, updatedItem]
    );

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
            <p className="text-gray-600">Track and manage your spare parts inventory</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Items</h3>
            <p className="text-2xl font-bold">{spareParts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Quantity</h3>
            <p className="text-2xl font-bold">
              {spareParts.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Warehouses</h3>
            <p className="text-2xl font-bold">
              {new Set(spareParts.map(item => item.location)).size}
            </p>
          </div>
        </div>

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
        {loading && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 text-center">
            <p>Loading inventory data...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('location')}
                  >
                    <div className="flex items-center">
                      Location {getSortIndicator('location')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('lastUpdated')}
                  >
                    <div className="flex items-center">
                      Last Updated {getSortIndicator('lastUpdated')}
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${item.quantity < 100 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.lastUpdated}</div>
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
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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