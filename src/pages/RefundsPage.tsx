import { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, RotateCcw, Plus, Minus } from 'lucide-react';
import type { RefundItem, Invoice } from '@/types';

export default function RefundsPage() {
  const { invoices, refunds, currentBranchId, currentUser, addRefund } = useStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reason, setReason] = useState('');
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');

  const isAdmin = currentUser?.role === 'admin';
  const branchRefunds = useMemo(() => {
    const list = isAdmin ? refunds : refunds.filter(r => r.branchId === currentBranchId);
    return list.filter(r => !search || r.refundNumber.toLowerCase().includes(search.toLowerCase()) || r.customerName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [refunds, currentBranchId, search, isAdmin]);

  const eligibleInvoices = invoices.filter(i => i.branchId === currentBranchId && i.total > 0);

  const openRefundDialog = () => {
    setSelectedInvoice(null);
    setReason('');
    setRefundItems([]);
    setRefundType('full');
    setDialogOpen(true);
  };

  const selectInvoice = (invId: string) => {
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setSelectedInvoice(inv);
      setRefundItems(inv.items.map(item => ({
        id: uuid(), invoiceItemId: item.id, name: item.name, type: item.type,
        quantity: item.quantity, unitPrice: item.unitPrice, total: item.total,
      })));
    }
  };

  const updateRefundQty = (id: string, qty: number) => {
    setRefundItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, qty), total: Math.max(0, qty) * i.unitPrice } : i));
  };

  const refundTotal = refundItems.reduce((s, i) => s + i.total, 0);

  const handleRefund = () => {
    if (!selectedInvoice || !reason) return;
    const activeItems = refundItems.filter(i => i.quantity > 0);
    if (activeItems.length === 0) return;
    addRefund({
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      branchId: currentBranchId,
      type: refundType,
      reason,
      items: activeItems,
      total: refundTotal,
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Refunds & Returns</h1>
          <p className="page-subtitle">Manage refunds and product returns</p>
        </div>
        <Button onClick={openRefundDialog} className="gap-2"><RotateCcw className="h-4 w-4" /> New Refund</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search refunds..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {branchRefunds.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-40" />No refunds yet
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Refund #</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
              <th className="text-left p-3 font-medium text-muted-foreground">By</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {branchRefunds.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-semibold text-foreground">{r.refundNumber}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{r.invoiceNumber}</td>
                  <td className="p-3 text-foreground">{r.customerName}</td>
                  <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${r.type === 'full' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30'}`}>{r.type}</span></td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                  <td className="p-3 text-muted-foreground text-xs">{r.userName}</td>
                  <td className="p-3 text-right font-semibold text-destructive">${r.total.toFixed(2)}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Refund</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Select onValueChange={selectInvoice}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>
                  {eligibleInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.customerName} (${inv.total.toFixed(2)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={refundType} onValueChange={v => setRefundType(v as 'full' | 'partial')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedInvoice && refundType === 'partial' && (
              <div className="space-y-2">
                <Label>Items to refund (adjust quantities)</Label>
                {refundItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span className="text-foreground flex-1">{item.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateRefundQty(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-mono text-xs">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateRefundQty(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-mono text-xs w-16 text-right">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason for refund</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter reason..." />
            </div>

            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span className="text-foreground">Refund Total</span>
              <span className="text-destructive">${refundTotal.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleRefund} disabled={!selectedInvoice || !reason || refundTotal <= 0}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
