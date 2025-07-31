import React, { useState, useEffect } from "react";

// Sample spare parts data as fallback
const sampleSpareParts = [
  {
    "Column2": "Cable 1.5 mm / Single Core 450/750-Volt (Red)",
    "Column9": 805,
    location: "Warehouse A"
  },
  {
    "Column2": "Cable 10 mm / Single Core 450/750-V (Red)",
    "Column9": 1000,
    location: "Warehouse B"
  },
  {
    "Column2": "Cable 2.5 mm / Single Core 450/750-V (Green)",
    "Column9": 1000,
    location: "Warehouse A"
  },
  {
    "Column2": "Cable 4.0 mm / Single Core (Yellow)",
    "Column9": 1000,
    location: "Warehouse C"
  },
  {
    "Column2": "Alken CH Cool",
    "Column9": 120,
    location: "Warehouse D"
  },
  {
    "Column2": "Descaler SP-100",
    "Column9": 450,
    location: "Warehouse B"
  },
  {
    "Column2": "Rust Remover WD40 (Multi Use)",
    "Column9": 120,
    location: "Warehouse A"
  }
];

const defaultForm = { name: "", quantity: "", location: "" };

type FormState = {
  name: string;
  quantity: string;
  location: string;
};

const InventoryPage = () => {
  const [spareParts, setSpareParts] = useState<any[]>(sampleSpareParts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

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
        ).map((item: any) => ({
          ...item,
          location: item.location || "Warehouse A"
        }));
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

  const openAddModal = () => {
    setForm(defaultForm);
    setEditIndex(null);
    setShowModal(true);
  };

  const openEditModal = (idx: number) => {
    const item = spareParts[idx];
    setForm({
      name: item["Column2"] || "",
      quantity: String(item["Column9"] ?? ""),
      location: item.location || ""
    });
    setEditIndex(idx);
    setShowModal(true);
  };

  const handleRemove = (idx: number) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      setSpareParts(parts => parts.filter((_, i) => i !== idx));
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quantity.trim() || !form.location.trim()) return;
    const newItem = {
      Column2: form.name,
      Column9: Number(form.quantity),
      location: form.location
    };
    if (editIndex !== null) {
      setSpareParts(parts => parts.map((item, i) => i === editIndex ? newItem : item));
    } else {
      setSpareParts(parts => [...parts, newItem]);
    }
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Items (Spare Parts)</h1>
      {loading && <p className="mb-4">Loading spare parts data...</p>}
      {error && <p className="mb-4 text-red-500">Error: {error}</p>}
      <div className="flex justify-between items-center mb-4">
        <p>Total items: {spareParts.length}</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={openAddModal}>Add Item</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-100">Spare Part Name</th>
              <th className="border px-2 py-1 bg-gray-100">In-Stock</th>
              <th className="border px-2 py-1 bg-gray-100">Location</th>
              <th className="border px-2 py-1 bg-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {spareParts.map((row: any, i: number) => (
              <tr key={i}>
                <td className="border px-2 py-1">{row["Column2"]}</td>
                <td className="border px-2 py-1">{row["Column9"] ?? "-"}</td>
                <td className="border px-2 py-1">{row.location ?? "-"}</td>
                <td className="border px-2 py-1">
                  <button className="text-blue-600 hover:underline mr-2" onClick={() => openEditModal(i)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleRemove(i)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editIndex !== null ? "Edit Item" : "Add Item"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Spare Part Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">In-Stock</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editIndex !== null ? "Save" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;