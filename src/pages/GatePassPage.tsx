import React, { useState } from "react";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const GatePassPage = () => {
  const [formData, setFormData] = useState({
    issuerName: "",
    date: "",
    department: "",
    designation: "",
    contact: "",
    signature: "",
    oltNo: "",
    tools: Array(30).fill({ description: "", unit: "", quantity: "", remarks: "" }),
    receiver: {
      name: "",
      department: "",
      sign: "",
      instructionFrom: "",
      oltNo: "",
      contact: ""
    }
  });

  const handleToolChange = (index: number, field: string, value: string) => {
    const updatedTools = [...formData.tools];
    updatedTools[index] = { ...updatedTools[index], [field]: value };
    setFormData({ ...formData, tools: updatedTools });
  };

  const exportToExcel = () => {
    const sheetData = [
      ["Issuer Name", formData.issuerName, "", "Date", formData.date],
      ["Department", formData.department, "", "Designation", formData.designation],
      ["Contact", formData.contact, "", "Signature", formData.signature],
      ["OLT NO.", formData.oltNo],
      [],
      ["SR No.", "Tools Description", "M/U", "QTY", "Remarks"],
      ...formData.tools.map((t, i) => [i + 1, t.description, t.unit, t.quantity, t.remarks]),
      [],
      ["Receiver's Name", formData.receiver.name, "Department", formData.receiver.department],
      ["Sign", formData.receiver.sign, "Instruction from", formData.receiver.instructionFrom],
      ["OLT No.", formData.receiver.oltNo, "Contact", formData.receiver.contact],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gate Pass");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "GatePass.xlsx");
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">E & M Sub-Department Gate Pass</h1>

      {/* Top Form */}
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Issuer Name" value={formData.issuerName} onChange={e => setFormData({ ...formData, issuerName: e.target.value })} />
        <input placeholder="Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
        <input placeholder="Department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
        <input placeholder="Designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
        <input placeholder="Contact" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
        <input placeholder="Signature" value={formData.signature} onChange={e => setFormData({ ...formData, signature: e.target.value })} />
        <input placeholder="OLT No." value={formData.oltNo} onChange={e => setFormData({ ...formData, oltNo: e.target.value })} />
      </div>

      {/* Tools Table */}
      <table className="w-full table-auto border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">SR No.</th>
            <th className="border p-1">Tools Description</th>
            <th className="border p-1">M/U</th>
            <th className="border p-1">QTY</th>
            <th className="border p-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {formData.tools.map((tool, idx) => (
            <tr key={idx}>
              <td className="border p-1 text-center">{idx + 1}</td>
              <td><input className="w-full p-1 border" value={tool.description} onChange={(e) => handleToolChange(idx, "description", e.target.value)} /></td>
              <td><input className="w-full p-1 border" value={tool.unit} onChange={(e) => handleToolChange(idx, "unit", e.target.value)} /></td>
              <td><input className="w-full p-1 border" value={tool.quantity} onChange={(e) => handleToolChange(idx, "quantity", e.target.value)} /></td>
              <td><input className="w-full p-1 border" value={tool.remarks} onChange={(e) => handleToolChange(idx, "remarks", e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Receiver Section */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <input placeholder="Receiver's Name" value={formData.receiver.name} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })} />
        <input placeholder="Department" value={formData.receiver.department} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, department: e.target.value } })} />
        <input placeholder="Sign" value={formData.receiver.sign} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, sign: e.target.value } })} />
        <input placeholder="Instruction from" value={formData.receiver.instructionFrom} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, instructionFrom: e.target.value } })} />
        <input placeholder="OLT No." value={formData.receiver.oltNo} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, oltNo: e.target.value } })} />
        <input placeholder="Receiver Contact" value={formData.receiver.contact} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, contact: e.target.value } })} />
      </div>

      {/* Export Button */}
      <button
        onClick={exportToExcel}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Export to Excel
      </button>
    </div>
  );
};

export default GatePassPage;