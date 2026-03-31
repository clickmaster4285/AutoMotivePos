import { useEffect, useState, useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { useCreateStockTransferMutation, useStockTransfersQuery } from '@/hooks/api/useStockTransfers';
import { canViewAllBranchesData } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, ArrowRightLeft } from 'lucide-react';

export default function StockTransfersPage() {
  const { currentBranchId, currentUser } = useAppState();
  const { branches } = useBranchesForUi();
  const { data: stockTransfers = [] } = useStockTransfersQuery();
  const { data: products = [] } = useProductsQuery();
  const { data: warehouses = [] } = useWarehousesQuery();
  const createTransferMutation = useCreateStockTransferMutation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [fromBranchId, setFromBranchId] = useState(currentBranchId);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const viewAllOrg = canViewAllBranchesData(currentUser);
  const list = useMemo(() => {
    const items = viewAllOrg ? stockTransfers : stockTransfers.filter(t => t.fromBranchId === currentBranchId || t.toBranchId === currentBranchId);
    return items.filter(t => !search || t.productName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [stockTransfers, currentBranchId, search, viewAllOrg]);

  const fromWarehouses = warehouses.filter(w => w.branch_id === fromBranchId);

 const toWarehouses = warehouses.filter(w => w.branch_id === toBranchId);

  const sourceProducts = products.filter(
    p => p.branch_id === fromBranchId && (!fromWarehouseId || p.warehouse_id === fromWarehouseId) && (p.stock || 0) > 0
  );
  const selectedProduct = products.find(p => p.id === productId);

  useEffect(() => {
    if (!branches.length) return;
    const hasCurrent = branches.some(b => b.id === currentBranchId);
    const hasSelected = branches.some(b => b.id === fromBranchId);
    if (!hasSelected) {
      setFromBranchId(hasCurrent ? currentBranchId : branches[0].id);
    }
  }, [branches, currentBranchId, fromBranchId]);

  const openDialog = () => {
    const hasCurrent = branches.some(b => b.id === currentBranchId);
    setFromBranchId(hasCurrent ? currentBranchId : (branches[0]?.id ?? ''));
    setFromWarehouseId(''); setToBranchId(''); setToWarehouseId('');
    setProductId(''); setQuantity('');
    setDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!productId || !toBranchId || !toWarehouseId || !quantity || !selectedProduct) return;
    const qty = parseInt(quantity);
    if (qty <= 0 || qty > (selectedProduct.stock || 0)) return;

    try {
      await createTransferMutation.mutateAsync({
        product_id: productId,
         from_branch_id: fromBranchId,      // ✅ Add this
      from_warehouse_id: fromWarehouseId, // ✅ Add this
        to_branch_id: toBranchId,
        to_warehouse_id: toWarehouseId,
        quantity: qty,
      });
      setDialogOpen(false);
    } catch {
      // Mutation hook exposes error state for UI if needed.
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Stock Transfers</h1>
          <p className="page-subtitle">Transfer inventory between branches and warehouses</p>
        </div>
        <Button onClick={openDialog} className="gap-2"><ArrowRightLeft className="h-4 w-4" /> New Transfer</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {list.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-40" />No transfers yet
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left p-3 font-medium text-muted-foreground">From</th>
              <th className="text-left p-3 font-medium text-muted-foreground">To</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
              <th className="text-left p-3 font-medium text-muted-foreground">By</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{t.productName}</td>
                  <td className="p-3 text-muted-foreground text-xs">{t.fromBranchName} / {t.fromWarehouseName}</td>
                  <td className="p-3 text-muted-foreground text-xs">{t.toBranchName} / {t.toWarehouseName}</td>
                  <td className="p-3 text-right font-mono font-semibold text-foreground">{t.quantity}</td>
                  <td className="p-3 text-muted-foreground text-xs">{t.userName}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Branch</Label>
                <Select value={fromBranchId} onValueChange={v => { setFromBranchId(v); setFromWarehouseId(''); setProductId(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <Select value={fromWarehouseId} onValueChange={v => { setFromWarehouseId(v); setProductId(''); }}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>{fromWarehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>To Branch</Label>
                <Select value={toBranchId} onValueChange={v => { setToBranchId(v); setToWarehouseId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            <div className="space-y-2">
  <Label>To Warehouse</Label>
  <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
    <SelectTrigger>
      <SelectValue placeholder={!toBranchId ? "Select branch first" : "Select warehouse"} />
    </SelectTrigger>
    <SelectContent>
      {/* If toBranchId is empty, toWarehouses will be empty → no dropdown items */}
      {toWarehouses.map(w => (
        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{sourceProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock || 0})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity {selectedProduct && <span className="text-muted-foreground">(max {selectedProduct.stock || 0})</span>}</Label>
                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max={selectedProduct?.stock || 0} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleTransfer} disabled={!productId || !toBranchId || !toWarehouseId || !quantity || createTransferMutation.isPending}>Transfer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
