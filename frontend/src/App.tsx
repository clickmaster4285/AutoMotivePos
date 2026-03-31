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
import NotFound from "@/pages/NotFound";
import UserPage from "@/pages/users/User";
import StaffCreatePage from "@/pages/users/create/page";
import StaffEditPage from "@/pages/users/[id]/edit/page";
import { StaffDetailPage } from "@/components/users/StaffDetailPage";
import WarehousesPage from "./pages/WarehousePage";

function GuardedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  return <RouteGuard path={path}>{children}</RouteGuard>;
}

/** Nested user-management routes; single guard so `/user-management` always resolves (index + children). */
function UserManagementLayout() {
  return (
    <RouteGuard path="/user-management">
      <Outlet />
    </RouteGuard>
  );
}

function AppContent() {
  const { currentUser, loadAll } = useAppState();

  useEffect(() => {
    initializeSeedData();
    loadAll();
  }, [loadAll]);

  if (!currentUser) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<GuardedRoute path="/"><DashboardPage /></GuardedRoute>} />
        <Route path="/inventory" element={<GuardedRoute path="/inventory"><InventoryPage /></GuardedRoute>} />
        <Route path="/jobs" element={<GuardedRoute path="/jobs"><JobCardsPage /></GuardedRoute>} />
        <Route path="/pos" element={<GuardedRoute path="/pos"><POSPage /></GuardedRoute>} />
        <Route path="/customers" element={<GuardedRoute path="/customers"><CustomersPage /></GuardedRoute>} />
        <Route path="/suppliers" element={<GuardedRoute path="/suppliers"><SuppliersPage /></GuardedRoute>} />
        <Route path="/reports" element={<GuardedRoute path="/reports"><ReportsPage /></GuardedRoute>} />
        <Route path="/refunds" element={<GuardedRoute path="/refunds"><RefundsPage /></GuardedRoute>} />
        <Route path="/transfers" element={<GuardedRoute path="/transfers"><StockTransfersPage /></GuardedRoute>} />
        <Route path="/audit" element={<GuardedRoute path="/audit"><AuditLogPage /></GuardedRoute>} />

        <Route path="/branches" element={<GuardedRoute path="/branches"><BranchesPage /></GuardedRoute>} />
        <Route path="/categories" element={<GuardedRoute path="/categories"><CategoriesPage /></GuardedRoute>} />

        <Route path="/warehouse" element={<GuardedRoute path="/warehouse"><WarehousesPage /></GuardedRoute>} />
        

        <Route path="/user-management" element={<UserManagementLayout />}>
          <Route index element={<UserPage />} />
          <Route path="create" element={<StaffCreatePage />} />
          <Route path=":id/edit" element={<StaffEditPage />} />
          <Route path=":id" element={<StaffDetailPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
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
