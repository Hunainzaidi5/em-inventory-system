import React, { useMemo, useState } from 'react';
import { FirebaseService } from '@/lib/firebaseService';
import { useNavigate } from 'react-router-dom';

// Files organized by main categories and systems
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

// Flatten for easy access
const AVAILABLE_FILES = Object.values(FILE_CATEGORIES).flatMap(category => Object.values(category));

const BATCH_SIZE = 200;

type SparePartRow = {
  name: string;
  belongsto?: string;
  quantity?: number;
  location?: string;
  itemCode?: string;
  imis_code?: string;
  uom?: string;
  partNumber?: string;
  category?: string;
  boq_number?: string;
  lastUpdated?: string | null;
  last_updated?: string | null;
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

function mapToSparePart(row: any, category: string, system: string): SparePartRow {
  // Common resolver for BOQ-like fields
  const resolveBoq = () => coerceString(
    row['BOQ #'] ?? row['BOQ'] ?? row['BOQ No'] ?? row['BOQ no'] ?? row['BOQ Number'] ?? row['BOQ number'] ?? row['boq_number'] ?? row['boqNumber'] ?? ''
  );

  // Handle different JSON structures based on file type
  if (system === 'BAS') {
    return {
      name: coerceString(row['BAS (Spares Inventory)'] ?? row['Item Name'] ?? ''),
      belongsto: category,
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
    };
  } else if (system === 'SPARE PARTS OM') {
    return {
      name: coerceString(row['Item Name'] ?? ''),
      belongsto: category,
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
    };
  } else {
    // Generic mapping for other systems
    return {
      name: coerceString(row.name ?? row['Item Name'] ?? row['BAS (Spares Inventory)'] ?? row['Item'] ?? ''),
      belongsto: category,
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
    };
  }
}

const prettyName = (file: string) => file.replace('.json', '').replace(/[-_]/g, ' ').toUpperCase();

export default function ReseedDataPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<string[]>(AVAILABLE_FILES);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<{inserted: number; files: number}>({ inserted: 0, files: 0 });
  const [previewData, setPreviewData] = useState<SparePartRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const toggleFile = (f: string) => {
    setSelectedFiles((prev) => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const startImport = async () => {
    setIsRunning(true);
    setLog([]);
    setSummary({ inserted: 0, files: 0 });

    let totalInserted = 0;
    for (const file of selectedFiles) {
      try {
        setLog((l) => [...l, `Fetching ${file}...`]);
        const res = await fetch(`/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Handle different JSON structures
        let items: any[] = [];
        if (Array.isArray(json)) {
          items = json.filter(item => item !== null); // Filter out null entries
        } else if (json && typeof json === 'object') {
          // Handle files like bas.json that have a wrapper object
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
        const mapped: SparePartRow[] = items.map((row) => mapToSparePart(row, category, system))
          .filter((r) => r.name && r.name.length > 0);

        // Batch insert
        let fileInserted = 0;
        for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
          const batch = mapped.slice(i, i + BATCH_SIZE);
          // Note: Firebase doesn't support batch inserts in the same way as Supabase
          // For now, we'll insert items one by one
          for (const item of batch) {
            await FirebaseService.create('spareParts', item);
          }
          if (error) {
            setLog((l) => [...l, `✗ ${file} batch ${i/BATCH_SIZE + 1}: ${error.message}`]);
          } else {
            fileInserted += batch.length;
            totalInserted += batch.length;
            setLog((l) => [...l, `✓ ${file} batch ${i/BATCH_SIZE + 1}: inserted ${batch.length}`]);
          }
        }
        setLog((l) => [...l, `Finished ${file}: inserted ${fileInserted}`]);
        setSummary((s) => ({ inserted: totalInserted, files: s.files + 1 }));
      } catch (e: any) {
        setLog((l) => [...l, `✗ ${file} failed: ${e?.message || e}`]);
      }
    }

    setIsRunning(false);
  };

  const previewImport = async () => {
    setShowPreview(true);
    setPreviewData([]);
    
    const previewRows: SparePartRow[] = [];
    let fileCount = 0;
    
    for (const file of selectedFiles.slice(0, 3)) { // Preview first 3 files only
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
          const fallbackCategory = `${category} - ${system}`;
          const mapped: SparePartRow[] = items.slice(0, 5).map((row) => mapToSparePart(row, category, system))
            .filter((r) => r.name && r.name.length > 0);
          previewRows.push(...mapped);
          fileCount++;
        }
      } catch (e) {
        // Skip preview errors
      }
    }
    
    setPreviewData(previewRows);
  };

  const allSelected = useMemo(() => selectedFiles.length === AVAILABLE_FILES.length, [selectedFiles.length]);

  const toggleAll = () => {
    if (allSelected) setSelectedFiles([]);
    else setSelectedFiles(AVAILABLE_FILES);
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Reseed Data (Developer Only)</h1>
        <button className="text-blue-600 hover:underline" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Select JSON files from /public to import into the spare_parts table. Data is batched ({BATCH_SIZE}/batch) and ids are auto-generated in DB.
        <br />
        <span className="text-orange-600 font-medium">Note: O&M spare-parts-OM.json file is not present in the om/ directory.</span>
      </p>

      <div className="mb-4 p-4 border rounded">
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          <span>Select all</span>
        </label>
        
        {Object.entries(FILE_CATEGORIES).map(([mainCategory, systems]) => (
          <div key={mainCategory} className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">{mainCategory}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 ml-4">
              {Object.entries(systems).map(([systemName, filePath]) => (
                <label key={filePath} className="flex items-center gap-2 p-2 border rounded">
                  <input 
                    type="checkbox" 
                    checked={selectedFiles.includes(filePath)} 
                    onChange={() => toggleFile(filePath)} 
                  />
                  <span className="text-sm">{systemName}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded text-white ${isRunning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={isRunning || selectedFiles.length === 0}
          onClick={startImport}
        >
          {isRunning ? 'Importing…' : 'Start Import'}
        </button>
        
        <button
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          disabled={isRunning || selectedFiles.length === 0}
          onClick={previewImport}
        >
          Preview Data
        </button>
      </div>

      {showPreview && previewData.length > 0 && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Preview (First 5 rows from first 3 files)</h3>
            <button 
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setShowPreview(false)}
            >
              Hide
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Item Code</th>
                  <th className="text-left p-2">IMIS Code</th>
                  <th className="text-left p-2">BOQ #</th>
                  <th className="text-left p-2">UOM</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.category}</td>
                    <td className="p-2">{row.quantity}</td>
                    <td className="p-2">{row.location}</td>
                    <td className="p-2">{row.itemCode}</td>
                    <td className="p-2">{row.imis_code}</td>
                    <td className="p-2">{row.boq_number}</td>
                    <td className="p-2">{row.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 border rounded bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Log</h2>
          <span className="text-sm text-gray-500">Inserted: {summary.inserted} • Files processed: {summary.files}</span>
        </div>
        <div className="h-64 overflow-auto text-sm whitespace-pre-wrap">
          {log.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
} 