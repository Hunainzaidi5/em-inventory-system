import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, X, Package, Save, AlertCircle } from "lucide-react";
import { getRequisitions, createRequisition, updateRequisition, deleteRequisition, subscribeToRequisitions, Requisition as ServiceRequisition } from "@/services/requisitionService";
import { useToast } from "@/components/ui/use-toast";
import { adjustQuantityForRequisition } from '@/services/itemQuantityService';
import { getSpareParts } from '@/services/spareService';

type RequisitionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return' | 'general_tools' | 'spare_management';
type StatusType = 'completed' | 'pending' | 'overdue';

type Requisition = ServiceRequisition;

interface Filters {
  requisitionType: RequisitionType | 'all';
  itemType: ItemType | 'all';
  status: 'completed' | 'pending' | 'overdue' | 'all';
  location: 'Depot' | 'Station 1' | 'Station 2' | 'Station 3' | 'Station 4' | 'Station 5' | 'Station 6' | 'Station 7' | 'Station 8' | 'Station 9' | 'Station 10' | 'Station 11' | 'Station 12' | 'Station 13' | 'Station 14' | 'Station 15' | 'Station 16' | 'Station 17' | 'Station 18' | 'Station 19' | 'Station 20' | 'Station 21' | 'Station 22' | 'Station 23' | 'Station 24' | 'Station 25' | 'Station 26' | 'Stabling Yard' | 'all';
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
  location: 'Depot' | 'Station 1' | 'Station 2' | 'Station 3' | 'Station 4' | 'Station 5' | 'Station 6' | 'Station 7' | 'Station 8' | 'Station 9' | 'Station 10' | 'Station 11' | 'Station 12' | 'Station 13' | 'Station 14' | 'Station 15' | 'Station 16' | 'Station 17' | 'Station 18' | 'Station 19' | 'Station 20' | 'Station 21' | 'Station 22' | 'Station 23' | 'Station 24' | 'Station 25' | 'Station 26' | 'Stabling Yard' | 'all';
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  status: 'completed' | 'pending' | 'overdue';
  notes: string;
}

interface FormErrors {
  itemName?: string;
  quantity?: string;
  issuedTo?: string;
  department?: string;
  location?: string;
}

