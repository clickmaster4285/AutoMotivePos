import { useMemo, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { canViewAllBranchesData } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const { invoices, jobCards, products, refunds, currentBranchId, currentUser } = useAppState();
  const { branches } = useBranchesForUi();
  const [reportType, setReportType] = useState('sales');

  const viewAllOrg = canViewAllBranchesData(currentUser);
  const branchInvoices = viewAllOrg ? invoices : invoices.filter(i => i.branchId === currentBranchId);
  const branchJobs = viewAllOrg ? jobCards : jobCards.filter(j => j.branchId === currentBranchId);
  const branchProducts = viewAllOrg ? products : products.filter(p => p.branchId === currentBranchId);
  const branchRefunds = viewAllOrg ? refunds : refunds.filter(r => r.branchId === currentBranchId);

  const salesByDay = useMemo(() => {
    const days: Record<string, number> = {};
    branchInvoices.forEach(inv => {
      const day = new Date(inv.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' });
      days[day] = (days[day] || 0) + inv.total;
    });
    return Object.entries(days).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));
  }, [branchInvoices]);

  const salesByBranch = useMemo(() => {
    if (!viewAllOrg) return [];
    return branches.map(b => ({
      name: b.name.split(' ')[0],
      total: Math.round(invoices.filter(i => i.branchId === b.id).reduce((s, i) => s + i.total, 0) * 100) / 100,
    }));
  }, [invoices, branches, viewAllOrg]);

  const inventoryReport = useMemo(() => {
    const cats: Record<string, { stock: number; value: number }> = {};
    branchProducts.forEach(p => {
      if (!cats[p.category]) cats[p.category] = { stock: 0, value: 0 };
      cats[p.category].stock += p.stock;
      cats[p.category].value += p.stock * p.cost;
    });
    return Object.entries(cats).map(([name, data]) => ({ name: name.replace(' Parts', ''), ...data, value: Math.round(data.value) }));
  }, [branchProducts]);

  const jobSummary = useMemo(() => [
    { name: 'Pending', count: branchJobs.filter(j => j.status === 'pending').length },
    { name: 'In Progress', count: branchJobs.filter(j => j.status === 'in_progress').length },
    { name: 'Waiting Parts', count: branchJobs.filter(j => j.status === 'waiting_parts').length },
    { name: 'Completed', count: branchJobs.filter(j => j.status === 'completed').length },
    { name: 'Paid', count: branchJobs.filter(j => j.status === 'paid').length },
  ], [branchJobs]);

  const refundsByDay = useMemo(() => {
    const days: Record<string, number> = {};
    branchRefunds.forEach(r => {
      const day = new Date(r.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' });
      days[day] = (days[day] || 0) + r.total;
    });
    return Object.entries(days).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));
  }, [branchRefunds]);

  const techPerformance = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; revenue: number }> = {};
    branchJobs.forEach(j => {
      if (j.technicianId && j.technicianName) {
        if (!map[j.technicianId]) map[j.technicianId] = { name: j.technicianName, total: 0, completed: 0, revenue: 0 };
        map[j.technicianId].total++;
        if (j.status === 'completed' || j.status === 'paid') {
          map[j.technicianId].completed++;
          const rev = j.services.reduce((s, sv) => s + sv.price, 0) + j.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
          map[j.technicianId].revenue += rev;
        }
      }
    });
    return Object.values(map).map(t => ({ name: t.name, completed: t.completed, total: t.total, revenue: Math.round(t.revenue) }));
  }, [branchJobs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0"><h1 className="page-title">Reports</h1><p className="page-subtitle">Business analytics and reports</p></div>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Report</SelectItem>
            {viewAllOrg && <SelectItem value="branch_sales">Branch-wise Sales</SelectItem>}
            <SelectItem value="inventory">Inventory Report</SelectItem>
            <SelectItem value="jobs">Job Summary</SelectItem>
            <SelectItem value="refunds">Refunds Report</SelectItem>
            <SelectItem value="technicians">Technician Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === 'sales' && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales by Day</h3>
          {salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="text-center"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold text-foreground">${branchInvoices.reduce((s, i) => s + i.total, 0).toFixed(2)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Invoices</p><p className="text-xl font-bold text-foreground">{branchInvoices.length}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Avg Sale</p><p className="text-xl font-bold text-foreground">${branchInvoices.length ? (branchInvoices.reduce((s, i) => s + i.total, 0) / branchInvoices.length).toFixed(2) : '0.00'}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-warning">${branchInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amountDue || 0), 0).toFixed(2)}</p></div>
          </div>
        </CardContent></Card>
      )}

      {reportType === 'branch_sales' && viewAllOrg && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales by Branch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByBranch}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}

      {reportType === 'inventory' && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryReport}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="stock" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Units" />
              <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}

      {reportType === 'jobs' && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Job Status Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-5 gap-4">
            {jobSummary.map(j => (
              <div key={j.name} className="text-center"><p className="text-xs text-muted-foreground">{j.name}</p><p className="text-xl font-bold text-foreground">{j.count}</p></div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {reportType === 'refunds' && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Refunds</h3>
          {refundsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={refundsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No refunds yet</div>}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center"><p className="text-xs text-muted-foreground">Total Refunds</p><p className="text-xl font-bold text-destructive">${branchRefunds.reduce((s, r) => s + r.total, 0).toFixed(2)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Count</p><p className="text-xl font-bold text-foreground">{branchRefunds.length}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Full / Partial</p><p className="text-xl font-bold text-foreground">{branchRefunds.filter(r => r.type === 'full').length} / {branchRefunds.filter(r => r.type === 'partial').length}</p></div>
          </div>
        </CardContent></Card>
      )}

      {reportType === 'technicians' && (
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Technician Performance</h3>
          {techPerformance.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={techPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="completed" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Total Assigned" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left p-2 text-muted-foreground">Technician</th><th className="text-right p-2 text-muted-foreground">Jobs</th><th className="text-right p-2 text-muted-foreground">Completed</th><th className="text-right p-2 text-muted-foreground">Revenue</th></tr></thead>
                  <tbody>{techPerformance.map(t => (
                    <tr key={t.name} className="border-b"><td className="p-2 text-foreground">{t.name}</td><td className="p-2 text-right">{t.total}</td><td className="p-2 text-right">{t.completed}</td><td className="p-2 text-right font-mono">${t.revenue.toFixed(2)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No technician data</div>}
        </CardContent></Card>
      )}
    </div>
  );
}
