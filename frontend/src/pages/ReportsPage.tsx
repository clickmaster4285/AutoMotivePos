// pages/ReportsPage.tsx
import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { canViewAllBranchesData } from '@/lib/permissions';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { useRefundsQuery } from '@/hooks/api/useRefunds';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useJobCardsQuery } from '@/hooks/api/useJobCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, DollarSign, Package, Wrench, RotateCcw, Receipt } from 'lucide-react';
import { useBranchesForUi } from '@/hooks/useBranches';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { SalesReport } from '@/components/reports/SalesReport';
import { TransactionsReport } from '@/components/reports/TransactionsReport';
import { InventoryReport } from '@/components/reports/InventoryReport';
import { JobsReport } from '@/components/reports/JobsReport';
import { RefundsReport } from '@/components/reports/RefundsReport';

type ReportTab = 'sales' | 'transactions' | 'inventory' | 'jobs' | 'refunds';
type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function ReportsPage() {
  const { customers, currentBranchId, currentUser, users } = useAppState();
  const { branches } = useBranchesForUi();
  
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);

  const viewAllOrg = canViewAllBranchesData(currentUser);
  
  const getBranchParam = () => {
    if (viewAllOrg && selectedBranchId) return { branchId: selectedBranchId };
    if (viewAllOrg) return undefined;
    return { branchId: currentBranchId };
  };

  const { data: transactions = [] } = useTransactionsQuery(getBranchParam());
  const { data: refunds = [] } = useRefundsQuery(getBranchParam());
  const { data: apiProducts = [] } = useProductsQuery();
  const { data: apiJobCards = [] } = useJobCardsQuery();

  // Date filtering logic
  const filterByDate = (items: any[], dateField: string = 'createdAt') => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return items;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return items;
    }

    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredTransactions = filterByDate(transactions, 'createdAt');
  const filteredRefunds = filterByDate(refunds, 'createdAt');
  const filteredJobs = filterByDate(apiJobCards, 'createdAt');

  // Branch filtering for products
  const filteredProducts = (() => {
    let products = apiProducts;
    if (!viewAllOrg) {
      products = products.filter(p => p.branch_id === currentBranchId);
    } else if (selectedBranchId) {
      products = products.filter(p => p.branch_id === selectedBranchId);
    }
    return products;
  })();

  const reportTabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sales', label: 'Sales', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt className="h-3.5 w-3.5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'jobs', label: 'Service Jobs', icon: <Wrench className="h-3.5 w-3.5" /> },
    { id: 'refunds', label: 'Refunds', icon: <RotateCcw className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">View detailed business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        viewAllOrg={viewAllOrg}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
      />

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeTab === 'sales' && (
        <SalesReport
          transactions={filteredTransactions}
          refunds={filteredRefunds}
          customers={customers}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsReport
          transactions={filteredTransactions}
          users={users}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryReport
          products={filteredProducts}
        />
      )}

      {activeTab === 'jobs' && (
        <JobsReport
          jobs={filteredJobs}
          users={users}
        />
      )}

      {activeTab === 'refunds' && (
        <RefundsReport
          refunds={filteredRefunds}
          transactions={filteredTransactions}
        />
      )}
    </div>
  );
}