// src/components/pos/ReceiptDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { Transaction } from '@/api/transaction';
import type { InvoiceItem } from '@/types';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastTransaction: Transaction | null;
  items: InvoiceItem[];
  customerName: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  due: number;
  paymentMethod: string;
  onPrint: () => void;
  currency?: string;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  lastTransaction,
  items,
  customerName,
  subtotal,
  discountAmount,
  total,
  due,
  paymentMethod,
  onPrint,
  currency
}: ReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sale recorded</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="text-center">
            <p className="font-bold text-foreground">AutoPOS Workshop</p>
            {lastTransaction?.transactionNumber && (
              <p className="text-sm font-mono text-foreground">{lastTransaction.transactionNumber}</p>
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
                  <td className="text-right text-foreground">{currency} {i.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>{currency} {subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>{currency} -{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span>{currency} {total.toFixed(2)}</span>
            </div>
            {due > 0 && (
              <div className="flex justify-between text-warning">
                <span>Outstanding</span>
                <span>{currency} {due.toFixed(2)}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground capitalize">Payment: {paymentMethod}</p>
          </div>
        </div>
        <Button className="w-full gap-2" onClick={onPrint}>
          <Printer className="h-4 w-4" /> Print & New Sale
        </Button>
      </DialogContent>
    </Dialog>
  );
}