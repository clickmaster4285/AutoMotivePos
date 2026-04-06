import { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useCustomersQuery } from '@/hooks/useCustomers';
import { useCreateTransactionMutation } from '@/hooks/api/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Receipt, ScanBarcode, Loader2 } from 'lucide-react';
import type { InvoiceItem, PaymentMethod, JobCard } from '@/types';
import type { Transaction } from '@/api/transaction';
import type { Product } from '@/api/product';
import { useJobCardsQuery, useUpdateJobCardStatusMutation } from '@/hooks/api/useJobCards';
import { useSettingsQuery, useUpdateSettingsMutation } from "@/hooks/api/useSettings";


export default function POSPage() {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const { data: products = [], isLoading: productsLoading } = useProductsQuery();


  
  const { data: customers = [], isLoading: customersLoading } = useCustomersQuery();
  const createTransactionMutation = useCreateTransactionMutation();
  const { data: jobCards = [], isLoading: jobCardsLoading } = useJobCardsQuery();
  const updateJobCardStatusMutation = useUpdateJobCardStatusMutation();


  const { data: settings, isLoading, refetch } = useSettingsQuery();
  
  
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';
  const [posBranchId, setPosBranchId] = useState(currentBranchId || '');

  useEffect(() => {
    if (!isAdmin && currentBranchId) {
      setPosBranchId(currentBranchId);
    }
  }, [isAdmin, currentBranchId]);

  useEffect(() => {
    if (!branches.length) return;
    const has = branches.some((b) => b.id === posBranchId);
    if (!has) {
      const fallback = currentBranchId && branches.some((b) => b.id === currentBranchId)
        ? currentBranchId
        : branches[0].id;
      setPosBranchId(fallback);
    }
  }, [branches, currentBranchId, posBranchId]);

const branchProducts = useMemo(() => {
  if (!isAdmin) {
    // ✅ NON ADMIN → SHOW ALL PRODUCTS
    return products.filter(
      (p) => (p.stock ?? 0) > 0 && p.status === 'ACTIVE'
    );
  }

  // ✅ ADMIN → FILTER BY BRANCH
  return products.filter(
    (p) =>
      p.branch_id === posBranchId &&
      (p.stock ?? 0) > 0 &&
      p.status === 'ACTIVE'
  );
}, [products, posBranchId, isAdmin]);
  
  
  const branchCustomers = useMemo(
    () => customers.filter((c) => !c.branch_id || c.branch_id === posBranchId),
    [customers, posBranchId]
  );

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastTxn, setLastTxn] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const maxQtyForLine = (line: InvoiceItem): number => {
    if (line.type !== 'product' || !line.productId) return 9999;
    const p = productById.get(line.productId);
    return p?.stock ?? 0;
  };

  const addProductItem = (productId: string) => {
    setSelectedJobCardId(null);
    const product = branchProducts.find((p) => p.id === productId);
    if (!product) return;
    const existing = items.find((i) => i.productId === product.id && i.type === 'product');
    if (existing) {
      const cap = product.stock ?? 0;
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== existing.id) return i;
          const nextQty = Math.min(cap, i.quantity + 1);
          return {
            ...i,
            quantity: nextQty,
            total: nextQty * i.unitPrice * (1 - i.discount / 100),
          };
        })
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: uuid(),
          type: 'product',
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price ?? 0,
          discount: 0,
          total: product.price ?? 0,
        },
      ]);
    }
  };

  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    const q = barcodeInput.trim().toLowerCase();
    const product = branchProducts.find((p) => p.sku.toLowerCase() === q);
    if (product) addProductItem(product.id);
    else toast({ title: 'Not found', description: 'No product with this SKU in this branch.', variant: 'destructive' });
    setBarcodeInput('');
  };

  const addServiceItem = (svc: { name: string; price: number }) => {
    setSelectedJobCardId(null);
    setItems((prev) => [
      ...prev,
      {
        id: uuid(),
        type: 'service',
        name: svc.name,
        quantity: 1,
        unitPrice: svc.price,
        discount: 0,
        total: svc.price,
      },
    ]);
  };

  const getJobTotal = (j: JobCard) => {
    const svcTotal = (j.services || []).reduce((s, sv) => s + sv.price, 0);
    const partTotal = (j.parts || []).reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    return svcTotal + partTotal;
  };
