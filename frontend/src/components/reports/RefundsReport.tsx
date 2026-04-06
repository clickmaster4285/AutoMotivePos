// components/reports/RefundsReport.tsx
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from 'recharts';

import { useSettingsQuery } from "@/hooks/api/useSettings";

interface RefundsReportProps {
  refunds: any[];
  transactions: any[];
}

export function RefundsReport({ refunds, transactions }: RefundsReportProps) {
  const { data: settings } = useSettingsQuery();
  const refundsData = useMemo(() => {
    const totalAmount = refunds.reduce((sum, r) => sum + (r.total || 0), 0);
    const count = refunds.length;
    const avgRefund = count > 0 ? totalAmount / count : 0;
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const refundRate = totalSales > 0 ? (totalAmount / totalSales) * 100 : 0;
    
    // Refunds by reason
    const reasons: Record<string, { reason: string; count: number; amount: number }> = {};
    refunds.forEach(r => {
      const reason = r.reason || 'No reason provided';
      if (!reasons[reason]) {
        reasons[reason] = { reason, count: 0, amount: 0 };
      }
      reasons[reason].count++;
      reasons[reason].amount += r.total || 0;
    });

    // Monthly refund trend based on actual data
    const monthlyMap: Record<string, { month: string; amount: number; count: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyMap[monthName] = { month: monthName, amount: 0, count: 0 };
    }
    
    refunds.forEach(refund => {
      const date = new Date(refund.createdAt);
      const monthName = date.toLocaleString('default', { month: 'short' });
      if (monthlyMap[monthName]) {
        monthlyMap[monthName].amount += refund.total || 0;
        monthlyMap[monthName].count++;
      }
    });

    return {
      totalAmount,
      count,
      avgRefund,
      refundRate,
      reasons: Object.values(reasons).sort((a, b) => b.amount - a.amount),
      monthlyTrend: Object.values(monthlyMap),
    };
  }, [refunds, transactions]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Refunds</p>
            <p className="text-lg font-bold text-red-500">{settings?.currency} {refundsData.totalAmount.toFixed(2)}</p>
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
            <p className="text-lg font-bold">{settings?.currency} {refundsData.avgRefund.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Refund Rate</p>
            <p className="text-lg font-bold text-yellow-500">{refundsData.refundRate.toFixed(1)}%</p>
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
                    <span className="font-bold">{settings?.currency || '$'}{reason.amount.toFixed(2)} ({reason.count})</span>
                  </div>
                  <div className="h-2 w-full rounded bg-muted overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${(reason.amount / refundsData.totalAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
              {refundsData.reasons.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">No refund data</div>
              )}
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
                <Bar yAxisId="left" dataKey="amount" fill="#ef4444" name={`Refund Amount (${settings?.currency})`} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" name="Number of Refunds" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}