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
import { Search, RotateCcw, Loader2, Minus, Plus } from 'lucide-react';
import type { RefundItem } from '@/types';
import type { Transaction } from '@/api/transaction';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';

import { useSettingsQuery } from "@/hooks/api/useSettings";

// Define interface for selected items with quantities and discounted values
interface SelectedRefundItem {
  lineId: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  discount: number;
  itemDiscount: number; // Individual item discount percentage
  originalTotal: number; // Total before overall discount
  discountedTotal: number; // Total after proportional discount
  refundAmount: number; // Amount to refund for this quantity
}

export default function RefundsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentBranchId, currentUser } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';
  const { data: settings } = useSettingsQuery();
  
  // For admin: 'all' means all branches, otherwise specific branch ID
  const [branchFilter, setBranchFilter] = useState<string>(isAdmin ? 'all' : (currentBranchId || ''));

  useEffect(() => {
    if (!isAdmin && currentBranchId) setBranchFilter(currentBranchId);
  }, [isAdmin, currentBranchId]);

  useEffect(() => {
    if (!branches.length) return;
    if (!isAdmin) {
      const fb = currentBranchId && branches.some((b) => b.id === currentBranchId) ? currentBranchId : branches[0].id;
      setBranchFilter(fb);
    }
  }, [branches, currentBranchId, isAdmin]);

  // Prepare branch param for API calls
  const branchParam = !isAdmin || branchFilter === 'all' 
    ? undefined 
    : { branchId: branchFilter };

  const { data: transactions = [], isLoading: txLoading } = useTransactionsQuery(branchParam, {
    enabled: isAdmin ? true : !!branchFilter,
  });
  
  const { data: refunds = [], isLoading: refundsLoading } = useRefundsQuery(branchParam, {
    enabled: isAdmin ? true : !!branchFilter,
  });
  
  const createRefundMutation = useCreateRefundMutation();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reason, setReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedRefundItem[]>([]);
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
    setTransactionSearch('');
    setReason('');
    setSelectedItems([]);
    setRefundType('full');
    setDialogOpen(true);
  };

  // Filter transactions based on search input
  const filteredEligibleTransactions = useMemo(() => {
    const q = transactionSearch.trim().toLowerCase();
    if (!q) return eligibleTransactions;

    const normalizedQuery = q.startsWith('txn-') ? q.slice(4) : q;

    return eligibleTransactions.filter((t) => {
      const txnNumber = (t.transactionNumber || '').toLowerCase();
      const normalizedTxn = txnNumber.startsWith('txn-') ? txnNumber.slice(4) : txnNumber;
      const customerName = (t.customerName || '').toLowerCase();
      
      return txnNumber.includes(q) || 
             normalizedTxn.includes(normalizedQuery) ||
             customerName.includes(q);
    });
  }, [eligibleTransactions, transactionSearch]);

  // Calculate proportional discount for an item
  const calculateProportionalDiscount = (
    itemOriginalTotal: number,
    transactionSubtotal: number,
    transactionTotal: number
  ): number => {
    if (transactionSubtotal === 0) return 0;
    const discountRatio = transactionTotal / transactionSubtotal;
    return itemOriginalTotal * discountRatio;
  };

  // Calculate refund amount for selected items with proportional discount distribution
  const calculateRefundAmounts = (
    transaction: Transaction,
    selectedQuantities: Map<string, number>
  ): SelectedRefundItem[] => {
    const transactionSubtotal = transaction.subtotal || 0;
    const transactionTotal = transaction.total || 0;
    const overallDiscount = transactionSubtotal - transactionTotal;
    
    // Calculate original totals for each item (without any discount)
    const itemOriginalTotals = transaction.items.map(item => ({
      lineId: item._id || String(item._id),
      name: item.name,
      unitPrice: item.unitPrice,
      originalUnitPrice: item.unitPrice,
      quantity: item.quantity,
      maxQuantity: item.quantity,
      itemDiscount: item.discount || 0,
      originalTotal: (item.unitPrice * item.quantity) * (1 - (item.discount || 0) / 100),
    }));

    // Calculate what percentage of total each item represents
    const totalOriginalAmount = itemOriginalTotals.reduce((sum, item) => sum + item.originalTotal, 0);
    
    return itemOriginalTotals.map(item => {
      const refundQuantity = selectedQuantities.get(item.lineId) || 0;
      if (refundQuantity === 0) return null;
      
      // Calculate original total for refund quantity
      const itemUnitOriginalTotal = item.originalTotal / item.quantity;
      const refundOriginalTotal = itemUnitOriginalTotal * refundQuantity;
      
      // Calculate proportional discount for the refunded portion
      let discountedTotal = refundOriginalTotal;
      let refundAmount = refundOriginalTotal;
      
      if (overallDiscount > 0 && transactionSubtotal > 0) {
        // Calculate the item's weight in the total
        const itemWeight = item.originalTotal / totalOriginalAmount;
        // Apply proportional discount based on weight
        const itemDiscountShare = overallDiscount * itemWeight;
        // Adjust discount based on refund quantity proportion
        const refundDiscountShare = itemDiscountShare * (refundQuantity / item.quantity);
        refundAmount = refundOriginalTotal - refundDiscountShare;
        discountedTotal = refundAmount;
      } else if (item.itemDiscount > 0) {
        // Handle individual item discount without overall discount
        refundAmount = refundOriginalTotal;
        discountedTotal = refundOriginalTotal;
      }
      
      return {
        lineId: item.lineId,
        name: item.name,
        quantity: refundQuantity,
        maxQuantity: item.quantity,
        unitPrice: refundAmount / refundQuantity, // Effective unit price after discount
        originalUnitPrice: item.unitPrice,
        discount: item.itemDiscount,
        itemDiscount: item.itemDiscount,
        originalTotal: refundOriginalTotal,
        discountedTotal: discountedTotal,
        refundAmount: refundAmount,
      };
    }).filter((item): item is SelectedRefundItem => item !== null);
  };

  const selectTransaction = (txnId: string) => {
    const txn = eligibleTransactions.find((t) => t.id === txnId);
    if (!txn) return;
    setSelectedTransaction(txn);
    
    if (refundType === 'full') {
      // For full refund, select all items with full quantities
      const allQuantities = new Map<string, number>();
      txn.items.forEach(item => {
        const lineId = item._id || String(item._id);
        allQuantities.set(lineId, item.quantity);
      });
      const calculatedItems = calculateRefundAmounts(txn, allQuantities);
      setSelectedItems(calculatedItems);
    } else {
      setSelectedItems([]);
    }
    
    setTransactionSearch('');
  };

  useEffect(() => {
    if (!selectedTransaction) return;
    if (refundType === 'full') {
      const allQuantities = new Map<string, number>();
      selectedTransaction.items.forEach(item => {
        const lineId = item._id || String(item._id);
        allQuantities.set(lineId, item.quantity);
      });
      const calculatedItems = calculateRefundAmounts(selectedTransaction, allQuantities);
      setSelectedItems(calculatedItems);
    }
  }, [refundType, selectedTransaction]);

  const handleQuantityChange = (lineId: string, newQuantity: number) => {
    if (!selectedTransaction) return;
    
    const item = selectedTransaction.items.find(i => (i._id || String(i._id)) === lineId);
    if (!item) return;
    
    const validQuantity = Math.max(0, Math.min(newQuantity, item.quantity));
    
    // Get current selected quantities
    const currentQuantities = new Map<string, number>();
    selectedItems.forEach(selected => {
      currentQuantities.set(selected.lineId, selected.quantity);
    });
    
    if (validQuantity === 0) {
      currentQuantities.delete(lineId);
    } else {
      currentQuantities.set(lineId, validQuantity);
    }
    
    // Recalculate all refund amounts with updated quantities
    const updatedItems = calculateRefundAmounts(selectedTransaction, currentQuantities);
    setSelectedItems(updatedItems);
  };

  const toggleItemSelection = (lineId: string, maxQuantity: number) => {
    if (!selectedTransaction) return;
    
    const currentQuantities = new Map<string, number>();
    selectedItems.forEach(selected => {
      currentQuantities.set(selected.lineId, selected.quantity);
    });
    
    if (currentQuantities.has(lineId)) {
      currentQuantities.delete(lineId);
    } else {
      currentQuantities.set(lineId, 1); // Start with 1 item
    }
    
    const updatedItems = calculateRefundAmounts(selectedTransaction, currentQuantities);
    setSelectedItems(updatedItems);
  };

 // In your frontend RefundsPage.tsx, update the refundItems useMemo:

