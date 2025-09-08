import { useEffect, useState } from "react";
import { Home, ArrowLeft, Search, Settings, Package, AlertCircle, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const NotFound = () => {
  const [currentPath] = useState("/non-existent-route");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      currentPath
    );
    // Trigger animations after component mounts
    setTimeout(() => setIsVisible(true), 100);
  }, [currentPath]);

  const navigate = useNavigate();
  const location = useLocation();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToSpareManagement = () => {
    navigate('/dashboard/spare-management');
  };

  const handleGoToSettings = () => {
    navigate('/dashboard/settings');
  };

  const navigateTo = (path: string) => {
    if (path.startsWith('/dashboard')) {
      navigate(path);
    } else {
      navigate(`/dashboard${path}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5eb] via-[#e9e1cc] to-[#e1d4b1] relative overflow-hidden p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d3c6a0]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c9ba8f]/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-[#b5a87a]/40 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-[#a5976f]/40 rounded-full animate-bounce" style={{animationDelay: '3s'}}></div>
      </div>

      <div className={`max-w-lg w-full mx-auto text-center px-4 relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Enhanced 404 Icon with Glassmorphism */}
        <div className="mb-10 relative">
          <div className="relative bg-[#f5f1e4]/80 backdrop-blur-xl rounded-3xl p-8 border border-[#e1d4b1]/50 shadow-2xl mx-auto max-w-xs">
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9c8c5c] to-[#7a6c47] mb-4">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl animate-bounce">🔍</div>
            </div>
          </div>
          {/* Floating particles */}
          <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#9c8c5c] rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-[#7a6c47] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        {/* Enhanced Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#5a5039] mb-4 tracking-tight flex items-center justify-center gap-2">
            <AlertCircle className="w-10 h-10 text-[#9c8c5c]" />
            Oops! Page Not Found
          </h1>
          <p className="text-lg text-[#6d6149] leading-relaxed max-w-md mx-auto">
            The page you're looking for seems to have vanished into the digital void. 
            <span className="block mt-2 text-[#8a7958] font-medium">Let's get you back on track!</span>
          </p>
        </div>

        {/* Enhanced Attempted URL Display */}
        <div className="bg-[#f5f1e4]/90 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-[#e1d4b1]/70 shadow-lg max-w-md mx-auto">
          <p className="text-sm font-medium text-[#6d6149] mb-3 flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Attempted URL
          </p>
          <p className="text-sm font-mono text-[#5a5039] break-all bg-[#e9e1cc]/70 px-3 py-2 rounded-lg border border-[#d3c6a0]">
            {currentPath}
          </p>
        </div>

        {/* Enhanced Primary Navigation */}
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              onClick={handleGoHome}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#9c8c5c] to-[#8a7958] hover:from-[#8a7958] hover:to-[#7a6c47] text-white px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl shadow-lg"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Go to Dashboard</span>
            </button>
            <button
              onClick={handleGoBack}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#7a6c47] to-[#6d6149] hover:from-[#6d6149] hover:to-[#5a5039] text-white px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Go Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              onClick={handleGoToSpareManagement}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#8a7958] to-[#7a6c47] hover:from-[#7a6c47] hover:to-[#6d6149] text-white px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl shadow-lg"
            >
              <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Spare Management</span>
            </button>
            <button
              onClick={handleGoToSettings}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#7a6c47] to-[#6d6149] hover:from-[#6d6149] hover:to-[#5a5039] text-white px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] hover:shadow-xl shadow-lg"
            >
              <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">System Settings</span>
            </button>
          </div>
        </div>

        {/* Enhanced Help Text */}
        <div className="mt-8 p-5 backdrop-blur-sm rounded-xl border max-w-lg mx-auto bg-[#f5f1e4]/80 border-[#d3c6a0]/50">
          <div className="text-sm space-y-2 text-[#5a5039]">
            <p className="flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#8a7958]" />
              If you believe this is an error, please contact your system administrator
            </p>
            <p className="text-xs font-mono mt-3 text-[#6d6149]">
              Error logged at: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;