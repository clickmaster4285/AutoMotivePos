import { useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { canViewAllBranchesData } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Wrench, Package, Users, TrendingUp, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { invoices, jobCards, products, customers, refunds, currentBranchId, currentUser, users } = useAppState();

  const role = currentUser?.role;
  const viewAllOrg = canViewAllBranchesData(currentUser);
  const isManager = role === 'branch_manager';
  const isTechnician = role === 'technician';
  const isCashier = role === 'cashier';

  const branchInvoices = useMemo(() => viewAllOrg ? invoices : invoices.filter(i => i.branchId === currentBranchId), [invoices, currentBranchId, viewAllOrg]);
  const branchJobs = useMemo(() => {
    if (viewAllOrg) return jobCards;
    if (isTechnician) return jobCards.filter(j => j.technicianId === currentUser?.id);
    return jobCards.filter(j => j.branchId === currentBranchId);
  }, [jobCards, currentBranchId, viewAllOrg, isTechnician, currentUser?.id]);
  const branchProducts = useMemo(() => viewAllOrg ? products : products.filter(p => p.branchId === currentBranchId), [products, currentBranchId, viewAllOrg]);
  const branchRefunds = useMemo(() => viewAllOrg ? refunds : refunds.filter(r => r.branchId === currentBranchId), [refunds, currentBranchId, viewAllOrg]);

  const totalSales = branchInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalRefunds = branchRefunds.reduce((sum, r) => sum + r.total, 0);
  const inventoryValue = branchProducts.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const lowStockCount = branchProducts.filter(p => p.stock <= p.minStock).length;
  const outstandingPayments = branchInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amountDue || 0), 0);

  // Role-specific stats
  const getStats = () => {
    if (isTechnician) {
      const myActive = branchJobs.filter(j => j.status !== 'completed' && j.status !== 'paid').length;
      const myCompleted = branchJobs.filter(j => j.status === 'completed' || j.status === 'paid').length;
      return [
        { label: 'My Active Jobs', value: myActive, icon: Wrench, sub: `${branchJobs.length} total assigned` },
        { label: 'Completed', value: myCompleted, icon: TrendingUp, sub: 'Jobs finished' },
        { label: 'Waiting Parts', value: branchJobs.filter(j => j.status === 'waiting_parts').length, icon: Package, sub: 'Blocked jobs' },
      ];
    }
    if (isCashier) {
      const myInvoices = branchInvoices.filter(i => i.userId === currentUser?.id);
      const myTotal = myInvoices.reduce((s, i) => s + i.total, 0);
      return [
        { label: 'My Sales', value: `$${myTotal.toFixed(2)}`, icon: DollarSign, sub: `${myInvoices.length} invoices` },
        { label: 'Today\'s Sales', value: `$${branchInvoices.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).reduce((s, i) => s + i.total, 0).toFixed(2)}`, icon: TrendingUp, sub: 'Branch total' },
        { label: 'Outstanding', value: `$${outstandingPayments.toFixed(2)}`, icon: RotateCcw, sub: 'Unpaid balance' },
      ];
    }
    return [
      { label: 'Total Sales', value: `$${totalSales.toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: DollarSign, sub: `${branchInvoices.length} invoices` },
      { label: 'Active Jobs', value: branchJobs.filter(j => j.status !== 'completed' && j.status !== 'paid').length, icon: Wrench, sub: `${branchJobs.length} total` },
      { label: 'Inventory', value: `$${inventoryValue.toLocaleString('en', { minimumFractionDigits: 0 })}`, icon: Package, sub: `${lowStockCount} low stock` },
      { label: 'Customers', value: customers.length, icon: Users, sub: viewAllOrg ? 'All branches' : 'Branch scope' },
      { label: 'Refunds', value: `$${totalRefunds.toFixed(2)}`, icon: RotateCcw, sub: `${branchRefunds.length} issued` },
      { label: 'Outstanding', value: `$${outstandingPayments.toFixed(2)}`, icon: TrendingUp, sub: 'Unpaid balance' },
    ];
  };

  const stats = getStats();

  const jobStatusData = [
    { name: 'Pending', value: branchJobs.filter(j => j.status === 'pending').length, color: 'hsl(36, 92%, 54%)' },
    { name: 'In Progress', value: branchJobs.filter(j => j.status === 'in_progress').length, color: 'hsl(210, 80%, 55%)' },
    { name: 'Waiting', value: branchJobs.filter(j => j.status === 'waiting_parts').length, color: 'hsl(280, 55%, 55%)' },
    { name: 'Completed', value: branchJobs.filter(j => j.status === 'completed').length, color: 'hsl(142, 60%, 42%)' },
    { name: 'Paid', value: branchJobs.filter(j => j.status === 'paid').length, color: 'hsl(142, 60%, 42%)' },
  ].filter(d => d.value > 0);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    branchProducts.forEach(p => { cats[p.category] = (cats[p.category] || 0) + p.stock; });
    return Object.entries(cats).map(([name, value]) => ({ name: name.replace(' Parts', ''), value }));
  }, [branchProducts]);

  const salesByStaff = useMemo(() => {
    if (!viewAllOrg) return [];
    const map: Record<string, number> = {};
    branchInvoices.forEach(inv => { map[inv.userName || 'Unknown'] = (map[inv.userName || 'Unknown'] || 0) + inv.total; });
    return Object.entries(map).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));
  }, [branchInvoices, viewAllOrg]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  const subtitle = isTechnician ? 'Your work overview' : isCashier ? 'Your sales overview' : viewAllOrg ? 'System-wide overview' : 'Branch overview';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className={`grid gap-3 ${stats.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'}`}>
        {stats.map((stat, i) => (
          <Card key={i} className="stat-card group">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-[0.15em]">{stat.label}</p>
                  <p className="text-lg font-heading font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{stat.sub}</p>
                </div>
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - only for admin/manager/inventory roles */}
      {(viewAllOrg || isManager || role === 'inventory_manager' || role === 'service_advisor') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {(viewAllOrg || isManager || role === 'inventory_manager') && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">Inventory by Category</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" fill="hsl(36, 92%, 54%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">No data</div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">
                {isTechnician ? 'My Job Status' : 'Job Status'}
              </h3>
              {jobStatusData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {jobStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {jobStatusData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground font-mono text-[10px]">{entry.name}</span>
                        <span className="font-bold text-foreground font-mono">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">No jobs</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewAllOrg && salesByStaff.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">Sales by Staff</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesByStaff}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="total" fill="hsl(210, 80%, 55%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(viewAllOrg || isManager || role === 'inventory_manager') && lowStockCount > 0 && (
        <Card className="border-warning/20">
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Package className="h-3.5 w-3.5 text-warning" />Low Stock Alert
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {branchProducts.filter(p => p.stock <= p.minStock).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-warning/5 border border-warning/15 text-xs">
                  <span className="text-foreground font-medium truncate">{p.name}</span>
                  <span className="text-warning font-mono font-bold">{p.stock}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