const refundItems = useMemo<RefundItem[]>(() => {
  if (!selectedTransaction) return [];

  return selectedItems.map((item) => {
    // Find the original line item to get the original unit price
    const originalLine = selectedTransaction.items.find(
      li => (li._id || String(li._id)) === item.lineId
    );
    
    return {
      id: item.lineId,
      invoiceItemId: item.lineId,
      name: item.name,
      type: originalLine?.productId ? 'product' : 'service',
      quantity: item.quantity,
      unitPrice: originalLine?.unitPrice || item.unitPrice, // Send ORIGINAL unit price
      discount: item.discount,
      total: item.refundAmount, // Send the calculated refund amount
    };
  });
}, [selectedItems, selectedTransaction]);

  const refundTotal = refundItems.reduce((sum, item) => sum + item.total, 0);
  const originalRefundTotal = selectedItems.reduce((sum, item) => sum + item.originalTotal, 0);
  const discountSaved = originalRefundTotal - refundTotal;

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
    toast({ title: 'Refund processed successfully' });
    setDialogOpen(false);
    // Refresh the page or refetch data
    window.location.reload(); // Optional: refresh to show updated data
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Refund failed';
    toast({ title: 'Refund failed', description: message, variant: 'destructive' });
  }
};

  const loading = txLoading || refundsLoading;

  const getBranchDisplayName = () => {
    if (!isAdmin) return null;
    if (branchFilter === 'all') return 'All Branches';
    const branch = branches.find(b => b.id === branchFilter);
    return branch?.name || 'Select Branch';
  };

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
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Branch">
                    {getBranchDisplayName()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-semibold">
                    🌐 All Branches
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={openRefundDialog} className="gap-2" disabled={!isAdmin && !branchFilter}>
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
                  <td onClick={() => navigate(`/refunds/${r.id}`)} className="p-3 font-mono text-xs font-semibold text-foreground cursor-pointer">
                    {r.refundNumber || r.id.slice(-8)}
                  </td>
                  <td onClick={() => navigate(`/refunds/${r.id}`)} className="p-3 font-mono text-xs text-muted-foreground cursor-pointer">
                    {r.invoiceNumber}
                  </td>
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
                  <td className="p-3 text-right font-semibold text-destructive">
                    {settings?.currency || '$'} {r.total.toFixed(2)}
                  </td>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction # or customer name..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {transactionSearch && filteredEligibleTransactions.length > 0 && (
                <div className="border rounded-md mt-2 max-h-60 overflow-y-auto">
                  {filteredEligibleTransactions.map((t) => (
                    <button
                      key={t.id}
                      className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-0"
                      onClick={() => selectTransaction(t.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-sm font-semibold">
                            {t.transactionNumber || t.id.slice(-8)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {t.customerName || 'Walk-in'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-medium">
                            {settings?.currency || '$'} {(t.total ?? 0).toFixed(2)}
                          </div>
                          {(t.subtotal || 0) > (t.total || 0) && (
                            <div className="text-xs text-muted-foreground">
                              Discount: {settings?.currency || '$'} {((t.subtotal || 0) - (t.total || 0)).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {transactionSearch && filteredEligibleTransactions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-md mt-2">
                  No matching transactions found
                </div>
              )}

              {selectedTransaction && !transactionSearch && (
                <div className="bg-muted p-3 rounded-md mt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-sm font-semibold">
                        {selectedTransaction.transactionNumber || selectedTransaction.id.slice(-8)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {selectedTransaction.customerName || 'Walk-in'}
                      </span>
                      {(selectedTransaction.subtotal || 0) > (selectedTransaction.total || 0) && (
                        <div className="text-xs text-green-600 mt-1">
                          Discount applied: {settings?.currency || '$'} {((selectedTransaction.subtotal || 0) - (selectedTransaction.total || 0)).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(null);
                        setTransactionSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {selectedTransaction && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={refundType}
                      onValueChange={(v) => {
                        const next = v as 'full' | 'partial';
                        setRefundType(next);
                        if (next === 'full' && selectedTransaction) {
                          const allQuantities = new Map<string, number>();
                          selectedTransaction.items.forEach(item => {
                            const lineId = item._id || String(item._id);
                            allQuantities.set(lineId, item.quantity);
                          });
                          const calculatedItems = calculateRefundAmounts(selectedTransaction, allQuantities);
                          setSelectedItems(calculatedItems);
                        } else if (next === 'partial') {
                          setSelectedItems([]);
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

                {refundType === 'partial' && (
                  <div className="space-y-2">
                    <Label>Items to refund (select items and adjust quantities)</Label>
                    <div className="space-y-3 max-h-64 overflow-auto pr-1">
                      {selectedTransaction.items.map((li) => {
                        const lineId = li._id || String(li._id);
                        const selectedItem = selectedItems.find(item => item.lineId === lineId);
                        const isSelected = !!selectedItem;
                        const currentQuantity = selectedItem?.quantity || 0;
                        const maxQuantity = li.quantity;
                        const itemOriginalTotal = (li.unitPrice * li.quantity) * (1 - (li.discount || 0) / 100);
                        
                        return (
                          <div
                            key={lineId}
                            className="p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleItemSelection(lineId, maxQuantity)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{li.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Original: {li.quantity} × {settings?.currency || '$'} {li.unitPrice.toFixed(2)}
                                    {li.discount > 0 && ` (${li.discount}% off)`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-sm font-semibold">
                                    {settings?.currency || '$'} {itemOriginalTotal.toFixed(2)}
                                  </div>
                                </div>
                              </label>
                            </div>
                            
                            {isSelected && selectedItem && (
                              <div className="space-y-2 pl-7 pt-2 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Refund quantity:</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleQuantityChange(lineId, currentQuantity - 1)}
                                      disabled={currentQuantity <= 1}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-12 text-center font-mono font-medium">
                                      {currentQuantity}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleQuantityChange(lineId, currentQuantity + 1)}
                                      disabled={currentQuantity >= maxQuantity}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      of {maxQuantity}
                                    </span>
                                  </div>
                                </div>
                                
                                {selectedItem.originalTotal !== selectedItem.refundAmount && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Discount applied:</span>
                                    <span className="text-green-600">
                                      -{settings?.currency || '$'} {(selectedItem.originalTotal - selectedItem.refundAmount).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-sm font-medium">Refund amount:</span>
                                  <span className="font-mono text-base font-bold text-destructive">
                                    {settings?.currency || '$'} {selectedItem.refundAmount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedItems.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                        No items selected for refund
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Reason for refund</Label>
                  <Textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Enter reason for refund..." 
                    rows={3}
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Original value of refunded items:</span>
                    <span className="font-mono">
                      {settings?.currency || '$'} {originalRefundTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {discountSaved > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Discount saved:</span>
                      <span className="font-mono text-green-600">
                        -{settings?.currency || '$'} {discountSaved.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg font-bold pt-2">
                    <span className="text-foreground">Total Refund Amount</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-destructive">
                        {settings?.currency || '$'} {refundTotal.toFixed(2)}
                      </div>
                      {refundType === 'partial' && selectedTransaction && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Original transaction total: {settings?.currency || '$'} {selectedTransaction.total.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => void handleRefund()}
              disabled={!selectedTransaction || !reason.trim() || refundTotal <= 0 || createRefundMutation.isPending}
              className="gap-2"
            >
              {createRefundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Process Refund ({settings?.currency || '$'} {refundTotal.toFixed(2)})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}