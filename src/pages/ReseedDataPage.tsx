import React, { useMemo, useState } from 'react';
import { FirebaseService } from '@/lib/firebaseService';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';

// Files organized by main categories and systems with unique identifiers
const FILE_CATEGORIES = {
  'PMA (Punjab Mass Transit Authority)': {
    'BAS': 'pma/bas.json',
    'FAS': 'pma/fas.json',
    'FES': 'pma/fes.json',
    'PSCADA': 'pma/pscada.json',
    'ELEVATOR': 'pma/elevator.json',
    'ESCALATOR': 'pma/escalator.json',
    'PSD': 'pma/psd.json',
    'HVAC': 'pma/hvac.json',
    'WSD': 'pma/wsd.json',
    'ILLUMINATION': 'pma/illumination.json',
    'SANITARY': 'pma/sanitary.json',
    'SPARE PARTS OM': 'pma/spare-parts-OM.json',
  },
  'O&M (Operations & Maintenance)': {
    'BAS': 'om/bas.json',
    'BATTERIES': 'om/batteries.json',
    'ELEVATOR': 'om/elevator.json',
    'ESCALATOR': 'om/escalator.json',
    'FAS': 'om/fas.json',
    'FES': 'om/fes.json',
    'GENERAL ITEMS': 'om/general_items.json',
    'HVAC': 'om/hvac.json',
    'ILLUMINATION': 'om/illumination.json',
    'PSD': 'om/psd.json',
    'WSD': 'om/wsd.json',
  }
};

// Additional inventory categories for reseeding
const INVENTORY_CATEGORIES = {
  'Faulty Returns': {
    'FAULTY RETURNS': 'faulty-returns.json',
  },
  'PPE Items': {
    'PPE ITEMS': 'ppe-items.json',
  },
  'Stationery Items': {
    'STATIONERY': 'stationery-items.json',
  },
  'Asset Management': {
    'ASSETS': 'assets.json',
  },
  'Inventory': {
    'INVENTORY': 'inventory.json',
  },
  'Tools': {
    'TOOLS': 'tools.json',
  },
  'General Tools': {
    'GENERAL TOOLS': 'general-tools.json',
  }
};

// Flatten for easy access
const AVAILABLE_FILES = Object.values(FILE_CATEGORIES).flatMap(category => Object.values(category));
const AVAILABLE_INVENTORY_FILES = Object.values(INVENTORY_CATEGORIES).flatMap(category => Object.values(category));

const BATCH_SIZE = 200;

type SparePartRow = {
  name: string;
  belongsto: string;
  quantity?: number;
  location?: string;
  itemCode?: string;
  imis_code?: string;
  uom?: string;
  partNumber?: string;
  category: string;
  boq_number?: string;
  lastUpdated?: string | null;
  last_updated?: string | null;
  source_file: string;
  source_category: string;
  source_system: string;
};

type InventoryItemRow = {
  name: string;
  category: string;
  quantity?: number;
  location?: string;
  itemCode?: string;
  description?: string;
  status?: string;
  condition?: string;
  assignedTo?: string;
  purchaseDate?: string;
  lastUpdated?: string | null;
  source_file: string;
  source_category: string;
};

