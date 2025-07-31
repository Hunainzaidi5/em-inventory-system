import React, { useState, useEffect } from "react";

// Sample spare parts data as fallback
const sampleSpareParts = [
  {
    "Column2": "Cable 1.5 mm / Single Core 450/750-Volt (Red)",
    "Column9": 805
  },
  {
    "Column2": "Cable 10 mm / Single Core 450/750-V (Red)",
    "Column9": 1000
  },
  {
    "Column2": "Cable 2.5 mm / Single Core 450/750-V (Green)",
    "Column9": 1000
  },
  {
    "Column2": "Cable 4.0 mm / Single Core (Yellow)",
    "Column9": 1000
  },
  {
    "Column2": "Alken CH Cool",
    "Column9": 120
  },
  {
    "Column2": "Descaler SP-100",
    "Column9": 450
  },
  {
    "Column2": "Rust Remover WD40 (Multi Use)",
    "Column9": 120
  }
];

const InventoryPage = () => {
  const [spareParts, setSpareParts] = useState<any[]>(sampleSpareParts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpareParts = async () => {
      try {
        setLoading(true);
        // Try to load the JSON file
        const response = await fetch('/spare-parts.json');
        if (!response.ok) {
          throw new Error('Failed to load spare parts data');
        }
        const data = await response.json();
        
        // Extract O&M Spare Part data
        const omParts = (data["O&M Spare Part"] || []).filter(
          (item: any) => item && item["Column2"] && typeof item["Column2"] === "string" && item["Column2"] !== "Item Name"
        );
        
        if (omParts.length > 0) {
          setSpareParts(omParts);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading spare parts:', err);
        setError('Failed to load spare parts data, using sample data');
        setLoading(false);
      }
    };

    loadSpareParts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Items (Spare Parts)</h1>
      {loading && <p className="mb-4">Loading spare parts data...</p>}
      {error && <p className="mb-4 text-red-500">Error: {error}</p>}
      <p className="mb-4">Total items: {spareParts.length}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-100">Spare Part Name</th>
              <th className="border px-2 py-1 bg-gray-100">In-Stock</th>
            </tr>
          </thead>
          <tbody>
            {spareParts.map((row: any, i: number) => (
              <tr key={i}>
                <td className="border px-2 py-1">{row["Column2"]}</td>
                <td className="border px-2 py-1">{row["Column9"] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;