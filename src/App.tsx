import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useStore } from '@/store/useStore';
import { initializeSeedData } from '@/lib/seed';
import { AppLayout } from '@/components/AppLayout';
import { RouteGuard } from '@/components/RouteGuard';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import JobCardsPage from '@/pages/JobCardsPage';
import POSPage from '@/pages/POSPage';
import CustomersPage from '@/pages/CustomersPage';
import SuppliersPage from '@/pages/SuppliersPage';
import ReportsPage from '@/pages/ReportsPage';
import RefundsPage from '@/pages/RefundsPage';
import StockTransfersPage from '@/pages/StockTransfersPage';
import AuditLogPage from '@/pages/AuditLogPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function GuardedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  return <RouteGuard path={path}>{children}</RouteGuard>;
}

function AppContent() {
  const { currentUser, loadAll } = useStore();

  useEffect(() => {
    initializeSeedData();
    loadAll();
  }, []);

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
