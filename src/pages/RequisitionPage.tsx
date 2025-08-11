import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, X, Calendar, Users, Package, Save, AlertCircle } from "lucide-react";

type RequisitionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return';

interface Requisition {
  id: string;
  requisitionType: RequisitionType;
  itemType: ItemType;
  itemName: string;
  quantity: number;
  issuedTo: string;
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  referenceNumber: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
}

interface Filters {
  requisitionType: RequisitionType | 'all';
  itemType: ItemType | 'all';
  status: 'completed' | 'pending' | 'overdue' | 'all';
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  dateRange: {
    start: string;
    end: string;
  };
}

interface RequisitionFormData {
  requisitionType: RequisitionType;
  itemType: ItemType;
  itemName: string;
  quantity: number;
  issuedTo: string;
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  status: 'completed' | 'pending' | 'overdue';
  notes: string;
}

interface FormErrors {
  itemName?: string;
  quantity?: string;
  issuedTo?: string;
  department?: string;
}

const RequisitionPage = () => {
  const [requisition, setRequisition] = useState<Requisition[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requisitionToDelete, setRequisitionToDelete] = useState<string | null>(null);
  const [showRequisitionForm, setShowRequisitionForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Department options with display names
  const departmentOptions = [
    { value: 'em_systems' as const, label: 'E&M Systems' },
    { value: 'em_track' as const, label: 'E&M Track' },
    { value: 'em_power' as const, label: 'E&M Power' },
    { value: 'em_signalling' as const, label: 'E&M Signalling' },
    { value: 'em_communication' as const, label: 'E&M Communication' },
    { value: 'em_third_rail' as const, label: 'E&M Third Rail' },
    { value: 'em_safety_quality' as const, label: 'E&M Safety & Quality' }
  ] as const;
  
  const [filters, setFilters] = useState<Filters>({
    requisitionType: 'all',
    itemType: 'all',
    status: 'all',
    department: 'all',
    dateRange: { start: '', end: '' }
  } as Filters);

  const [formData, setFormData] = useState<RequisitionFormData>({
    requisitionType: 'issue',
    itemType: 'inventory',
    itemName: '',
    quantity: 1,
    issuedTo: '',
    department: 'all',
    status: 'pending',
    notes: ''
  } as RequisitionFormData);

  // Generate mock data
  useEffect(() => {
    const fetchRequisition = () => {
      setTimeout(() => {
        const mockRequisition: Requisition[] = [
          {
            id: '1',
            requisitionType: 'issue',
            itemType: 'inventory',
            itemName: 'Safety Helmet Yellow',
            quantity: 5,
            issuedTo: 'John Doe',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-001',
            createdAt: '2024-08-01T10:30:00Z',
            status: 'completed',
            notes: 'Standard safety equipment for new maintenance crew'
          },
          {
            id: '2',
            requisitionType: 'return',
            itemType: 'tool',
            itemName: 'Power Drill Makita XFD131',
            quantity: 2,
            issuedTo: 'Jane Smith',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-002',
            createdAt: '2024-08-02T14:15:00Z',
            status: 'pending',
            notes: 'Returned after project completion'
          },
          {
            id: '3',
            requisitionType: 'consume',
            itemType: 'stationery',
            itemName: 'Safety Gloves Nitrile',
            quantity: 10,
            issuedTo: 'Robert Johnson',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-003',
            createdAt: '2024-08-03T09:45:00Z',
            status: 'overdue',
            notes: 'Monthly consumables for operations team'
          },
          {
            id: '4',
            requisitionType: 'issue',
            itemType: 'ppe',
            itemName: 'Hard Hat White',
            quantity: 3,
            issuedTo: 'Sarah Wilson',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-004',
            createdAt: '2024-08-04T11:20:00Z',
            status: 'completed'
          },
          {
            id: '5',
            requisitionType: 'return',
            itemType: 'faulty_return',
            itemName: 'Angle Grinder',
            quantity: 1,
            issuedTo: 'Mike Davis',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-005',
            createdAt: '2024-07-30T16:30:00Z',
            status: 'completed',
            notes: 'Returned due to motor failure'
          },
          {
            id: '6',
            requisitionType: 'consume',
            itemType: 'stationery',
            itemName: 'Cleaning Supplies',
            quantity: 15,
            issuedTo: 'Lisa Brown',
            department: 'em_systems' as const,
            referenceNumber: 'TRX-2024-006',
            createdAt: '2024-08-01T08:00:00Z',
            status: 'pending'
          }
        ];
        
        setRequisition(mockRequisition);
        setIsLoading(false);
      }, 500);
    };

    fetchRequisition();
  }, []);

  // Filter requisition based on search and filters
  const filteredRequisition = useMemo(() => {
    return requisition.filter(tx => {
      const matchesSearch = 
        tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.requisitionType === 'all' || tx.requisitionType === filters.requisitionType;
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
  }, [requisition, searchTerm, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: requisition.length,
      completed: requisition.filter(t => t.status === 'completed').length,
      pending: requisition.filter(t => t.status === 'pending').length,
      overdue: requisition.filter(t => t.status === 'overdue').length
    };
  }, [requisition]);

  // Generate reference number
  const generateReferenceNumber = () => {
    const year = new Date().getFullYear();
    const nextNumber = String(requisition.length + 1).padStart(3, '0');
    return `TRX-${year}-${nextNumber}`;
  };

  // Validate form
  const validateForm = (data: RequisitionFormData): FormErrors => {
    const errors: FormErrors = {};
    
    if (!data.itemName.trim()) {
      errors.itemName = 'Item name is required';
    }
    
    if (data.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!data.issuedTo.trim()) {
      errors.issuedTo = 'Issued to field is required';
    }
    
    if (!data.department.trim()) {
      errors.department = 'Department is required';
    }
    
    return errors;
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isEditMode && selectedRequisition) {
      // Update existing requisition
      setRequisition(prev => prev.map(tx => 
        tx.id === selectedRequisition.id 
          ? {
              ...tx,
              ...formData
            }
          : tx
      ));
    } else {
      // Create new requisition
      const newRequisition: Requisition = {
        id: Date.now().toString(),
        ...formData,
        referenceNumber: generateReferenceNumber(),
        createdAt: new Date().toISOString()
      };
      setRequisition(prev => [newRequisition, ...prev]);
    }
    
    setIsSaving(false);
    handleCloseForm();
  };

  // Handle opening form for new requisition
  const handleNewRequisition = () => {
    setIsEditMode(false);
    setSelectedRequisition(null);
    setFormData({
      requisitionType: 'issue',
      itemType: 'inventory',
      itemName: '',
      quantity: 1,
      issuedTo: '',
      department: 'all',
      status: 'pending',
      notes: ''
    } as RequisitionFormData);
    setFormErrors({});
    setShowRequisitionForm(true);
  };

  // Handle opening form for editing
  const handleEditRequisition = (requisition: Requisition) => {
    setIsEditMode(true);
    setSelectedRequisition(requisition);
    setFormData({
      requisitionType: requisition.requisitionType,
      itemType: requisition.itemType,
      itemName: requisition.itemName,
      quantity: requisition.quantity,
      issuedTo: requisition.issuedTo,
      department: requisition.department,
      status: requisition.status,
      notes: requisition.notes || ''
    });
    setFormErrors({});
    setShowRequisitionForm(true);
  };

  // Handle closing form
  const handleCloseForm = () => {
    setShowRequisitionForm(false);
    setIsEditMode(false);
    setSelectedRequisition(null);
    setFormErrors({});
    setIsSaving(false);
  };

  // Handle form field changes
  const handleFormChange = (field: keyof RequisitionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleDeleteRequisition = (id: string) => {
    setRequisitionToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (requisitionToDelete) {
      setRequisition(prev => prev.filter(t => t.id !== requisitionToDelete));
      setRequisitionToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Reference', 'Item', 'Type', 'Quantity', 'Issued To', 'Department', 'Date', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredRequisition.map(tx => [
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
    a.download = `requisition-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      requisitionType: 'all',
      itemType: 'all',
      status: 'all',
      department: 'all',
      dateRange: { start: '', end: '' }
    } as Filters);
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
      stationery: 'bg-gray-100 text-gray-800',
      faulty_return: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const getRequisitionTypeBadge = (type: RequisitionType) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Requisition</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all inventory requisition
          </p>
        </div>
        <button 
          onClick={handleNewRequisition}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> 
          New Requisition
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
              placeholder="Search requisition..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Department Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={filters.department}
              onChange={(e) => {
                const value = e.target.value as Requisition['department'];
                setFilters(prev => ({
                  ...prev,
                  department: value || 'all'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requisition Type</label>
                <select
                  value={filters.requisitionType}
                  onChange={(e) => setFilters(prev => ({...prev, requisitionType: e.target.value as any}))}
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
                  <option value="spare_management">Spare Parts</option>
                  <option value="ppe">PPE</option>
                  <option value="stationery">Stationery</option>
                  <option value="faulty_return">Faulty Return</option>
                  <option value="inventory">Inventory</option>
                  <option value="tools">Tools</option>
                  <option value="general_tools">General Tools</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({...prev, department: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  <option value="em_systems">E&M Systems</option>
                  <option value="em_track">E&M Track</option>
                  <option value="em_power">E&M Power</option>
                  <option value="em_thrird_rail">E&M Third Rail</option>
                  <option value="em_communication">E&M Communication</option>
                  <option value="em_signaling">E&M Signaling</option>
                  <option value="em_safety_quality">E&M Safety & Quality</option>
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
                  <option value="cancelled">Cancelled</option>
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

      {/* Requisition Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisition</th>
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
                    Loading requisition...
                  </td>
                </tr>
              ) : filteredRequisition.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No requisition found.
                  </td>
                </tr>
              ) : (
                filteredRequisition.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{txn.referenceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRequisitionTypeBadge(txn.requisitionType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(txn.itemType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.issuedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {departmentOptions.find(d => d.value === txn.department)?.label || txn.department}
                    </td>
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
                            setSelectedRequisition(txn);
                            setShowDetails(true);
                          }}
                          className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditRequisition(txn)}
                          className="text-gray-600 hover:text-green-600 transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequisition(txn.id)}
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

      {/* Requisition Form Modal */}
      {showRequisitionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? 'Edit Requisition' : 'New Requisition'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSaving}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requisition Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requisition Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.requisitionType}
                    onChange={(e) => handleFormChange('requisitionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="issue">Issue</option>
                    <option value="return">Return</option>
                    <option value="consume">Consume</option>
                  </select>
                </div>

                {/* Item Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => handleFormChange('itemType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="spare_management">Spare Parts</option>
                    <option value="ppe">PPE</option>
                    <option value="stationery">Stationery</option>
                    <option value="faulty_return">Faulty Return</option>
                    <option value="inventory">Inventory</option>
                    <option value="tools">Tools</option>
                    <option value="general_tools">General Tools</option>
                  </select>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => handleFormChange('itemName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.itemName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter item name"
                    disabled={isSaving}
                  />
                  {formErrors.itemName && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.itemName}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  />
                  {formErrors.quantity && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.quantity}
                    </div>
                  )}
                </div>

                {/* Issued To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issued To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.issuedTo}
                    onChange={(e) => handleFormChange('issuedTo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.issuedTo ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter person name"
                    disabled={isSaving}
                  />
                  {formErrors.issuedTo && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.issuedTo}
                    </div>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="em_systems">E&M Systems</option>
                    <option value="em_track">E&M Track</option>
                    <option value="em_power">E&M Power</option>
                    <option value="em_signalling">E&M Signalling</option>
                    <option value="em_communication">E&M Communication</option>
                    <option value="em_third_rail">E&M Third Rail</option>
                    <option value="em_safety_quality">E&M Safety & Quality</option>
                  </select>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any additional notes..."
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditMode ? 'Update Requisition' : 'Create Requisition'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requisition Details Modal */}
      {showDetails && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Requisition Details</h2>
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
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.referenceNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequisition.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requisition Type</label>
                  <div className="mt-1">{getRequisitionTypeBadge(selectedRequisition.requisitionType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Type</label>
                  <div className="mt-1">{getTypeBadge(selectedRequisition.itemType)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.itemName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issued To</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.issuedTo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.department}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Date Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequisition.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedRequisition.notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedRequisition.notes}</p>
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
              <button 
                onClick={() => {
                  setShowDetails(false);
                  handleEditRequisition(selectedRequisition);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Requisition
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Requisition</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this requisition? This action cannot be undone.
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

export default RequisitionPage;