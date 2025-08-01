import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
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

const GatePassPage = () => {
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
    };
    
    setGeneratedPass(passData);
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
            <div className="mt-4 md:mt-0">
              <button
                onClick={downloadPass}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Gate Pass (PDF)
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gate Pass Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requester Information</h4>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.requesterName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Employee ID</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.employeeId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Department</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.department}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Designation</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.designation}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Pass Information</h4>
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Pass Number</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.passNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Issue Date</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.issueDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Expected Return</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.expectedReturnDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Authorized By</dt>
                    <dd className="text-sm text-gray-900">{generatedPass.authorizedBy}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{generatedPass.itemsDescription}</p>
              <p className="text-sm font-medium text-gray-900 mt-2">Quantity: {generatedPass.quantity}</p>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Purpose</h4>
              <p className="text-sm text-gray-900">{generatedPass.purpose}</p>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Destination</h4>
              <p className="text-sm text-gray-900">{generatedPass.destination}</p>
            </div>

            {generatedPass.remarks && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Remarks</h4>
                <p className="text-sm text-gray-900">{generatedPass.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;