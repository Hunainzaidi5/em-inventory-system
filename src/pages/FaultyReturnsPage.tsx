import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiPackage, FiMapPin, FiTool } from "react-icons/fi";

interface FaultyReturn {
  id?: string;
  itemName: string;
  boq_number: string;
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
    boq_number: "", 
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

  // Listen to inventory-sync events to reload local data so counts update after requisition.
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('faultyReturns');
      if (saved) {
        try { setFaultyReturns(JSON.parse(saved)); } catch {}
      }
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
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
        (item.boq_number && item.boq_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      boq_number: "", 
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
        boq_number: item.boq_number,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <FiTool className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Faulty Returns Management
              </h1>
            </div>
            <p className="text-slate-600 ml-11">Track and manage faulty returns and their locations</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FiPlus className="mr-2 w-5 h-5" />
            Add New Faulty Return
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total Faulty Returns</h3>
                <p className="text-3xl font-bold text-slate-800">{faultyReturns.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total Quantity</h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {faultyReturns.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FiCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Pick-up Locations</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {new Set(faultyReturns.map(item => item.pickUpLocation)).size}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiMapPin className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Storage Locations</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(faultyReturns.map(item => item.storageLocation)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiMapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items, BOQ numbers, part numbers, or fault descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="w-full md:w-56">
              <select
                value={selectedPickUpLocation}
                onChange={(e) => setSelectedPickUpLocation(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
              >
                {pickUpLocations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All Pick-up Locations" : loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-56">
              <select
                value={selectedStorageLocation}
                onChange={(e) => setSelectedStorageLocation(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
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
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('itemName')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Item Name</span>
                      <span className="text-blue-600">{getSortIndicator('itemName')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    BOQ Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Part Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    UOM
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('quantity')}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Quantity</span>
                      <span className="text-blue-600">{getSortIndicator('quantity')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Used Against (Fault/Ticket)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Pick-up Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Storage Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/80 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{item.itemName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-lg inline-block">{item.boq_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-mono">{item.partNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg inline-block font-medium">{item.uom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
                          item.quantity < 10 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-xs truncate bg-yellow-50 px-2 py-1 rounded-lg" title={item.usedAgainst}>
                          {item.usedAgainst}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg inline-flex items-center">
                          <FiMapPin className="w-3 h-3 mr-1" />
                          {item.pickUpLocation}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 bg-purple-50 text-purple-700 px-2 py-1 rounded-lg inline-flex items-center">
                          <FiMapPin className="w-3 h-3 mr-1" />
                          {item.storageLocation}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(item.id!)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id!)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiPackage className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 text-lg font-medium">
                          {searchTerm || selectedPickUpLocation !== "all" || selectedStorageLocation !== "all"
                            ? "No faulty returns match your filters" 
                            : "No faulty returns recorded"}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          {!searchTerm && selectedPickUpLocation === "all" && selectedStorageLocation === "all"
                            ? "Click 'Add New Faulty Return' to get started"
                            : "Try adjusting your search or filters"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FiTool className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editId ? "Edit Faulty Return" : "Add New Faulty Return"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    name="itemName"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      BOQ Number
                    </label>
                    <input
                      name="boq_number"
                      value={form.boq_number}
                      onChange={(e) => setForm({ ...form, boq_number: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="BOQ Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Part Number
                    </label>
                    <input
                      name="partNumber"
                      value={form.partNumber}
                      onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Part Number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      UOM
                    </label>
                    <input
                      name="uom"
                      value={form.uom}
                      onChange={(e) => setForm({ ...form, uom: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="e.g., PCS, KG, M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Used Against (Fault/Ticket) *
                  </label>
                  <textarea
                    name="usedAgainst"
                    value={form.usedAgainst}
                    onChange={(e) => setForm({ ...form, usedAgainst: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    rows={3}
                    placeholder="Describe the fault, ticket number, or PMA details..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Pick-up Location *
                    </label>
                    <input
                      name="pickUpLocation"
                      value={form.pickUpLocation}
                      onChange={(e) => setForm({ ...form, pickUpLocation: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Station Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Storage Location *
                    </label>
                    <input
                      name="storageLocation"
                      value={form.storageLocation}
                      onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Station Number"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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