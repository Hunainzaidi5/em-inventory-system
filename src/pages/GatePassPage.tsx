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

  const [tools, setTools] = useState<{ description: string; unit: string; qty: string }[]>([
    { description: '', unit: 'PCS', qty: '1' }
  ]);

  const addTool = () => {
    setTools([...tools, { description: '', unit: 'PCS', qty: '1' }]);
  };

  const removeTool = (index: number) => {
    if (tools.length > 1) {
      const newTools = [...tools];
      newTools.splice(index, 1);
      setTools(newTools);
    }
  };

  const handleToolChange = (index: number, field: 'description' | 'unit' | 'qty' | string, value: string) => {
    // Handle the tools array state
    const newTools = [...tools];
    newTools[index] = { ...newTools[index], [field]: value };
    setTools(newTools);
    
    // Also update the formData.tools to keep them in sync if needed
    if (formData.tools && index < formData.tools.length) {
      const updatedFormTools = [...formData.tools];
      updatedFormTools[index] = { ...updatedFormTools[index], [field]: value };
      setFormData({ ...formData, tools: updatedFormTools });
    }
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const newTools = [...tools];
    const currentQty = parseInt(newTools[index].qty) || 1;
    const newQty = Math.max(1, currentQty + delta);
    newTools[index].qty = newQty.toString();
    setTools(newTools);
  };

  return (
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8 px-4 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-8 overflow-hidden border border-[#e1d4b1]/50">
          <div className="bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] p-1">
            <nav className="flex space-x-1 p-1">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'form'
                    ? 'bg-white text-[#5c4a2a] shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Form</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'bg-white text-[#5c4a2a] shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </span>
              </button>
            </nav>
          </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'form' && (
            <div className="p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-[#5c4a2a] mb-1">Gate Pass</h2>
                 <p className="text-[#8c7a5c]">Fill in the details below to create a Gate Pass</p>
               </div>
               <div className="flex flex-wrap gap-4 mt-8">
                <button
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] hover:from-[#a08d63] hover:to-[#7a6a4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b39b6e] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-[#8c7a5c] to-[#6d5e47] hover:from-[#7a6a4f] hover:to-[#5c4f3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8c7a5c] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  {isExporting ? 'Exporting...' : 'Export to PDF'}
                </button>
              </div>
              <button
                onClick={clearForm}
                className="px-5 py-2.5 bg-gradient-to-r from-[#d4b17a] to-[#b39b6e] text-white rounded-xl hover:from-[#c2a26d] hover:to-[#9c8a5f] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span className="flex items-center space-x-2 text-sm sm:text-base">
                  <span>🗑️</span>
                  <span>Clear Form</span>
                </span>
              </button>
             </div>

        {/* Status Indicators */}
        <div className="mt-8 pt-6 pb-8 border-t border-gray-200 mb-8">
          <h4 className="text-left text-sm font-semibold text-gray-700 mb-2">Form Completion Status</h4>
          <div className="flex justify-start space-x-8">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.issuerName && formData.date 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.issuerName && formData.date ? '🟢' : '🔴'}</span>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.tools.some(t => t.description) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.tools.some(t => t.description) ? '🟢' : '🔴'}</span>
              <span className="font-medium">Tools Added</span>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              formData.receiver.name 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-lg">{formData.receiver.name ? '🟢' : '🔴'}</span>
              <span className="font-medium">Receiver Info</span>
            </div>
          </div>
        </div>

            {/* Issuer Information */}
            <div className="bg-gradient-to-br from-[#f5f1e8] to-[#e9e0d0] p-6 rounded-2xl mb-8 border border-[#e1d4b1] shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] rounded-xl flex items-center justify-center mr-4 mb-3 sm:mb-0 flex-shrink-0">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#5c4a2a]">Issuer Information</h3>
                  <p className="text-[#8c7a5c]">Enter the details of the person issuing the gate pass</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label htmlFor="issuerName" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    Issuer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="issuerName"
                    value={formData.issuerName}
                    onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a] placeholder-[#8c7a5c]/60"
                    placeholder="Enter issuer name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="date" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="department" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a] appearance-none"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Department 1">Department 1</option>
                    <option value="Department 2">Department 2</option>
                    <option value="Department 3">Department 3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="designation" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a] placeholder-[#8c7a5c]/60"
                    placeholder="Enter designation"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a] placeholder-[#8c7a5c]/60"
                    placeholder="Enter contact number"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="oltNo" className="block text-sm font-medium text-[#5c4a2a] mb-1">
                    OLT Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="oltNo"
                    value={formData.oltNo}
                    onChange={(e) => setFormData({ ...formData, oltNo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e1d4b1] rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#b39b6e] focus:border-transparent transition-all duration-200 text-[#5c4a2a] placeholder-[#8c7a5c]/60"
                    placeholder="Enter OLT number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#e1d4b1]/30 overflow-hidden mb-8">
              <div className="p-6 border-b border-[#e1d4b1]/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#8c7a5c] to-[#6b5d45] rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white text-xl">🔧</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#5c4a2a]">Tools Information</h3>
                      <p className="text-[#8c7a5c]">Add the tools and equipment being taken out</p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] text-white rounded-xl hover:from-[#9c8a5f] hover:to-[#7a6a4a] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {isExporting ? 'Exporting...' : 'Export to PDF'}
                    </button>
                    <button
                      onClick={exportToExcel}
                      disabled={isExporting}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#8c7a5c] to-[#6b5d45] text-white rounded-xl hover:from-[#7a6a4a] hover:to-[#5a4d39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b39b6e] focus:ring-opacity-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isExporting ? 'Exporting...' : 'Export to Excel'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c]">
                      <th className="border border-[#e1d4b1] p-3 text-center font-medium text-white text-sm uppercase tracking-wider w-16">SR. No.</th>
                      <th className="border border-[#e1d4b1] p-3 text-center font-medium text-white text-sm uppercase tracking-wider">Tools Description</th>
                      <th className="border border-[#e1d4b1] p-3 text-center font-medium text-white text-sm uppercase tracking-wider w-20">M/U</th>
                      <th className="border border-[#e1d4b1] p-3 text-center font-medium text-white text-sm uppercase tracking-wider w-32">Qty</th>
                      <th className="border border-[#e1d4b1] p-3 text-center font-medium text-white text-sm uppercase tracking-wider w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map((tool, i) => (
                      <tr key={i} className="bg-white hover:bg-[#f9f7f0] transition-colors">
                        <td className="border border-[#e1d4b1] p-3 text-center text-[#5c4a2a] font-medium">{i + 1}</td>
                        <td className="border border-[#e1d4b1] p-3">
                          <input
                            type="text"
                            value={tool.description}
                            onChange={(e) => handleToolChange(i, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-[#e1d4b1] rounded-lg bg-white/90 text-[#5c4a2a] placeholder-[#b39b6e]/60 focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200"
                            placeholder="Enter tool description"
                          />
                        </td>
                        <td className="border border-[#e1d4b1] p-3">
                          <div className="relative">
                            <select
                              value={tool.unit}
                              onChange={(e) => handleToolChange(i, 'unit', e.target.value)}
                              className="w-full px-3 py-2 border border-[#e1d4b1] rounded-lg bg-white/90 text-[#5c4a2a] focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] appearance-none pr-8"
                            >
                              <option value="">Select Unit</option>
                              <option value="Unit 1">Unit 1</option>
                              <option value="Unit 2">Unit 2</option>
                              <option value="Unit 3">Unit 3</option>
                            </select>
                          </div>
                        </td>
                        <td className="border border-[#e1d4b1] p-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleQuantityChange(i, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-[#f0e9db] text-[#5c4a2a] rounded-l-lg hover:bg-[#e1d4b1] focus:outline-none focus:ring-2 focus:ring-[#b39b6e] focus:ring-opacity-50 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={tool.qty}
                              onChange={(e) => handleToolChange(i, 'qty', e.target.value)}
                              className="w-16 h-8 text-center border-t border-b border-[#e1d4b1] bg-white/90 text-[#5c4a2a] focus:outline-none focus:ring-1 focus:ring-[#b39b6e]"
                            />
                            <button
                              onClick={() => handleQuantityChange(i, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-[#f0e9db] text-[#5c4a2a] rounded-r-lg hover:bg-[#e1d4b1] focus:outline-none focus:ring-2 focus:ring-[#b39b6e] focus:ring-opacity-50 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="border border-[#e1d4b1] p-3 text-center">
                          <button
                            onClick={() => removeTool(i)}
                            className="text-[#8c7a5c] hover:text-[#6b5d45] focus:outline-none transition-colors duration-200 p-1 rounded-full hover:bg-[#f0e9db]"
                            aria-label="Remove tool"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} className="p-3">
                        <div className="border-t-2 border-dashed border-[#e1d4b1] pt-4">
                          <button
                            onClick={addTool}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#f0e9db] to-[#e5dcc7] text-[#5c4a2a] rounded-xl hover:from-[#e1d4b1] hover:to-[#d4c7a8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b39b6e] focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Another Tool
                          </button>
                        </div>
                      </td>
                    </tr>
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
            <div className="bg-gradient-to-br from-[#f0e9db] to-[#e5dcc7] p-6 rounded-2xl mb-8 border border-[#e1d4b1] shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8c7a5c] to-[#6b5d45] rounded-xl flex items-center justify-center mr-4 mb-3 sm:mb-0 flex-shrink-0">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#5c4a2a]">Receiver Information</h3>
                  <p className="text-[#8c7a5c]">Enter the details of the person receiving the tools</p>
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

      {/* Hidden container for Excel export reference */}
      <div ref={containerRef} className="hidden">
        {/* This is used for maintaining compatibility if needed */}
      </div>
    </PageContainer>
  );
};

export default GatePassPage;