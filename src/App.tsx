import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import InspectorLayout from "./components/InspectorLayout";
import DashboardPage from "./pages/inspector/DashboardPage";
import BusinessesPage from "./pages/inspector/BusinessesPage";
import DocumentsPage from "./pages/inspector/DocumentsPage";
import HistoryPage from "./pages/inspector/HistoryPage";
import ReportsPage from "./pages/inspector/ReportsPage";
import ProfilePage from "./pages/inspector/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import InspectionForm from "./pages/InspectionForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/inspector" element={<InspectorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          {/* Keep old route for backward compat */}
          <Route path="/dashboard" element={<Navigate to="/inspector/dashboard" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/inspection/:id" element={<InspectionForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