const completedJobs = useMemo(() => {
  const filtered = jobCards
    .filter((j) => {
      const jobBranchId = j.branchId?._id || j.branchId;

      // ✅ Only include jobs with status "completed"
      return j.status === 'completed' && (isAdmin ? jobBranchId === posBranchId : true);
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    );

  return filtered;
}, [jobCards, posBranchId, isAdmin]);
  
  const loadJobCardIntoSale = (job: JobCard) => {
    // Pre-check stock for parts to avoid checkout failure after user selects the job.
    for (const part of job.parts || []) {
      const cap = productById.get(part.productId)?.stock ?? 0;
      if (cap < part.quantity) {
        toast({
          title: 'Insufficient stock for parts',
          description: `${job.jobNumber}: ${part.productName} requested ${part.quantity}, available ${cap}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setItems(() => {
      const next: InvoiceItem[] = [];

      for (const svc of job.services || []) {
        next.push({
          id: uuid(),
          type: 'service',
          name: svc.name,
          quantity: 1,
          unitPrice: svc.price,
          discount: 0,
          total: svc.price,
        });
      }

      for (const part of job.parts || []) {
        next.push({
          id: uuid(),
          type: 'product',
          productId: part.productId,
          name: part.productName,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          discount: 0,
          total: part.quantity * part.unitPrice,
        });
      }

      return next;
    });

setCustomerId(job.customerId?._id || job.customerId || '');
    setCustomerName(job.customerName || '');
    setDiscountValue('0');
    setAmountPaid('');
    setPreviewOpen(false);
    setLastTxn(null);
    setSelectedJobCardId(job.id);
  };

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const cap = maxQtyForLine(i);
        const newQty = Math.max(1, Math.min(cap, i.quantity + delta));
        return { ...i, quantity: newQty, total: newQty * i.unitPrice * (1 - i.discount / 100) };
      })
    );
  };

  const updateItemDiscount = (id: string, disc: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const d = Math.min(100, Math.max(0, disc));
        return { ...i, discount: d, total: i.quantity * i.unitPrice * (1 - d / 100) };
      })
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmt =
    discountType === 'percentage'
      ? (subtotal * (parseFloat(discountValue) || 0)) / 100
      : parseFloat(discountValue) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const paid = parseFloat(amountPaid) || total;
  const due = Math.max(0, total - paid);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const c = branchCustomers.find((x) => x.id === id);
    if (c) setCustomerName(c.name);
  };

const handleCheckout = async () => {
  if (items.length === 0 || !posBranchId) return;
  try {
    const txn = await createTransactionMutation.mutateAsync({
      branchId: posBranchId,
      customerId: customerId || undefined,
      customerName: customerName || 'Walk-in Customer',
      items: items.map((i) => {
        const base = {
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount || 0,
        };
        if (i.type === 'product' && i.productId) return { ...base, productId: i.productId };
        return base;
      }),
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || total,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
    });

    setLastTxn(txn);
    setPreviewOpen(true);

    // ✅ Always mark job card as paid if selected
    if (selectedJobCardId) {
      try {
        await updateJobCardStatusMutation.mutateAsync({
          id: selectedJobCardId,
          status: 'paid',
        });
      } catch (e) {
        toast({
          title: 'Job status update failed',
          description: e instanceof Error ? e.message : 'Could not mark job as paid',
          variant: 'destructive',
        });
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Checkout failed';
    toast({ title: 'Checkout failed', description: message, variant: 'destructive' });
  }
};


const handlePrintAndReset = () => {
  const printContent = printRef.current;
  if (!printContent) return;

  // Get current date/time for receipt
  const now = new Date();
  const dateTime = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate totals
  const subtotalAmount = subtotal;
  const discountAmount = discountAmt;
  const totalAmount = total;
  const paidAmount = parseFloat(amountPaid) || totalAmount;
  const changeAmount = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const dueAmount = due;

  // Build receipt HTML
  const receiptHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Receipt</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 9px; width: 58mm; margin: 0 auto; padding: 2mm 1mm; background: white; }
      .receipt { width: 100%; }
      .header { text-align: center; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #000; }
      .store-name { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
      .store-info { font-size: 8px; line-height: 1.2; }
      .transaction-info, .customer-info { margin: 6px 0; padding: 3px 0; }
      .transaction-info p, .customer-info p { margin: 2px 0; }
      .items-table { width: 100%; margin: 6px 0; border-collapse: collapse; }
      .items-table th { 
        font-size: 8px; 
        padding: 4px 0; 
        border-bottom: 1px solid #000; 
        text-align: center;
      }
      .items-table td { 
        font-size: 8px; 
        padding: 4px 0; 
        border-bottom: 1px solid #eee;
        vertical-align: top;
      }
      .item-name { max-width: 70px; word-wrap: break-word; text-align: left; }
      .item-qty { text-align: center; width: 30px; }
      .item-price { text-align: right; width: 35px; }
      .item-total { text-align: right; width: 40px; }
      .totals { margin: 6px 0; padding-top: 4px; border-top: 1px solid #000; }
      .totals-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 8px; }
      .totals-row.total { font-size: 9px; font-weight: bold; margin-top: 5px; padding-top: 4px; border-top: 1px solid #000; }
      .payment-info { margin: 6px 0; padding: 6px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
      .footer { text-align: center; margin-top: 6px; padding-top: 4px; border-top: 1px solid #000; font-size: 7px; }
      .thankyou { text-align: center; font-size: 9px; font-weight: bold; margin: 8px 0 5px 0; }
      @media print { body { margin: 0; padding: 2mm 1mm; } @page { margin: 0; size: auto; } }
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
        <p><strong>Receipt #:</strong> ${lastTxn?.transactionNumber || 'N/A'}</p>
        <p><strong>Date:</strong> ${dateTime}</p>
        <p><strong>Cashier:</strong> ${currentUser?.name?.substring(0, 15) || 'Staff'}</p>

          <p><strong>Customer:</strong> ${(customerName || 'Walk-in Customer').substring(0, 25)}</p>
        ${customerId ? `<p><strong>ID:</strong> ${String(customerId).substring(0, 15)}</p>` : ''}
      </div>


      <table class="items-table">
        <thead>
          <tr>
            <th class="item-name">Item</th>
            <th class="item-qty">Qty</th>
            <th class="item-price">Price</th>
            <th class="item-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td class="item-name">
                ${item.name.substring(0, 22)}
                ${item.discount > 0 ? `<br/><span style="font-size: 7px; color:#d32f2f;">-${item.discount}% off</span>` : ''}
              </td>
              <td class="item-qty">${item.quantity}</td>
              <td class="item-price">${item.unitPrice.toFixed(2)}</td>
              <td class="item-total">${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span>Subtotal:</span><span>${subtotalAmount.toFixed(2)}</span></div>
       ${discountAmount > 0 ? `<div class="totals-row"><span>Discount ${discountType === 'percentage' ? `(${parseFloat(discountValue) || 0}%)` : ''}</span><span style="color:#d32f2f;">-${discountAmount.toFixed(2)}</span></div>` : ''}
        <div class="totals-row total"><span>TOTAL:</span><span>${totalAmount.toFixed(2)}</span></div>
      </div>

      <div class="payment-info">
        <div class="totals-row"><span>Payment Method:</span><span>${paymentMethod.toUpperCase()}</span></div>
        <div class="totals-row"><span>Amount Paid:</span><span>${paidAmount.toFixed(2)}</span></div>
        ${changeAmount > 0 ? `<div class="totals-row"><span>Change:</span><span style="color:#2e7d32;">${changeAmount.toFixed(2)}</span></div>` : ''}
        ${dueAmount > 0 ? `<div class="totals-row" style="color: #d32f2f; font-weight: bold;"><span>Outstanding Due:</span><span>${dueAmount.toFixed(2)}</span></div>` : ''}
      </div>

      <div class="thankyou">THANK YOU FOR SHOPPING!</div>

      <div class="footer">
        <div>No refunds or exchanges without receipt</div>
        <div>Items must be returned within 7 days</div>
        <div>Visit us: www.autopos.com</div>
        <div style="margin-top: 4px;">** This is a computer generated receipt **</div>
      </div>
    </div>
  </body>
  </html>
`;

  // Create a hidden iframe for printing
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

  // Print once and reset after printing (even if canceled)
  const cleanup = () => {
    document.body.removeChild(iframe);
    resetSale();
  };

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
};
  
const resetSale = () => {
  setItems([]);
  setSelectedJobCardId(null);
  setCustomerId('');
  setCustomerName('');
  setDiscountValue('0');
  setAmountPaid('');
  setPreviewOpen(false);
  setLastTxn(null);
  setSearch(''); // Clear search field
  setBarcodeInput(''); // Clear barcode input field
};

  const filteredProducts = branchProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const dataLoading = productsLoading || customersLoading || jobCardsLoading;

  return (
    <div className="animate-fade-in h-[calc(100vh-5rem)]">
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <p className="page-subtitle">Sales post to the transaction API and update inventory</p>
        </div>
        {isAdmin && branches.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-64">
            <Label className="text-xs whitespace-nowrap text-muted-foreground">Branch</Label>
            <Select value={posBranchId} onValueChange={setPosBranchId}>
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
      </div>

      {dataLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading products and customers…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100%-4rem)]">
        <div className="lg:col-span-3 space-y-3 overflow-auto">
          <div className="flex gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              <Input
                placeholder="SKU"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                className="w-40"
              />
              <Button variant="outline" size="icon" onClick={handleBarcodeScan}>
                <ScanBarcode className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Completed Jobs</p>
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {completedJobs.length === 0 ? (
                <div className="text-center py-3 text-xs text-muted-foreground">No completed jobs</div>
              ) : (
                completedJobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => loadJobCardIntoSale(j)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{j.jobNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{j.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{j.vehicleName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">${getJobTotal(j).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Pay & Checkout</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProductItem(p.id)}
                  className="p-3 text-left bg-card border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-semibold text-primary">
                      ${(p.price ?? 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.stock ?? 0} in stock</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Current Sale</span>
              <span className="text-xs text-muted-foreground ml-auto">{items.length} items</span>
            </div>
            <Select value={customerId || '__walkin'} onValueChange={(v) => (v === '__walkin' ? (setCustomerId(''), setCustomerName('')) : handleCustomerSelect(v))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__walkin">Walk-in Customer</SelectItem>
                {branchCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Add items to start
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{item.type}</span>
                      {item.discount > 0 && <span className="text-destructive">-{item.discount}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    type="number"
                    className="w-12 h-6 text-[10px] text-center"
                    placeholder="%"
                    value={item.discount || ''}
                    onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                  />
                  <span className="font-mono text-xs w-16 text-right">${item.total.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">$</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                className="h-8 text-xs"
                placeholder="Invoice Discount"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>

            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Bank Transfer</SelectItem>
           
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label className="text-xs">Amount Paid</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                placeholder={`Full: $${total.toFixed(2)}`}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-${discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {due > 0 && (
                <div className="flex justify-between text-warning text-xs">
                  <span>Outstanding</span>
                  <span>${due.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => void handleCheckout()}
              disabled={items.length === 0 || !posBranchId || createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing…
                </>
              ) : (
                <>Checkout — ${total.toFixed(2)}</>
              )}
            </Button>
          </div>
        </div>
      </div>

    <Dialog open={previewOpen} onOpenChange={(open) => {
  if (!open) {
    // When dialog is closed without printing, still reset
    resetSale();
  }
  setPreviewOpen(open);
}}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Sale recorded</DialogTitle>
    </DialogHeader>
    <div ref={printRef} className="space-y-3 py-2">
      <div className="text-center">
        <p className="font-bold text-foreground">AutoPOS Workshop</p>
        {lastTxn?.transactionNumber && (
          <p className="text-sm font-mono text-foreground">{lastTxn.transactionNumber}</p>
        )}
        <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
      </div>
      <div className="border-t border-dashed" />
      <p className="text-sm text-foreground">Customer: {customerName || 'Walk-in'}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 text-muted-foreground">Item</th>
            <th className="text-right py-1 text-muted-foreground">Qty</th>
            <th className="text-right py-1 text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td className="py-1 text-foreground">{i.name}</td>
              <td className="text-right text-foreground">{i.quantity}</td>
              <td className="text-right text-foreground">${i.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-dashed pt-2 space-y-1 text-sm">
        <div className="flex justify-between text-foreground">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-destructive">
            <span>Discount</span>
            <span>-${discountAmt.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {due > 0 && (
          <div className="flex justify-between text-warning">
            <span>Outstanding</span>
            <span>${due.toFixed(2)}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground capitalize">Payment: {paymentMethod}</p>
      </div>
    </div>
    <Button className="w-full gap-2" onClick={handlePrintAndReset}>
      <Printer className="h-4 w-4" /> Print & New Sale
    </Button>
  </DialogContent>
</Dialog>
    </div>
  );
}