const RequisitionPage = () => {
  const { toast } = useToast();
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
  const [itemOptions, setItemOptions] = useState<{ name: string; quantity: number }[]>([]);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  
  const locationOptions = [
    { value: 'Depot' as const, label: 'Depot' },
    { value: 'Station 1' as const, label: 'Station 1' },
    { value: 'Station 2' as const, label: 'Station 2' },
    { value: 'Station 3' as const, label: 'Station 3' },
    { value: 'Station 4' as const, label: 'Station 4' },
    { value: 'Station 5' as const, label: 'Station 5' },
    { value: 'Station 6' as const, label: 'Station 6' },
    { value: 'Station 7' as const, label: 'Station 7' },
    { value: 'Station 8' as const, label: 'Station 8' },
    { value: 'Station 9' as const, label: 'Station 9' },
    { value: 'Station 10' as const, label: 'Station 10' },
    { value: 'Station 11' as const, label: 'Station 11' },
    { value: 'Station 12' as const, label: 'Station 12' },
    { value: 'Station 13' as const, label: 'Station 13' },
    { value: 'Station 14' as const, label: 'Station 14' },
    { value: 'Station 15' as const, label: 'Station 15' },
    { value: 'Station 16' as const, label: 'Station 16' },
    { value: 'Station 17' as const, label: 'Station 17' },
    { value: 'Station 18' as const, label: 'Station 18' },
    { value: 'Station 19' as const, label: 'Station 19' },
    { value: 'Station 20' as const, label: 'Station 20' },
    { value: 'Station 21' as const, label: 'Station 21' },
    { value: 'Station 22' as const, label: 'Station 22' },
    { value: 'Station 23' as const, label: 'Station 23' },
    { value: 'Station 24' as const, label: 'Station 24' },
    { value: 'Station 25' as const, label: 'Station 25' },
    { value: 'Station 26' as const, label: 'Station 26' },
    { value: 'Stabling Yard' as const, label: 'Stabling Yard' }
  ] as const;

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
    location: 'all',
    department: 'all',
    dateRange: { start: '', end: '' }
  } as Filters);

  const [formData, setFormData] = useState<RequisitionFormData>({
    requisitionType: 'issue',
    itemType: 'inventory',
    itemName: '',
    quantity: 1,
    issuedTo: '',
    location: 'Depot',
    department: 'em_systems',
    status: 'pending',
    notes: ''
  } as RequisitionFormData);

  // Filter requisition based on search and filters
  const filteredRequisition = useMemo(() => {
    return requisition.filter(tx => {
      const matchesSearch = 
        tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.requisitionType === 'all' || tx.requisitionType === filters.requisitionType;
      const matchesItemType = filters.itemType === 'all' || tx.itemType === filters.itemType;
      const matchesStatus = filters.status === 'all' || tx.status === filters.status;
      const matchesLocation = !filters.location || tx.location === filters.location;
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

      return matchesSearch && matchesType && matchesItemType && matchesStatus && matchesLocation && matchesDepartment && matchesDateRange;
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

    // For issue/consume, ensure sufficient stock when we know availability
    if ((data.requisitionType === 'issue' || data.requisitionType === 'consume') && availableQuantity !== null) {
      if (data.quantity > availableQuantity) {
        errors.quantity = `Insufficient stock. Available: ${availableQuantity}`;
      }
    }
    
    if (!data.issuedTo.trim()) {
      errors.issuedTo = 'Issued to field is required';
    }
    
    if (!data.location || !String(data.location).trim()) {
      errors.location = 'Location is required';
    }
    
    if (!data.department || !String(data.department).trim()) {
      errors.department = 'Department is required';
    }
    
    return errors;
  };

  // Load items per item type from appropriate source
  const loadItemsForType = useCallback(async (type: ItemType) => {
    try {
      if (type === 'spare_management') {
        const parts = await getSpareParts();
        const opts = (parts || []).map(p => ({ name: p.name, quantity: Number(p.quantity) || 0 }));
        setItemOptions(opts);
        return;
      }
      const storageKeyMap: Record<ItemType, string> = {
        inventory: 'inventoryItems',
        tool: 'toolsItems',
        general_tools: 'generalToolsItems',
        ppe: 'ppeItems',
        stationery: 'stationeryItems',
        faulty_return: 'faultyReturns',
        spare_management: ''
      } as const;
      const key = storageKeyMap[type];
      if (!key) { setItemOptions([]); return; }
      const raw = localStorage.getItem(key);
      if (!raw) { setItemOptions([]); return; }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) { setItemOptions([]); return; }
      const opts = arr.map((it: any) => ({ name: String(it.itemName || it.name || '').trim(), quantity: Number(it.quantity) || 0 }))
        .filter((o: any) => o.name);
      setItemOptions(opts);
    } catch (e) {
      console.error('[Requisition] Failed loading items for type', type, e);
      setItemOptions([]);
    }
  }, []);

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      if (isEditMode && selectedRequisition) {
        await updateRequisition(selectedRequisition.id, {
          requisitionType: formData.requisitionType,
          itemType: formData.itemType,
          itemName: formData.itemName,
          quantity: formData.quantity,
          issuedTo: formData.issuedTo,
          department: formData.department,
          location: formData.location,
          // status excluded: service type does not accept it
          notes: formData.notes,
        });
      } else {
        await createRequisition({
          requisitionType: formData.requisitionType,
          itemType: formData.itemType,
          itemName: formData.itemName,
          quantity: formData.quantity,
          issuedTo: formData.issuedTo,
          department: formData.department,
          location: formData.location,
          // status excluded: service sets default
          notes: formData.notes,
        });
        // Adjust item quantity according to requisition
        await adjustQuantityForRequisition({
          itemType: formData.itemType as any,
          itemName: formData.itemName,
          requisitionType: formData.requisitionType as any,
          quantity: formData.quantity,
        });
      }

      await fetchRequisitions();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving requisition:', error);
      toast({ title: 'Error', description: 'Failed to save requisition', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
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
      location: 'all',
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
      location: requisition.location,
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

    if (field === 'itemType') {
      setAvailableQuantity(null);
      setItemOptions([]);
      setFormData(prev => ({ ...prev, itemName: '' }));
      loadItemsForType(value as ItemType);
    }

    if (field === 'itemName') {
      const opt = itemOptions.find(o => o.name.toLowerCase() === String(value).toLowerCase());
      setAvailableQuantity(opt ? opt.quantity : null);
    }
  };

  const handleDeleteRequisition = (id: string) => {
    setRequisitionToDelete(id);
    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!requisitionToDelete) return;
    
    try {
      await deleteRequisition(requisitionToDelete);
      
      // Refresh the data
      await fetchRequisitions();
      
      setShowDeleteDialog(false);
      setRequisitionToDelete(null);
      
      toast({
        title: "Success",
        description: "Requisition deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting requisition:', error);
      toast({
        title: "Error",
        description: "Failed to delete requisition",
        variant: "destructive",
      });
    }
  };
  
  // Fetch requisitions from Supabase
  const fetchRequisitions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getRequisitions();
      setRequisition(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch requisitions",
        variant: "destructive",
      });
      console.error("Error fetching requisitions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Initial fetch
  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToRequisitions((payload) => {
      console.log('Requisition change:', payload);
      fetchRequisitions();
    });

    return () => {
      subscription();
    };
  }, [fetchRequisitions]);

  // Initial load of item options and keep them in sync with local modules
  useEffect(() => {
    loadItemsForType(formData.itemType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      loadItemsForType(formData.itemType);
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, [formData.itemType, loadItemsForType]);

  const exportToCSV = () => {
    const headers = ['Reference', 'Item', 'Type', 'Quantity', 'Issued To', 'Location', 'Department', 'Date', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredRequisition.map(tx => [
        tx.referenceNumber,
        `"${tx.itemName}"`,
        tx.itemType,
        tx.quantity,
        `"${tx.issuedTo}"`,
        `"${tx.location}"`,
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
      location: 'all',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
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
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
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
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200">
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
          
          {/* Location Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={filters.location}
              onChange={(e) => {
                const value = e.target.value as Requisition['location'];
                setFilters(prev => ({
                  ...prev,
                  location: value || 'all'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locationOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
                  <option value="tool">Tools</option>
                  <option value="general_tools">General Tools</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({...prev, location: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Locations</option>
                  <option value="Depot">Depot</option>
                  <option value="Station 1">Station 1</option>
                  <option value="Station 2">Station 2</option>
                  <option value="Station 3">Station 3</option>
                  <option value="Station 4">Station 4</option>
                  <option value="Station 5">Station 5</option>
                  <option value="Station 6">Station 6</option>
                  <option value="Station 7">Station 7</option>
                  <option value="Station 8">Station 8</option>
                  <option value="Station 9">Station 9</option>
                  <option value="Station 10">Station 10</option>
                  <option value="Station 11">Station 11</option>
                  <option value="Station 12">Station 12</option>
                  <option value="Station 13">Station 13</option>
                  <option value="Station 14">Station 14</option>
                  <option value="Station 15">Station 15</option>
                  <option value="Station 16">Station 16</option>
                  <option value="Station 17">Station 17</option>
                  <option value="Station 18">Station 18</option>
                  <option value="Station 19">Station 19</option>
                  <option value="Station 20">Station 20</option>
                  <option value="Station 21">Station 21</option>
                  <option value="Station 22">Station 22</option>
                  <option value="Station 23">Station 23</option>
                  <option value="Station 24">Station 24</option>
                  <option value="Station 25">Station 25</option>
                  <option value="Station 26">Station 26</option>
                  <option value="Stabling Yard">Stabling Yard</option>                 
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
                  <option value="em_signalling">E&M Signalling</option>
                  <option value="em_communication">E&M Communication</option>
                  <option value="em_third_rail">E&M Third Rail</option>
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
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.location}</td>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <option value="tool">Tools</option>
                    <option value="general_tools">General Tools</option>
                  </select>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.itemName}
                    onChange={(e) => handleFormChange('itemName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.itemName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  >
                    <option value="">Select an item</option>
                    {itemOptions.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                  {availableQuantity !== null && (
                    <div className="mt-2 text-xs text-gray-600">Available: <span className={availableQuantity > 0 ? 'text-emerald-600' : 'text-red-600'}>{availableQuantity}</span></div>
                  )}
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

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isSaving}
                  >
                    <option value="">Select a location</option>
                    <option value="Depot">Depot</option>
                    {Array.from({ length: 26 }, (_, i) => (
                      <option key={`station-${i + 1}`} value={`Station ${i + 1}`}>
                        Station {i + 1}
                      </option>
                    ))}
                    <option value="Stabling Yard">Stabling Yard</option>
                  </select>
                  {formErrors.location && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.location}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequisition.location}</p>
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
                  onClick={handleDeleteConfirm}
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