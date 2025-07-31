import React from "react";
// @ts-ignore
const spareParts = require("../../Gate Pass & Issuance/Warehouse Spare Parts  (O&M & PMA).json");

const omParts = (spareParts["O&M Spare Part"] || []).filter(
  (item: any) => item && item["Column2"] && typeof item["Column2"] === "string" && item["Column2"] !== "Item Name"
);

const GeneralItemsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">General Items (Spare Parts)</h1>
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100">Spare Part Name</th>
            <th className="border px-2 py-1 bg-gray-100">In-Stock</th>
          </tr>
        </thead>
        <tbody>
          {omParts.map((row: any, i: number) => (
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

export default GeneralItemsPage; 