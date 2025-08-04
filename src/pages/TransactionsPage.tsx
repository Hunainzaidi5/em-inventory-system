import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, X, Calendar, Users, Package } from "lucide-react";

type TransactionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'general' | 'faulty_return';

interface Transaction {
  id: string;
  transactionType: TransactionType;
  itemType: ItemType;
  itemName: string;
  quantity: number;
  issuedTo: string;
  department: string;
  referenceNumber: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
}

interface Filters {
  transactionType: TransactionType | 'all';
  itemType: ItemType | 'all';
  status: 'completed' | 'pending' | 'overdue' | 'all';
  department: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    transactionType: 'all',
    itemType: 'all',
    status: 'all',
    department: '',
    dateRange: { start: '', end: '' }
  });

  // Generate mock data
  useEffect(() => {
    const fetchTransactions = () => {
      setTimeout(() => {
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            transactionType: 'issue',
            itemType: 'inventory',
            itemName: 'Safety Helmet Yellow',
            quantity: 5,
            issuedTo: 'John Doe',
            department: 'Maintenance',
            referenceNumber: 'TRX-2024-001',
            createdAt: '2024-08-01T10:30:00Z',
            status: 'completed',
            notes: 'Standard safety equipment for new maintenance crew'
          },
          {
            id: '2',
            transactionType: 'return',
            itemType: 'tool',
            itemName: 'Power Drill Makita XFD131',
            quantity: 2,
            issuedTo: 'Jane Smith',
            department: 'Engineering',
            referenceNumber: 'TRX-2024-002',
            createdAt: '2024-08-02T14:15:00Z',
            status: 'pending',
            notes: 'Returned after project completion'
          },
          {
            id: '3',
            transactionType: 'consume',
            itemType: 'general',
            itemName: 'Safety Gloves Nitrile',
            quantity: 10,
            issuedTo: 'Robert Johnson',
            department: 'Operations',
            referenceNumber: 'TRX-2024-003',
            createdAt: '2024-08-03T09:45:00Z',
            status: 'overdue',
            notes: 'Monthly consumables for operations team'
          },
          {
            id: '4',
            transactionType: 'issue',
            itemType: 'ppe',
            itemName: 'Hard Hat White',
            quantity: 3,
            issuedTo: 'Sarah Wilson',
            department: 'Construction',
            referenceNumber: 'TRX-2024-004',
            createdAt: '2024-08-04T11:20:00Z',
            status: 'completed'
          },
          {
            id: '5',
            transactionType: 'return',
            itemType: 'faulty_return',
            itemName: 'Angle Grinder',
            quantity: 1,
            issuedTo: 'Mike Davis',
            department: 'Maintenance',
            referenceNumber: 'TRX-2024-005',
            createdAt: '2024-07-30T16:30:00Z',
            status: 'completed',
            notes: 'Returned due to motor failure'
          },
          {
            id: '6',
            transactionType: 'consume',
            itemType: 'general',
            itemName: 'Cleaning Supplies',
            quantity: 15,
            issuedTo: 'Lisa Brown',
            department: 'Facilities',
            referenceNumber: 'TRX-2024-006',
            createdAt: '2024-08-01T08:00:00Z',
            status: 'pending'
          }
        ];
        
        setTransactions(mockTransactions);
        setIsLoading(false);
      }, 500);
    };

    fetchTransactions();
  }, []);

  // Get unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = [...new Set(transactions.map(t => t.department))];
    return depts.sort();
  }, [transactions]);

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.transactionType === 'all' || tx.transactionType === filters.transactionType;
      const matchesItemType = filters.itemType === 'all' || tx.itemType === filters.itemType;
      const matchesStatus = filters.status === 'all' || tx.status === filters.status;
      const matchesDepartment = !filters.department || tx.department === filters.department;

      let matchesDateRange = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        const txDate = new Date(tx.createdAt);
        if (filters.dateRange.start) {
          matchesDateRange = matchesDateRange && txDate >= new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          matchesDateRange = matchesDateRange && txDate <= new Date(filters.dateRange.end);
        }
      }

      return matchesSearch && matchesType && matchesItemType && matchesStatus && matchesDepartment && matchesDateRange;
    });
  }, [transactions, searchTerm, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: transactions.length,
      completed: transactions.filter(t => t.status === 'completed').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      overdue: transactions.filter(t => t.status === 'overdue').length
    };
  }, [transactions]);

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      setTransactionToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Reference', 'Item', 'Type', 'Quantity', 'Issued To', 'Department', 'Date', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => [
        tx.referenceNumber,
        `"${tx.itemName}"`,
        tx.itemType,
        tx.quantity,
        `"${tx.issuedTo}"`,
        `"${tx.department}"`,
        new Date(tx.createdAt).toLocaleDateString(),
        tx.status,
        `"${tx.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      transactionType: 'all',
      itemType: 'all',
      status: 'all',
      department: '',
      dateRange: { start: '', end: '' }
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      inventory: 'bg-blue-100 text-blue-800',
      tool: 'bg-purple-100 text-purple-800',
      ppe: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800',
      faulty_return: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: TransactionType) => {
    const colors = {
      issue: 'bg-green-100 text-green-800',
      return: 'bg-blue-100 text-blue-800',
      consume: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all inventory transactions
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <Plus className="h-4 w-4" /> 
          New Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters(prev => ({...prev, transactionType: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="issue">Issue</option>
                  <option value="return">Return</option>
                  <option value="consume">Consume</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <select
                  value={filters.itemType}
                  onChange={(e) => setFilters(prev => ({...prev, itemType: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Items</option>
                  <option value="inventory">Inventory</option>
                  <option value="tool">Tool</option>
                  <option value="ppe">PPE</option>
                  <option value="general">General</option>
                  <option value="faulty_return">Faulty Return</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({...prev, status: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({...prev, department: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{txn.referenceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTransactionTypeBadge(txn.transactionType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(txn.itemType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.issuedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(txn.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(txn);
                            setShowDetails(true);
                          }}
                          className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-green-600 transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(txn.id)}
                          className="text-gray-600 hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.referenceNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <div className="mt-1">{getTransactionTypeBadge(selectedTransaction.transactionType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Type</label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.itemType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.itemName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issued To</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.issuedTo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.department}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Date Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTransaction.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedTransaction.notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Edit Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Transaction</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;