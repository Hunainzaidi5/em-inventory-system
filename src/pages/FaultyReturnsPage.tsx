import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";

interface FaultyReturn {
  id?: string;
  itemName: string;
  boqNumber: string;
  partNumber: string;
  uom: string;
  quantity: number;
  usedAgainst: string;
  pickUpLocation: string;
  storageLocation: string;
  lastUpdated?: string;
}

const FaultyReturnsPage = () => {
  const [faultyReturns, setFaultyReturns] = useState<FaultyReturn[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FaultyReturn, 'id'>>({ 
    itemName: "", 
    boqNumber: "", 
    partNumber: "", 
    uom: "", 
    quantity: 0, 
    usedAgainst: "", 
    pickUpLocation: "", 
    storageLocation: "" 
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPickUpLocation, setSelectedPickUpLocation] = useState("all");
  const [selectedStorageLocation, setSelectedStorageLocation] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof FaultyReturn; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('faultyReturns');
    if (savedData) {
      try {
        setFaultyReturns(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading faulty returns data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('faultyReturns', JSON.stringify(faultyReturns));
  }, [faultyReturns]);

  // Handle sorting
  const requestSort = (key: keyof FaultyReturn) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: FaultyReturn[]) => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.boqNumber && item.boqNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.usedAgainst && item.usedAgainst.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply pick-up location filter
    if (selectedPickUpLocation !== "all") {
      filtered = filtered.filter(item => item.pickUpLocation === selectedPickUpLocation);
    }

    // Apply storage location filter
    if (selectedStorageLocation !== "all") {
      filtered = filtered.filter(item => item.storageLocation === selectedStorageLocation);
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

  const filteredItems = getFilteredItems(faultyReturns);

  // Get unique locations for filter dropdowns
  const pickUpLocations = ["all", ...new Set(faultyReturns.map(item => item.pickUpLocation))];
  const storageLocations = ["all", ...new Set(faultyReturns.map(item => item.storageLocation))];

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      itemName: "", 
      boqNumber: "", 
      partNumber: "", 
      uom: "", 
      quantity: 0, 
      usedAgainst: "", 
      pickUpLocation: "", 
      storageLocation: "" 
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = faultyReturns.find(item => item.id === id);
    if (item) {
      setForm({
        itemName: item.itemName,
        boqNumber: item.boqNumber,
        partNumber: item.partNumber,
        uom: item.uom,
        quantity: item.quantity,
        usedAgainst: item.usedAgainst,
        pickUpLocation: item.pickUpLocation,
        storageLocation: item.storageLocation
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this faulty return?")) {
      setFaultyReturns(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim() || form.quantity < 0 || !form.pickUpLocation.trim() || !form.storageLocation.trim()) return;

    const updatedItem = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editId) {
      setFaultyReturns(prev => prev.map(item => item.id === editId ? updatedItem : item));
    } else {
      setFaultyReturns(prev => [...prev, updatedItem]);
    }

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof FaultyReturn) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Faulty Returns Management</h1>
            <p className="text-gray-600">Track and manage faulty returns and their locations</p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New Faulty Return
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Faulty Returns</h3>
            <p className="text-2xl font-bold">{faultyReturns.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Quantity</h3>
            <p className="text-2xl font-bold">
              {faultyReturns.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Pick-up Locations</h3>
            <p className="text-2xl font-bold">
              {new Set(faultyReturns.map(item => item.pickUpLocation)).size}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Storage Locations</h3>
            <p className="text-2xl font-bold">
              {new Set(faultyReturns.map(item => item.storageLocation)).size}
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
                placeholder="Search items, BOQ numbers, part numbers, or fault descriptions..."
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
                value={selectedPickUpLocation}
                onChange={(e) => setSelectedPickUpLocation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {pickUpLocations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All Pick-up Locations" : loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedStorageLocation}
                onChange={(e) => setSelectedStorageLocation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {storageLocations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All Storage Locations" : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Faulty Returns Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('itemName')}
                  >
                    <div className="flex items-center">
                      Item Name {getSortIndicator('itemName')}
                    </div>
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('quantity')}
                  >
                    <div className="flex items-center">
                      Quantity {getSortIndicator('quantity')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used Against (Fault/Ticket)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick-up Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage Location
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
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.boqNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.partNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.uom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${item.quantity < 10 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={item.usedAgainst}>
                          {item.usedAgainst}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.pickUpLocation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.storageLocation}</div>
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
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || selectedPickUpLocation !== "all" || selectedStorageLocation !== "all"
                        ? "No faulty returns match your filters" 
                        : "No faulty returns recorded"}
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-lg font-semibold">
                  {editId ? "Edit Faulty Return" : "Add New Faulty Return"}
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
                    name="itemName"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Used Against (Fault/Ticket) *
                  </label>
                  <textarea
                    name="usedAgainst"
                    value={form.usedAgainst}
                    onChange={(e) => setForm({ ...form, usedAgainst: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the fault, ticket number, or PMA details..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pick-up Location *
                    </label>
                    <input
                      name="pickUpLocation"
                      value={form.pickUpLocation}
                      onChange={(e) => setForm({ ...form, pickUpLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Station Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location *
                    </label>
                    <input
                      name="storageLocation"
                      value={form.storageLocation}
                      onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Station Number"
                      required
                    />
                  </div>
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
                    {editId ? "Save Changes" : "Add Faulty Return"}
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

export default FaultyReturnsPage; 