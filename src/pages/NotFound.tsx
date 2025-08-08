import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FiHome, FiArrowLeft, FiSearch, FiSettings, FiPackage } from "react-icons/fi";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToInventory = () => {
    navigate('/inventory');
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-auto text-center px-6">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-gray-300">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl text-gray-600">🚫</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Attempted URL */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500 mb-2">Attempted URL:</p>
          <p className="text-sm font-mono text-gray-700 break-all">
            {location.pathname}
          </p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FiHome className="w-4 h-4" />
              Go to Dashboard
            </button>
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleGoToInventory}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FiPackage className="w-4 h-4" />
              Spare Management
            </button>
            <button
              onClick={handleGoToSettings}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FiSettings className="w-4 h-4" />
              System Settings
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => navigate('/tools')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Tools Management
            </button>
            <button
              onClick={() => navigate('/ppe')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              PPE Items
            </button>
            <button
              onClick={() => navigate('/stationery')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Stationery Items
            </button>
            <button
              onClick={() => navigate('/faulty-returns')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Faulty Returns
            </button>
            <button
              onClick={() => navigate('/gate-pass')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Gate Pass
            </button>
            <button
              onClick={() => navigate('/availability')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Availability Overview
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-gray-500">
          <p>If you believe this is an error, please contact your system administrator.</p>
          <p className="mt-1">Error logged at: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
