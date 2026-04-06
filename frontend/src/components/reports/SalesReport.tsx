// components/reports/SalesReport.tsx
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useSettingsQuery } from "@/hooks/api/useSettings";

interface SalesReportProps {
  transactions: any[];
  refunds: any[];
  customers: any[];
}

export function SalesReport({ transactions, refunds, customers }: SalesReportProps) {
   const { data: settings } = useSettingsQuery();
  const salesData = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + (r.total || 0), 0);
    const netSales = totalSales - totalRefunds;
    const totalInvoices = transactions.length;
    const avgTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;
    const paidInvoices = transactions.filter(t => t.status === 'paid').length;
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
    const pendingInvoices = totalInvoices - paidInvoices;
    const outstandingAmount = transactions.filter(t => t.status !== 'paid').reduce((s, t) => s + (t.amountDue || t.total || 0), 0);
    

   
    
    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    transactions.forEach(t => {
      const method = t.paymentMethod || 'cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + (t.total || 0);
    });

    // Daily trend
    const trendMap: Record<string, { date: string; sales: number; net: number }> = {};
    [...transactions, ...refunds.map(r => ({ ...r, isRefund: true }))].forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString();
      if (!trendMap[date]) trendMap[date] = { date, sales: 0, net: 0 };
      if (item.isRefund) {
        trendMap[date].net -= item.total || 0;
      } else {
        trendMap[date].sales += item.total || 0;
        trendMap[date].net += item.total || 0;
      }
    });

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    transactions.forEach(t => {
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
      pendingInvoices,
      outstandingAmount,
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
      trend: Object.values(trendMap).slice(-30),
      topProducts: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }, [transactions, refunds]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  const paymentColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Sales</p>
            <p className="text-lg font-bold">{settings?.currency} {salesData.totalSales.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{salesData.totalInvoices} invoices</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Net Sales</p>
            <p className="text-lg font-bold text-green-500">{settings?.currency} {salesData.netSales.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">After refunds</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Avg Ticket</p>
            <p className="text-lg font-bold">{settings?.currency} {salesData.avgTicket.toFixed(2)}</p>
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
            <p className="text-lg font-bold text-yellow-500">{settings?.currency} {salesData.outstandingAmount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{salesData.pendingInvoices} pending</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Refunds</p>
            <p className="text-lg font-bold text-red-500">{settings?.currency} {salesData.totalRefunds.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">{refunds.length} issued</p>
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
                <PieChart>
                  <Pie data={salesData.paymentMethods} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {salesData.paymentMethods.map((entry, i) => (
                      <Cell key={i} fill={paymentColors[i % paymentColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {salesData.paymentMethods.filter(m => m.value > 0).map((method, i) => (
                  <div key={method.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: paymentColors[i % paymentColors.length] }} />
                    <span className="capitalize text-muted-foreground">{method.name}</span>
                    <span className="font-bold ml-auto">{settings?.currency}{method.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Collection Performance */}
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
                  <p className="text-xs font-bold">{settings?.currency} {product.revenue.toFixed(2)}</p>
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
  );
}