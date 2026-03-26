import { useState, useMemo, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Receipt, ScanBarcode } from 'lucide-react';
import type { InvoiceItem, PaymentMethod } from '@/types';

const servicePresets = [
  { name: 'Oil Change', price: 45 },
  { name: 'Brake Inspection', price: 30 },
  { name: 'Tire Rotation', price: 25 },
  { name: 'Engine Diagnostics', price: 80 },
  { name: 'AC Service', price: 120 },
  { name: 'Alignment', price: 75 },
];

export default function POSPage() {
  const { products, customers, currentBranchId, addInvoice } = useStore();
  const branchProducts = products.filter(p => p.branchId === currentBranchId && p.stock > 0);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const addProductItem = (productId: string) => {
    const product = branchProducts.find(p => p.id === productId);
    if (!product) return;
    const existing = items.find(i => i.name === product.name && i.type === 'product');
    if (existing) {
      setItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setItems(prev => [...prev, { id: uuid(), type: 'product', name: product.name, quantity: 1, unitPrice: product.price, discount: 0, total: product.price }]);
    }
  };

  const handleBarcodeScan = () => {
    if (!barcodeInput) return;
    const product = branchProducts.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
    if (product) addProductItem(product.id);
    setBarcodeInput('');
  };

  const addServiceItem = (svc: { name: string; price: number }) => {
    setItems(prev => [...prev, { id: uuid(), type: 'service', name: svc.name, quantity: 1, unitPrice: svc.price, discount: 0, total: svc.price }]);
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty, total: newQty * i.unitPrice * (1 - i.discount / 100) };
    }));
  };

  const updateItemDiscount = (id: string, disc: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const d = Math.min(100, Math.max(0, disc));
      return { ...i, discount: d, total: i.quantity * i.unitPrice * (1 - d / 100) };
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmt = discountType === 'percentage' ? subtotal * (parseFloat(discountValue) || 0) / 100 : parseFloat(discountValue) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const paid = parseFloat(amountPaid) || total;
  const due = Math.max(0, total - paid);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const c = customers.find(c => c.id === id);
    if (c) setCustomerName(c.name);
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    const status = due > 0 ? (paid > 0 ? 'partial' : 'unpaid') : 'paid';
    addInvoice({
      customerId: customerId || undefined,
      customerName: customerName || 'Walk-in Customer',
      branchId: currentBranchId,
      items,
      subtotal,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      discountAmount: discountAmt,
      total,
      amountPaid: Math.min(paid, total),
      amountDue: due,
      paymentMethod,
      status: status as 'paid' | 'unpaid' | 'partial',
    });
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '', 'width=400,height=600');
    if (win) {
      win.document.write(`<html><head><title>Invoice</title><style>body{font-family:monospace;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}td,th{padding:4px 0;text-align:left}th{border-bottom:1px dashed #000}.right{text-align:right}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}</style></head><body>${printContent.innerHTML}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  const resetSale = () => {
    setItems([]); setCustomerId(''); setCustomerName('');
    setDiscountValue('0'); setAmountPaid(''); setPreviewOpen(false);
  };

  const filteredProducts = branchProducts.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in h-[calc(100vh-5rem)]">
      <div className="page-header">
        <h1 className="page-title">Point of Sale</h1>
        <p className="page-subtitle">Create invoices and process payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100%-4rem)]">
        <div className="lg:col-span-3 space-y-3 overflow-auto">
          <div className="flex gap-2">
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
            <div className="flex gap-1">
              <Input placeholder="Barcode / SKU" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()} className="w-40" />
              <Button variant="outline" size="icon" onClick={handleBarcodeScan}><ScanBarcode className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Quick Services</p>
            <div className="flex flex-wrap gap-2">
              {servicePresets.map(svc => (
                <Button key={svc.name} variant="outline" size="sm" className="text-xs gap-1" onClick={() => addServiceItem(svc)}>
                  <Plus className="h-3 w-3" />{svc.name} — ${svc.price}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addProductItem(p.id)}
                  className="p-3 text-left bg-card border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-semibold text-primary">${p.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{p.stock} in stock</span>
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
            <Select value={customerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Walk-in Customer" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />Add items to start
              </div>
            ) : items.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{item.type}</span>
                    {item.discount > 0 && <span className="text-destructive">-{item.discount}%</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <Input type="number" className="w-12 h-6 text-[10px] text-center" placeholder="%" value={item.discount || ''}
                  onChange={e => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)} />
                <span className="font-mono text-xs w-16 text-right">${item.total.toFixed(2)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={v => setDiscountType(v as 'percentage' | 'fixed')}>
                <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">$</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" className="h-8 text-xs" placeholder="Invoice Discount" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>

            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Bank Transfer</SelectItem>
                <SelectItem value="split">Split Payment</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label className="text-xs">Amount Paid</Label>
              <Input type="number" className="h-8 text-xs" placeholder={`Full: $${total.toFixed(2)}`}
                value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-${discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
              {due > 0 && <div className="flex justify-between text-warning text-xs"><span>Outstanding</span><span>${due.toFixed(2)}</span></div>}
            </div>

            <Button className="w-full" onClick={handleCheckout} disabled={items.length === 0}>
              Checkout — ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invoice Created ✓</DialogTitle></DialogHeader>
          <div ref={printRef} className="space-y-3 py-2">
            <div className="text-center">
              <p className="font-bold text-foreground">AutoPOS Workshop</p>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
            </div>
            <div className="border-t border-dashed" />
            <p className="text-sm text-foreground">Customer: {customerName || 'Walk-in'}</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-1 text-muted-foreground">Item</th><th className="text-right py-1 text-muted-foreground">Qty</th><th className="text-right py-1 text-muted-foreground">Total</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}><td className="py-1 text-foreground">{i.name}</td><td className="text-right text-foreground">{i.quantity}</td><td className="text-right text-foreground">${i.total.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed pt-2 space-y-1 text-sm">
              <div className="flex justify-between text-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-${discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-foreground"><span>Total</span><span>${total.toFixed(2)}</span></div>
              {due > 0 && <div className="flex justify-between text-warning"><span>Outstanding</span><span>${due.toFixed(2)}</span></div>}
              <p className="text-xs text-muted-foreground capitalize">Payment: {paymentMethod}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}><Printer className="h-4 w-4" /> Print</Button>
            <Button className="flex-1" onClick={resetSale}>New Sale</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
