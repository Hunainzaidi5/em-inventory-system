import React, { useState, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';
import { gatePassService } from '@/services/gatePassService';
import { PageContainer } from "@/components/layout/PageContainer";

const GatePassPage: React.FC = () => {
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

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const [searchParams] = useSearchParams();


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
          department: (record as any).department || prev.department,
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

          {/* Tab Content */}
          {activeTab === 'form' && (
            <div className="p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default GatePassPage;