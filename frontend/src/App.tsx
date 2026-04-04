import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/query-client";
import { useAppState } from "@/providers/AppStateProvider";
import { initializeSeedData } from "@/lib/seed";
import { AppLayout } from "@/components/AppLayout";
import { RouteGuard } from "@/components/RouteGuard";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import InventoryPage from "@/pages/InventoryPage";
import JobCardsPage from "@/pages/JobCardsPage";
import POSPage from "@/pages/POSPage";
import CustomersPage from "@/pages/CustomersPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ReportsPage from "@/pages/ReportsPage";
import RefundsPage from "@/pages/RefundsPage";
import StockTransfersPage from "@/pages/StockTransfersPage";
import AuditLogPage from "@/pages/AuditLogPage";
import BranchesPage from '@/pages/Branches'
import CategoriesPage from "@/pages/Category";
import CentralizedProductsPage from "@/pages/CentralizedProductsPage";
import NotFound from "@/pages/NotFound";
import UserPage from "@/pages/users/User";
import StaffCreatePage from "@/pages/users/create/page";
import StaffEditPage from "@/pages/users/[id]/edit/page";
import { StaffDetailPage } from "@/components/users/StaffDetailPage";
import WarehousesPage from "./pages/WarehousePage";
import ShiftManagementPage from "@/pages/users/shifts/ShiftManagement";
import PayrollIntegrationPage from "@/pages/users/payroll/PayrollIntegration";
import CentralizedProductDetailPage from "./pages/CentralizedProductDetailPage";
import InventoryDetailPage from "./pages/InventoryDetailPage";
import RefundDetailPage from "./pages/RefundDetailPage";
import UserSettings from "./pages/Settings";
import HomePage from "./pages/LandingPage";
import { Navigate } from "react-router-dom";


export function GuardedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppState();

  if (!currentUser) {
    // Redirect to /login if not logged in
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
/** Nested user-management routes; single guard so `/user-management` always resolves (index + children). */
function UserManagementLayout() {
  return (
    <RouteGuard path="/user-management">
      <Outlet />
    </RouteGuard>
  );
}

/** HR routes (preferred); mirrors user-management. */
function HrLayout() {
  return (
    <RouteGuard path="/hr">
      <Outlet />
    </RouteGuard>
  );
}

function AppContent() {
  const { loadAll } = useAppState();

  useEffect(() => {
    initializeSeedData();
    loadAll();
  }, [loadAll]);

 return (
  <Routes>
    {/* Public routes: no AppLayout */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />

    {/* Protected routes: wrapped with AppLayout */}
    <Route
      element={
        <GuardedRoute>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </GuardedRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/inventory/:id" element={<InventoryDetailPage />} />
      <Route path="/jobs" element={<JobCardsPage />} />
      <Route path="/pos" element={<POSPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/refunds" element={<RefundsPage />} />
      <Route path="/refunds/:id" element={<RefundDetailPage />} />
      <Route path="/transfers" element={<StockTransfersPage />} />
      <Route path="/centralized-products" element={<CentralizedProductsPage />} />
      <Route path="/centralized-products/:id" element={<CentralizedProductDetailPage />} />
      <Route path="/audit" element={<AuditLogPage />} />
      <Route path="/branches" element={<BranchesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/warehouses" element={<WarehousesPage />} />
      <Route path="/settings" element={<UserSettings />} />

      {/* User Management */}
      <Route path="/user-management" element={<UserManagementLayout />}>
        <Route index element={<UserPage />} />
        <Route path="create" element={<StaffCreatePage />} />
        <Route path=":id/edit" element={<StaffEditPage />} />
        <Route path=":id" element={<StaffDetailPage />} />
      </Route>

      {/* HR module */}
      <Route path="/hr" element={<HrLayout />}>
        <Route index element={<UserPage />} />
        <Route path="employees" element={<UserPage />} />
        <Route path="employees/create" element={<StaffCreatePage />} />
        <Route path="employees/:id/edit" element={<StaffEditPage />} />
        <Route path="employees/:id" element={<StaffDetailPage />} />
        <Route path="shifts" element={<ShiftManagementPage />} />
        <Route path="payroll" element={<PayrollIntegrationPage />} />
      </Route>
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
}
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
