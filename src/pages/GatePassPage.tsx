import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const GatePassPage = () => {
  const [formData, setFormData] = useState({
    issuerName: "",
    date: "",
    designation: "",
    department: "",
    contact: "",
    signature: "",
    oltNo: "",
    tools: Array.from({ length: 30 }, () => ({ description: "", unit: "", qty: "", remarks: "" })),
    receiver: {
      name: "",
      department: "",
      sign: "",
      instructionFrom: "",
      oltNo: "",
      contact: ""
    }
  });

  const handleToolChange = (index, field, value) => {
    const updated = [...formData.tools];
    updated[index][field] = value;
    setFormData({ ...formData, tools: updated });
  };

  const containerRef = useRef(null);

  const exportToExcel = () => {
    const wsData = [
      ["Name of Issuer:", formData.issuerName, "", "Date:", formData.date],
      ["Designation:", formData.designation, "", "Department:", formData.department],
      ["Contact:", formData.contact, "", "Signature:", formData.signature],
      ["OLT No:", formData.oltNo],
      [],
      ["Sr.", "Tools Description", "M/U", "QTY", "Remarks"],
      ...formData.tools.map((t, i) => [i + 1, t.description, t.unit, t.qty, t.remarks]),
      [],
      ["Receiver Name:", formData.receiver.name, "Department:", formData.receiver.department],
      ["Sign:", formData.receiver.sign, "Instruction From:", formData.receiver.instructionFrom],
      ["OLT No:", formData.receiver.oltNo, "Contact:", formData.receiver.contact]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gate Pass");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "GatePass.xlsx");
  };

  const exportToPDF = () => {
    if (containerRef.current) {
      html2canvas(containerRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("GatePass.pdf");
      });
    }
  };

  return (
    <div className="p-4 text-sm" ref={containerRef}>
      <h1 className="text-center text-lg font-bold mb-4">E&M DEPARTMENT GATE PASS</h1>
      <table className="table-fixed w-full border border-black text-left">
        <tbody>
          <tr>
            <td className="border p-1">Name of Issuer:</td>
            <td className="border p-1"><input value={formData.issuerName} onChange={e => setFormData({ ...formData, issuerName: e.target.value })} className="w-full" /></td>
            <td className="border p-1">Date:</td>
            <td className="border p-1"><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full" /></td>
          </tr>
          <tr>
            <td className="border p-1">Designation:</td>
            <td className="border p-1"><input value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="w-full" /></td>
            <td className="border p-1">Department:</td>
            <td className="border p-1"><input value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full" /></td>
          </tr>
          <tr>
            <td className="border p-1">Contact:</td>
            <td className="border p-1"><input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full" /></td>
            <td className="border p-1">Signature:</td>
            <td className="border p-1"><input value={formData.signature} onChange={e => setFormData({ ...formData, signature: e.target.value })} className="w-full" /></td>
          </tr>
          <tr>
            <td className="border p-1">OLT No:</td>
            <td colSpan={3} className="border p-1"><input value={formData.oltNo} onChange={e => setFormData({ ...formData, oltNo: e.target.value })} className="w-full" /></td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border border-black mt-4 text-center">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Sr.</th>
            <th className="border p-1">Tools Description</th>
            <th className="border p-1">M/U</th>
            <th className="border p-1">QTY</th>
            <th className="border p-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {formData.tools.map((tool, i) => (
            <tr key={i}>
              <td className="border p-1">{i + 1}</td>
              <td className="border p-1"><input className="w-full" value={tool.description} onChange={e => handleToolChange(i, "description", e.target.value)} /></td>
              <td className="border p-1"><input className="w-full" value={tool.unit} onChange={e => handleToolChange(i, "unit", e.target.value)} /></td>
              <td className="border p-1"><input className="w-full" value={tool.qty} onChange={e => handleToolChange(i, "qty", e.target.value)} /></td>
              <td className="border p-1"><input className="w-full" value={tool.remarks} onChange={e => handleToolChange(i, "remarks", e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table-fixed w-full border border-black text-left mt-4">
        <tbody>
          <tr>
            <td className="border p-1">Receiver Name:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.name} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })} /></td>
            <td className="border p-1">Department:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.department} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, department: e.target.value } })} /></td>
          </tr>
          <tr>
            <td className="border p-1">Sign:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.sign} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, sign: e.target.value } })} /></td>
            <td className="border p-1">Instruction From:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.instructionFrom} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, instructionFrom: e.target.value } })} /></td>
          </tr>
          <tr>
            <td className="border p-1">OLT No:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.oltNo} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, oltNo: e.target.value } })} /></td>
            <td className="border p-1">Contact:</td>
            <td className="border p-1"><input className="w-full" value={formData.receiver.contact} onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, contact: e.target.value } })} /></td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-center gap-4 mt-4">
        <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded">Export to XLSX</button>
        <button onClick={exportToPDF} className="px-4 py-2 bg-blue-600 text-white rounded">Export to PDF</button>
      </div>
    </div>
  );
};

export default GatePassPage;
