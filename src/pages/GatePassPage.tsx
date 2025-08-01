import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const GatePassPage = () => {
  const printRef = useRef(null);

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

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([]);

    const headerStyles = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const addRow = (sheet, row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
        sheet[cellRef] = { t: "s", v: cell, s: headerStyles };
      });
    };

    let rowIdx = 0;
    addRow(ws, ["Name of Issuer:", formData.issuerName, "", "Date:", formData.date], rowIdx++);
    addRow(ws, ["Designation:", formData.designation, "", "Department:", formData.department], rowIdx++);
    addRow(ws, ["Contact:", formData.contact, "", "Signature:", formData.signature], rowIdx++);
    addRow(ws, ["OLT No:", formData.oltNo], rowIdx++);
    rowIdx++;
    addRow(ws, ["Sr.", "Tools Description", "M/U", "QTY", "Remarks"], rowIdx++);

    formData.tools.forEach((tool, i) => {
      addRow(ws, [i + 1, tool.description, tool.unit, tool.qty, tool.remarks], rowIdx++);
    });

    rowIdx++;
    addRow(ws, ["Receiver Name:", formData.receiver.name, "Department:", formData.receiver.department], rowIdx++);
    addRow(ws, ["Sign:", formData.receiver.sign, "Instruction From:", formData.receiver.instructionFrom], rowIdx++);
    addRow(ws, ["OLT No:", formData.receiver.oltNo, "Contact:", formData.receiver.contact], rowIdx++);

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIdx, c: 4 } });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gate Pass");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx", cellStyles: true });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "GatePass.xlsx");
  };

  // PDF export remains unchanged

  return (
    <div className="p-4">
      {/* UI remains unchanged */}
    </div>
  );
};

export default GatePassPage;
