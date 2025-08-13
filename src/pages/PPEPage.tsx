import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiPackage, FiMapPin, FiTool, FiUser, FiUsers, FiBriefcase, FiShield } from "react-icons/fi";

interface IssuedTo {
  name: string;
  olt: string;
  designation: string;
  group: string;
}

interface PPEItem {
  id?: string;
  itemName: string;
  itemDescription: string;
  itemLocation: string;
  quantity: number;
  issuedTo: IssuedTo;
  lastUpdated?: string;
}

const PPEPage = () => {
  const [ppeItems, setPpeItems] = useState<PPEItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PPEItem, 'id'>>({ 
    itemName: "", 
    itemDescription: "", 
    itemLocation: "", 
    quantity: 0, 
    issuedTo: {
      name: "",
      olt: "",
      designation: "",
      group: ""
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof PPEItem; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('ppeItems');
    if (savedData) {
      try {
        setPpeItems(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading PPE data:', error);
      }
    }
  }, []);

  // Listen to inventory-sync events to reload local data so counts update after requisition.
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('ppeItems');
      if (saved) {
        try { setPpeItems(JSON.parse(saved)); } catch {}
      }
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('ppeItems', JSON.stringify(ppeItems));
  }, [ppeItems]);

  // Handle sorting
  const requestSort = (key: keyof PPEItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: PPEItem[]) => {
    let filtered = [...data];
    
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

  const filteredItems = getFilteredItems(ppeItems);

  // Get unique groups for filter dropdown
  const groups = ["all", ...new Set(ppeItems.map(item => item.issuedTo.group))];

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
      }
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = ppeItems.find(item => item.id === id);
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
        }
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this PPE item?")) {
      setPpeItems(prev => prev.filter(item => item.id !== id));
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
      setPpeItems(prev => prev.map(item => item.id === editId ? updatedItem : item));
    } else {
      setPpeItems(prev => [...prev, updatedItem]);
    }

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof PPEItem) => {
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
              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                <FiShield className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                PPE Management
              </h1>
            </div>
            <p className="text-slate-600 ml-11">Track and manage Personal Protective Equipment and safety items</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FiPlus className="mr-2 w-5 h-5" />
            Add New PPE Item
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total PPE Items</h3>
                <p className="text-3xl font-bold text-slate-800">{ppeItems.length}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FiShield className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Total Quantity</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {ppeItems.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 font-medium text-sm">Active Users</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(ppeItems.map(item => item.issuedTo.name)).size}
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
                  {new Set(ppeItems.map(item => item.itemLocation)).size}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiMapPin className="w-6 h-6 text-orange-600" />
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
                placeholder="Search PPE items, descriptions, locations, or assigned users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
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
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              >
                {groups.map(group => (
                  <option key={group} value={group}>
                    {group === "all" ? "All Groups" : group}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PPE Items Table */}
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200/50">
                {filteredItems.map((item) => (
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
                ))}
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
                    {editId ? 'Edit PPE Item' : 'Add New PPE Item'}
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={form.itemLocation}
                    onChange={(e) => setForm({...form, itemLocation: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  />
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
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">OLT</label>
                      <input
                        type="text"
                        value={form.issuedTo.olt}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, olt: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={form.issuedTo.designation}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, designation: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Group</label>
                      <input
                        type="text"
                        value={form.issuedTo.group}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, group: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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

export default PPEPage; 