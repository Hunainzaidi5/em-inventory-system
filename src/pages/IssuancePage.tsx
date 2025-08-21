import React, { useState, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from 'react-router-dom';
import { issuanceService } from '@/services/issuanceService';

// Define TypeScript interfaces for our data structure
interface Tool {
  description: string;
  unit: string;
  qty: string;
  remarks: string;
}

interface Receiver {
  name: string;
  department: string;
  sign: string;
  instructionFrom: string;
  oltNo: string;
  contact: string;
}

interface FormData {
  issuerName: string;
  date: string;
  designation: string;
  department: string;
  contact: string;
  signature: string;
  oltNo: string;
  tools: Tool[];
  receiver: Receiver;
}

const IssuancePage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    issuerName: "",
    date: new Date().toISOString().split('T')[0],
    designation: "",
    department: "",
    contact: "",
    signature: "",
    oltNo: "",
    tools: Array.from({ length: 30 }, () => ({
      description: "",
      unit: "",
      qty: "",
      remarks: ""
    })),
    receiver: {
      name: "",
      department: "",
      sign: "",
      instructionFrom: "",
      oltNo: "",
      contact: ""
    }
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;

    let isMounted = true;
    (async () => {
      try {
        const record = await issuanceService.getById(id);
        if (!record || !isMounted) return;

        const toolsArray = Array.from({ length: 30 }, () => ({ description: "", unit: "", qty: "", remarks: "" }));
        (record.tools || []).forEach((t, idx) => {
          if (idx < toolsArray.length) {
            toolsArray[idx] = {
              description: t.description || "",
              unit: (t as any).unit || "",
              qty: String((t as any).qty ?? ""),
              remarks: (t as any).remarks || "",
            };
          }
        });

        setFormData(prev => ({
          ...prev,
          issuerName: (record as any).issuer_name || "",
          date: record.date || prev.date,
          department: (record as any).department || "",
          designation: prev.designation,
          contact: prev.contact,
          signature: prev.signature,
          oltNo: prev.oltNo,
          tools: toolsArray,
          receiver: {
            name: record.receiver?.name || "",
            department: record.receiver?.department || "",
            sign: record.receiver?.sign || "",
            instructionFrom: record.receiver?.instructionFrom || "",
            oltNo: record.receiver?.oltNo || "",
            contact: record.receiver?.contact || "",
          }
        }));
        setActiveTab('preview');
      } catch (e) {
        // Non-blocking if load fails
      }
    })();

    return () => { isMounted = false; };
  }, [searchParams]);

  // Add proper type for the handleToolChange parameters
  const handleToolChange = useCallback((index: number, field: keyof Tool, value: string): void => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.map((tool, i) => 
        i === index ? { ...tool, [field]: value } : tool
      )
    }));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      // Create HTML table that looks exactly like the Issuance
      let htmlContent = `
        <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <tr>
            <td colspan="5" style="text-align: center; font-weight: bold; font-size: 16px; background-color: #d4edda; padding: 10px; border: 2px solid black;">
              E & M Sub-Department
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: center; font-weight: bold; font-size: 14px; background-color: #cce5ff; padding: 8px; border: 2px solid black;">
              Issuance
            </td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black; width: 15%;">Issuer Name:</td>
            <td style="padding: 8px; border: 1px solid black; width: 25%;">${formData.issuerName || ''}</td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black; width: 15%;">Date:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black;">${formData.date || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Department:</td>
            <td style="padding: 8px; border: 1px solid black;">${formData.department || ''}</td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Designation:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black;">${formData.designation || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Contact:</td>
            <td style="padding: 8px; border: 1px solid black;">${formData.contact || ''}</td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Signature:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black; height: 30px;"></td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">OLT NO.</td>
            <td colspan="4" style="padding: 8px; border: 1px solid black;">${formData.oltNo || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; text-align: center; background-color: #e9ecef; padding: 8px; border: 2px solid black; width: 8%;">SR. No.</td>
            <td style="font-weight: bold; text-align: center; background-color: #e9ecef; padding: 8px; border: 2px solid black; width: 45%;">Tools Description</td>
            <td style="font-weight: bold; text-align: center; background-color: #e9ecef; padding: 8px; border: 2px solid black; width: 12%;">M/U</td>
            <td style="font-weight: bold; text-align: center; background-color: #e9ecef; padding: 8px; border: 2px solid black; width: 12%;">QTY.</td>
            <td style="font-weight: bold; text-align: center; background-color: #e9ecef; padding: 8px; border: 2px solid black; width: 23%;">Remarks</td>
          </tr>
      `;
      
      // Add all 30 tool rows
      for (let i = 0; i < 30; i++) {
        const tool = formData.tools[i];
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa';
        htmlContent += `
          <tr>
            <td style="text-align: center; padding: 6px; border: 1px solid black; background-color: ${bgColor};">${i + 1}</td>
            <td style="padding: 6px; border: 1px solid black; background-color: ${bgColor}; min-height: 25px;">${tool.description || ''}</td>
            <td style="text-align: center; padding: 6px; border: 1px solid black; background-color: ${bgColor};">${tool.unit || ''}</td>
            <td style="text-align: center; padding: 6px; border: 1px solid black; background-color: ${bgColor};">${tool.qty || ''}</td>
            <td style="padding: 6px; border: 1px solid black; background-color: ${bgColor};">${tool.remarks || ''}</td>
          </tr>
        `;
      }
      
      // Add receiver section
      htmlContent += `
          <tr>
            <td colspan="5" style="font-weight: bold; font-size: 14px; background-color: #f8f9fa; padding: 10px; border: 2px solid black;">
              To be filled by receiver:
            </td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Receivers Name:</td>
            <td style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">${formData.receiver.name || ''}</td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Department:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">${formData.receiver.department || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Sign:</td>
            <td style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;"></td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Instruction from:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">${formData.receiver.instructionFrom || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">OLT NO.</td>
            <td style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">${formData.receiver.oltNo || ''}</td>
            <td style="font-weight: bold; background-color: #f8f9fa; padding: 8px; border: 1px solid black;">Receivers Contact:</td>
            <td colspan="2" style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">${formData.receiver.contact || ''}</td>
          </tr>
        </table>
      `;
      
      // Create and download HTML file that opens in Excel
      const blob = new Blob([`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Issuance</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { page-break-inside: avoid; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `], { type: 'application/vnd.ms-excel' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `Issuance_${currentDate}_${Date.now()}.xls`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("✅ Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("❌ Error exporting to Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      const element = printRef.current;
      if (!element) {
        alert("❌ Form not found. Please try again.");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight, '', 'FAST');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Issuance_${currentDate}_${Date.now()}.pdf`;
      
      pdf.save(filename);
      
      alert("✅ PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("❌ Error exporting to PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      setFormData({
        issuerName: "",
        date: new Date().toISOString().split('T')[0],
        designation: "",
        department: "",
        contact: "",
        signature: "",
        oltNo: "",
        tools: Array.from({ length: 30 }, () => ({ 
          description: "", 
          unit: "", 
          qty: "", 
          remarks: "" 
        })),
        receiver: {
          name: "",
          department: "",
          sign: "",
          instructionFrom: "",
          oltNo: "",
          contact: ""
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Edit Form
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👁️ Preview
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'form' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Issuance Form</h2>
              <button
                onClick={clearForm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🗑️ Clear Form
              </button>
            </div>

            {/* Issuer Information */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">👤 Issuer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuer Name *</label>
                  <input 
                    type="text"
                    value={formData.issuerName}
                    onChange={e => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter issuer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input 
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter designation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input 
                    type="text"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OLT NO.</label>
                  <input 
                    type="text"
                    value={formData.oltNo}
                    onChange={e => setFormData({ ...formData, oltNo: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter OLT number"
                  />
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">🔧 Tools Information</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-center font-semibold w-16">SR. No.</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">Tools Description</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold w-20">M/U</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold w-20">QTY.</th>
                      <th className="border border-gray-300 p-3 text-center font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tools.slice(0, 15).map((tool, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center font-medium">{i + 1}</td>
                        <td className="border border-gray-300 p-1">
                          <input 
                            type="text"
                            value={tool.description}
                            onChange={e => handleToolChange(i, "description", e.target.value)}
                            className="w-full p-2 border-none outline-none focus:bg-blue-50 rounded"
                            placeholder="Enter tool description"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input 
                            type="text"
                            value={tool.unit}
                            onChange={e => handleToolChange(i, "unit", e.target.value)}
                            className="w-full p-2 border-none outline-none text-center focus:bg-blue-50 rounded"
                            placeholder="Unit"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input 
                            type="text"
                            value={tool.qty}
                            onChange={e => handleToolChange(i, "qty", e.target.value)}
                            className="w-full p-2 border-none outline-none text-center focus:bg-blue-50 rounded"
                            placeholder="Qty"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input 
                            type="text"
                            value={tool.remarks}
                            onChange={e => handleToolChange(i, "remarks", e.target.value)}
                            className="w-full p-2 border-none outline-none focus:bg-blue-50 rounded"
                            placeholder="Enter remarks"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 mt-2">💡 Showing first 15 rows for editing. All 30 rows will be included in exports.</p>
            </div>

            {/* Receiver Information */}
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">📥 Receiver Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receivers Name</label>
                  <input 
                    type="text"
                    value={formData.receiver.name}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter receiver name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    type="text"
                    value={formData.receiver.department}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, department: e.target.value } })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instruction from</label>
                  <input 
                    type="text"
                    value={formData.receiver.instructionFrom}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, instructionFrom: e.target.value } })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter instruction source"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OLT NO.</label>
                  <input 
                    type="text"
                    value={formData.receiver.oltNo}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, oltNo: e.target.value } })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter OLT number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receivers Contact</label>
                  <input 
                    type="text"
                    value={formData.receiver.contact}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, contact: e.target.value } })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter contact number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Issuance Preview</h2>
            </div>
            
            {/* Exact replica for display/export */}
            <div ref={printRef} className="bg-white mx-auto" style={{ width: '210mm', fontFamily: 'Arial, sans-serif' }}>
              <div className="border-4 border-black">
                {/* Title Header */}
                <div className="bg-green-100 text-center py-4 border-b-2 border-black">
                  <h1 className="text-2xl font-bold">E & M Sub-Department</h1>
                </div>
                
                {/* Issuance Header */}
                <div className="bg-blue-200 text-center py-3 border-b-2 border-black">
                  <h2 className="text-xl font-semibold">Issuance</h2>
                </div>

                {/* Top Information Grid */}
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50" style={{ width: '20%' }}>
                        Issuer Name:
                      </td>
                      <td className="border-r border-b border-black p-3" style={{ width: '30%' }}>
                        {formData.issuerName}
                      </td>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50" style={{ width: '15%' }}>
                        Date:
                      </td>
                      <td className="border-b border-black p-3" style={{ width: '35%' }}>
                        {formData.date}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                        Department:
                      </td>
                      <td className="border-r border-b border-black p-3">
                        {formData.department}
                      </td>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                        Designation:
                      </td>
                      <td className="border-b border-black p-3">
                        {formData.designation}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                        Contact:
                      </td>
                      <td className="border-r border-b border-black p-3">
                        {formData.contact}
                      </td>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                        Signature:
                      </td>
                      <td className="border-b border-black p-3">
                        {/* Empty signature cell - no signature pad */}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                        OLT NO.
                      </td>
                      <td className="border-b border-black p-3" colSpan={3}>
                        {formData.oltNo}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Tools Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black p-2 font-bold text-center" style={{ width: '8%' }}>
                        SR. No.
                      </th>
                      <th className="border border-black p-2 font-bold text-center" style={{ width: '45%' }}>
                        Tools Description
                      </th>
                      <th className="border border-black p-2 font-bold text-center" style={{ width: '12%' }}>
                        M/U
                      </th>
                      <th className="border border-black p-2 font-bold text-center" style={{ width: '12%' }}>
                        QTY.
                      </th>
                      <th className="border border-black p-2 font-bold text-center" style={{ width: '23%' }}>
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tools.map((tool, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-black p-2 text-center font-medium">
                          {i + 1}
                        </td>
                        <td className="border border-black p-2" style={{ minHeight: '30px' }}>
                          {tool.description}
                        </td>
                        <td className="border border-black p-2 text-center">
                          {tool.unit}
                        </td>
                        <td className="border border-black p-2 text-center">
                          {tool.qty}
                        </td>
                        <td className="border border-black p-2">
                          {tool.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bottom Section */}
                <div className="border-t-2 border-black">
                  <div className="bg-gray-100 p-3 border-b border-black">
                    <h3 className="font-bold text-lg">To be filled by receiver:</h3>
                  </div>
                  
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border-r border-b border-black p-3 font-semibold bg-gray-50" style={{ width: '20%' }}>
                          Receivers Name:
                        </td>
                        <td className="border-r border-b border-black p-3" style={{ width: '30%' }}>
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {formData.receiver.name}
                          </div>
                        </td>
                        <td className="border-r border-b border-black p-3 font-semibold bg-gray-50" style={{ width: '20%' }}>
                          Department:
                        </td>
                        <td className="border-b border-black p-3" style={{ width: '30%' }}>
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {formData.receiver.department}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                          Sign:
                        </td>
                        <td className="border-r border-b border-black p-3">
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {/* Empty signature cell - no signature pad */}
                          </div>
                        </td>
                        <td className="border-r border-b border-black p-3 font-semibold bg-gray-50">
                          Instruction from:
                        </td>
                        <td className="border-b border-black p-3">
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {formData.receiver.instructionFrom}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-3 font-semibold bg-gray-50">
                          OLT NO.
                        </td>
                        <td className="border-r border-black p-3">
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {formData.receiver.oltNo}
                          </div>
                        </td>
                        <td className="border-r border-black p-3 font-semibold bg-gray-50">
                          Receivers Contact:
                        </td>
                        <td className="border-black p-3">
                          <div className="border-b border-gray-400 pb-2" style={{ minHeight: '25px' }}>
                            {formData.receiver.contact}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Always Visible */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={exportToExcel} 
            disabled={isExporting}
            className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
              isExporting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-1'
            }`}
          >
            {isExporting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                📊 Export to Excel
              </>
            )}
          </button>
          
          <button 
            onClick={exportToPDF} 
            disabled={isExporting}
            className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
              isExporting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-1'
            }`}
          >
            {isExporting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                📄 Export to PDF
              </>
            )}
          </button>

          <button 
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
          >
            {activeTab === 'form' ? '👁️ Preview' : '📝 Edit'}
          </button>
        </div>
        
        {/* Status Indicators */}
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <div className={`flex items-center ${formData.issuerName && formData.date ? 'text-green-600' : 'text-red-500'}`}>
            <span className="mr-1">{formData.issuerName && formData.date ? '✅' : '❌'}</span>
            Basic Info
          </div>
          <div className={`flex items-center ${formData.tools.some(t => t.description) ? 'text-green-600' : 'text-red-500'}`}>
            <span className="mr-1">{formData.tools.some(t => t.description) ? '✅' : '❌'}</span>
            Tools Added
          </div>
          <div className={`flex items-center ${formData.receiver.name ? 'text-green-600' : 'text-red-500'}`}>
            <span className="mr-1">{formData.receiver.name ? '✅' : '❌'}</span>
            Receiver Info
          </div>
        </div>
      </div>

      {/* Hidden container for Excel export reference */}
      <div ref={containerRef} className="hidden">
        {/* This is used for maintaining compatibility if needed */}
      </div>
    </div>
  );
};

export default IssuancePage;