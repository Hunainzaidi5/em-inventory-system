import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from "qrcode.react";
import { saveAs } from 'file-saver';
import { UserRole } from "../types";

interface GatePassFormData {
  requesterName: string;
  employeeId: string;
  department: string;
  designation: string;
  contactNumber: string;
  destination: string;
  purpose: string;
  itemsDescription: string;
  quantity: string;
  expectedReturnDate: string;
  authorizedBy: string;
  securityCheck: boolean;
  remarks: string;
}

const QRGeneratorPage = () => {
  const [qrValue, setQrValue] = useState<string>("");
  const [generatedPass, setGeneratedPass] = useState<any>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GatePassFormData>();

  const userRole: UserRole = 'engineer'; // This would come from auth context in a real app
  const currentDate = new Date().toISOString().split('T')[0];
  const passNumber = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const onSubmit = (data: GatePassFormData) => {
    const passData = {
      ...data,
      id: uuidv4(),
      passNumber,
      issueDate: currentDate,
      status: 'active',
      qrCode: `GATEPASS-${passNumber}`,
    };
    
    setQrValue(JSON.stringify(passData));
    setGeneratedPass(passData);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qrcode') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `gate-pass-${passNumber}.png`);
        }
      });
    }
  };

  const downloadPass = () => {
    // This would generate a PDF in a real app
    alert('PDF generation would be implemented here');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gate Pass & Issuance System</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Gate Pass</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name *</label>
              <input
                type="text"
                {...register('requesterName', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.requesterName && <p className="text-red-500 text-xs mt-1">{errors.requesterName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                {...register('employeeId', { required: 'Employee ID is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                {...register('department', { required: 'Department is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Other">Other</option>
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
              <input
                type="text"
                {...register('designation', { required: 'Designation is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="tel"
                {...register('contactNumber', { 
                  required: 'Contact number is required',
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
              <input
                type="text"
                {...register('destination', { required: 'Destination is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <textarea
                {...register('purpose', { required: 'Purpose is required' })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Description *</label>
              <textarea
                {...register('itemsDescription', { required: 'Items description is required' })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed description of items including quantities, serial numbers, etc."
              ></textarea>
              {errors.itemsDescription && <p className="text-red-500 text-xs mt-1">{errors.itemsDescription.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="text"
                {...register('quantity', { required: 'Quantity is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date *</label>
              <input
                type="date"
                {...register('expectedReturnDate', { required: 'Expected return date is required' })}
                min={currentDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expectedReturnDate && <p className="text-red-500 text-xs mt-1">{errors.expectedReturnDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Authorized By *</label>
              <select
                {...register('authorizedBy', { required: 'Authorized by is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Authorizer</option>
                <option value="Manager">Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Team Lead">Team Lead</option>
              </select>
              {errors.authorizedBy && <p className="text-red-500 text-xs mt-1">{errors.authorizedBy.message}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="securityCheck"
                {...register('securityCheck', { required: 'Security check confirmation is required' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="securityCheck" className="ml-2 block text-sm text-gray-700">
                I confirm that all items have been checked by security
              </label>
              {errors.securityCheck && <p className="text-red-500 text-xs mt-1">This confirmation is required</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                {...register('remarks')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information or special instructions"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate Gate Pass
            </button>
          </div>
        </form>
      </div>

      {generatedPass && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Gate Pass Generated Successfully!</h2>
              <p className="text-gray-600">Pass Number: <span className="font-medium">{generatedPass.passNumber}</span></p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download QR Code
              </button>
              <button
                onClick={downloadPass}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Gate Pass (PDF)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Pass Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Requester Name</p>
                    <p className="font-medium">{generatedPass.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="font-medium">{generatedPass.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{generatedPass.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-medium">{generatedPass.designation}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">{generatedPass.destination}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p className="font-medium">{generatedPass.purpose}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Items Description</p>
                    <p className="font-medium whitespace-pre-line">{generatedPass.itemsDescription}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{generatedPass.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">{new Date(currentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Return</p>
                    <p className="font-medium">{new Date(generatedPass.expectedReturnDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Authorized By</p>
                    <p className="font-medium">{generatedPass.authorizedBy}</p>
                  </div>
                  {generatedPass.remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Remarks</p>
                      <p className="font-medium">{generatedPass.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please present this QR code at the security checkpoint when exiting and returning to the premises.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <QRCodeSVG
                  id="qrcode"
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Scan this QR code to verify gate pass details
              </p>
              <div className="text-center">
                <p className="text-sm font-medium">{generatedPass.passNumber}</p>
                <p className="text-xs text-gray-500">Valid until: {new Date(generatedPass.expectedReturnDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGeneratorPage;