import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";

interface IssuedTo {
  name: string;
  olt: string;
  designation: string;
  group: string;
}

interface Tool {
  id?: string;
  itemName: string;
  toolDescription: string;
  brand: string;
  uom: string;
  quantity: number;
  issuedTo: IssuedTo;
  lastUpdated?: string;
}

const ToolsPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Tool, 'id'>>({ 
    itemName: "", 
    toolDescription: "", 
    brand: "", 
    uom: "", 
    quantity: 0, 
    issuedTo: {
      name: "",
      olt: "",
      designation: "",
      group: ""
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Tool; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('tools');
    if (savedData) {
      try {
        setTools(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading tools data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('tools', JSON.stringify(tools));
  }, [tools]);

  // Handle sorting
  const requestSort = (key: keyof Tool) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: Tool[]) => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.toolDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.olt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.group.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter(item => item.brand === selectedBrand);
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

  const filteredItems = getFilteredItems(tools);

  // Get unique brands and groups for filter dropdowns
  const brands = ["all", ...new Set(tools.map(item => item.brand))];
  const groups = ["all", ...new Set(tools.map(item => item.issuedTo.group))];

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      itemName: "", 
      toolDescription: "", 
      brand: "", 
      uom: "", 
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
    const item = tools.find(item => item.id === id);
    if (item) {
      setForm({
        itemName: item.itemName,
        toolDescription: item.toolDescription,
        brand: item.brand,
        uom: item.uom,
        quantity: item.quantity,
        issuedTo: item.issuedTo
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this tool?")) {
      setTools(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim() || form.quantity < 0 || !form.issuedTo.name.trim()) return;

    const updatedItem = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editId) {
      setTools(prev => prev.map(item => item.id === editId ? updatedItem : item));
    } else {
      setTools(prev => [...prev, updatedItem]);
    }

    setShowModal(false);
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Tool) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tools Management</h1>
            <p className="text-gray-600">Track and manage tools and their assignments</p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-4 md:mt-0 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New Tool
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Tools</h3>
            <p className="text-2xl font-bold">{tools.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Quantity</h3>
            <p className="text-2xl font-bold">
              {tools.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Brands</h3>
            <p className="text-2xl font-bold">
              {new Set(tools.map(item => item.brand)).size}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Groups</h3>
            <p className="text-2xl font-bold">
              {new Set(tools.map(item => item.issuedTo.group)).size}
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
                placeholder="Search tools, descriptions, brands, or assigned personnel..."
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
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand === "all" ? "All Brands" : brand}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Tools Table */}
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
                    Tool Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
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
                    Issued To
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={item.toolDescription}>
                          {item.toolDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.uom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${item.quantity < 5 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {item.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="font-medium">{item.issuedTo.name}</div>
                          <div className="text-xs text-gray-400">
                            OLT: {item.issuedTo.olt} | {item.issuedTo.designation} | Group: {item.issuedTo.group}
                          </div>
                        </div>
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
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || selectedBrand !== "all" || selectedGroup !== "all"
                        ? "No tools match your filters" 
                        : "No tools recorded"}
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
                  {editId ? "Edit Tool" : "Add New Tool"}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tool Description
                  </label>
                  <textarea
                    name="toolDescription"
                    value={form.toolDescription}
                    onChange={(e) => setForm({ ...form, toolDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the tool and its specifications..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      name="brand"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brand name"
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
                
                {/* Issued To Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Issued To</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        name="issuedToName"
                        value={form.issuedTo.name}
                        onChange={(e) => setForm({ 
                          ...form, 
                          issuedTo: { ...form.issuedTo, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Receiver Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OLT (Employee Code)
                      </label>
                      <input
                        name="issuedToOlt"
                        value={form.issuedTo.olt}
                        onChange={(e) => setForm({ 
                          ...form, 
                          issuedTo: { ...form.issuedTo, olt: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Employee Code Number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation
                      </label>
                      <input
                        name="issuedToDesignation"
                        value={form.issuedTo.designation}
                        onChange={(e) => setForm({ 
                          ...form, 
                          issuedTo: { ...form.issuedTo, designation: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Designation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group
                      </label>
                      <input
                        name="issuedToGroup"
                        value={form.issuedTo.group}
                        onChange={(e) => setForm({ 
                          ...form, 
                          issuedTo: { ...form.issuedTo, group: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Group Number"
                      />
                    </div>
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
                    {editId ? "Save Changes" : "Add Tool"}
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

export default ToolsPage; 