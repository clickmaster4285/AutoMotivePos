import { useState, useMemo, useEffect } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { useRefundsQuery, useCreateRefundMutation } from '@/hooks/api/useRefunds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Search, RotateCcw, Loader2 } from 'lucide-react';
import type { RefundItem } from '@/types';
import type { Transaction } from '@/api/transaction';
import { Checkbox } from '@/components/ui/checkbox';

export default function RefundsPage() {
  const { toast } = useToast();
  const { currentBranchId, currentUser } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const [branchId, setBranchId] = useState(currentBranchId || '');

  useEffect(() => {
    if (!isAdmin && currentBranchId) setBranchId(currentBranchId);
  }, [isAdmin, currentBranchId]);

  useEffect(() => {
    if (!branches.length) return;
    const has = branches.some((b) => b.id === branchId);
    if (!has) {
      const fb =
        currentBranchId && branches.some((b) => b.id === currentBranchId) ? currentBranchId : branches[0].id;
      setBranchId(fb);
    }
  }, [branches, currentBranchId, branchId]);

  const branchParam = branchId ? { branchId } : undefined;
  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery(branchParam, {
    enabled: !!branchId,
  });
  const { data: refunds = [], isLoading: refundsLoading } = useRefundsQuery(branchParam, {
    enabled: !!branchId,
  });
  const createRefundMutation = useCreateRefundMutation();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reason, setReason] = useState('');
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');

  const eligibleTransactions = useMemo(
    () => transactions.filter((t) => !t.isVoid && t.status === 'paid' && (t.total ?? 0) > 0),
    [transactions]
  );

  const filteredRefunds = useMemo(() => {
    return refunds
      .filter(
        (r) =>
          !search ||
          (r.refundNumber || r.id).toLowerCase().includes(search.toLowerCase()) ||
          (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [refunds, search]);

  const openRefundDialog = () => {
    setSelectedTransaction(null);
    setReason('');
    setSelectedLineIds([]);
    setRefundType('full');
    setDialogOpen(true);
  };

  const selectTransaction = (txnId: string) => {
    const txn = eligibleTransactions.find((t) => t.id === txnId);
    if (!txn) return;
    setSelectedTransaction(txn);
    const allLineIds = txn.items.map((li) => li.lineId);
    setSelectedLineIds(refundType === 'full' ? allLineIds : []);
  };

  useEffect(() => {
    if (!selectedTransaction) return;
    if (refundType === 'full') {
      setSelectedLineIds(selectedTransaction.items.map((li) => li.lineId));
    }
  }, [refundType, selectedTransaction]);

  useEffect(() => {
    if (!selectedTransaction) return;
    if (refundType !== 'partial') return;
    const allCount = selectedTransaction.items.length;
    if (allCount > 0 && selectedLineIds.length === allCount) {
      setRefundType('full');
    }
  }, [refundType, selectedTransaction, selectedLineIds]);

  const refundItems = useMemo<RefundItem[]>(() => {
    if (!selectedTransaction) return [];

    const selected =
      refundType === 'full'
        ? selectedTransaction.items
        : selectedTransaction.items.filter((li) => selectedLineIds.includes(li.lineId));

    return selected.map((li) => ({
      id: li.lineId,
      invoiceItemId: li.lineId,
      name: li.name,
      type: li.productId ? 'product' : 'service',
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      total: li.total,
    }));
  }, [refundType, selectedTransaction, selectedLineIds]);

  const refundTotal = refundItems.reduce((s, i) => s + i.total, 0);

  const handleRefund = async () => {
    if (!selectedTransaction || !reason.trim()) return;
    if (refundItems.length === 0) {
      toast({ title: 'Nothing to refund', variant: 'destructive' });
      return;
    }
    try {
      await createRefundMutation.mutateAsync({
        invoiceId: selectedTransaction.id,
        type: refundType,
        reason: reason.trim(),
        items: refundItems.map((i) => ({
          invoiceItemId: i.invoiceItemId,
          name: i.name,
          type: i.type,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
      });
      toast({ title: 'Refund processed' });
      setDialogOpen(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Refund failed';
      toast({ title: 'Refund failed', description: message, variant: 'destructive' });
    }
  };

  const loading = txLoading || refundsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Refunds & Returns</h1>
          <p className="page-subtitle">Refunds are recorded against POS transactions for this branch</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && branches.length > 0 && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={openRefundDialog} className="gap-2" disabled={!branchId}>
            <RotateCcw className="h-4 w-4" /> New Refund
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search refunds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredRefunds.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No refunds yet
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Refund #</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Sale</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                <th className="text-left p-3 font-medium text-muted-foreground">By</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-semibold text-foreground">
                    {r.refundNumber || r.id.slice(-8)}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{r.invoiceNumber}</td>
                  <td className="p-3 text-foreground">{r.customerName}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                        r.type === 'full'
                          ? 'bg-destructive/15 text-destructive border-destructive/30'
                          : 'bg-warning/15 text-warning border-warning/30'
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.reason}</td>
                  <td className="p-3 text-muted-foreground text-xs">{r.processedByName || '—'}</td>
                  <td className="p-3 text-right font-semibold text-destructive">${r.total.toFixed(2)}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Refund</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Transaction (sale)</Label>
              <Select onValueChange={selectTransaction}>
                <SelectTrigger>
                  <SelectValue placeholder={eligibleTransactions.length ? 'Select sale' : 'No sales in this branch'} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleTransactions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.transactionNumber || t.id.slice(-8)} — {t.customerName || 'Walk-in'} ($
                      {(t.total ?? 0).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={refundType}
                  onValueChange={(v) => {
                    const next = v as 'full' | 'partial';
                    setRefundType(next);
                    if (next === 'partial') setSelectedLineIds([]);
                    if (next === 'full' && selectedTransaction) {
                      setSelectedLineIds(selectedTransaction.items.map((li) => li.lineId));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTransaction && refundType === 'partial' && (
              <div className="space-y-2">
                <Label>Items to refund</Label>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {selectedTransaction.items.map((li) => {
                    const checked = selectedLineIds.includes(li.lineId);
                    return (
                      <label
                        key={li.lineId}
                        className="flex items-center justify-between gap-3 p-2 bg-muted rounded text-sm cursor-pointer"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const nextChecked = Boolean(v);
                              setSelectedLineIds((prev) => {
                                if (nextChecked) {
                                  if (prev.includes(li.lineId)) return prev;
                                  return [...prev, li.lineId];
                                }
                                return prev.filter((id) => id !== li.lineId);
                              });
                            }}
                          />
                          <span className="text-foreground truncate">{li.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            x{li.quantity}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-right whitespace-nowrap">
                          ${li.total.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason for refund</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason..." />
            </div>

            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span className="text-foreground">Refund Total</span>
              <span className="text-destructive">${refundTotal.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => void handleRefund()}
              disabled={!selectedTransaction || !reason.trim() || refundTotal <= 0 || createRefundMutation.isPending}
            >
              {createRefundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing…
                </>
              ) : (
                'Process Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
