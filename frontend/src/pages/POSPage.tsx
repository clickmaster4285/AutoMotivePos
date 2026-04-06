// src/pages/POSPage.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useCustomersQuery } from '@/hooks/useCustomers';
import { useCreateTransactionMutation } from '@/hooks/api/useTransactions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Receipt, Loader2 } from 'lucide-react';
import type { InvoiceItem, PaymentMethod, JobCard } from '@/types';
import type { Transaction } from '@/api/transaction';
import type { Product } from '@/api/product';
import { useJobCardsQuery, useUpdateJobCardStatusMutation } from '@/hooks/api/useJobCards';
import { useSettingsQuery } from '@/hooks/api/useSettings';
import { CustomerSelector } from '@/components/POS/CustomerSelector';
import { ProductGrid } from '@/components/POS/ProductGrid';
import { CompletedJobsList } from '@/components/POS/CompletedJobsList';
import { CartItem } from '@/components/POS/CartItem';
import { CartSummary } from '@/components/POS/CartSummary';
import { ReceiptDialog } from '@/components/POS/ReceiptDialog';
import { useReceiptPrint } from '@/components/POS/ReceiptPrint';

export default function POSPage() {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const { data: products = [], isLoading: productsLoading } = useProductsQuery();
  const { data: customers = [], isLoading: customersLoading } = useCustomersQuery();
  const createTransactionMutation = useCreateTransactionMutation();
  const { data: jobCards = [], isLoading: jobCardsLoading } = useJobCardsQuery();
  const updateJobCardStatusMutation = useUpdateJobCardStatusMutation();
  const { data: settings } = useSettingsQuery();
  const { printReceipt } = useReceiptPrint();

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
        : branches[0]?.id;
      if (fallback) setPosBranchId(fallback);
    }
  }, [branches, currentBranchId, posBranchId]);

  const branchProducts = useMemo(() => {
    if (!isAdmin) {
      return products.filter((p) => (p.stock ?? 0) > 0 && p.status === 'ACTIVE');
    }
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
    const product = branchProducts.find((p) => p.sku?.toLowerCase() === q);
    if (product) addProductItem(product.id);
    else toast({ title: 'Not found', description: 'No product with this SKU in this branch.', variant: 'destructive' });
    setBarcodeInput('');
  };

  const getJobTotal = (j: JobCard) => {
    const svcTotal = (j.services || []).reduce((s, sv) => s + sv.price, 0);
    const partTotal = (j.parts || []).reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    return svcTotal + partTotal;
  };

  const completedJobs = useMemo(() => {
    return jobCards
      .filter((j) => {
        const jobBranchId = j.branchId?._id || j.branchId;
        return j.status === 'completed' && (isAdmin ? jobBranchId === posBranchId : true);
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
  }, [jobCards, posBranchId, isAdmin]);

  const loadJobCardIntoSale = (job: JobCard) => {
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

  const handleCustomerSelect = (id: string, name: string) => {
    setCustomerId(id);
    setCustomerName(name);
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
    if (!lastTxn) return;
    
    printReceipt({
      transaction: lastTxn,
      items,
      customerName,
      customerId,
      subtotal,
      discountAmount: discountAmt,
      discountType,
      discountValue,
      total,
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || total,
      due,
      cashierName: currentUser?.name || 'Staff',
      settings,
      onPrintComplete: resetSale
    });
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
    setSearch('');
    setBarcodeInput('');
  };

  const filteredProducts = branchProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
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
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Completed Jobs</p>
            <CompletedJobsList
              jobs={completedJobs}
              onSelectJob={loadJobCardIntoSale}
              getJobTotal={getJobTotal}
            />
          </div>

          <ProductGrid
            products={filteredProducts}
            search={search}
            onSearchChange={setSearch}
            barcodeInput={barcodeInput}
            onBarcodeChange={setBarcodeInput}
            onBarcodeScan={handleBarcodeScan}
            onProductSelect={addProductItem}
            isLoading={productsLoading}
            currency={settings?.currency}
          />
        </div>

        <div className="lg:col-span-2 bg-card border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Current Sale</span>
              <span className="text-xs text-muted-foreground ml-auto">{items.length} items</span>
            </div>
            <CustomerSelector
              customers={branchCustomers}
              selectedCustomerId={customerId}
              selectedCustomerName={customerName}
              onCustomerSelect={handleCustomerSelect}
              branchId={posBranchId}
            />
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Add items to start
              </div>
            ) : (
              items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQty}
                  onUpdateDiscount={updateItemDiscount}
                  onRemove={removeItem}
                  currency={settings?.currency}
                />
              ))
            )}
          </div>

          <CartSummary
            subtotal={subtotal}
            discountAmount={discountAmt}
            total={total}
            due={due}
            discountType={discountType}
            discountValue={discountValue}
            paymentMethod={paymentMethod}
            amountPaid={amountPaid}
            onDiscountTypeChange={setDiscountType}
            onDiscountValueChange={setDiscountValue}
            onPaymentMethodChange={setPaymentMethod}
            onAmountPaidChange={setAmountPaid}
            onCheckout={handleCheckout}
            isCheckingOut={createTransactionMutation.isPending}
            hasItems={items.length > 0}
            branchId={posBranchId}
            currency={settings?.currency}
          />
        </div>
      </div>

      <ReceiptDialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) resetSale();
          setPreviewOpen(open);
        }}
        lastTransaction={lastTxn}
        items={items}
        customerName={customerName}
        subtotal={subtotal}
        discountAmount={discountAmt}
        total={total}
        due={due}
        paymentMethod={paymentMethod}
        onPrint={handlePrintAndReset}
         currency={settings?.currency}
      />
    </div>
  );
}