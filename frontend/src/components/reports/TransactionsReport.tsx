// components/reports/TransactionsReport.tsx
import { Card, CardContent } from '@/components/ui/card';

interface TransactionsReportProps {
  transactions: any[];
  users: any[];
}

export function TransactionsReport({ transactions, users }: TransactionsReportProps) {
  const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);

  return (
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
              {transactions.slice(0, 50).map((transaction) => (
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
                <td className="p-3 text-right text-xs font-bold">${totalSales.toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
          {transactions.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">No transactions found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}