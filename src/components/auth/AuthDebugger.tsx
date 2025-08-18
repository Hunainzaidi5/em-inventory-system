import React, { useState } from 'react';
import { AuthStatusChecker } from './AuthStatusChecker';
import { runAllTests } from '@/utils/testConnection';

export const AuthDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      await runAllTests();
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Auth Debugger"
      >
        🔧
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-lg"
        >
          ✕
        </button>
        <button
          onClick={handleRunTests}
          disabled={isRunningTests}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {isRunningTests ? '🧪 Testing...' : '🧪 Run Tests'}
        </button>
      </div>
      <AuthStatusChecker />
    </div>
  );
};
