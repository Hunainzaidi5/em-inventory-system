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
import TransactionsPage from "./pages/TransactionsPage";
import FaultyReturnsPage from "./pages/FaultyReturnsPage";
import GatePassPage from "./pages/GatePassPage";
import InsurancePage from "./pages/InsurancePage";
import QRGeneratorPage from "./pages/QRGeneratorPage";
import UsersPage from "./pages/UsersPage";
import IssuanceRecordPage from "./pages/IssuanceRecordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <React.StrictMode>
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
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/faulty-returns" element={<FaultyReturnsPage />} />
                <Route path="/gate-pass" element={<GatePassPage />} />
                <Route path="/insurance" element={<InsurancePage />} />
                <Route path="/qr-generator" element={<QRGeneratorPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/issuance-record" element={<IssuanceRecordPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
