import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useTransactionsQuery } from '@/hooks/api/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Search, Receipt, Printer, Loader2, Eye, ArrowUpDown, Filter } from 'lucide-react';
import type { Transaction } from '@/api/transaction';
import { useSettingsQuery } from '@/hooks/api/useSettings';
import { useNavigate } from 'react-router-dom';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentBranchId, currentUser } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const { data: settings } = useSettingsQuery();
  
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';
  const [branchId, setBranchId] = useState<string>('all'); // Default to 'all' for admin
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'void'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Set branch for non-admin users (they can only see their branch)
  useEffect(() => {
    if (!isAdmin && currentBranchId) {
      setBranchId(currentBranchId);
    }
  }, [isAdmin, currentBranchId]);

  // Prepare branch parameter for API call
  const branchParam = useMemo(() => {
    if (!branchId || branchId === 'all' || !isAdmin) {
      return undefined;
    }
    return { branchId };
  }, [branchId, isAdmin]);

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTransactions } = useTransactionsQuery(branchParam, {
    enabled: true, // Always enabled
  });

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.transactionNumber?.toLowerCase().includes(lowerSearch)) ||
        (t.customerName?.toLowerCase().includes(lowerSearch)) ||
        (t.id.toLowerCase().includes(lowerSearch))
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortField === 'date') {
        aVal = new Date(a.createdAt || a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || b.createdAt || 0).getTime();
      } else {
        aVal = a.total || 0;
        bVal = b.total || 0;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return filtered;
  }, [transactions, search, sortField, sortOrder, statusFilter]);

  const viewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  const handlePrintReceipt = () => {
    const printContent = printRef.current;
    if (!printContent || !selectedTransaction) return;

    const now = new Date(selectedTransaction.createdAt || Date.now());
    const dateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const items = selectedTransaction.items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
    const discountAmount = selectedTransaction.discountAmount || 0;
    const total = selectedTransaction.total || subtotal - discountAmount;
    const paid = selectedTransaction.amountPaid || total;
    const change = paid > total ? paid - total : 0;
    const due = total > paid ? total - paid : 0;

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${selectedTransaction.transactionNumber || 'Transaction'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Monaco', monospace;
      font-size: 10.5px;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm 3mm;
      background: white;
      line-height: 1.25;
    }
    .receipt { width: 100%; }

    .header { 
      text-align: center; 
      margin-bottom: 6px; 
      padding-bottom: 5px; 
      border-bottom: 1.5px solid #000; 
    }
    .store-name { 
      font-size: 15px; 
      font-weight: bold; 
      letter-spacing: 1.2px; 
      margin-bottom: 3px;
    }
    .store-info { 
      font-size: 9px; 
      line-height: 1.3; 
      color: #333; 
    }

    .transaction-info { 
      margin: 7px 0 8px 0; 
    }
    .transaction-info p { 
      margin: 2px 0; 
      font-size: 10px;
    }
    .transaction-info strong { font-weight: bold; }

    .items-table { 
      width: 100%; 
      margin: 7px 0; 
      border-collapse: collapse; 
    }
    .items-table th {
      font-size: 10px;
      padding: 4px 0 5px 0;
      border-bottom: 1.5px solid #000;
      text-align: center;
      font-weight: bold;
    }
    .items-table td {
      padding: 4px 2px;
      border-bottom: 1px dotted #ccc;
      vertical-align: top;
    }

    .item-name-col { text-align: left; width: 46%; }
    .item-qty-col { text-align: center; width: 12%; }
    .item-price-col { text-align: right; width: 18%; }
    .item-total-col { text-align: right; width: 24%; }

    .item-name {
      font-size: 10px;
      line-height: 1.3;
      word-wrap: break-word;
      white-space: normal;
    }
    .item-discount {
      display: inline-block;
      font-size: 8px;
      color: #d32f2f;
      background: #fff0f0;
      padding: 1px 4px;
      border-radius: 2px;
      margin-top: 2px;
    }

    .item-qty, .item-price, .item-total {
      font-size: 10px;
      font-family: 'Courier New', monospace;
    }
    .item-total { font-weight: 600; }

    .totals { 
      margin: 8px 0 6px 0; 
      padding-top: 6px; 
      border-top: 1.5px solid #000; 
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10px;
    }
    .totals-row.total {
      font-size: 11.5px;
      font-weight: bold;
      margin-top: 7px;
      padding-top: 6px;
      border-top: 1.5px solid #000;
    }
    .totals-row .value { 
      font-weight: 600; 
      font-family: 'Courier New', monospace; 
    }

    .payment-info {
      margin: 8px 0;
      padding: 6px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .payment-info .totals-row { margin: 3px 0; }

    .thankyou { 
      text-align: center; 
      font-size: 11px; 
      font-weight: bold; 
      margin: 8px 0 5px 0; 
      letter-spacing: 0.8px;
    }

    .footer { 
      text-align: center; 
      margin-top: 8px; 
      padding-top: 6px; 
      border-top: 1px solid #000; 
      font-size: 8.2px; 
      color: #555; 
      line-height: 1.35;
    }

    .void-badge {
      color: #d32f2f;
      font-weight: bold;
      font-size: 11px;
      background: #fff0f0;
      padding: 3px 7px;
      display: inline-block;
      margin: 4px 0;
    }

    @media print {
      body { margin: 0; padding: 3mm; }
      @page { margin: 0; size: auto; }
      .item-discount, .void-badge { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">${settings?.companyName || 'AUTOPOS'}</div>
      <div class="store-info">${settings?.address || '123 Business Street'}</div>
      <div class="store-info">Tel: ${settings?.phone || '(555) 123-4567'}</div>
    </div>

    <div class="transaction-info">
      <p><strong>Receipt #:</strong> ${selectedTransaction.transactionNumber || selectedTransaction.id?.slice(-8) || 'N/A'}</p>
      <p><strong>Date:</strong> ${dateTime}</p>
      <p><strong>Cashier:</strong> ${selectedTransaction.cashierName || currentUser?.name || 'Staff'}</p>
      ${selectedTransaction.status === 'void' ? '<p><span class="void-badge">** VOIDED TRANSACTION **</span></p>' : ''}
      <p><strong>Customer:</strong> ${(selectedTransaction.customerName || 'Walk-in Customer').substring(0, 28)}</p>
      ${selectedTransaction.customerId ? `<p><strong>Customer ID:</strong> ${String(selectedTransaction.customerId).slice(-8)}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="item-name-col">Item</th>
          <th class="item-qty-col">Qty</th>
          <th class="item-price-col">Price</th>
          <th class="item-total-col">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
      const hasDiscount = item.discount > 0;
      const discountedPrice = item.unitPrice * (1 - (item.discount || 0) / 100);
      const currencySymbol = settings?.currency || '$';
      return `
            <tr>
              <td class="item-name-col">
                <div class="item-name">
                  ${item.name.substring(0, 32)}
                  ${hasDiscount ? `<div class="item-discount">-${item.discount}% (${currencySymbol}${discountedPrice.toFixed(2)} each)</div>` : ''}
                </div>
              </td>
              <td class="item-qty-col"><div class="item-qty">${item.quantity}</div></td>
              <td class="item-price-col">
                <div class="item-price">${currencySymbol} ${(item.unitPrice || 0).toFixed(2)}</div>
              </td>
              <td class="item-total-col">
                <div class="item-total">${currencySymbol} ${(item.total || 0).toFixed(2)}</div>
              </td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span class="label">Subtotal</span>
        <span class="value">${settings?.currency || '$'} ${subtotal.toFixed(2)}</span>
      </div>
      ${discountAmount > 0 ? `
        <div class="totals-row">
          <span class="label">Discount</span>
          <span class="value" style="color:#d32f2f;">${settings?.currency || '$'} -${discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span class="label">TOTAL</span>
        <span class="value">${settings?.currency || '$'} ${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <div class="totals-row">
        <span class="label">Payment Method</span>
        <span class="value" style="text-transform:uppercase;">${(selectedTransaction.paymentMethod || 'cash')}</span>
      </div>
      <div class="totals-row">
        <span class="label">Amount Paid</span>
        <span class="value">${settings?.currency || '$'} ${paid.toFixed(2)}</span>
      </div>
      ${change > 0 ? `
        <div class="totals-row">
          <span class="label">Change</span>
          <span class="value" style="color:#2e7d32;">${settings?.currency || '$'} ${change.toFixed(2)}</span>
        </div>
      ` : ''}
      ${due > 0 ? `
        <div class="totals-row">
          <span class="label">Due</span>
          <span class="value" style="color:#d32f2f;">${settings?.currency || '$'} ${due.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>

    <div class="thankyou">THANK YOU FOR YOUR BUSINESS!</div>

    <div class="footer">
      <div>No refunds without receipt • Return within 7 days</div>
      <div>${settings?.website || 'www.autopos.com'}</div>
      <div style="margin-top: 4px;">** Computer Generated Receipt **</div>
    </div>
  </div>
</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptHTML);
    iframeDoc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    const cleanup = () => {
      document.body.removeChild(iframe);
    };
    iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'void') {
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">VOID</span>;
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 border border-green-500/30">PAID</span>;
  };

  // Get selected branch name for display
  const selectedBranchName = useMemo(() => {
    if (branchId === 'all') return 'All Branches';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Select Branch';
  }, [branchId, branches]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">View all POS transactions and print receipts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && branches.length > 0 && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={() => refetchTransactions()} disabled={txLoading}>
            <Loader2 className={`h-4 w-4 mr-2 ${txLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Branch indicator for non-admin users */}
      {!isAdmin && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <span className="text-muted-foreground">Current Branch:</span>{' '}
          <span className="font-medium text-foreground">{selectedBranchName}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSort('date')}
            className={sortField === 'date' ? 'bg-muted' : ''}
          >
            Date <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSort('amount')}
            className={sortField === 'amount' ? 'bg-muted' : ''}
          >
            Amount <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      {txLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {search || statusFilter !== 'all' ? 'No matching transactions found' : 'No transactions yet'}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Receipt #</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Items</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Payment</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs font-semibold text-foreground">
                    {txn.transactionNumber || txn.id.slice(-8)}
                   </td>
                  <td className="p-3 text-foreground max-w-[150px] truncate">
                    {txn.customerName || 'Walk-in Customer'}
                   </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {txn.items?.length || 0} items
                   </td>
                  <td className="p-3 text-right font-semibold">
                    {settings?.currency || '$'} {(txn.total || 0).toFixed(2)}
                   </td>
                  <td className="p-3 text-xs capitalize">
                    {txn.paymentMethod || 'cash'}
                   </td>
                  <td className="p-3">
                    {getStatusBadge(txn.status)}
                   </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : '—'}
                   </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewReceipt(txn)}
                      className="h-8 w-8 p-0"
                      title="View & Print Receipt"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          
          <div ref={printRef} className="p-4 space-y-3 max-h-[70vh] overflow-auto">
            {selectedTransaction && (
              <>
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">{settings?.companyName || 'AUTOPOS'}</p>
                  <p className="text-xs text-muted-foreground">{settings?.address || '123 Business Street'}</p>
                  <p className="text-xs text-muted-foreground">Tel: {settings?.phone || '(555) 123-4567'}</p>
                  <div className="border-t border-dashed my-3" />
                  <p className="font-mono text-sm font-semibold">
                    {selectedTransaction.transactionNumber || selectedTransaction.id.slice(-8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : ''}
                  </p>
                  {selectedTransaction.status === 'void' && (
                    <p className="text-xs text-destructive font-semibold mt-1">** VOIDED **</p>
                  )}
                </div>

                <div className="border-t border-dashed" />
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Customer:</p>
                  <p className="text-sm text-foreground">{selectedTransaction.customerName || 'Walk-in Customer'}</p>
                </div>

                <div className="border-t border-dashed" />

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 text-muted-foreground">Item</th>
                      <th className="text-right py-1 text-muted-foreground">Qty</th>
                      <th className="text-right py-1 text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTransaction.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 text-foreground">
                          {item.name}
                          {item.discount > 0 && (
                            <span className="text-xs text-destructive ml-1">(-{item.discount}%)</span>
                          )}
                        </td>
                        <td className="text-right text-foreground">{item.quantity}</td>
                        <td className="text-right text-foreground">{settings?.currency || '$'} {(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed pt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{settings?.currency || '$'} {(selectedTransaction.items || []).reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}</span>
                  </div>
                  {selectedTransaction.discountAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Discount:</span>
                      <span>{settings?.currency || '$'} -{selectedTransaction.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1 border-t">
                    <span>TOTAL:</span>
                    <span>{settings?.currency || '$'} {(selectedTransaction.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="capitalize">{selectedTransaction.paymentMethod || 'cash'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>{settings?.currency || '$'} {(selectedTransaction.amountPaid || selectedTransaction.total || 0).toFixed(2)}</span>
                  </div>
                  {(() => {
                    const paid = selectedTransaction.amountPaid || selectedTransaction.total || 0;
                    const total = selectedTransaction.total || 0;
                    const due = total > paid ? total - paid : 0;
                    const change = paid > total ? paid - total : 0;
                    return (
                      <>
                        {change > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Change:</span>
                            <span>{settings?.currency || '$'} {change.toFixed(2)}</span>
                          </div>
                        )}
                        {due > 0 && (
                          <div className="flex justify-between text-destructive">
                            <span>Due:</span>
                            <span>{settings?.currency || '$'} {due.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="border-t border-dashed pt-3 text-center">
                  <p className="text-sm font-semibold">THANK YOU!</p>
                  <p className="text-[10px] text-muted-foreground mt-1">No refunds without original receipt</p>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button className="flex-1 gap-2" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}