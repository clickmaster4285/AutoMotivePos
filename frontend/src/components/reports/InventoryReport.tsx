// components/reports/InventoryReport.tsx
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { useAppState } from '@/providers/AppStateProvider';
import { canViewAllBranchesData } from '@/lib/permissions';

interface InventoryReportProps {
  products: any[];
}

export function InventoryReport({ products }: InventoryReportProps) {
  const { currentUser, currentBranchId } = useAppState();
  const viewAllOrg = canViewAllBranchesData(currentUser);
  
  // Fetch transactions for stock movement
  const { data: transactions = [] } = useTransactionsQuery(
    viewAllOrg ? undefined : { branchId: currentBranchId }
  );

  const inventoryData = useMemo(() => {
    const totalCost = products.reduce((sum, p) => sum + (p.cost || 0) * (p.stock || 0), 0);
    const totalRetail = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
    const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 0));
    const outOfStock = products.filter(p => (p.stock || 0) === 0);
    
    // Stock by category
    const categoryStock: Record<string, { name: string; value: number }> = {};
    products.forEach(p => {
      const category = p.categoryName || 'Uncategorized';
      if (!categoryStock[category]) {
        categoryStock[category] = { name: category, value: 0 };
      }
      categoryStock[category].value += (p.cost || 0) * (p.stock || 0);
    });

    // Stock by status
    const stockStatus = [
      { name: 'In Stock', value: products.filter(p => (p.stock || 0) > (p.minStock || 0)).length, color: '#10b981' },
      { name: 'Low Stock', value: lowStock.filter(p => (p.stock || 0) > 0).length, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStock.length, color: '#ef4444' },
    ];

    return {
      totalCost,
      totalRetail,
      potentialProfit: totalRetail - totalCost,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalProducts: products.length,
      categoryStock: Object.values(categoryStock),
      lowStockItems: lowStock.slice(0, 10),
      stockStatus,
    };
  }, [products]);

  // Calculate real stock movement from transaction data
  const stockMovement = useMemo(() => {
    // Get last 6 months
    const monthlyMap: Record<string, { month: string; in: number; out: number; fullDate: Date }> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyMap[monthName] = { 
        month: monthName, 
        in: 0, 
        out: 0,
        fullDate: date
      };
    }
    
    // Process transactions to calculate stock movement
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const monthName = transactionDate.toLocaleString('default', { month: 'short' });
      
      // Only count transactions from last 6 months
      if (monthlyMap[monthName]) {
        // Calculate items sold (stock out)
        if (transaction.items && transaction.items.length > 0) {
          transaction.items.forEach((item: any) => {
            const quantity = item.quantity || 0;
            monthlyMap[monthName].out += quantity;
          });
        }
      }
    });
    
    // Calculate stock in from product creation dates and purchase orders
    // For now, we'll use product creation dates as stock in
    products.forEach(product => {
      if (product.createdAt) {
        const createdDate = new Date(product.createdAt);
        const monthName = createdDate.toLocaleString('default', { month: 'short' });
        
        if (monthlyMap[monthName]) {
          const initialStock = product.stock || 0;
          monthlyMap[monthName].in += initialStock;
        }
      }
    });
    
    // Sort by date
    return Object.values(monthlyMap).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [transactions, products]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  return (
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
            <p className="text-lg font-bold text-yellow-500">{inventoryData.lowStockCount}</p>
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
            <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Stock Status</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={inventoryData.stockStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {inventoryData.stockStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {inventoryData.stockStatus.map(entry => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Stock Movement</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockMovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="in" fill="#10b981" name="Stock In (Units)" />
                <Bar dataKey="out" fill="#3b82f6" name="Stock Out (Units)" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Stock In: New products added | Stock Out: Products sold
            </p>
          </CardContent>
        </Card>

        {inventoryData.lowStockCount > 0 && (
          <Card className="border-yellow-500/20">
            <CardContent className="p-5">
              <h3 className="text-xs font-heading font-bold mb-3 flex items-center gap-2 text-yellow-500">
                <AlertCircle className="h-3.5 w-3.5" />
                Low Stock Alert ({inventoryData.lowStockCount} items)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
                {inventoryData.lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-yellow-500/5 border border-yellow-500/15">
                    <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                    <div className="text-right ml-2">
                      <span className="text-yellow-500 font-mono text-xs font-bold">{item.stock || 0}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">/ {item.minStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}