function coerceString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function coerceNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function coerceDate(value: any): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function mapToSparePart(row: any, category: string, system: string, sourceFile: string): SparePartRow {
  // Common resolver for BOQ-like fields
  const resolveBoq = () => coerceString(
    row['BOQ #'] ?? row['BOQ'] ?? row['BOQ No'] ?? row['BOQ no'] ?? row['BOQ Number'] ?? row['BOQ number'] ?? row['boq_number'] ?? row['boqNumber'] ?? ''
  );

  // Handle different JSON structures based on file type
  if (system === 'BAS') {
    return {
      name: coerceString(row['BAS (Spares Inventory)'] ?? row['Item Name'] ?? ''),
      belongsto: `${category} - ${system}`, // Unique identifier
      quantity: coerceNumber(row['Quantity'] ?? 0),
      location: coerceString(row['Location'] ?? ''),
      itemCode: coerceString(row['Item Code (Brand)'] ?? row['IMIS Codes'] ?? row['IMIS CODE'] ?? ''),
      imis_code: coerceString(row['IMIS Codes'] ?? row['IMIS CODE'] ?? ''),
      uom: coerceString(row['UOM'] ?? ''),
      partNumber: coerceString(row['Sr. #'] ?? ''),
      category: system,
      boq_number: resolveBoq(),
      lastUpdated: null,
      last_updated: null,
      source_file: sourceFile,
      source_category: category,
      source_system: system,
    };
  } else if (system === 'SPARE PARTS OM') {
    return {
      name: coerceString(row['Item Name'] ?? ''),
      belongsto: `${category} - ${system}`, // Unique identifier
      quantity: coerceNumber(row['In-stock'] ?? row['Stock Received from Warehouse (20-7/23)'] ?? 0),
      location: coerceString(row['Location'] ?? ''),
      itemCode: coerceString(row['Item Code (Brand)'] ?? row['IMIS CODE'] ?? ''),
      imis_code: coerceString(row['IMIS CODE'] ?? ''),
      uom: coerceString(row['U/M'] ?? ''),
      partNumber: coerceString(row['Item Code (Brand)'] ?? ''),
      category: system,
      boq_number: resolveBoq(),
      lastUpdated: null,
      last_updated: null,
      source_file: sourceFile,
      source_category: category,
      source_system: system,
    };
  } else {
    // Generic mapping for other systems
    return {
      name: coerceString(row.name ?? row['Item Name'] ?? row['BAS (Spares Inventory)'] ?? row['Item'] ?? ''),
      belongsto: `${category} - ${system}`, // Unique identifier
      quantity: coerceNumber(row.quantity ?? row['Quantity'] ?? row['In-stock'] ?? row['Stock Received from Warehouse (20-7/23)'] ?? 0),
      location: coerceString(row.location ?? row['Location'] ?? ''),
      itemCode: coerceString(row['Item Code (Brand)'] ?? row.itemCode ?? row['IMIS Codes'] ?? row['IMIS CODE'] ?? ''),
      imis_code: coerceString(row.imis_code ?? row['IMIS Codes'] ?? row['IMIS CODE'] ?? ''),
      uom: coerceString(row.uom ?? row['UOM'] ?? row['U/M'] ?? ''),
      partNumber: coerceString(row.partNumber ?? row['Sr. #'] ?? row['Item Code (Brand)'] ?? ''),
      category: system,
      boq_number: resolveBoq(),
      lastUpdated: null,
      last_updated: null,
      source_file: sourceFile,
      source_category: category,
      source_system: system,
    };
  }
}

function mapToInventoryItem(row: any, category: string, sourceFile: string): InventoryItemRow {
  return {
    name: coerceString(row.name ?? row['Item Name'] ?? row['Item'] ?? row['Description'] ?? ''),
    category: category,
    quantity: coerceNumber(row.quantity ?? row['Quantity'] ?? row['In-stock'] ?? 1),
    location: coerceString(row.location ?? row['Location'] ?? row['Assigned Location'] ?? ''),
    itemCode: coerceString(row.itemCode ?? row['Item Code'] ?? row['Asset Tag'] ?? ''),
    description: coerceString(row.description ?? row['Description'] ?? row['Notes'] ?? ''),
    status: coerceString(row.status ?? row['Status'] ?? 'Available'),
    condition: coerceString(row.condition ?? row['Condition'] ?? 'Good'),
    assignedTo: coerceString(row.assignedTo ?? row['Assigned To'] ?? row['User'] ?? ''),
    purchaseDate: coerceDate(row.purchaseDate ?? row['Purchase Date'] ?? row['Date'] ?? null),
    lastUpdated: null,
    source_file: sourceFile,
    source_category: category,
  };
}

const prettyName = (file: string) => file.replace('.json', '').replace(/[-_]/g, ' ').toUpperCase();

