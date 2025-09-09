import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiPackage, FiMapPin, FiTool, FiUser, FiUsers, FiBriefcase, FiBox, FiDatabase, FiRefreshCw, FiFileText, FiCalendar, FiClock, FiTag } from "react-icons/fi";
import { PageContainer } from "@/components/layout/PageContainer";
import issuanceRequisitionService from '@/services/issuanceRequisitionService';
import spareService from '@/services/spareService';
import inventoryService from '@/services/inventoryService';

interface IssuanceRequisition {
  id?: string;
  requisitionNumber: string;
  requesterName: string;
  requesterDesignation: string;
  requesterContact: string;
  requesterOltNo: string;
  department: string;
  requestDate: string;
  requiredDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "approved" | "rejected" | "completed";
  items: IssuanceRequisitionItem[];
  reason: string;
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string;
  lastUpdated?: string;
}

interface IssuanceRequisitionItem {
  itemCode?: string;
  itemName: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  priority: "low" | "medium" | "high" | "urgent";
  remarks?: string;
}

const IssuanceRequisitionPage = () => {
  const [issuanceRequisitions, setIssuanceRequisitions] = useState<IssuanceRequisition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
  const [form, setForm] = useState<Omit<IssuanceRequisition, 'id'>>({ 
    requisitionNumber: "",
    requesterName: "",
    requesterDesignation: "",
    requesterContact: "",
    requesterOltNo: "",
    department: "",
    requestDate: new Date().toISOString().split('T')[0],
    requiredDate: "",
    priority: "medium",
    status: "pending",
    items: [],
    reason: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof IssuanceRequisition; direction: 'asc' | 'desc' } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [spareParts, setSpareParts] = useState<any[]>([]);

  const addItemRow = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { itemCode: "", itemName: "", itemDescription: "", unit: "", quantity: 1, priority: "medium", remarks: "" }
      ]
    });
  };

  const removeItemRow = (index: number) => {
    const next = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: next });
  };

  const updateItemField = (index: number, field: keyof IssuanceRequisitionItem, value: any) => {
    const next = form.items.map((it, i) => (i === index ? { ...it, [field]: value } : it));
    setForm({ ...form, items: next });
  };

  const handleItemSelection = (index: number, sparePart: any) => {
    const next = form.items.map((it, i) => {
      if (i === index) {
        return {
          ...it,
          itemCode: sparePart.itemCode || sparePart.imis_code || '',
          itemDescription: sparePart.name || '',
          unit: sparePart.uom || ''
        };
      }
      return it;
    });
    setForm({ ...form, items: next });
  };

  const handlePrint = () => {
    window.print();
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('issuanceRequisitions');
    if (savedData) {
      try {
        setIssuanceRequisitions(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading Issuance Requisition data:', error);
      }
    }
  }, []);

  // Load spare parts for item code dropdown
  useEffect(() => {
    const loadSpareParts = async () => {
      try {
        const allSpares = await spareService.getAllSpareParts();
        setSpareParts(allSpares || []);
      } catch (error) {
        console.error('Error loading spare parts:', error);
      }
    };
    loadSpareParts();
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('issuanceRequisitions', JSON.stringify(issuanceRequisitions));
  }, [issuanceRequisitions]);

  // Handle sorting
  const requestSort = (key: keyof IssuanceRequisition) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get filtered items based on active tab
  const getFilteredItems = (data: IssuanceRequisition[]) => {
    let filtered = [...data];
    
    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.status === activeTab);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(item => item.department === selectedDepartment);
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

  const filteredItems = getFilteredItems(issuanceRequisitions);

  // Get unique departments for filter dropdown
  const departments = ["all", ...new Set(issuanceRequisitions.map(item => item.department))];

  // Get stats for current tab
  const getCurrentTabStats = () => {
    const currentTabItems = issuanceRequisitions.filter(item => {
      if (activeTab === "all") return true;
      return item.status === activeTab;
    });

    return {
      totalRequisitions: currentTabItems.length,
      pendingCount: issuanceRequisitions.filter(item => item.status === "pending").length,
      approvedCount: issuanceRequisitions.filter(item => item.status === "approved").length,
      completedCount: issuanceRequisitions.filter(item => item.status === "completed").length
    };
  };

  const currentStats = getCurrentTabStats();

  // Generate requisition number
  const generateRequisitionNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = issuanceRequisitions.length + 1;
    return `IR-${year}${month}${day}-${String(count).padStart(3, '0')}`;
  };

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      requisitionNumber: generateRequisitionNumber(),
      requesterName: "",
      requesterDesignation: "",
      requesterContact: "",
      requesterOltNo: "",
      department: "",
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: "",
      priority: "medium",
      status: "pending",
      items: [],
      reason: ""
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = issuanceRequisitions.find(item => item.id === id);
    if (item) {
      setForm({
        requisitionNumber: item.requisitionNumber,
        requesterName: item.requesterName,
        requesterDesignation: item.requesterDesignation,
        requesterContact: item.requesterContact,
        requesterOltNo: item.requesterOltNo,
        department: item.department,
        requestDate: item.requestDate,
        requiredDate: item.requiredDate,
        priority: item.priority,
        status: item.status,
        items: item.items,
        reason: item.reason,
        approvedBy: item.approvedBy,
        approvedDate: item.approvedDate,
        remarks: item.remarks
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this issuance requisition?")) {
      setIssuanceRequisitions(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department.trim()) {
      alert('Please fill in the Department field');
      return;
    }
    
    if (form.items.length === 0) {
      alert('Please add at least one item to the requisition');
      return;
    }
    
    // Validate items
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.itemDescription.trim()) {
        alert(`Please provide a description for item ${i + 1}`);
        return;
      }
      if (item.quantity <= 0) {
        alert(`Please provide a valid quantity for item ${i + 1}`);
        return;
      }
    }

    const updatedItem = {
      ...form,
      id: editId || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      // 1) Persist IR in DB
      if (editId) {
        await issuanceRequisitionService.update(editId, updatedItem as any);
        setIssuanceRequisitions(prev => prev.map(item => item.id === editId ? updatedItem : item));
      } else {
        const newId = await issuanceRequisitionService.create({
          requisitionNumber: updatedItem.requisitionNumber,
          department: updatedItem.department,
          requestDate: updatedItem.requestDate,
          requiredDate: updatedItem.requiredDate,
          priority: updatedItem.priority,
          status: updatedItem.status,
          items: updatedItem.items,
        });
        updatedItem.id = newId;
        setIssuanceRequisitions(prev => [...prev, updatedItem]);
      }

      // 2) For each item, deduct from spares and move to inventory
      for (const it of updatedItem.items) {
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) continue;

        // Try to find matching spare by itemCode or description
        try {
          const allSpares = await spareService.getAllSpareParts();
          const match = allSpares.find(sp => 
            (it.itemCode && sp.itemCode?.toLowerCase() === it.itemCode.toLowerCase()) ||
            sp.name?.toLowerCase() === it.itemDescription.toLowerCase()
          );
          if (match?.id) {
            await spareService.updateStock(match.id, -qty, 'Issued via IR', 'system');
          }
        } catch (err) {
          console.warn('Skipping spare deduction for item due to error:', err);
        }

        // Upsert into inventory (simple create as new record)
        try {
          const inventoryItemData: any = {
            name: it.itemDescription,
            description: it.remarks || '',
            category: form.department || 'Inventory',
            current_stock: qty,
            min_stock: 0,
            max_stock: qty,
            unit: it.unit || 'PCS',
            location: 'Issued to Department',
          };
          
          await (inventoryService as any).createItem(inventoryItemData);
        } catch (err) {
          console.warn('Skipping inventory insert for item due to error:', err);
        }
      }

      // 3) Notify other pages to refresh
      window.dispatchEvent(new Event('inventory-sync'));

      setShowModal(false);
    } catch (err) {
      console.error('Error generating IR:', err);
      alert('Failed to generate IR. Please try again.');
    }
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof IssuanceRequisition) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Refresh data
  const refreshData = () => {
    const savedData = localStorage.getItem('issuanceRequisitions');
    if (savedData) {
      try {
        setIssuanceRequisitions(JSON.parse(savedData));
      } catch (error) {
        console.error('Error refreshing Issuance Requisition data:', error);
      }
    }
  };

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8">
      <div className="w-full p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <FiFileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
                Issuance Requisition
              </h1>
            </div>
            <p className="text-gray-600 ml-11">Manage and track issuance requisitions for inventory items</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              className="flex items-center bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FiPlus className="mr-2 w-5 h-5" />
              Generate New IR
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Requisitions Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Total Requisitions</h3>
                <p className="text-3xl font-bold text-white">{currentStats.totalRequisitions}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FiFileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Pending</h3>
                <p className="text-3xl font-bold text-white">
                  {currentStats.pendingCount}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FiClock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Approved Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Approved</h3>
                <p className="text-3xl font-bold text-white">
                  {currentStats.approvedCount}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FiCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-gradient-to-br from-red-600 to-red-600 p-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Completed</h3>
                <p className="text-3xl font-bold text-white">
                  {currentStats.completedCount}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <FiPackage className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#f8f5ee] rounded-2xl shadow-lg border border-[#e1d4b1] mb-8 overflow-hidden">
          <div className="flex border-b border-[#e1d4b1]">
            {[
              { key: "all", label: "All Requisitions" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
              { key: "completed", label: "Completed" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 font-medium text-sm border-r border-[#e1d4b1] transition-all duration-200 ${
                  activeTab === tab.key 
                    ? "bg-gradient-to-r from-[#e1d4b1] to-[#d8c8a0] text-[#5c4a2a] border-b-2 border-[#8c7a5c]" 
                    : "text-[#7a6b4f] hover:text-[#5c4a2a] hover:bg-[#e1d4b1]/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${activeTab === tab.key ? 'bg-[#8c7a5c]' : 'bg-[#d8c8a0]'}`}></div>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-[#e1d4b1] mb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-3 h-3 bg-gradient-to-r from-[#8c7a5c] to-[#b39b6e] rounded-full"></div>
                <h3 className="text-xl font-bold text-[#5c4a2a]">
                  {activeTab === "all" ? "All Requisitions" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requisitions`}
                </h3>
              </div>
              <p className="text-sm text-[#7a6b4f] font-medium">
                {activeTab === "all" ? "View and manage all issuance requisitions" : `View ${activeTab} issuance requisitions`}
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search Bar */}
              <div className="flex-grow">
                <label htmlFor="search-requisitions" className="block text-sm font-medium text-[#5c4a2a] mb-1">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-[#b39b6e]" />
                  </div>
                  <input
                    id="search-requisitions"
                    type="text"
                    placeholder="Search requisition number, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/80 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#8c7a5c] focus:border-[#8c7a5c] focus:bg-white transition-all duration-200 text-[#5c4a2a] placeholder-[#b39b6e]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#b39b6e] hover:text-[#8c7a5c] transition-colors"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Department Filter */}
              <div className="w-full lg:w-64">
                <label htmlFor="department-filter" className="block text-sm font-medium text-[#5c4a2a] mb-1">Filter by Department</label>
                <select
                  id="department-filter"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/80 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#8c7a5c] focus:border-[#8c7a5c] focus:bg-white transition-all duration-200 text-[#5c4a2a]"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {searchTerm && (
              <div className="mt-1 text-sm text-gray-600">
                Searching for: <span className="font-medium">"{searchTerm}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="bg-[#f0e9db]">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1] transition-colors"
                    onClick={() => requestSort('requisitionNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Requisition #</span>
                      <span className="text-[#b39b6e]">{getSortIndicator('requisitionNumber')}</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                    Request Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-200/50">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{item.requisitionNumber}</div>
                        <div className="text-xs text-slate-500">{item.items.length} items</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{item.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{item.requestDate}</div>
                        <div className="text-xs text-slate-500">Required: {item.requiredDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      {searchTerm || selectedDepartment !== "all" 
                        ? "No requisitions match your filters" 
                        : `No ${activeTab} requisitions found`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editId ? 'Edit Issuance Requisition' : 'Generate New Issuance Requisition'}
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
                {/* Requisition Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Requisition Number</label>
                    <input
                      type="text"
                      value={form.requisitionNumber}
                      onChange={(e) => setForm({...form, requisitionNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({...form, department: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="E&M Systems">E&M Systems</option>
                      <option value="E&M Power">E&M Power</option>
                      <option value="E&M Third Rail">E&M Third Rail</option>
                      <option value="E&M Communication">E&M Communication</option>
                      <option value="E&M Signalling">E&M Signalling</option>
                      <option value="E&M Track">E&M Track</option>
                      <option value="E&M Safety and Quality">E&M Safety and Quality</option>
                    </select>
                  </div>
                </div>

                {/* Priority and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({...form, priority: e.target.value as "low" | "medium" | "high" | "urgent"})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({...form, status: e.target.value as "pending" | "approved" | "rejected" | "completed"})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>



                {/* Items Section */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-slate-900">Requested Items</h4>
                    <button type="button" onClick={addItemRow} className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                      <FiPlus className="mr-2" /> Add Row
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Sr. No</th>
                                                     <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Item Code (Brand/IMIS)</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Remarks</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {form.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-4 text-sm text-slate-500">No items added. Use "Add Row" to insert a new item.</td>
                          </tr>
                        )}
                        {form.items.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-slate-600">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <select
                                value={row.itemCode || ""}
                                onChange={(e) => {
                                  const selectedSpare = spareParts.find(sp => 
                                    (sp.itemCode === e.target.value) || (sp.imis_code === e.target.value)
                                  );
                                  if (selectedSpare) {
                                    handleItemSelection(idx, selectedSpare);
                                  } else {
                                    updateItemField(idx, "itemCode", e.target.value);
                                  }
                                }}
                                className="w-36 px-2 py-1 border border-slate-200 rounded-md text-sm"
                              >
                                <option value="">Select Item</option>
                                {spareParts.map((spare, spareIdx) => (
                                  <option 
                                    key={spareIdx} 
                                    value={spare.itemCode || spare.imis_code || ''}
                                  >
                                    {spare.itemCode || spare.imis_code || ''} - {spare.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={row.itemDescription}
                                onChange={(e) => updateItemField(idx, "itemDescription", e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                                placeholder="Item description"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={row.unit}
                                onChange={(e) => updateItemField(idx, "unit", e.target.value)}
                                className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm"
                                placeholder="Unit"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={row.quantity}
                                onChange={(e) => updateItemField(idx, "quantity", parseInt(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={row.remarks || ""}
                                onChange={(e) => updateItemField(idx, "remarks", e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                                placeholder="Remarks"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button type="button" onClick={() => removeItemRow(idx)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {showPreview ? 'Hide Preview' : 'Preview'}
                    </button>
                    {showPreview && (
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                      >
                        Print
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editId ? 'Update Requisition' : 'Generate Requisition'}
                  </button>
                </div>

                {showPreview && (
                  <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 ir-print-area" ref={previewRef}>
                    <div className="text-center mb-4">
                      <div className="font-semibold text-slate-800">NORINCO-GMG-DAEWOO (JV)</div>
                      <div className="text-sm text-slate-600">Store Issue Requisition Form</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Date:</span> {form.requestDate || ''}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">Issue Request #</span> {form.requisitionNumber || ''}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="font-medium">Requested By Sub Department:</span> E & M System
                      </div>
                      <div className="text-right">
                        <span className="font-medium">Department:</span> Equipment & Maintenance
                      </div>
                    </div>

                    <table className="w-full text-sm border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-2 py-1 text-left">Sr. No</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Item Code</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Description</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Unit</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Quantity</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.length === 0 ? (
                          <tr>
                            <td className="border border-slate-300 px-2 py-6 text-center" colSpan={6}>No items</td>
                          </tr>
                        ) : (
                          form.items.map((it, i) => (
                            <tr key={i}>
                              <td className="border border-slate-300 px-2 py-1">{i + 1}</td>
                              <td className="border border-slate-300 px-2 py-1">{it.itemCode || ''}</td>
                              <td className="border border-slate-300 px-2 py-1">{it.itemDescription}</td>
                              <td className="border border-slate-300 px-2 py-1">{it.unit}</td>
                              <td className="border border-slate-300 px-2 py-1">{it.quantity}</td>
                              <td className="border border-slate-300 px-2 py-1">{it.remarks || ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <div className="text-xs text-slate-600 mt-2">No. Note:</div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <div className="h-10 border-b border-slate-400"></div>
                        <div className="text-sm text-slate-700 mt-1">Requested By:</div>
                        <div className="text-xs text-slate-500">Date: ____________________________</div>
                      </div>
                      <div className="text-right">
                        <div className="h-10 border-b border-slate-400"></div>
                        <div className="text-sm text-slate-700 mt-1">Approved by Manager:</div>
                        <div className="text-xs text-slate-500">Date: ____________________________</div>
                      </div>
                    </div>

                    <div className="mt-6 text-sm font-medium">TO BE FILLED IN BY STORES</div>
                    <div className="grid grid-cols-2 gap-6 mt-3">
                      <div>
                        <div className="h-10 border-b border-slate-400"></div>
                        <div className="text-sm text-slate-700 mt-1">Received by:</div>
                        <div className="text-xs text-slate-500">Date: ____________________________</div>
                      </div>
                      <div className="text-right">
                        <div className="h-10 border-b border-slate-400"></div>
                        <div className="text-sm text-slate-700 mt-1">Issued by:</div>
                        <div className="text-xs text-slate-500">Date: ____________________________</div>
                      </div>
                    </div>
                    <style>{`
                      @media print {
                        body * { visibility: hidden; }
                        .ir-print-area, .ir-print-area * { visibility: visible; }
                        .ir-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
                        .ir-print-area table { page-break-inside: avoid; }
                      }
                    `}</style>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default IssuanceRequisitionPage;
