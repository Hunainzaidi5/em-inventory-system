import React, { useState, useEffect } from "react";

const InventoryPage = () => {
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpareParts = async () => {
      try {
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
        
        setSpareParts(omParts);
        setLoading(false);
      } catch (err) {
        console.error('Error loading spare parts:', err);
        setError('Failed to load spare parts data');
        setLoading(false);
      }
    };

    loadSpareParts();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Inventory Items (Spare Parts)</h1>
        <p>Loading spare parts data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Inventory Items (Spare Parts)</h1>
        <p className="text-red-500">Error: {error}</p>
        <p>Please check if the JSON file is accessible.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Items (Spare Parts)</h1>
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