export default function ReseedDataPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<string[]>(AVAILABLE_FILES);
  const [selectedInventoryFiles, setSelectedInventoryFiles] = useState<string[]>(AVAILABLE_INVENTORY_FILES);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<{inserted: number; files: number; inventoryInserted: number}>({ 
    inserted: 0, 
    files: 0, 
    inventoryInserted: 0 
  });
  const [previewData, setPreviewData] = useState<SparePartRow[]>([]);
  const [previewInventoryData, setPreviewInventoryData] = useState<InventoryItemRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'spareParts' | 'inventory'>('spareParts');

  const toggleFile = (f: string, isInventory: boolean = false) => {
    if (isInventory) {
      setSelectedInventoryFiles((prev) => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    } else {
      setSelectedFiles((prev) => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    }
  };

  const startImport = async () => {
    setIsRunning(true);
    setLog([]);
    setSummary({ inserted: 0, files: 0, inventoryInserted: 0 });

    let totalInserted = 0;
    let totalInventoryInserted = 0;

    // Clear existing data before importing (refresh mode)
    try {
      setLog((l) => [...l, '🔄 Clearing existing data for refresh...']);
      
      // Clear spare parts data
      if (selectedFiles.length > 0) {
        const existingSpareParts = await FirebaseService.query('spareParts', []);
        if (existingSpareParts.length > 0) {
          await Promise.all(existingSpareParts.map((part: any) => 
            FirebaseService.delete('spareParts', part.id)
          ));
          setLog((l) => [...l, `🗑️ Cleared ${existingSpareParts.length} existing spare parts`]);
        }
      }
      
      // Clear inventory items data
      if (selectedInventoryFiles.length > 0) {
        const existingInventoryItems = await FirebaseService.query('inventoryItems', []);
        if (existingInventoryItems.length > 0) {
          await Promise.all(existingInventoryItems.map((item: any) => 
            FirebaseService.delete('inventoryItems', item.id)
          ));
          setLog((l) => [...l, `🗑️ Cleared ${existingInventoryItems.length} existing inventory items`]);
        }
      }
      
      setLog((l) => [...l, '✅ Database cleared successfully']);
    } catch (error) {
      setLog((l) => [...l, `⚠️ Warning: Could not clear existing data: ${error}`]);
    }

    // Import spare parts
    for (const file of selectedFiles) {
      try {
        setLog((l) => [...l, `📥 Fetching ${file}...`]);
        const res = await fetch(`/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        let items: any[] = [];
        if (Array.isArray(json)) {
          items = json.filter(item => item !== null);
        } else if (json && typeof json === 'object') {
          const keys = Object.keys(json);
          if (keys.length > 0 && Array.isArray(json[keys[0]])) {
            items = json[keys[0]].filter((item: any) => item !== null);
          }
        }
        
        if (!Array.isArray(items) || items.length === 0) {
          setLog((l) => [...l, `⚠ ${file}: No valid items found`]);
          continue;
        }

        const category = getCategoryFromFile(file);
        const system = getSystemFromFile(file);
        const mapped: SparePartRow[] = items.map((row) => mapToSparePart(row, category, system, file))
          .filter((r) => r.name && r.name.length > 0);

        // Batch insert
        let fileInserted = 0;
        for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
          const batch = mapped.slice(i, i + BATCH_SIZE);
          for (const item of batch) {
            await FirebaseService.create('spareParts', item);
          }
          fileInserted += batch.length;
          totalInserted += batch.length;
          setLog((l) => [...l, `✓ ${file} batch ${i/BATCH_SIZE + 1}: inserted ${batch.length}`]);
        }
        setLog((l) => [...l, `✅ Finished ${file}: inserted ${fileInserted}`]);
        setSummary((s) => ({ ...s, inserted: totalInserted, files: s.files + 1 }));
      } catch (e: any) {
        setLog((l) => [...l, `✗ ${file} failed: ${e?.message || e}`]);
      }
    }

    // Import inventory items
    for (const file of selectedInventoryFiles) {
      try {
        setLog((l) => [...l, `📥 Fetching inventory ${file}...`]);
        const res = await fetch(`/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        let items: any[] = [];
        if (Array.isArray(json)) {
          items = json.filter(item => item !== null);
        } else if (json && typeof json === 'object') {
          const keys = Object.keys(json);
          if (keys.length > 0 && Array.isArray(json[keys[0]])) {
            items = json[keys[0]].filter((item: any) => item !== null);
          }
        }
        
        if (!Array.isArray(items) || items.length === 0) {
          setLog((l) => [...l, `⚠ ${file}: No valid inventory items found`]);
          continue;
        }

        const category = getInventoryCategoryFromFile(file);
        const mapped: InventoryItemRow[] = items.map((row) => mapToInventoryItem(row, category, file))
          .filter((r) => r.name && r.name.length > 0);

        // Batch insert
        let fileInserted = 0;
        for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
          const batch = mapped.slice(i, i + BATCH_SIZE);
          for (const item of batch) {
            await FirebaseService.create('inventoryItems', item);
          }
          fileInserted += batch.length;
          totalInventoryInserted += batch.length;
          setLog((l) => [...l, `✓ Inventory ${file} batch ${i/BATCH_SIZE + 1}: inserted ${batch.length}`]);
        }
        setLog((l) => [...l, `✅ Finished inventory ${file}: inserted ${fileInserted}`]);
        setSummary((s) => ({ ...s, inventoryInserted: totalInventoryInserted }));
      } catch (e: any) {
        setLog((l) => [...l, `✗ Inventory ${file} failed: ${e?.message || e}`]);
      }
    }

    setLog((l) => [...l, `🎉 Import completed! Total: ${totalInserted + totalInventoryInserted} items`]);
    setIsRunning(false);
  };

  const previewImport = async () => {
    setShowPreview(true);
    setPreviewData([]);
    setPreviewInventoryData([]);
    
    const previewRows: SparePartRow[] = [];
    const previewInventoryRows: InventoryItemRow[] = [];
    
    // Preview spare parts
    for (const file of selectedFiles.slice(0, 2)) {
      try {
        const res = await fetch(`/${file}`);
        if (!res.ok) continue;
        const json = await res.json();
        
        let items: any[] = [];
        if (Array.isArray(json)) {
          items = json.filter(item => item !== null);
        } else if (json && typeof json === 'object') {
          const keys = Object.keys(json);
          if (keys.length > 0 && Array.isArray(json[keys[0]])) {
            items = json[keys[0]].filter((item: any) => item !== null);
          }
        }
        
        if (Array.isArray(items) && items.length > 0) {
          const category = getCategoryFromFile(file);
          const system = getSystemFromFile(file);
          const mapped: SparePartRow[] = items.slice(0, 3).map((row) => mapToSparePart(row, category, system, file))
            .filter((r) => r.name && r.name.length > 0);
          previewRows.push(...mapped);
        }
      } catch (e) {
        // Skip preview errors
      }
    }

    // Preview inventory items
    for (const file of selectedInventoryFiles.slice(0, 2)) {
      try {
        const res = await fetch(`/${file}`);
        if (!res.ok) continue;
        const json = await res.json();
        
        let items: any[] = [];
        if (Array.isArray(json)) {
          items = json.filter(item => item !== null);
        } else if (json && typeof json === 'object') {
          const keys = Object.keys(json);
          if (keys.length > 0 && Array.isArray(json[keys[0]])) {
            items = json[keys[0]].filter((item: any) => item !== null);
          }
        }
        
        if (Array.isArray(items) && items.length > 0) {
          const category = getInventoryCategoryFromFile(file);
          const mapped: InventoryItemRow[] = items.slice(0, 3).map((row) => mapToInventoryItem(row, category, file))
            .filter((r) => r.name && r.name.length > 0);
          previewInventoryRows.push(...mapped);
        }
      } catch (e) {
        // Skip preview errors
      }
    }
    
    setPreviewData(previewRows);
    setPreviewInventoryData(previewInventoryRows);
  };

  const allSelected = useMemo(() => selectedFiles.length === AVAILABLE_FILES.length, [selectedFiles.length]);
  const allInventorySelected = useMemo(() => selectedInventoryFiles.length === AVAILABLE_INVENTORY_FILES.length, [selectedInventoryFiles.length]);

  const toggleAll = (isInventory: boolean = false) => {
    if (isInventory) {
      if (allInventorySelected) setSelectedInventoryFiles([]);
      else setSelectedInventoryFiles(AVAILABLE_INVENTORY_FILES);
    } else {
      if (allSelected) setSelectedFiles([]);
      else setSelectedFiles(AVAILABLE_FILES);
    }
  };

  const getCategoryFromFile = (filePath: string): string => {
    if (filePath.startsWith('pma/')) return 'PMA (Punjab Mass Transit Authority)';
    if (filePath.startsWith('om/')) return 'O&M (Operations & Maintenance)';
    return 'Unknown';
  };

  const getSystemFromFile = (filePath: string): string => {
    const fileName = filePath.split('/').pop() || '';
    if (fileName === 'spare-parts-OM.json') return 'SPARE PARTS OM';
    if (fileName === 'bas.json') return 'BAS';
    if (fileName === 'fas.json') return 'FAS';
    if (fileName === 'fes.json') return 'FES';
    if (fileName === 'pscada.json') return 'PSCADA';
    if (fileName === 'elevator.json') return 'ELEVATOR';
    if (fileName === 'escalator.json') return 'ESCALATOR';
    if (fileName === 'psd.json') return 'PSD';
    if (fileName === 'hvac.json') return 'HVAC';
    if (fileName === 'wsd.json') return 'WSD';
    if (fileName === 'illumination.json') return 'ILLUMINATION';
    if (fileName === 'sanitary.json') return 'SANITARY';
    if (fileName === 'batteries.json') return 'BATTERIES';
    if (fileName === 'general_items.json') return 'GENERAL ITEMS';
    return 'UNKNOWN';
  };

  const getInventoryCategoryFromFile = (filePath: string): string => {
    const fileName = filePath.split('/').pop() || '';
    if (fileName === 'faulty-returns.json') return 'Faulty Returns';
    if (fileName === 'ppe-items.json') return 'PPE Items';
    if (fileName === 'stationery-items.json') return 'Stationery Items';
    if (fileName === 'assets.json') return 'Asset Management';
    if (fileName === 'inventory.json') return 'Inventory';
    if (fileName === 'tools.json') return 'Tools';
    if (fileName === 'general-tools.json') return 'General Tools';
    return 'Unknown';
  };

  return (
    <PageContainer>
      <div className="min-h-screen py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-gray-800 bg-clip-text text-transparent">
                Reseed Data
              </h1>
              <p className="text-gray-800 font-medium">Developer Only - Database Refresh & Import Tool</p>
            </div>
          </div>
          <button 
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105" 
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="mb-6 p-6 card-surface-dark rounded-2xl border border-white/10 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Important Notes:</h2>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Refresh Mode:</strong> This process will clear all existing data before importing new data to prevent duplication</li>
            <li>• Data is batched ({BATCH_SIZE}/batch) and IDs are auto-generated in the database</li>
            <li>• <strong>belongsto</strong> field includes both category and system (e.g., "PMA - BAS", "O&M - HVAC") to prevent mixing</li>
            <li>• Source tracking added to identify which file and category each item came from</li>
            <li>• Support for all inventory categories: Spare Parts, Faulty Returns, PPE Items, Stationery Items, Asset Management, Inventory, Tools, and General Tools</li>
            <li>• <strong>⚠️ Warning:</strong> This will permanently delete existing data. Make sure to backup if needed.</li>
          </ul>
        </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('spareParts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'spareParts'
                ? 'border-indigo-400 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-blue-500 hover:border-blue-500'
            }`}
          >
            Spare Parts ({selectedFiles.length}/{AVAILABLE_FILES.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-indigo-400 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-blue-500 hover:border-blue-500'
            }`}
          >
            Inventory Items ({selectedInventoryFiles.length}/{AVAILABLE_INVENTORY_FILES.length})
          </button>
        </nav>
      </div>

      {/* Spare Parts Tab */}
      {activeTab === 'spareParts' && (
        <div className="mb-6 p-4 card-surface-dark rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Spare Parts Files</h3>
            <label className="flex items-center gap-2 text-gray-200">
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={() => toggleAll(false)}
                className="rounded"
              />
              <span className="text-sm font-medium">Select all</span>
            </label>
          </div>
          {Object.entries(FILE_CATEGORIES).map(([mainCategory, systems]) => (
            <div key={mainCategory} className="mb-4">
              <h4 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wide">{mainCategory}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-4">
                {Object.entries(systems).map(([systemName, filePath]) => (
                  <label key={filePath} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.includes(filePath)} 
                      onChange={() => toggleFile(filePath, false)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-white">{systemName}</div>
                      <div className="text-xs text-gray-400">{filePath}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Items Tab */}
      {activeTab === 'inventory' && (
        <div className="mb-6 p-4 card-surface-dark rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Inventory Items Files</h3>
            <label className="flex items-center gap-2 text-gray-200">
              <input 
                type="checkbox" 
                checked={allInventorySelected} 
                onChange={() => toggleAll(true)}
                className="rounded"
              />
              <span className="text-sm font-medium">Select all</span>
            </label>
          </div>
          {Object.entries(INVENTORY_CATEGORIES).map(([mainCategory, systems]) => (
            <div key={mainCategory} className="mb-4">
              <h4 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wide">{mainCategory}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-4">
                {Object.entries(systems).map(([systemName, filePath]) => (
                  <label key={filePath} className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedInventoryFiles.includes(filePath)} 
                      onChange={() => toggleFile(filePath, true)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-white">{systemName}</div>
                      <div className="text-xs text-gray-400">{filePath}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
            isRunning 
              ? 'bg-white/20 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
          }`}
          disabled={isRunning || (selectedFiles.length === 0 && selectedInventoryFiles.length === 0)}
          onClick={startImport}
        >
          {isRunning ? 'Importing…' : 'Start Import'}
        </button>
        
        <button
          className="px-6 py-3 rounded-lg bg-indigo-600 border-white/20 hover:bg-indigo-700 hover:shadow-lg text-white font-medium transition-colors"
          disabled={isRunning || (selectedFiles.length === 0 && selectedInventoryFiles.length === 0)}
          onClick={previewImport}
        >
          Preview Data
        </button>
      </div>

      {/* Preview Section */}
      {showPreview && (previewData.length > 0 || previewInventoryData.length > 0) && (
        <div className="mb-6 p-4 card-surface-dark rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Preview Data</h3>
            <button 
              className="text-sm text-gray-300 hover:text-white"
              onClick={() => setShowPreview(false)}
            >
              Hide
            </button>
          </div>
          
          {/* Spare Parts Preview */}
          {previewData.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-300 mb-2">Spare Parts Preview (First 3 rows from first 2 files)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white/5 rounded-lg overflow-hidden">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Name</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Belongs To</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Category</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Quantity</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Location</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 text-white">{row.name}</td>
                        <td className="p-3 font-medium text-indigo-300">{row.belongsto}</td>
                        <td className="p-3 text-gray-200">{row.category}</td>
                        <td className="p-3 text-gray-200">{row.quantity}</td>
                        <td className="p-3 text-gray-200">{row.location}</td>
                        <td className="p-3 text-xs text-gray-400">{row.source_file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Items Preview */}
          {previewInventoryData.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Inventory Items Preview (First 3 rows from first 2 files)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white/5 rounded-lg overflow-hidden">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Name</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Category</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Quantity</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Location</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Status</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-200 uppercase tracking-wide">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewInventoryData.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-3 text-white">{row.name}</td>
                        <td className="p-3 font-medium text-emerald-300">{row.category}</td>
                        <td className="p-3 text-gray-200">{row.quantity}</td>
                        <td className="p-3 text-gray-200">{row.location}</td>
                        <td className="p-3 text-gray-200">{row.status}</td>
                        <td className="p-3 text-xs text-gray-400">{row.source_file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Section */}
      <div className="mt-6 p-4 card-surface-dark rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Import Log</h2>
          <div className="text-sm text-gray-300">
            <span className="mr-4">Spare Parts: {summary.inserted}</span>
            <span className="mr-4">Inventory: {summary.inventoryInserted}</span>
            <span>Files: {summary.files}</span>
          </div>
        </div>
        <div className="h-64 overflow-auto text-sm whitespace-pre-wrap bg-white/5 p-3 rounded border border-white/10 text-gray-200">
          {log.map((line, idx) => (
            <div key={idx} className="py-1">{line}</div>
          ))}
        </div>
      </div>
    </div>
    </PageContainer>
  );
}