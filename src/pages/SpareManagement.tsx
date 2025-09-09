import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiChevronDown, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { PageContainer } from "@/components/layout/PageContainer";
import spareService from "../services/spareService";
import { toast } from "../components/ui/use-toast";
import { SparePart, TabData, SystemCategory } from "../types/spareTypes";

const SpareManagement: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState("O&M");
  const [activeSubTab, setActiveSubTab] = useState("BAS");
  const [tabData, setTabData] = useState<Record<string, TabData>>({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>({ 
    name: "", 
    quantity: 0, 
    location: "", 
    uom: "", 
    imis_code: "", 
    boq_number: "",
    itemCode: "",
    partNumber: "",
    belongsto: "",
    category: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SparePart; direction: 'asc' | 'desc' } | null>(null);

  // Scrollbar sync refs/state
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [horizontalScrollWidth, setHorizontalScrollWidth] = useState<number>(0);

  // Define system categories with separate O&M and PMA categories
  const systemCategories: SystemCategory[] = [
    // O&M Categories
    { key: "om_BAS", name: "BAS", omFile: "om/bas.json", pmaFile: "", type: 'om' },
    { key: "om_BATTERIES", name: "BATTERIES", omFile: "om/batteries.json", pmaFile: "", type: 'om' },
    { key: "om_ELEVATOR", name: "ELEVATOR", omFile: "om/elevator.json", pmaFile: "", type: 'om' },
    { key: "om_ESCALATOR", name: "ESCALATOR", omFile: "om/escalator.json", pmaFile: "", type: 'om' },
    { key: "om_FAS", name: "FAS", omFile: "om/fas.json", pmaFile: "", type: 'om' },
    { key: "om_FES", name: "FES", omFile: "om/fes.json", pmaFile: "", type: 'om' },
    { key: "om_GENERAL_ITEMS", name: "GENERAL ITEMS", omFile: "om/general_items.json", pmaFile: "", type: 'om' },
    { key: "om_HVAC", name: "HVAC", omFile: "om/hvac.json", pmaFile: "", type: 'om' },
    { key: "om_ILLUMINATION", name: "ILLUMINATION", omFile: "om/illumination.json", pmaFile: "", type: 'om' },
    { key: "om_PSD", name: "PSD", omFile: "om/psd.json", pmaFile: "", type: 'om' },
    { key: "om_WSD", name: "WSD", omFile: "om/wsd.json", pmaFile: "", type: 'om' },
    
    // PMA Categories (keeping the original ones)
    { key: "PMA_BAS", name: "BAS", omFile: "", pmaFile: "pma/bas.json", type: 'pma' },
    { key: "PMA_FAS", name: "FAS", omFile: "", pmaFile: "pma/fas.json", type: 'pma' },
    { key: "PMA_FES", name: "FES", omFile: "", pmaFile: "pma/fes.json", type: 'pma' },
    { key: "PMA_PSCADA", name: "PSCADA", omFile: "", pmaFile: "pma/pscada.json", type: 'pma' },
    { key: "PMA_ELEVATOR", name: "ELEVATOR", omFile: "", pmaFile: "pma/elevator.json", type: 'pma' },
    { key: "PMA_ESCALATOR", name: "ESCALATOR", omFile: "", pmaFile: "pma/escalator.json", type: 'pma' },
    { key: "PMA_PSD", name: "PSD", omFile: "", pmaFile: "pma/psd.json", type: 'pma' },
    { key: "PMA_HVAC", name: "HVAC", omFile: "", pmaFile: "pma/hvac.json", type: 'pma' },
    { key: "PMA_WSD", name: "WSD", omFile: "", pmaFile: "pma/wsd.json", type: 'pma' },
    { key: "PMA_ILLUMINATION", name: "ILLUMINATION", omFile: "", pmaFile: "pma/illumination.json", type: 'pma' }
  ];

  // Get categories for current main tab
  const getCurrentTabCategories = () => {
    return systemCategories.filter(cat => 
      activeMainTab === "O&M" ? cat.type === 'om' : cat.type === 'pma'
    );
  };

  // Update active sub tab when main tab changes
  useEffect(() => {
    const currentCategories = getCurrentTabCategories();
    if (currentCategories.length > 0 && !currentCategories.find(cat => cat.key === activeSubTab)) {
      setActiveSubTab(currentCategories[0].key);
    }
  }, [activeMainTab]);

  // Compute and sync scroll widths
  useEffect(() => {
    const updateWidth = () => {
      const width = tableRef.current?.scrollWidth || 0;
      setHorizontalScrollWidth(width);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [tabData, activeMainTab, activeSubTab]);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableContainerRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  // Load data for a specific tab
  const loadTabData = useCallback(async (tabKey: string, mainTab: string) => {
    const category = systemCategories.find(cat => cat.key === tabKey);
    if (!category) return;

    const tabId = `${mainTab}_${tabKey}`;
    
    setTabData(prev => ({
      ...prev,
      [tabId]: {
        name: category.name,
        data: [],
        loading: true,
        error: null
      }
    }));

    try {
      // Load from Firebase with proper filtering based on belongsto and source tracking
      let spareParts = await spareService.getSparePartsByCategory(category.name);
      
      // Filter data based on the main tab (O&M vs PMA) and source tracking
      if (spareParts && spareParts.length > 0) {
        spareParts = spareParts.filter(part => {
          // Check if the item belongs to the correct main category
          const belongsToMainTab = part.belongsto?.includes(mainTab) || 
                                  part.source_category?.includes(mainTab) ||
                                  part.belongsto === mainTab;
          
          // Additional check for source tracking
          const sourceMatches = part.source_category === mainTab || 
                              (mainTab === "O&M" && part.source_category?.includes("O&M")) ||
                              (mainTab === "PMA" && part.source_category?.includes("PMA"));
          
          return belongsToMainTab || sourceMatches;
        });
        
        if (spareParts.length > 0) {
          setTabData(prev => ({
            ...prev,
            [tabId]: {
              name: category.name,
              data: spareParts,
              loading: false,
              error: null
            }
          }));
          return;
        }
      }

      // Fallback to local JSON files if no data in Firebase
      const fileName = mainTab === "O&M" ? category.omFile : category.pmaFile;
      if (!fileName) {
        throw new Error(`No data file configured for ${mainTab} ${category.name}`);
      }
      
      const response = await fetch(`/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }
      
      const data = await response.json();
      let formattedParts: SparePart[] = [];

      if (category.key === "WSD" || category.key === "PMA_WSD") {
        // Handle WSD structure (array format)
        formattedParts = (data || [])
          .filter((item: any) => item && item["Item_Description"])
          .map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: item["Item_Description"] || "",
            quantity: Number(item["Quantity"]) || 0,
            location: item["Location"] || "C&C Warehouse, Depot",
            itemCode: item["Sr_No"]?.toString() || "",
            imis_code: item["IMIS_Code"] || "",
            uom: item["UOM"] || "",
            partNumber: item["Specification"] || "",
            boq_number: item["BOQ_No"]?.toString() || "",
            belongsto: `${mainTab} - ${category.name}`, // Ensure proper belongsto
            category: category.name,
            source_category: mainTab,
            source_system: category.name,
            source_file: fileName,
            lastUpdated: new Date().toISOString().split('T')[0]
          }));
      } else {
        // Handle other JSON structures
        const key = Object.keys(data)[0];
        const items = data[key] || [];
        
        formattedParts = items
          .filter((item: any) => {
            const inventoryField = item[key + " (Spares Inventory)"] || 
                                item["(Sanitary Items Inventory)"] ||
                                item["PSCADA System - (Spares Inventory)"] ||
                                item["Item Detail"] ||
                                item["Item_Description"] || 
                                item["Item Description"] ||
                                item["Item Name"];
            return item && inventoryField && inventoryField !== "-";
          })
          .map((item: any) => {
            const itemName = item[key + " (Spares Inventory)"] || 
                           item["(Sanitary Items Inventory)"] ||
                           item["PSCADA System - (Spares Inventory)"] ||
                           item["Item Detail"] ||
                           item["Item_Description"] || 
                           item["Item Description"] ||
                           item["Item Name"] || "";
            const belongsto = item["Item Belongs To"] || "";

            const quantity = Number(item["Quantity"]) || 
                           Number(item["Current Balance"]) || 
                           Number(item["In-stock"]) || 0;

            const imis_code = item["IMIS Codes"] || 
                           item[" IMIS Codes"] ||
                           item["IMIS Code"] || 
                           item["IMIS_Code"] || 
                           item["IMIS CODE"] || "";

            const uom = item["UOM"] || item["U/M"] || "";
            const partNumber = item["Part #"] || item[" Part #"] || item["Part Number"] || item["Specification"] || "";
            const category = item["Category"] || item["category"] || item["Catagory"] || "";
            const boq_number = item["BOQ #"] || item[" BOQ #"] || item["BOQ_No"] || item["BOQ Number"] || "";
            const serialNumber = item["Sr. #"] || item[" Sr. #"] || item["Sr_No"] || item["Serial Number"] || "";

            return {
              id: Math.random().toString(36).substr(2, 9),
              name: itemName,
              belongsto: `${mainTab} - ${category.name}`, // Ensure proper belongsto
              quantity: quantity,
              location: item["Location"] || "C&C Warehouse, Depot",
              itemCode: serialNumber?.toString() || "",
              imis_code: imis_code,
              uom: uom,
              partNumber: partNumber,
              category: category || category.name,
              boq_number: boq_number,
              source_category: mainTab,
              source_system: category.name,
              source_file: fileName,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          });

        // Save to Firebase if we loaded from JSON
        if (formattedParts.length > 0) {
          try {
            await Promise.all(formattedParts.map(part => spareService.createSparePart(part)));
          } catch (err) {
            console.error('Error saving initial data to Firebase:', err);
          }
        }
      }

      setTabData(prev => ({
        ...prev,
        [tabId]: {
          name: category.name,
          data: formattedParts,
          loading: false,
          error: null
        }
      }));
    } catch (err) {
      console.error(`Error loading ${tabKey} data for ${mainTab}:`, err);
      setTabData(prev => ({
        ...prev,
        [tabId]: {
          name: category.name,
          data: [],
          loading: false,
          error: `Failed to load ${mainTab} ${category.name} data`
        }
      }));
    }
  }, []);

  // Load data when main tab or sub tab changes
  useEffect(() => {
    if (activeMainTab && activeSubTab) {
      loadTabData(activeSubTab, activeMainTab);
    }
  }, [activeMainTab, activeSubTab]);

  // Live refresh when global inventory updates occur (e.g., after requisition issues/returns)
  useEffect(() => {
    const handler = () => {
      if (activeMainTab && activeSubTab) {
        loadTabData(activeSubTab, activeMainTab);
      }
    };
    window.addEventListener('inventory-sync', handler as any);
    return () => window.removeEventListener('inventory-sync', handler as any);
  }, [activeMainTab, activeSubTab, loadTabData]);

  const currentTabId = `${activeMainTab}_${activeSubTab}`;

  // Note: Firebase doesn't have the same real-time subscription structure as Supabase
  // For now, we'll refresh data manually when needed
  // In production, consider using onSnapshot from Firestore

  // Handle sorting
  const requestSort = (key: keyof SparePart) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting, filtering and searching
  const getFilteredItems = (data: SparePart[]) => {
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.imis_code && item.imis_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedLocation !== "all") {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
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

  const currentTabData = tabData[currentTabId];
  const filteredItems = currentTabData ? getFilteredItems(currentTabData.data) : [];

  // Get unique locations for filter dropdown
  const locations = currentTabData 
    ? ["all", ...new Set(currentTabData.data.map(item => item.location))]
    : ["all"];

  // Modal handlers
  const openAddModal = () => {
    setForm({ 
      name: "", 
      quantity: 0, 
      location: "", 
      uom: "", 
      imis_code: "", 
      boq_number: "",
      itemCode: "",
      partNumber: ""
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = currentTabData?.data.find(item => item.id === id);
    if (item) {
      setForm({
        name: item.name,
        quantity: item.quantity,
        location: item.location,
        uom: item.uom || "",
        imis_code: item.imis_code || "",
        boq_number: item.boq_number || "",
        itemCode: item.itemCode || "",
        partNumber: item.partNumber || ""
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      try {
        await spareService.deleteSparePart(id);
        // The real-time subscription will handle the UI update
        toast({
          title: "Success",
          description: "Item removed successfully",
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.quantity < 0 || !form.location.trim()) return;

    const currentCategory = systemCategories.find(cat => cat.key === activeSubTab);
    const itemData = {
      ...form,
      // Add category and belongsto based on current tab if not set
      category: form.category || currentCategory?.name || '',
      belongsto: form.belongsto || activeMainTab,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      if (editId) {
        // Update existing item
        await spareService.updateSparePart(editId, itemData);
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Add new item
        await spareService.createSparePart(itemData);
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }

      // Reset form with default values
      if (!editId) {
        setForm({
          name: '',
          quantity: 0,
          location: '',
          uom: '',
          imis_code: '',
          boq_number: '',
          itemCode: '',
          partNumber: '',
          category: '',
          belongsto: ''
        });
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof SparePart) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Refresh current tab data
  const refreshCurrentTab = () => {
    if (activeMainTab && activeSubTab) {
      loadTabData(activeSubTab, activeMainTab);
    }
  };

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent">
                  Spare Management
                </h1>
                <p className="text-gray-600 font-medium">Track and manage your spare parts inventory across all systems</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshCurrentTab}
              className="flex items-center bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              disabled={currentTabData?.loading}
            >
              <FiRefreshCw className={`mr-2 ${currentTabData?.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
            >
              <FiPlus className="mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {currentTabData && !currentTabData.loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Items Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/80 font-medium text-sm uppercase tracking-wide">Total Items</h3>
                  <p className="text-3xl font-bold text-white mt-2">{currentTabData.data.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Quantity Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/80 font-medium text-sm uppercase tracking-wide">Total Quantity</h3>
                  <p className="text-3xl font-bold text-white mt-2">
                    {currentTabData.data.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Warehouses Card */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/80 font-medium text-sm uppercase tracking-wide">Warehouses</h3>
                  <p className="text-3xl font-bold text-white mt-2">
                    {new Set(currentTabData.data.map(item => item.location)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Low Stock Items Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/80 font-medium text-sm uppercase tracking-wide">Low Stock Items</h3>
                  <p className="text-3xl font-bold text-white mt-2">
                    {currentTabData.data.filter(item => item.quantity < 100).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="bg-[#f8f5ee] rounded-2xl shadow-lg border border-[#e1d4b1] mb-8 overflow-hidden">
          {/* Main Tabs */}
          <div className="flex border-b border-[#e1d4b1]">
            <button
              onClick={() => setActiveMainTab("O&M")}
              className={`px-8 py-5 font-semibold text-sm border-r border-[#e1d4b1] transition-all duration-200 ${
                activeMainTab === "O&M" 
                  ? "bg-gradient-to-r from-[#e1d4b1] to-[#d8c8a0] text-[#5c4a2a] border-b-2 border-[#b39b6e]" 
                  : "text-[#7a6b4f] hover:text-[#5c4a2a] hover:bg-[#e1d4b1]/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeMainTab === "O&M" ? 'bg-[#8c7a5c]' : 'bg-[#d8c8a0]'}`}></div>
                <span>O&M (Operations & Maintenance)</span>
              </div>
            </button>
            <button
              onClick={() => setActiveMainTab("PMA")}
              className={`px-8 py-5 font-semibold text-sm transition-all duration-200 ${
                activeMainTab === "PMA" 
                  ? "bg-gradient-to-r from-[#e1d4b1] to-[#d8c8a0] text-[#5c4a2a] border-b-2 border-[#b39b6e]" 
                  : "text-[#7a6b4f] hover:text-[#5c4a2a] hover:bg-[#e1d4b1]/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${activeMainTab === "PMA" ? 'bg-[#8c7a5c]' : 'bg-[#d8c8a0]'}`}></div>
                <span>PMA (Punjab Mass Transit Authority)</span>
              </div>
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="p-6 bg-gradient-to-r from-[#f0e9db] to-[#e1d4b1]">
            <div className="flex flex-wrap gap-3">
              {getCurrentTabCategories().map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveSubTab(category.key)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap border ${
                    activeSubTab === category.key
                      ? "bg-gradient-to-r from-[#8c7a5c] to-[#6b5d45] text-white shadow-lg transform scale-105 border-[#b39b6e]"
                      : "bg-white/80 text-[#5c4a2a] hover:bg-[#e1d4b1] border-[#e1d4b1] hover:border-[#b39b6e] hover:shadow-md"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {/* Filters */}
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-[#e1d4b1] mb-8 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-[#8c7a5c] to-[#b39b6e] rounded-full"></div>
                  <h3 className="text-xl font-bold text-[#5c4a2a]">
                    {activeMainTab} - {currentTabData?.name || activeSubTab}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {activeMainTab === "O&M" ? "Operations & Maintenance Inventory" : "Punjab Mass Transit Authority Inventory"}
                </p>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                {/* Enhanced Search Bar */}
                <div className="flex-grow max-w-2xl">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by name, code, or IMIS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Location Filter */}
                <div className="w-full lg:w-56">
                  <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
                  <select
                    id="location-filter"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-700"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc === "all" ? "All Locations" : loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Searching for: <span className="font-medium">"{searchTerm}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading/Error States */}
          {currentTabData?.loading && (
            <div className="bg-white p-8 rounded-lg shadow mb-6 text-center">
              <FiRefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-600">Loading {currentTabData.name} data...</p>
            </div>
          )}
          
          {currentTabData?.error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <FiX className="mr-2" />
                <p>{currentTabData.error}</p>
                <button
                  onClick={refreshCurrentTab}
                  className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          {!currentTabData?.loading && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Top horizontal scrollbar */}
              <div
                className="overflow-x-auto h-4 mb-1"
                ref={topScrollRef}
                onScroll={handleTopScroll}
              >
                <div style={{ width: horizontalScrollWidth }} />
              </div>

              {/* Main scroll area with both axes */}
              <div
                className="max-h-[70vh] overflow-x-auto overflow-y-auto"
                ref={tableContainerRef}
                onScroll={handleTableScroll}
              >
                <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f0e9db]">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]"
                        onClick={() => requestSort('name')}
                      >
                        <div className="flex items-center">
                          Item Name {getSortIndicator('name')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        Belongs To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        IMIS Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        BOQ Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        Part Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        UOM
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]"
                        onClick={() => requestSort('quantity')}
                      >
                        <div className="flex items-center">
                          Quantity {getSortIndicator('quantity')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider cursor-pointer hover:bg-[#e1d4b1]"
                        onClick={() => requestSort('location')}
                      >
                        <div className="flex items-center">
                          Location {getSortIndicator('location')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5c4a2a] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.itemCode && (
                              <div className="text-xs text-gray-500">Code: {item.itemCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.belongsto || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.imis_code || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.boq_number || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.partNumber || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.category || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.uom || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${
                              item.quantity < 10 ? 'text-red-600 font-bold' : 
                              item.quantity < 100 ? 'text-orange-600 font-medium' : 
                              'text-gray-500'
                            }`}>
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.location}</div>
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
                        <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                          {currentTabData?.error 
                            ? "Failed to load data"
                            : searchTerm || selectedLocation !== "all" 
                              ? "No items match your filters" 
                              : "No items found in inventory"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-lg font-semibold">
                  {editId ? "Edit Spare Item" : "Add New Spare Item"}
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
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Belongs To *
                  </label>
                  <select
                    name="belongsto"
                    value={form.belongsto}
                    onChange={(e) => setForm({ ...form, belongsto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select an option</option>
                    <option value="O&M">O&M</option>
                    <option value="PMA">PMA</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMIS Code
                    </label>
                    <input
                      name="imis_code"
                      value={form.imis_code}
                      onChange={(e) => setForm({ ...form, imis_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="IMIS Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BOQ Number
                    </label>
                    <input
                      name="boq_number"
                      value={form.boq_number}
                      onChange={(e) => setForm({ ...form, boq_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="BOQ Number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Code
                    </label>
                    <input
                      name="itemCode"
                      value={form.itemCode}
                      onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item Code"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      disabled={!form.belongsto}
                      required
                    >
                      <option value="">Select a category</option>
                      {systemCategories
                        .filter(cat => {
                          if (!form.belongsto) return false;
                          const selectedType = form.belongsto === 'O&M' ? 'om' : 'pma';
                          return cat.type === selectedType;
                        })
                        .map((category) => (
                          <option key={category.key} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    name="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select a location</option>
                    <option value="C&C Warehouse Depot">C&C Warehouse Depot</option>
                    <option value="C&C Warehouse Stabling Yard">C&C Warehouse Stabling Yard</option>
                    <option value="CMC Ground Floor Store">CMC Ground Floor Store</option>
                    <option value="CMC 2nd Floor Store">CMC 2nd Floor Store</option>
                  </select>
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
                    {editId ? "Save Changes" : "Add Item"}
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
export default SpareManagement;  