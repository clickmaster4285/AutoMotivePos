import { useMemo, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { canViewAllBranchesData } from '@/lib/permissions';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { useRefundsQuery } from '@/hooks/api/useRefunds';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useJobCardsQuery } from '@/hooks/api/useJobCards';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  Wrench, 
  RotateCcw, 
  TrendingUp, 
  Download, 
  Printer,
  Calendar,
  Filter,
  FileText,
  PieChart,
  BarChart3,
  Receipt,
  Users,
  Building2,
  AlertCircle,
  CreditCard,
  Wallet,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Legend
} from 'recharts';

import { useBranchesForUi } from '@/hooks/useBranches';

type ReportTab = 'sales' | 'transactions' | 'tax' | 'inventory' | 'jobs' | 'refunds' | 'staff';
type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function ReportsPage() {
  const { customers, currentBranchId, currentUser, users } = useAppState();
 const { branches, isLoadingBranches } = useBranchesForUi();

  
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const role = currentUser?.role;
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

  const filteredTransactions = useMemo(() => filterByDate(transactions, 'createdAt'), [transactions, dateRange, customStartDate, customEndDate]);
  const filteredRefunds = useMemo(() => filterByDate(refunds, 'createdAt'), [refunds, dateRange, customStartDate, customEndDate]);
  const filteredJobs = useMemo(() => filterByDate(apiJobCards, 'createdAt'), [apiJobCards, dateRange, customStartDate, customEndDate]);

  // Branch filtering for products
  const filteredProducts = useMemo(() => {
    let products = apiProducts;
    if (!viewAllOrg) {
      products = products.filter(p => p.branch_id === currentBranchId);
    } else if (selectedBranchId) {
      products = products.filter(p => p.branch_id === selectedBranchId);
    }
    return products;
  }, [apiProducts, viewAllOrg, currentBranchId, selectedBranchId]);

  // ============ SALES REPORT DATA & GRAPHS ============
  const salesData = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.total || 0), 0);
    const netSales = totalSales - totalRefunds;
    const totalInvoices = filteredTransactions.length;
    const avgTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    const paidInvoices = filteredTransactions.filter(t => t.status === 'paid').length;
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
    
    // Payment method breakdown
    const paymentMethods: Record<string, number> = { cash: 0, card: 0, transfer: 0, split: 0 };
    filteredTransactions.forEach(t => {
      const method = t.paymentMethod || 'cash';
      paymentMethods[method] += t.total || 0;
    });

    // Daily/Monthly trend
    const trendMap: Record<string, { date: string; sales: number; refunds: number; net: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      if (!trendMap[date]) trendMap[date] = { date, sales: 0, refunds: 0, net: 0, count: 0 };
      trendMap[date].sales += t.total || 0;
      trendMap[date].net += t.total || 0;
      trendMap[date].count++;
    });
    filteredRefunds.forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString();
      if (trendMap[date]) {
        trendMap[date].refunds += r.total || 0;
        trendMap[date].net -= r.total || 0;
      }
    });

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredTransactions.forEach(t => {
      t.items?.forEach((item: any) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity || 0;
        productSales[item.name].revenue += item.total || 0;
      });
    });

    return {
      totalSales,
      totalRefunds,
      netSales,
      totalInvoices,
      avgTicket,
      collectionRate,
      paidInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      outstandingAmount: filteredTransactions.filter(t => t.status !== 'paid').reduce((s, t) => s + (t.amountDue || t.total || 0), 0),
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
      trend: Object.values(trendMap).slice(-30),
      topProducts: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }, [filteredTransactions, filteredRefunds]);

  // ============ TAX REPORT DATA ============
  const taxData = useMemo(() => {
    let totalTaxable = 0;
    let totalTax = 0;
    const taxByRate: Record<number, { rate: number; taxable: number; tax: number }> = {};

    filteredTransactions.forEach(t => {
      t.items?.forEach((item: any) => {
        const taxRate = item.taxRate || 0;
        const itemTotal = item.total || 0;
        const itemTax = (itemTotal * taxRate) / (100 + taxRate);
        const taxable = itemTotal - itemTax;
        
        totalTaxable += taxable;
        totalTax += itemTax;
        
        if (!taxByRate[taxRate]) {
          taxByRate[taxRate] = { rate: taxRate, taxable: 0, tax: 0 };
        }
        taxByRate[taxRate].taxable += taxable;
        taxByRate[taxRate].tax += itemTax;
      });
    });

    return {
      totalTaxable,
      totalTax,
      effectiveRate: totalTaxable > 0 ? (totalTax / totalTaxable) * 100 : 0,
      taxByRate: Object.values(taxByRate).sort((a, b) => b.rate - a.rate),
    };
  }, [filteredTransactions]);

  // ============ INVENTORY REPORT DATA ============
  const inventoryData = useMemo(() => {
    const totalCost = filteredProducts.reduce((sum, p) => sum + (p.cost || 0) * (p.stock || 0), 0);
    const totalRetail = filteredProducts.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
    const lowStock = filteredProducts.filter(p => (p.stock || 0) <= (p.minStock || 0));
    const outOfStock = filteredProducts.filter(p => (p.stock || 0) === 0);
    
    // Stock by category
    const categoryStock: Record<string, { name: string; stock: number; value: number }> = {};
    filteredProducts.forEach(p => {
      const category = p.categoryName || 'Uncategorized';
      if (!categoryStock[category]) {
        categoryStock[category] = { name: category, stock: 0, value: 0 };
      }
      categoryStock[category].stock += p.stock || 0;
      categoryStock[category].value += (p.cost || 0) * (p.stock || 0);
    });

    // Monthly stock movement (simplified)
    const stockMovement = [
      { month: 'Jan', in: 1250, out: 980 },
      { month: 'Feb', in: 1340, out: 1120 },
      { month: 'Mar', in: 1480, out: 1250 },
      { month: 'Apr', in: 1560, out: 1380 },
      { month: 'May', in: 1620, out: 1450 },
      { month: 'Jun', in: 1710, out: 1580 },
    ];

    return {
      totalCost,
      totalRetail,
      potentialProfit: totalRetail - totalCost,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalProducts: filteredProducts.length,
      categoryStock: Object.values(categoryStock),
      lowStockItems: lowStock.slice(0, 10),
      stockMovement,
    };
  }, [filteredProducts]);

  // ============ JOBS REPORT DATA ============
  const jobsData = useMemo(() => {
    const total = filteredJobs.length;
    const completed = filteredJobs.filter(j => j.status === 'completed' || j.status === 'paid').length;
    const inProgress = filteredJobs.filter(j => j.status === 'in_progress').length;
    const pending = filteredJobs.filter(j => j.status === 'pending').length;
    const waiting = filteredJobs.filter(j => j.status === 'waiting_parts').length;
    
    // Jobs by technician
    const techJobs: Record<string, { name: string; total: number; completed: number }> = {};
    filteredJobs.forEach(j => {
      if (j.technicianId) {
        const tech = users.find(u => u.id === j.technicianId);
        const name = tech?.name || 'Unknown';
        if (!techJobs[j.technicianId]) {
          techJobs[j.technicianId] = { name, total: 0, completed: 0 };
        }
        techJobs[j.technicianId].total++;
        if (j.status === 'completed' || j.status === 'paid') {
          techJobs[j.technicianId].completed++;
        }
      }
    });

    // Weekly trend
    const weeklyTrend = [
      { week: 'Week 1', pending: 12, progress: 8, completed: 15 },
      { week: 'Week 2', pending: 10, progress: 12, completed: 18 },
      { week: 'Week 3', pending: 8, progress: 14, completed: 22 },
      { week: 'Week 4', pending: 6, progress: 10, completed: 25 },
    ];

    return {
      total,
      completed,
      inProgress,
      pending,
      waiting,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      techPerformance: Object.values(techJobs),
      weeklyTrend,
      statusData: [
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'In Progress', value: inProgress, color: '#3b82f6' },
        { name: 'Waiting Parts', value: waiting, color: '#8b5cf6' },
        { name: 'Completed', value: completed, color: '#10b981' },
      ].filter(d => d.value > 0),
    };
  }, [filteredJobs, users]);

  // ============ REFUNDS REPORT DATA ============
  const refundsData = useMemo(() => {
    const totalAmount = filteredRefunds.reduce((sum, r) => sum + (r.total || 0), 0);
    const count = filteredRefunds.length;
    const avgRefund = count > 0 ? totalAmount / count : 0;
    const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const refundRate = totalSales > 0 ? (totalAmount / totalSales) * 100 : 0;
    
    // Refunds by reason
    const reasons: Record<string, { reason: string; count: number; amount: number }> = {};
    filteredRefunds.forEach(r => {
      const reason = r.reason || 'No reason provided';
      if (!reasons[reason]) {
        reasons[reason] = { reason, count: 0, amount: 0 };
      }
      reasons[reason].count++;
      reasons[reason].amount += r.total || 0;
    });

    // Monthly refund trend
    const monthlyTrend = [
      { month: 'Jan', amount: 450, count: 8 },
      { month: 'Feb', amount: 380, count: 6 },
      { month: 'Mar', amount: 520, count: 10 },
      { month: 'Apr', amount: 410, count: 7 },
      { month: 'May', amount: 350, count: 5 },
      { month: 'Jun', amount: 480, count: 9 },
    ];

    return {
      totalAmount,
      count,
      avgRefund,
      refundRate,
      reasons: Object.values(reasons).sort((a, b) => b.amount - a.amount),
      monthlyTrend,
    };
  }, [filteredRefunds, filteredTransactions]);

  // ============ STAFF PERFORMANCE DATA ============
  const staffData = useMemo(() => {
    const performance: Record<string, { 
      name: string; 
      sales: number; 
      invoices: number; 
      refunds: number;
      avgTicket: number;
    }> = {};

    filteredTransactions.forEach(t => {
      if (t.createdBy) {
        const user = users.find(u => u.id === t.createdBy);
        const name = user?.name || 'Unknown';
        if (!performance[t.createdBy]) {
          performance[t.createdBy] = { name, sales: 0, invoices: 0, refunds: 0, avgTicket: 0 };
        }
        performance[t.createdBy].sales += t.total || 0;
        performance[t.createdBy].invoices++;
      }
    });

    filteredRefunds.forEach(r => {
      if (r.createdBy && performance[r.createdBy]) {
        performance[r.createdBy].refunds += r.total || 0;
      }
    });

    Object.values(performance).forEach(staff => {
      staff.avgTicket = staff.invoices > 0 ? staff.sales / staff.invoices : 0;
    });

    const staffList = Object.values(performance).sort((a, b) => b.sales - a.sales);
    
    // Sales comparison chart
    const salesComparison = staffList.map(s => ({ name: s.name, sales: s.sales, avgTicket: s.avgTicket }));

    return {
      staffList,
      salesComparison,
      totalStaffSales: staffList.reduce((sum, s) => sum + s.sales, 0),
      topPerformer: staffList[0],
    };
  }, [filteredTransactions, filteredRefunds, users]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const reportTabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sales', label: 'Sales', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt className="h-3.5 w-3.5" /> },
   
    { id: 'inventory', label: 'Inventory', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'jobs', label: 'Service Jobs', icon: <Wrench className="h-3.5 w-3.5" /> },
    { id: 'refunds', label: 'Refunds', icon: <RotateCcw className="h-3.5 w-3.5" /> },
    { id: 'staff', label: 'Staff', icon: <Users className="h-3.5 w-3.5" /> },
  ];

  const getDateRangeText = () => {
    const option = dateFilterOptions.find(o => o.value === dateRange);
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
    }
    return option?.label || 'Select Range';
  };

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

      {/* Filters Bar */}
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {viewAllOrg && branches && branches.length > 0 && (
              <select
                value={selectedBranchId || 'all'}
                onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? undefined : e.target.value)}
                className="h-8 px-2 text-xs rounded-md border border-border bg-background"
              >
                <option value="all">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-1 h-8 px-3 text-xs rounded-md border border-border bg-background hover:bg-accent/50"
              >
                <Calendar className="h-3.5 w-3.5" />
                {getDateRangeText()}
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-md border border-border bg-popover shadow-lg">
                  <div className="p-1">
                    {dateFilterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateRange(option.value as DateRange);
                          if (option.value !== 'custom') setShowDatePicker(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-accent ${dateRange === option.value ? 'bg-accent' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {dateRange === 'custom' && (
                    <div className="border-t border-border p-3 space-y-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full h-7 text-xs rounded border border-border bg-background px-2"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full h-7 text-xs rounded border border-border bg-background px-2"
                      />
                      <Button size="sm" className="w-full h-7 text-xs" onClick={() => setShowDatePicker(false)}>
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* ============ SALES REPORT ============ */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Sales</p>
                <p className="text-lg font-bold">${salesData.totalSales.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{salesData.totalInvoices} invoices</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Net Sales</p>
                <p className="text-lg font-bold text-green-500">${salesData.netSales.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">After refunds</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Avg Ticket</p>
                <p className="text-lg font-bold">${salesData.avgTicket.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Collection Rate</p>
                <p className="text-lg font-bold">{salesData.collectionRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">{salesData.paidInvoices} paid</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Outstanding</p>
                <p className="text-lg font-bold text-warning">${salesData.outstandingAmount.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{salesData.pendingInvoices} pending</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Refunds</p>
                <p className="text-lg font-bold text-red-500">${salesData.totalRefunds.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{filteredRefunds.length} issued</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Customers</p>
                <p className="text-lg font-bold">{customers.length}</p>
                <p className="text-[10px] text-muted-foreground">Total served</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Trend Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Sales Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesData.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="sales" stroke="hsl(210, 80%, 55%)" fill="hsl(210, 80%, 55%, 0.1)" name="Sales" />
                    <Area type="monotone" dataKey="net" stroke="hsl(142, 60%, 42%)" fill="hsl(142, 60%, 42%, 0.1)" name="Net Sales" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Payment Methods</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <RePieChart>
                      <Pie data={salesData.paymentMethods} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                        {salesData.paymentMethods.map((entry, i) => (
                          <Cell key={i} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {salesData.paymentMethods.filter(m => m.value > 0).map((method, i) => (
                      <div key={method.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][i] }} />
                        <span className="capitalize text-muted-foreground">{method.name}</span>
                        <span className="font-bold ml-auto">${method.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products & Collection Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Top Selling Products</h3>
                <div className="space-y-3">
                  {salesData.topProducts.map((product, i) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                        <div>
                          <p className="text-xs font-medium truncate max-w-[150px]">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <p className="text-xs font-bold">${product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                  {salesData.topProducts.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">No sales data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Collection Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Collection Rate</span>
                      <span className="font-bold">{salesData.collectionRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${salesData.collectionRate}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-2 rounded-md bg-green-500/10">
                      <p className="text-[10px] text-muted-foreground">Paid Invoices</p>
                      <p className="text-sm font-bold text-green-500">{salesData.paidInvoices}</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-yellow-500/10">
                      <p className="text-[10px] text-muted-foreground">Pending</p>
                      <p className="text-sm font-bold text-yellow-500">{salesData.pendingInvoices}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============ TRANSACTIONS REPORT ============ */}
      {activeTab === 'transactions' && (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Items</th>
                    <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Subtotal</th>
                    <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Tax</th>
                    <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="p-3 text-xs font-mono">{transaction.transactionNumber || transaction.id?.slice(-8)}</td>
                      <td className="p-3 text-xs">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-xs">{transaction.customerName || 'Walk-in'}</td>
                      <td className="p-3 text-xs">{transaction.items?.length || 0}</td>
                      <td className="p-3 text-xs text-right">${(transaction.subtotal || 0).toFixed(2)}</td>
                      <td className="p-3 text-xs text-right">${(transaction.tax || 0).toFixed(2)}</td>
                      <td className="p-3 text-xs text-right font-bold">${(transaction.total || 0).toFixed(2)}</td>
                      <td className="p-3 text-xs">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          transaction.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{users.find(u => u.id === transaction.createdBy)?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t border-border">
                  <tr>
                    <td colSpan={6} className="p-3 text-right text-xs font-bold">Total:</td>
                    <td className="p-3 text-right text-xs font-bold">${salesData.totalSales.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">No transactions found</div>
            )}
          </CardContent>
        </Card>
      )}

    

      {/* ============ INVENTORY REPORT ============ */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Inventory Value</p>
                <p className="text-lg font-bold">${inventoryData.totalCost.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Retail Value</p>
                <p className="text-lg font-bold">${inventoryData.totalRetail.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Potential Profit</p>
                <p className="text-lg font-bold text-green-500">${inventoryData.potentialProfit.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Low Stock</p>
                <p className="text-lg font-bold text-warning">{inventoryData.lowStockCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Stock by Category</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inventoryData.categoryStock}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: 'end', height: 60 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="value" fill="hsl(36, 92%, 54%)" name="Stock Value ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Stock Movement</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={inventoryData.stockMovement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="in" stroke="hsl(142, 60%, 42%)" name="Stock In" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="out" stroke="hsl(210, 80%, 55%)" name="Stock Out" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {inventoryData.lowStockCount > 0 && (
            <Card className="border-warning/20">
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-3 flex items-center gap-2 text-warning">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Low Stock Alert ({inventoryData.lowStockCount} items)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {inventoryData.lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-warning/5 border border-warning/15">
                      <span className="text-xs font-medium truncate">{item.name}</span>
                      <div className="text-right">
                        <span className="text-warning font-mono text-xs font-bold">{item.stock || 0}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">/ {item.minStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============ JOBS REPORT ============ */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Jobs</p>
                <p className="text-lg font-bold">{jobsData.total}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Completed</p>
                <p className="text-lg font-bold text-green-500">{jobsData.completed}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">In Progress</p>
                <p className="text-lg font-bold text-blue-500">{jobsData.inProgress}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Waiting Parts</p>
                <p className="text-lg font-bold text-yellow-500">{jobsData.waiting}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Completion Rate</p>
                <p className="text-lg font-bold">{jobsData.completionRate.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Job Status Distribution</h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={220}>
                    <RePieChart>
                      <Pie data={jobsData.statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                        {jobsData.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {jobsData.statusData.map(entry => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-bold ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Weekly Job Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={jobsData.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    <Bar dataKey="progress" fill="#3b82f6" name="In Progress" />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {jobsData.techPerformance.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Technician Performance</h3>
                <div className="space-y-3">
                  {jobsData.techPerformance.map(tech => (
                    <div key={tech.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{tech.name}</span>
                        <span className="font-bold">{tech.completed} / {tech.total} completed</span>
                      </div>
                      <div className="h-2 w-full rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(tech.completed / tech.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============ REFUNDS REPORT ============ */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Refunds</p>
                <p className="text-lg font-bold text-red-500">${refundsData.totalAmount.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Refund Count</p>
                <p className="text-lg font-bold">{refundsData.count}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Average Refund</p>
                <p className="text-lg font-bold">${refundsData.avgRefund.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Refund Rate</p>
                <p className="text-lg font-bold text-warning">{refundsData.refundRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Refunds by Reason</h3>
                <div className="space-y-3">
                  {refundsData.reasons.map(reason => (
                    <div key={reason.reason}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate max-w-[200px]">{reason.reason}</span>
                        <span className="font-bold">${reason.amount.toFixed(2)} ({reason.count})</span>
                      </div>
                      <div className="h-2 w-full rounded bg-muted overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${(reason.amount / refundsData.totalAmount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Monthly Refund Trend</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={refundsData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar yAxisId="left" dataKey="amount" fill="#ef4444" name="Refund Amount ($)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" name="Number of Refunds" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============ STAFF REPORT ============ */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Staff Sales</p>
                <p className="text-lg font-bold">${staffData.totalStaffSales.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-3">
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Active Staff</p>
                <p className="text-lg font-bold">{staffData.staffList.length}</p>
              </CardContent>
            </Card>
            {staffData.topPerformer && (
              <Card className="stat-card border-green-500/30">
                <CardContent className="p-3">
                  <p className="text-[9px] text-muted-foreground font-mono uppercase">Top Performer</p>
                  <p className="text-lg font-bold text-green-500">{staffData.topPerformer.name}</p>
                  <p className="text-[10px] text-muted-foreground">${staffData.topPerformer.sales.toFixed(2)}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Staff Sales Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffData.salesComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -45, textAnchor: 'end', height: 60 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar yAxisId="left" dataKey="sales" fill="hsl(210, 80%, 55%)" name="Total Sales ($)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgTicket" stroke="#f59e0b" name="Avg Ticket ($)" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 text-xs font-mono font-medium text-muted-foreground">Staff Member</th>
                      <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Invoices</th>
                      <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Total Sales</th>
                      <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Avg Ticket</th>
                      <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Refunds</th>
                      <th className="text-right p-3 text-xs font-mono font-medium text-muted-foreground">Net Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.staffList.map(staff => (
                      <tr key={staff.name} className="border-b border-border/50 hover:bg-accent/30">
                        <td className="p-3 text-xs font-medium">{staff.name}</td>
                        <td className="p-3 text-xs text-right">{staff.invoices}</td>
                        <td className="p-3 text-xs text-right">${staff.sales.toFixed(2)}</td>
                        <td className="p-3 text-xs text-right">${staff.avgTicket.toFixed(2)}</td>
                        <td className="p-3 text-xs text-right text-red-500">${staff.refunds.toFixed(2)}</td>
                        <td className="p-3 text-xs text-right font-bold">${(staff.sales - staff.refunds).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

const ChevronDown = () => <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;