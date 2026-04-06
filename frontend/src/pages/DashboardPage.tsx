import { useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { canViewAllBranchesData } from '@/lib/permissions';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { useRefundsQuery } from '@/hooks/api/useRefunds';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useJobCardsQuery } from '@/hooks/api/useJobCards';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Wrench, Package, Users, TrendingUp, RotateCcw, Receipt, Wallet, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useSettingsQuery } from "@/hooks/api/useSettings";



export default function DashboardPage() {
  const { customers, currentBranchId, currentUser, users } = useAppState();

  const role = currentUser?.role;
  const viewAllOrg = canViewAllBranchesData(currentUser);
  const isManager = role === 'branch_manager';
  const isTechnician = role === 'technician';
  const isCashier = role === 'cashier';
  const branchParam = viewAllOrg ? undefined : { branchId: currentBranchId };
  const { data: transactions = [] } = useTransactionsQuery(branchParam);
  const { data: refunds = [] } = useRefundsQuery(branchParam);
  const { data: apiProducts = [] } = useProductsQuery();
  const { data: apiJobCards = [] } = useJobCardsQuery();


    const { data: settings } = useSettingsQuery();
  const branchInvoices = transactions;
  const branchJobs = useMemo(() => {
    if (viewAllOrg) return apiJobCards;
    if (isTechnician) return apiJobCards.filter(j => j.technicianId === currentUser?.id);
    return apiJobCards.filter(j => j.branchId === currentBranchId);
  }, [apiJobCards, currentBranchId, viewAllOrg, isTechnician, currentUser?.id]);
  const branchProducts = useMemo(
    () => (viewAllOrg ? apiProducts : apiProducts.filter((p) => p.branch_id === currentBranchId)),
    [apiProducts, currentBranchId, viewAllOrg]
  );
  const branchRefunds = refunds;
  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  const totalSales = branchInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalRefunds = branchRefunds.reduce((sum, r) => sum + r.total, 0);
  const netSales = totalSales - totalRefunds;
  const inventoryValue = branchProducts.reduce((sum, p) => sum + (p.cost || 0) * (p.stock || 0), 0);
  const lowStockCount = branchProducts.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;
  const outstandingPayments = branchInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amountDue || 0), 0);
  const totalInvoices = branchInvoices.length;
  const averageTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;
  const paidInvoiceCount = branchInvoices.filter(i => i.status === 'paid').length;
  const collectionRate = totalInvoices > 0 ? (paidInvoiceCount / totalInvoices) * 100 : 0;

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
      const myInvoices = branchInvoices.filter(i => i.createdBy === currentUser?.id);
      const myTotal = myInvoices.reduce((s, i) => s + i.total, 0);
      return [
        { label: 'My Sales', value: `${settings.currency}${myTotal.toFixed(2)}`, icon: DollarSign, sub: `${myInvoices.length} invoices` },
        { label: 'Today\'s Sales', value: `${settings.currency}${branchInvoices.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).reduce((s, i) => s + i.total, 0).toFixed(2)}`, icon: TrendingUp, sub: 'Branch total' },
        { label: 'Outstanding', value: `${settings.currency}${outstandingPayments.toFixed(2)}`, icon: RotateCcw, sub: 'Unpaid balance' },
      ];
    }
    return [
      { label: 'Total Sales', value: `${settings.currency}${totalSales.toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: DollarSign, sub: `${branchInvoices.length} invoices` },
      { label: 'Net Sales', value: `${settings.currency}${netSales.toLocaleString('en', { minimumFractionDigits: 2 })}`, icon: Wallet, sub: 'After refunds' },
      { label: 'Active Jobs', value: branchJobs.filter(j => j.status !== 'completed' && j.status !== 'paid').length, icon: Wrench, sub: `${branchJobs.length} total` },
      { label: 'Inventory', value: `${settings.currency}${inventoryValue.toLocaleString('en', { minimumFractionDigits: 0 })}`, icon: Package, sub: `${lowStockCount} low stock` },
      { label: 'Customers', value: customers.length, icon: Users, sub: viewAllOrg ? 'All branches' : 'Branch scope' },
      { label: 'Refunds', value: `${settings.currency}${totalRefunds.toFixed(2)}`, icon: RotateCcw, sub: `${branchRefunds.length} issued` },
      { label: 'Outstanding', value: `${settings.currency}${outstandingPayments.toFixed(2)}`, icon: TrendingUp, sub: 'Unpaid balance' }
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
    branchProducts.forEach((p) => {
      const key = p.categoryName || p.categoryId || 'Uncategorized';
      cats[key] = (cats[key] || 0) + (p.stock || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name: name.replace(' Parts', ''), value }));
  }, [branchProducts]);

  const salesByStaff = useMemo(() => {
    if (!viewAllOrg) return [];
    const map: Record<string, number> = {};
    branchInvoices.forEach((inv) => {
      const name = (inv.createdBy ? userNameById.get(inv.createdBy) : undefined) || 'Unknown';
      map[name] = (map[name] || 0) + inv.total;
    });
    return Object.entries(map).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));
  }, [branchInvoices, userNameById, viewAllOrg]);

  const dailySalesTrend = useMemo(() => {
    const dayMap = new Map<string, { day: string; sales: number; refunds: number; invoices: number }>();
    const now = new Date();
    const labels: string[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(key);
      dayMap.set(key, { day, sales: 0, refunds: 0, invoices: 0 });
    }

    branchInvoices.forEach((invoice) => {
      if (!invoice.createdAt) return;
      const key = new Date(invoice.createdAt).toISOString().slice(0, 10);
      if (!dayMap.has(key)) return;
      const row = dayMap.get(key)!;
      row.sales += invoice.total;
      row.invoices += 1;
    });

    branchRefunds.forEach((refund) => {
      if (!refund.createdAt) return;
      const key = new Date(refund.createdAt).toISOString().slice(0, 10);
      if (!dayMap.has(key)) return;
      const row = dayMap.get(key)!;
      row.refunds += refund.total;
    });

    return labels.map((key) => {
      const row = dayMap.get(key)!;
      return { ...row, net: row.sales - row.refunds };
    });
  }, [branchInvoices, branchRefunds]);

  const paymentMethodData = useMemo(() => {
    const map = { cash: 0, card: 0, transfer: 0, split: 0 };
    branchInvoices.forEach((invoice) => {
      const method = invoice.paymentMethod || 'cash';
      map[method] += invoice.total;
    });
    return [
      { name: 'Cash', value: map.cash, color: 'hsl(142, 60%, 42%)' },
      { name: 'Card', value: map.card, color: 'hsl(210, 80%, 55%)' },
      { name: 'Transfer', value: map.transfer, color: 'hsl(280, 55%, 55%)' },
      { name: 'Split', value: map.split, color: 'hsl(36, 92%, 54%)' }
    ].filter((x) => x.value > 0);
  }, [branchInvoices]);

  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    branchInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemMap[item.name].qty += item.quantity;
        itemMap[item.name].revenue += item.total;
      });
    });
    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [branchInvoices]);

  const recentInvoices = useMemo(() => {
    return [...branchInvoices]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 6);
  }, [branchInvoices]);

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

      <div className={`grid gap-3 ${stats.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-7'}`}>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-heading font-bold text-foreground uppercase tracking-wider">7-Day Sales Trend</h3>
              <span className="text-[10px] font-mono text-muted-foreground">Dynamic from POS invoices</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailySalesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 8%, 50%)', fontFamily: 'DM Mono' }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="sales" stroke="hsl(210, 80%, 55%)" strokeWidth={2} dot={false} name="Sales" />
                <Line type="monotone" dataKey="net" stroke="hsl(142, 60%, 42%)" strokeWidth={2} dot={false} name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">POS Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/60">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Invoices</span>
                </div>
                <span className="text-sm font-bold">{totalInvoices}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/60">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Avg Ticket</span>
                </div>
                <span className="text-sm font-bold">{settings.currency}{averageTicket.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/60">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Collection Rate</span>
                </div>
                <span className="text-sm font-bold">{collectionRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, collectionRate)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - only for admin/manager/inventory roles */}
      {(viewAllOrg || isManager || role === 'inventory_manager' || role === 'service_advisor') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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

          <Card>
            <CardContent className="p-5">
              <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">Payment Method Mix</h3>
              {paymentMethodData.length > 0 ? (
                <div className="flex items-center gap-5">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2} dataKey="value" strokeWidth={0}>
                        {paymentMethodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {paymentMethodData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground font-mono text-[10px]">{entry.name}</span>
                        <span className="font-bold text-foreground font-mono">{settings.currency}{entry.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">No payment data</div>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">Top Selling Items</h3>
            {topSellingItems.length > 0 ? (
              <div className="space-y-2">
                {topSellingItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-md border border-border/40">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{item.qty} units sold</p>
                    </div>
                    <p className="text-xs font-bold font-mono">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">No sales items</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-4 uppercase tracking-wider">Recent Invoices</h3>
            {recentInvoices.length > 0 ? (
              <div className="space-y-2">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 rounded-md border border-border/40">
                    <div>
                      <p className="text-xs font-medium">{invoice.transactionNumber || invoice.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{invoice.customerName || 'Walk-in'} - {invoice.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono">{settings.currency}{invoice.total.toFixed(2)}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">{invoice.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">No invoices</div>
            )}
          </CardContent>
        </Card>
      </div>

      {(viewAllOrg || isManager || role === 'inventory_manager') && lowStockCount > 0 && (
        <Card className="border-warning/20">
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Package className="h-3.5 w-3.5 text-warning" />Low Stock Alert
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {branchProducts.filter(p => (p.stock || 0) <= (p.minStock || 0)).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-warning/5 border border-warning/15 text-xs">
                  <span className="text-foreground font-medium truncate">{p.name}</span>
                  <span className="text-warning font-mono font-bold">{p.stock || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
