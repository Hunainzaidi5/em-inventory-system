import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiPackage, FiMapPin, FiTool, FiUser, FiUsers, FiBriefcase, FiBox, FiSettings } from "react-icons/fi";
import { PageContainer } from "@/components/layout/PageContainer";

interface IssuedTo {
  name: string;
  olt: string;
  designation: string;
  group: string;
}

interface GeneralToolsItem {
  id?: string;
  itemName: string;
  itemDescription: string;
  itemLocation: string;
  quantity: number;
  issuedTo: IssuedTo;
  lastUpdated?: string;
}

const GeneralToolsPage = () => {
  const [generalToolsItems, setGeneralToolsItems] = useState<GeneralToolsItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<GeneralToolsItem, 'id'>>({ 
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof GeneralToolsItem; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('generalToolsItems');
    if (savedData) {
      try {
        setGeneralToolsItems(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading General Tools data:', error);
      }
    }
  }, []);

  // Listen to inventory-sync events to reload local data so counts update after requisition.
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('generalToolsItems');
      if (saved) {
        try { setGeneralToolsItems(JSON.parse(saved)); } catch {}
      }
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('generalToolsItems', JSON.stringify(generalToolsItems));
  }, [generalToolsItems]);

  // Handle sorting
  const requestSort = (key: keyof GeneralToolsItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: GeneralToolsItem[]) => {
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

  const filteredItems = getFilteredItems(generalToolsItems);

  // Get unique groups for filter dropdown
  const groups = ["all", ...new Set(generalToolsItems.map(item => item.issuedTo.group))];

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
    const item = generalToolsItems.find(item => item.id === id);
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
    if (window.confirm("Are you sure you want to remove this general tool item?")) {
      setGeneralToolsItems(prev => prev.filter(item => item.id !== id));
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
      setGeneralToolsItems(prev => prev.map(item => item.id === editId ? updatedItem : item));
    } else {
      setGeneralToolsItems(prev => [...prev, updatedItem]);
    }

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof GeneralToolsItem) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-teal-100 rounded-lg mr-3">
                <FiSettings className="w-6 h-6 text-teal-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
                General Tools Management
              </h1>
            </div>
            <p className="text-gray-600 ml-11">Track and manage general tools and miscellaneous equipment</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FiPlus className="mr-2 w-5 h-5" />
            Add New General Tool
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Tools</p>
                <p className="text-3xl font-bold text-white mt-2">{generalToolsItems.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <FiTool className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Quantity</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {generalToolsItems.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Active Users</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {new Set(generalToolsItems.map(item => item.issuedTo.name)).size}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-600 to-red-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Locations</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {new Set(generalToolsItems.map(item => item.itemLocation)).size}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <FiMapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#e1d4b1]/30 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8c7a5c] w-5 h-5" />
              <input
                type="text"
                placeholder="Search general tools, descriptions, locations, or assigned users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/90 border border-[#e1d4b1] rounded-xl focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] focus:bg-white transition-all duration-200 text-[#5c4a2a] placeholder-[#b39b6e]/70"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8c7a5c] hover:text-[#5c4a2a] transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="w-full md:w-56">
              <div className="relative">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white/90 border border-[#e1d4b1] rounded-xl focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] focus:bg-white transition-all duration-200 appearance-none text-[#5c4a2a]"
                >
                  {groups.map(group => (
                    <option key={group} value={group}>
                      {group === "all" ? "All Groups" : group}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8c7a5c]">
                  <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Tools Items Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f0e9db]">
                <tr className="border-b border-[#e1d4b1]">
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]/50 transition-colors"
                    onClick={() => requestSort('itemName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tool Name</span>
                      <span className="text-[#b39b6e]">{getSortIndicator('itemName')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]/50 transition-colors"
                    onClick={() => requestSort('itemDescription')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      <span className="text-[#b39b6e]">{getSortIndicator('itemDescription')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]/50 transition-colors"
                    onClick={() => requestSort('itemLocation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Location</span>
                      <span className="text-[#b39b6e]">{getSortIndicator('itemLocation')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]/50 transition-colors"
                    onClick={() => requestSort('quantity')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Quantity</span>
                      <span className="text-[#b39b6e]">{getSortIndicator('quantity')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider hover:bg-[#e1d4b1]/50 transition-colors">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider hover:bg-[#e1d4b1]/50 transition-colors">
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
                    {editId ? 'Edit General Tool' : 'Add New General Tool'}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tool Name *</label>
                    <input
                      type="text"
                      value={form.itemName}
                      onChange={(e) => setForm({...form, itemName: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Describe the general tool and its specifications..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={form.itemLocation}
                    onChange={(e) => setForm({...form, itemLocation: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="e.g., General Storage, Utility Room"
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
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">OLT</label>
                      <input
                        type="text"
                        value={form.issuedTo.olt}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, olt: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={form.issuedTo.designation}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, designation: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Group</label>
                      <input
                        type="text"
                        value={form.issuedTo.group}
                        onChange={(e) => setForm({...form, issuedTo: {...form.issuedTo, group: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editId ? 'Update Tool' : 'Add Tool'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default GeneralToolsPage; 