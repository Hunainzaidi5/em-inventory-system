import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import NotFound from "./pages/NotFound";
import AvailabilityOverview from "./pages/AvailabilityOverview";
import ToolsPage from "./pages/ToolsPage";
import PPEPage from "./pages/PPEPage";
import GeneralItemsPage from "./pages/GeneralItemsPage";
import FaultyReturnsPage from "./pages/FaultyReturnsPage";
import GatePassPage from "./pages/GatePassPage";
import IssuanceRecordPage from "./pages/IssuanceRecordPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";

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
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#333' }}>E&M Inventory Management System</h1>
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/availability" element={<AvailabilityOverview />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/ppe" element={<PPEPage />} />
                <Route path="/general" element={<GeneralItemsPage />} />
                <Route path="/faulty-returns" element={<FaultyReturnsPage />} />
                <Route path="/gate-pass" element={<GatePassPage />} />
                <Route path="/issuance-record" element={<IssuanceRecordPage />} />
                <Route path="/settings" element={<SystemSettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
