import React, { useState, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSearchParams } from 'react-router-dom';
import { issuanceService } from '@/services/issuanceService';
import SignaturePad from '@/components/SignaturePad';
import { PageContainer } from "@/components/layout/PageContainer";

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
          department: formatDepartment((record as any).department || ""),
          designation: (record as any).issuer_designation || "",
          contact: (record as any).issuer_contact || "",
          signature: (record as any).issuer_signature || "",
          oltNo: (record as any).issuer_olt_no || "",
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

  // Add a new tool to the tools list
  const addTool = useCallback((): void => {
    setFormData(prev => ({
      ...prev,
      tools: [...prev.tools, { description: "", unit: "", qty: "", remarks: "" }]
    }));
  }, []);

  // Remove a tool from the tools list
  const removeTool = useCallback((index: number): void => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index)
    }));
  }, []);

  // Update a specific field of a tool
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
            <td colspan="2" style="padding: 8px; border: 1px solid black; height: 30px;">
              ${formData.signature ? `<img src="${formData.signature}" alt="Issuer Signature" style="max-height: 25px; max-width: 100%;" />` : ''}
            </td>
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
            <td style="padding: 8px; border: 1px solid black; border-bottom: 2px solid #666; min-height: 30px;">
              ${formData.receiver.sign ? `<img src="${formData.receiver.sign}" alt="Receiver Signature" style="max-height: 20px; max-width: 100%;" />` : ''}
            </td>
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
    <PageContainer className="min-h-screen bg-gradient-to-br from-white via-white to-white py-8 px-4 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-900 to-orange-400 bg-clip-text text-transparent mb-2">Issuance Management</h1>
          <p className="text-gray-600">Create and manage issuance forms with digital signatures</p>
        </div>

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

                 {/* Tab Content */}
         {activeTab === 'form' && (
           <div className="p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-[#5c4a2a] mb-1">Issuance Form</h2>
                 <p className="text-[#8c7a5c]">Fill in the details below to create an issuance form</p>
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
             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl mb-8 border border-[#e1d4b1] shadow-sm">
               <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                 <div className="w-12 h-12 bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] rounded-xl flex items-center justify-center flex-shrink-0">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-[#5c4a2a]">Issuer Information</h3>
                   <p className="text-[#8c7a5c]">Enter the details of the person issuing the items</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Issuer Name <span className="text-red-500">*</span></label>
                   <input 
                     type="text"
                     value={formData.issuerName}
                     onChange={e => setFormData({ ...formData, issuerName: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none"
                     placeholder="Enter issuer name"
                   />
                 </div>
                                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Date <span className="text-red-500">*</span></label>
                   <input 
                     type="date"
                     value={formData.date}
                     onChange={e => setFormData({ ...formData, date: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none text-[#5c4a2a]"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Department</label>
                   <input 
                     type="text"
                     value={formData.department}
                     onChange={e => setFormData({ ...formData, department: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none"
                     placeholder="Enter department"
                   />
                 </div>
                                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Designation</label>
                   <input 
                     type="text"
                     value={formData.designation}
                     onChange={e => setFormData({ ...formData, designation: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none"
                     placeholder="Enter designation"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Contact</label>
                   <input 
                     type="text"
                     value={formData.contact}
                     onChange={e => setFormData({ ...formData, contact: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none"
                     placeholder="Enter contact number"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">OLT NO.</label>
                   <input 
                     type="text"
                     value={formData.oltNo}
                     onChange={e => setFormData({ ...formData, oltNo: e.target.value })}
                     className="w-full p-3 border border-[#e1d4b1] rounded-lg focus:ring-2 focus:ring-[#b39b6e] focus:border-[#b39b6e] transition-all duration-200 bg-white/80 hover:bg-white focus:bg-white shadow-sm focus:outline-none"
                     placeholder="Enter OLT number"
                   />
                 </div>
                                 <div>
                   <label className="block text-sm font-medium text-[#5c4a2a] mb-1.5">Signature</label>
                   <SignaturePad
                     value={formData.signature}
                     onChange={(value) => setFormData({ ...formData, signature: value })}
                     className="w-full"
                     placeholder="Draw your signature or upload an image"
                   />
                 </div>
               </div>
             </div>

             {/* Tools Section */}
             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl mb-8 border border-[#e1d4b1] shadow-sm">
               <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                 <div className="w-12 h-12 bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] rounded-xl flex items-center justify-center flex-shrink-0">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-[#5c4a2a]">Tools Information</h3>
                   <p className="text-[#8c7a5c]">Add the tools and equipment being issued</p>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-[#e1d4b1] rounded-lg overflow-hidden">
                   <thead>
                     <tr className="bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c]">
                       <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Quantity</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Remarks</th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {formData.tools.slice(0, 15).map((tool, i) => (
                       <tr key={i} className={`hover:bg-green-50 transition-colors duration-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                         <td className="px-4 py-3 whitespace-nowrap">
                           <input
                             type="text"
                             value={tool.description}
                             onChange={(e) => handleToolChange(i, 'description', e.target.value)}
                             className="w-full p-2 border border-[#e1d4b1] rounded-md focus:ring-[#b39b6e] focus:border-[#b39b6e] bg-white/80 focus:bg-white transition-colors"
                             placeholder="Tool description"
                           />
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap">
                           <input
                             type="text"
                             value={tool.unit}
                             onChange={(e) => handleToolChange(i, 'unit', e.target.value)}
                             className="w-20 p-2 border border-[#e1d4b1] rounded-md focus:ring-[#b39b6e] focus:border-[#b39b6e] bg-white/80 focus:bg-white transition-colors text-center"
                             placeholder="Unit"
                           />
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap">
                           <input
                             type="text"
                             value={tool.qty}
                             onChange={(e) => handleToolChange(i, 'qty', e.target.value)}
                             className="w-20 p-2 border border-[#e1d4b1] rounded-md focus:ring-[#b39b6e] focus:border-[#b39b6e] bg-white/80 focus:bg-white transition-colors text-center"
                             placeholder="Quantity"
                           />
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap">
                           <input
                             type="text"
                             value={tool.remarks}
                             onChange={(e) => handleToolChange(i, 'remarks', e.target.value)}
                             className="w-full p-2 border border-[#e1d4b1] rounded-md focus:ring-[#b39b6e] focus:border-[#b39b6e] bg-white/80 focus:bg-white transition-colors"
                             placeholder="Any remarks"
                           />
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-right">
                           <button
                             type="button"
                             onClick={() => removeTool(i)}
                             className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                             title="Remove tool"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 22H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                 <div className="flex items-start space-x-3">
                   <div className="flex-shrink-0 mt-0.5">
                     <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                       <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                   <p className="text-sm text-amber-800">
                     <span className="font-medium">Note:</span> Showing first 15 rows for editing. All {formData.tools.length} rows will be included in exports.
                   </p>
                 </div>
               </div>
               <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={addTool}
                    disabled={formData.tools.length >= 30}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-[#b39b6e] to-[#8c7a5c] text-white font-medium rounded-lg hover:from-[#a08d63] hover:to-[#7a6a4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b39b6e] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Tool
                  </button>
                </div>
             </div>

                         {/* Receiver Information */}
             <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl mb-8 border border-purple-100">
               <div className="flex items-center mb-6">
                 <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
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
                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                     placeholder="Enter receiver name"
                   />
                 </div>
                                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                   <input 
                     type="text"
                     value={formData.receiver.department}
                     onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, department: e.target.value } })}
                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                     placeholder="Enter department"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Instruction from</label>
                   <input 
                     type="text"
                     value={formData.receiver.instructionFrom}
                     onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, instructionFrom: e.target.value } })}
                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                     placeholder="Enter instruction source"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">OLT NO.</label>
                   <input 
                     type="text"
                     value={formData.receiver.oltNo}
                     onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, oltNo: e.target.value } })}
                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                     placeholder="Enter OLT number"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Receivers Contact</label>
                   <input 
                     type="text"
                     value={formData.receiver.contact}
                     onChange={e => setFormData({ ...formData, receiver: { ...formData.receiver, contact: e.target.value } })}
                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                     placeholder="Enter contact number"
                   />
                 </div>
                                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Receiver Signature</label>
                   <SignaturePad
                     value={formData.receiver.sign}
                     onChange={(value) => setFormData({ 
                       ...formData, 
                       receiver: { ...formData.receiver, sign: value } 
                     })}
                     className="w-full"
                     placeholder="Draw receiver signature or upload an image"
                   />
                 </div>
               </div>
             </div>
           </div>
         )}

                 {activeTab === 'preview' && (
           <div className="p-8">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-bold text-gray-800 mb-2">Issuance Preview</h2>
               <p className="text-gray-600">Preview your issuance form before exporting</p>
             </div>
            
                         {/* Exact replica for display/export */}
             <div ref={printRef} className="bg-white mx-auto shadow-2xl rounded-2xl overflow-hidden" style={{ width: '210mm', fontFamily: 'Arial, sans-serif' }}>
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
                        {formData.signature ? (
                          <img 
                            src={formData.signature} 
                            alt="Issuer Signature" 
                            className="h-8 max-w-full object-contain"
                          />
                        ) : (
                          <div className="h-8 border-b border-gray-400"></div>
                        )}
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
                            {formData.receiver.sign ? (
                              <img 
                                src={formData.receiver.sign} 
                                alt="Receiver Signature" 
                                className="h-6 max-w-full object-contain"
                              />
                            ) : (
                              <div className="h-6"></div>
                            )}
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
      
      {/* Hidden container for Excel export reference */}
      <div ref={containerRef} className="hidden">
        {/* This is used for maintaining compatibility if needed */}
      </div>
    </PageContainer>
  );
};

export default IssuancePage;