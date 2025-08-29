import React, { useState, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from 'react-router-dom';
import { gatePassService } from '@/services/gatePassService';
import { PageContainer } from "@/components/layout/PageContainer";

const GatePassPage = () => {
  const [formData, setFormData] = useState({
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

  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  const [searchParams] = useSearchParams();

  const formatDepartment = (dept?: string) => {
    const map: Record<string, string> = {
      em_systems: 'E&M SYSTEMS',
      em_track: 'E&M TRACK',
      em_power: 'E&M POWER',
      em_signalling: 'E&M SIGNALLING',
      em_communication: 'E&M COMMUNICATION',
      em_third_rail: 'E&M THIRD RAIL',
      em_safety_quality: 'E&M SAFETY & QUALITY',
    };
    return dept ? (map[dept] || dept) : '';
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;

    let isMounted = true;
    (async () => {
      try {
        const record = await gatePassService.getById(id);
        if (!record || !isMounted) return;

        const toolsArray = Array.from({ length: 30 }, () => ({ description: "", unit: "", qty: "", remarks: "" }));
        if ((record as any).itemsDescription) {
          toolsArray[0] = {
            description: (record as any).itemsDescription || "",
            unit: "",
            qty: String((record as any).quantitySummary || ""),
            remarks: (record as any).purpose || "",
          };
        }

        setFormData(prev => ({
          ...prev,
          issuerName: (record as any).requesterName || prev.issuerName,
          date: record.created_at?.split('T')[0] || prev.date,
          department: formatDepartment((record as any).department || prev.department),
          designation: prev.designation,
          contact: prev.contact,
          signature: prev.signature,
          oltNo: prev.oltNo,
          tools: toolsArray,
          receiver: {
            name: (record as any).receiver?.name || prev.receiver.name,
            department: (record as any).receiver?.department || prev.receiver.department,
            sign: (record as any).receiver?.sign || prev.receiver.sign,
            instructionFrom: (record as any).receiver?.instructionFrom || prev.receiver.instructionFrom,
            oltNo: (record as any).receiver?.oltNo || prev.receiver.oltNo,
            contact: (record as any).receiver?.contact || prev.receiver.contact,
          }
        }));
        setActiveTab('preview');
      } catch (e) {
        // Non-blocking if load fails
      }
    })();

    return () => { isMounted = false; };
  }, [searchParams]);

  const handleToolChange = (index, field, value) => {
    const updated = [...formData.tools];
    updated[index][field] = value;
    setFormData({ ...formData, tools: updated });
  };

  const containerRef = useRef(null);
  const printRef = useRef(null);

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      // Create HTML table that looks exactly like the Gate Pass
      let htmlContent = `
        <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <tr>
            <td colspan="5" style="text-align: center; font-weight: bold; font-size: 16px; background-color: #d4edda; padding: 10px; border: 2px solid black;">
              E & M Sub-Department
            </td>
          </tr>
          <tr>
            <td colspan="5" style="text-align: center; font-weight: bold; font-size: 14px; background-color: #cce5ff; padding: 8px; border: 2px solid black;">
              Gate Pass
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
            <title>Gate Pass</title>
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
      link.download = `GatePass_${currentDate}_${Date.now()}.xls`;
      
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
      const filename = `GatePass_${currentDate}_${Date.now()}.pdf`;
      
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
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8">
      <div className="w-full p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gate Pass Management</h1>
          <p className="text-gray-600">Create and manage gate pass forms for equipment and tools</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-1">
            <nav className="flex space-x-1 p-1">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'form'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="text-lg">📝</span>
                  <span>Edit Form</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'bg-white text-red-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span className="text-lg">👁️</span>
                  <span>Preview</span>
                </span>
              </button>
            </nav>
          </div>
          </div>

        {/* Tab Content */}
        {activeTab === 'form' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Gate Pass Form</h2>
                <p className="text-gray-600">Fill in the details below to create a gate pass form</p>
              </div>
              <button
                onClick={clearForm}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <span>🗑️</span>
                  <span>Clear Form</span>
                </span>
              </button>
            </div>

            {/* Issuer Information */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl mb-8 border border-orange-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Issuer Information</h3>
                  <p className="text-gray-600">Enter the details of the person issuing the gate pass</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issuer Name *</label>
                  <input 
                    type="text"
                    value={formData.issuerName}
                    onChange={e => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter issuer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input 
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <input 
                    type="text"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter designation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                  <input 
                    type="text"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">OLT NO.</label>
                  <input 
                    type="text"
                    value={formData.oltNo}
                    onChange={e => setFormData({ ...formData, oltNo: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter OLT number"
                  />
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl mb-8 border border-red-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🔧</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Tools Information</h3>
                  <p className="text-gray-600">Add the tools and equipment being taken out</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-gray-200 bg-white rounded-xl overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-red-500 to-pink-600">
                      <th className="border border-gray-300 p-4 text-center font-bold text-white w-16">SR. No.</th>
                      <th className="border border-gray-300 p-4 text-center font-bold text-white">Tools Description</th>
                      <th className="border border-gray-300 p-4 text-center font-bold text-white w-20">M/U</th>
                      <th className="border border-gray-300 p-4 text-center font-bold text-white w-20">QTY.</th>
                      <th className="border border-gray-300 p-4 text-center font-bold text-white">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tools.slice(0, 15).map((tool, i) => (
                      <tr key={i} className={`hover:bg-red-50 transition-colors duration-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="border border-gray-200 p-3 text-center font-semibold text-gray-700 bg-gray-100">{i + 1}</td>
                        <td className="border border-gray-200 p-2">
                          <input 
                            type="text"
                            value={tool.description}
                            onChange={e => handleToolChange(i, "description", e.target.value)}
                            className="w-full p-3 border-2 border-transparent rounded-lg outline-none focus:bg-red-50 focus:border-red-300 transition-all duration-200"
                            placeholder="Enter tool description"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input 
                            type="text"
                            value={tool.unit}
                            onChange={e => handleToolChange(i, "unit", e.target.value)}
                            className="w-full p-3 border-2 border-transparent rounded-lg outline-none text-center focus:bg-red-50 focus:border-red-300 transition-all duration-200"
                            placeholder="Unit"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input 
                            type="text"
                            value={tool.qty}
                            onChange={e => handleToolChange(i, "qty", e.target.value)}
                            className="w-full p-3 border-2 border-transparent rounded-lg outline-none text-center focus:bg-red-50 focus:border-red-300 transition-all duration-200"
                            placeholder="Qty"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input 
                            type="text"
                            value={tool.remarks}
                            onChange={e => handleToolChange(i, "remarks", e.target.value)}
                            className="w-full p-3 border-2 border-transparent rounded-lg outline-none focus:bg-red-50 focus:border-red-300 transition-all duration-200"
                            placeholder="Enter remarks"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600 text-lg">💡</span>
                  <p className="text-sm text-orange-800 font-medium">Showing first 15 rows for editing. All 30 rows will be included in exports.</p>
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl mb-8 border border-indigo-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl">📥</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Receiver Information</h3>
                  <p className="text-gray-600">Enter the details of the person receiving the items</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receivers Name</label>
                  <input 
                    type="text"
                    value={formData.receiver.name}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter receiver name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input 
                    type="text"
                    value={formData.receiver.department}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, department: e.target.value } })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Instruction from</label>
                  <input 
                    type="text"
                    value={formData.receiver.instructionFrom}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, instructionFrom: e.target.value } })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter instruction source"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">OLT NO.</label>
                  <input 
                    type="text"
                    value={formData.receiver.oltNo}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, oltNo: e.target.value } })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter OLT number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receivers Contact</label>
                  <input 
                    type="text"
                    value={formData.receiver.contact}
                    onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, contact: e.target.value } })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter contact number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Gate Pass Preview</h2>
              <p className="text-gray-600">Preview your gate pass form before exporting</p>
            </div>
            
            {/* Exact replica for display/export */}
            <div ref={printRef} className="bg-white mx-auto shadow-2xl rounded-2xl overflow-hidden" style={{ width: '210mm', fontFamily: 'Arial, sans-serif' }}>
              <div className="border-4 border-black">
                {/* Title Header */}
                <div className="bg-green-100 text-center py-4 border-b-2 border-black">
                  <h1 className="text-2xl font-bold">E & M Sub-Department</h1>
                </div>
                
                {/* Gate Pass Header */}
                <div className="bg-blue-200 text-center py-3 border-b-2 border-black">
                  <h2 className="text-xl font-semibold">Gate Pass</h2>
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
      <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Export & Actions</h3>
          <p className="text-gray-600">Export your gate pass form or switch between edit and preview modes</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          <button 
            onClick={exportToExcel} 
            disabled={isExporting}
            className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              isExporting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
          >
            {isExporting ? (
              <span className="flex items-center space-x-2">
                <span className="inline-block animate-spin">⏳</span>
                <span>Exporting...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span className="text-lg">📊</span>
                <span>Export to Excel</span>
              </span>
            )}
          </button>
          
          <button 
            onClick={exportToPDF} 
            disabled={isExporting}
            className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              isExporting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
          >
            {isExporting ? (
              <span className="flex items-center space-x-2">
                <span className="inline-block animate-spin">⏳</span>
                <span>Exporting...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span className="text-lg">📄</span>
                <span>Export to PDF</span>
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span className="flex items-center space-x-2">
              <span className="text-lg">{activeTab === 'form' ? '👁️' : '📝'}</span>
              <span>{activeTab === 'form' ? 'Preview' : 'Edit'}</span>
            </span>
          </button>
        </div>
        
        {/* Status Indicators */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-center text-sm font-semibold text-gray-700 mb-4">Form Completion Status</h4>
          <div className="flex justify-center space-x-8">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.issuerName && formData.date 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.issuerName && formData.date ? '✅' : '❌'}</span>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.tools.some(t => t.description) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.tools.some(t => t.description) ? '✅' : '❌'}</span>
              <span className="font-medium">Tools Added</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.receiver.name 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.receiver.name ? '✅' : '❌'}</span>
              <span className="font-medium">Receiver Info</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for Excel export reference */}
      <div ref={containerRef} className="hidden">
        {/* This is used for maintaining compatibility if needed */}
      </div>
    </PageContainer>
  );
};

export default GatePassPage;