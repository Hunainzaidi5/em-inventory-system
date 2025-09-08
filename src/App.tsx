import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import collectionSyncService from '@/services/collectionSyncService';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import NotFound from "./pages/NotFound";
import AvailabilityOverview from "./pages/AvailabilityOverview";
import PPEPage from "./pages/PPEPage";
import StationeryItemsPage from "./pages/StationeryItemsPage";
import FaultyReturnsPage from "./pages/FaultyReturnsPage";
import GatePassPage from "./pages/GatePassPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import IssuancePage from "./pages/IssuancePage";
import LoginPage from "./pages/LoginPage";
import { DevOnlyRoute } from './components/auth/ProtectedRoute';
import AddUserPage from './pages/AddUserPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import RequisitionPage from "./pages/RequisitionPage";
import SpareManagement from "./pages/SpareManagement";
import ToolsPage from "./pages/ToolsPage";
import GeneralToolsPage from "./pages/GeneralToolsPage";
import ReseedDataPage from './pages/ReseedDataPage';
import IssuanceRequisitionPage from './pages/IssuanceRequisitionPage';
import { AuthDebugger } from './components/auth/AuthDebugger';

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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Top-level aliases to avoid 404s when users navigate directly */}
      <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
      <Route path="/add-user" element={<Navigate to="/dashboard/add-user" replace />} />
      <Route path="/edit-user/:userId" element={<Navigate to="/dashboard/edit-user/:userId" replace />} />
      <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
      <Route path="/gate-pass" element={<Navigate to="/dashboard/gate-pass" replace />} />
      <Route path="/issuance" element={<Navigate to="/dashboard/issuance" replace />} />
      <Route path="/requisition" element={<Navigate to="/dashboard/requisition" replace />} />
      <Route path="/spare-management" element={<Navigate to="/dashboard/spare-management" replace />} />
      <Route path="/tools" element={<Navigate to="/dashboard/tools" replace />} />
      <Route path="/general-tools" element={<Navigate to="/dashboard/general-tools" replace />} />
      <Route path="/ppe" element={<Navigate to="/dashboard/ppe" replace />} />
      <Route path="/availability" element={<Navigate to="/dashboard/availability" replace />} />
      <Route path="/stationery" element={<Navigate to="/dashboard/stationery" replace />} />
      <Route path="/faulty-returns" element={<Navigate to="/dashboard/faulty-returns" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
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
        <Route path="spare-management" element={<SpareManagement />} />
        <Route path="requisition" element={<RequisitionPage />} />
        <Route path="availability" element={<AvailabilityOverview />} />
        <Route path="ppe" element={<PPEPage />} />
        <Route path="stationery" element={<StationeryItemsPage />} />
        <Route path="faulty-returns" element={<FaultyReturnsPage />} />
        <Route path="gate-pass" element={<GatePassPage />} />
        <Route path="issuance-requisition" element={<IssuanceRequisitionPage />} />
        <Route path="issuance" element={<IssuancePage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="add-user" element={<AddUserPage />} />
        <Route path="edit-user/:userId" element={<AddUserPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="general-tools" element={<GeneralToolsPage />} />
        <Route path="requisition" element={<RequisitionPage />} />
        <Route element={<DevOnlyRoute />}>
          <Route path="reseed" element={<ReseedDataPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  React.useEffect(() => {
    console.log("[DEBUG] App component mounted");
    // Hydrate client-side lists from Firestore on app start
    collectionSyncService.hydrateAll();
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
              {import.meta.env.DEV && <AuthDebugger />}
            </TooltipProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
