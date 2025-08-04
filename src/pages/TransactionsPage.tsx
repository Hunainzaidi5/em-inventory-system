import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiEye, FiDownload, FiFilter } from "react-icons/fi";

interface Transaction {
  id?: string;
  transactionType: 'issue' | 'return' | 'consume';
  itemType: 'inventory' | 'tool' | 'ppe' | 'general' | 'faulty_return';
  itemName: string;
  itemId: string;
  quantity: number;
  issuedTo: {
    name: string;
    olt: string;
    designation: string;
    group: string;
  };
  issuedBy: string;
  department: string;
  purpose: string;
  returnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: string;
  referenceNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>({
    transactionType: 'issue',
    itemType: 'inventory',
    itemName: '',
    itemId: '',
    quantity: 0,
    issuedTo: {
      name: '',
      olt: '',
      designation: '',
      group: ''
    },
    issuedBy: '',
    department: '',
    purpose: '',
    returnDate: '',
    conditionOnReturn: '',
    referenceNumber: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransactionType, setSelectedTransactionType] = useState("all");
  const [selectedItemType, setSelectedItemType] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('transactions');
    if (savedData) {
      try {
        setTransactions(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading transactions data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Handle sorting
  const requestSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: Transaction[]) => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply transaction type filter
    if (selectedTransactionType !== "all") {
      filtered = filtered.filter(item => item.transactionType === selectedTransactionType);
    }

    // Apply item type filter
    if (selectedItemType !== "all") {
      filtered = filtered.filter(item => item.itemType === selectedItemType);
    }

    // Apply department filter
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(item => item.department === selectedDepartment);
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(item => new Date(item.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(item => new Date(item.createdAt) <= new Date(dateRange.end));
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

  const filteredTransactions = getFilteredItems(transactions);

  // Get unique values for filter dropdowns
  const transactionTypes = ["all", "issue", "return", "consume"];
  const itemTypes = ["all", "inventory", "tool", "ppe", "general", "faulty_return"];
  const departments = ["all", ...new Set(transactions.map(item => item.department))];

  // Modal handlers
  const openAddModal = () => {
    setForm({
      transactionType: 'issue',
      itemType: 'inventory',
      itemName: '',
      itemId: '',
      quantity: 0,
      issuedTo: {
        name: '',
        olt: '',
        designation: '',
        group: ''
      },
      issuedBy: '',
      department: '',
      purpose: '',
      returnDate: '',
      conditionOnReturn: '',
      referenceNumber: generateReferenceNumber(),
      notes: ''
    });
    setEditId(null);
    setShowModal(true);
  };

  const openViewModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewModal(true);
  };

  const openEditModal = (id: string) => {
    const transaction = transactions.find(item => item.id === id);
    if (transaction) {
      setForm({
        transactionType: transaction.transactionType,
        itemType: transaction.itemType,
        itemName: transaction.itemName,
        itemId: transaction.itemId,
        quantity: transaction.quantity,
        issuedTo: transaction.issuedTo,
        issuedBy: transaction.issuedBy,
        department: transaction.department,
        purpose: transaction.purpose,
        returnDate: transaction.returnDate || '',
        conditionOnReturn: transaction.conditionOnReturn || '',
        referenceNumber: transaction.referenceNumber,
        notes: transaction.notes || ''
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this transaction?")) {
      setTransactions(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim() || form.quantity <= 0 || !form.issuedTo.name.trim() || !form.issuedBy.trim()) return;

    const updatedTransaction = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      createdAt: editId ? (transactions.find(t => t.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editId) {
      setTransactions(prev => prev.map(item => item.id === editId ? updatedTransaction : item));
    } else {
      setTransactions(prev => [...prev, updatedTransaction]);
    }

    setShowModal(false);
  };

  // Generate reference number
  const generateReferenceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${year}${month}${day}-${random}`;
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Transaction) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Export transactions
  const exportTransactions = () => {
    const csvContent = [
      ['Reference Number', 'Transaction Type', 'Item Type', 'Item Name', 'Quantity', 'Issued To', 'Department', 'Purpose', 'Date'],
      ...filteredTransactions.map(t => [
        t.referenceNumber,
        t.transactionType,
        t.itemType,
        t.itemName,
        t.quantity.toString(),
        t.issuedTo.name,
        t.department,
        t.purpose,
        new Date(t.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'issue': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-green-100 text-green-800';
      case 'consume': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Transaction Management</h1>
            <p className="text-gray-600">Track and manage all inventory transactions</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={exportTransactions}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiDownload className="mr-2" />
              Export CSV
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Total Transactions</h3>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Issues</h3>
            <p className="text-2xl font-bold text-blue-600">
              {transactions.filter(t => t.transactionType === 'issue').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Returns</h3>
            <p className="text-2xl font-bold text-green-600">
              {transactions.filter(t => t.transactionType === 'return').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 font-medium">Consumed</h3>
            <p className="text-2xl font-bold text-red-600">
              {transactions.filter(t => t.transactionType === 'consume').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={selectedTransactionType}
                onChange={(e) => setSelectedTransactionType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {transactionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedItemType}
                onChange={(e) => setSelectedItemType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {itemTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Items" : type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start Date"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="End Date"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('referenceNumber')}
                  >
                    <div className="flex items-center">
                      Reference {getSortIndicator('referenceNumber')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
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
                    Department
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date {getSortIndicator('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.referenceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.itemName}</div>
                        <div className="text-xs text-gray-500">{transaction.itemType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{transaction.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.issuedTo.name}</div>
                        <div className="text-xs text-gray-500">{transaction.issuedTo.designation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{transaction.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openViewModal(transaction)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => openEditModal(transaction.id!)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleRemove(transaction.id!)}
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
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || selectedTransactionType !== "all" || selectedItemType !== "all" || selectedDepartment !== "all"
                        ? "No transactions match your filters" 
                        : "No transactions recorded"}
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
                  {editId ? "Edit Transaction" : "Add New Transaction"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Type *
                    </label>
                    <select
                      name="transactionType"
                      value={form.transactionType}
                      onChange={(e) => setForm({ ...form, transactionType: e.target.value as 'issue' | 'return' | 'consume' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="issue">Issue</option>
                      <option value="return">Return</option>
                      <option value="consume">Consume</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Type *
                    </label>
                    <select
                      name="itemType"
                      value={form.itemType}
                      onChange={(e) => setForm({ ...form, itemType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="inventory">Inventory</option>
                      <option value="tool">Tool</option>
                      <option value="ppe">PPE</option>
                      <option value="general">General</option>
                      <option value="faulty_return">Faulty Return</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      Quantity *
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
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
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issued By *
                    </label>
                    <input
                      name="issuedBy"
                      value={form.issuedBy}
                      onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <input
                      name="department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose *
                  </label>
                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Date
                    </label>
                    <input
                      name="returnDate"
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition on Return
                    </label>
                    <input
                      name="conditionOnReturn"
                      value={form.conditionOnReturn}
                      onChange={(e) => setForm({ ...form, conditionOnReturn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
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
                    {editId ? "Save Changes" : "Add Transaction"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Transaction Modal */}
        {viewModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Transaction Details</h2>
                <button
                  onClick={() => setViewModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.referenceNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(selectedTransaction.transactionType)}`}>
                      {selectedTransaction.transactionType.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.itemName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Type</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.itemType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.department}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issued To</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.issuedTo.name}</p>
                  <p className="text-xs text-gray-500">OLT: {selectedTransaction.issuedTo.olt} | {selectedTransaction.issuedTo.designation} | Group: {selectedTransaction.issuedTo.group}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.purpose}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issued By</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.issuedBy}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedTransaction.returnDate && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Return Date</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.returnDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condition on Return</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.conditionOnReturn}</p>
                    </div>
                  </div>
                )}
                {selectedTransaction.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  </div>
);
};

export default TransactionsPage; 