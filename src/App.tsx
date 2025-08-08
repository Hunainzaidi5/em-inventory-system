import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import RequisitionPage from "./pages/RequisitionPage";
import NotFound from "./pages/NotFound";
import AvailabilityOverview from "./pages/AvailabilityOverview";
import ToolsPage from "./pages/ToolsPage";
import PPEPage from "./pages/PPEPage";
import GeneralItemsPage from "./pages/GeneralItemsPage";
import FaultyReturnsPage from "./pages/FaultyReturnsPage";
import GatePassPage from "./pages/GatePassPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import IssuancePage from "./pages/IssuancePage";
import LoginPage from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DevOnlyRoute } from './components/auth/ProtectedRoute';
import AddUserPage from './pages/AddUserPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// App routes component
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="requisition" element={<RequisitionPage />} />
        <Route path="availability" element={<AvailabilityOverview />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="ppe" element={<PPEPage />} />
        <Route path="general-items" element={<GeneralItemsPage />} />
        <Route path="faulty-returns" element={<FaultyReturnsPage />} />
        <Route path="gate-pass" element={<GatePassPage />} />
        <Route path="issuance" element={<IssuancePage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="add-user" element={<AddUserPage />} />
        <Route path="edit-user/:userId" element={<AddUserPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  React.useEffect(() => {
    console.log("[DEBUG] App component mounted");
  }, []);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <TooltipProvider>
              <AppRoutes />
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
