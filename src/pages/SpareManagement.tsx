import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiChevronDown, FiChevronRight, FiRefreshCw } from "react-icons/fi";

interface SparePart {
  id?: string;
  name: string;
  quantity: number;
  location: string;
  lastUpdated?: string;
  itemCode?: string;
  imisCode?: string;
  uom?: string;
  partNumber?: string;
  boqNumber?: string;
  belongsto?: string;
}

interface TabData {
  name: string;
  data: SparePart[];
  loading: boolean;
  error: string | null;
}

interface SystemCategory {
  key: string;
  name: string;
  omFile: string;  // O&M JSON file
  pmaFile: string; // PMA JSON file
  type: 'om' | 'pma' | 'both'; // Indicates which tabs this category appears in
}

const SpareManagement = () => {
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
    imisCode: "", 
    boqNumber: "",
    itemCode: "",
    partNumber: "",
    belongsto: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // System categories
  const systemCategories: SystemCategory[] = [
    { key: "bas", name: "BAS", omFile: "bas_om.json", pmaFile: "bas_pma.json", type: 'both' },
    { key: "fire", name: "Fire Fighting", omFile: "fire_om.json", pmaFile: "fire_pma.json", type: 'both' },
    { key: "plumbing", name: "Plumbing", omFile: "plumbing_om.json", pmaFile: "plumbing_pma.json", type: 'both' },
    { key: "electrical", name: "Electrical", omFile: "electrical_om.json", pmaFile: "electrical_pma.json", type: 'both' },
    { key: "hvac", name: "HVAC", omFile: "hvac_om.json", pmaFile: "hvac_pma.json", type: 'both' },
  ];

  // Load data for the current tab
  useEffect(() => {
    const loadData = async () => {
      const currentCategory = systemCategories.find(cat => cat.key === activeSubTab);
      if (!currentCategory) return;

      const fileToLoad = activeMainTab === "O&M" ? currentCategory.omFile : currentCategory.pmaFile;
      
      setTabData(prev => ({
        ...prev,
        [activeSubTab]: {
          ...prev[activeSubTab],
          loading: true,
          error: null
        }
      }));

      try {
        // Simulate API call
        // In a real app, you would fetch this from your backend
        const response = await import(`@/data/${fileToLoad}`);
        
        setTabData(prev => ({
          ...prev,
          [activeSubTab]: {
            name: `${currentCategory.name} ${activeMainTab} Inventory`,
            data: response.default,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error(`Error loading ${fileToLoad}:`, error);
        setTabData(prev => ({
          ...prev,
          [activeSubTab]: {
            ...prev[activeSubTab],
            loading: false,
            error: `Failed to load ${activeMainTab} data for ${currentCategory.name}`
          }
        }));
      }
    };

    loadData();
  }, [activeMainTab, activeSubTab]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for adding/editing items would go here
    console.log('Form submitted:', form);
    setShowModal(false);
  };

  // Open edit modal with item data
  const openEditModal = (id: string) => {
    const currentItems = tabData[activeSubTab]?.data || [];
    const itemToEdit = currentItems.find(item => item.id === id);
    if (itemToEdit) {
      setForm({
        name: itemToEdit.name,
        quantity: itemToEdit.quantity,
        location: itemToEdit.location,
        uom: itemToEdit.uom || "",
        imisCode: itemToEdit.imisCode || "",
        boqNumber: itemToEdit.boqNumber || "",
        itemCode: itemToEdit.itemCode || "",
        partNumber: itemToEdit.partNumber || "",
        belongsto: itemToEdit.belongsto || ""
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  // Get unique locations for filter
  const locations = Array.from(new Set(
    Object.values(tabData).flatMap(tab => 
      tab.data?.map(item => item.location) || []
    )
  )).filter(Boolean) as string[];

  // Filter items based on search term and location
  const filteredItems = tabData[activeSubTab]?.data?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation;
    return matchesSearch && matchesLocation;
  }) || [];

  const currentTabData = tabData[activeSubTab];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spare Parts Management</h1>
          <p className="text-muted-foreground">
            Manage and track all spare parts inventory
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              name: "",
              quantity: 0,
              location: "",
              uom: "",
              imisCode: "",
              boqNumber: "",
              itemCode: "",
              partNumber: "",
              belongsto: ""
            });
            setEditId(null);
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 h-10"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          Add New Item
        </button>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        {/* Main Tabs */}
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          {["O&M", "PMA"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeMainTab === tab
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-1">
          {systemCategories
            .filter(cat => cat.type === 'both' || cat.type.toLowerCase() === activeMainTab.toLowerCase())
            .map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveSubTab(category.key)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeSubTab === category.key
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or item code..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="all">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="rounded-md border">
        {currentTabData?.loading ? (
          <div className="flex items-center justify-center p-8">
            <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : currentTabData?.error ? (
          <div className="p-8 text-center text-destructive">
            {currentTabData.error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IMIS Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BOQ Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.belongsto || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.itemCode || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.imisCode || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.boqNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.partNumber || '-'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(item.id!)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          // onClick={() => handleRemove(item.id!)}
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
                    <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                      {searchTerm || selectedLocation !== "all" 
                        ? "No items match your filters" 
                        : "No items found in inventory"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">
                {editId ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <FiX className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item Belongs To <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="belongsto"
                  value={form.belongsto}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={form.quantity}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unit of Measure (UOM)
                  </label>
                  <input
                    type="text"
                    name="uom"
                    value={form.uom}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g., PCS, KG, M"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    IMIS Code
                  </label>
                  <input
                    type="text"
                    name="imisCode"
                    value={form.imisCode}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="IMIS Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    BOQ Number
                  </label>
                  <input
                    type="text"
                    name="boqNumber"
                    value={form.boqNumber}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="BOQ Number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Item Code
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    value={form.itemCode}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Item Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Part Number
                  </label>
                  <input
                    type="text"
                    name="partNumber"
                    value={form.partNumber}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Part Number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Location <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  {editId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpareManagement;
