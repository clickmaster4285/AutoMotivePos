// src/components/pos/CartSummary.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { PaymentMethod } from '@/types';

interface CartSummaryProps {
  subtotal: number;
  discountAmount: number;
  total: number;
  due: number;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  paymentMethod: PaymentMethod;
  amountPaid: string;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
  onDiscountValueChange: (value: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountPaidChange: (value: string) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
  hasItems: boolean;
  branchId?: string;
  currency?: string;

}

export function CartSummary({
  subtotal,
  discountAmount,
  total,
  due,
  discountType,
  discountValue,
  paymentMethod,
  amountPaid,
  onDiscountTypeChange,
  onDiscountValueChange,
  onPaymentMethodChange,
  onAmountPaidChange,
  onCheckout,
  isCheckingOut,
  hasItems,
  branchId,
  currency,
}: CartSummaryProps) {
  return (
    <div className="p-4 border-t space-y-3">
      <div className="flex gap-2">
        <Select value={discountType} onValueChange={(v) => onDiscountTypeChange(v as 'percentage' | 'fixed')}>
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">%</SelectItem>
            <SelectItem value="fixed">{currency || '$'}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          className="h-8 text-xs"
          placeholder="Invoice Discount"
          value={discountValue}
          onChange={(e) => onDiscountValueChange(e.target.value)}
        />
      </div>

      <Select value={paymentMethod} onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}>
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
          placeholder={`Full: ${currency} ${total.toFixed(2)}`}
          value={amountPaid}
          onChange={(e) => onAmountPaidChange(e.target.value)}
        />
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-destructive">
            <span>Discount</span>
            <span>{currency} -{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t">
          <span>Total</span>
          <span>{currency} {total.toFixed(2)}</span>
        </div>
        {due > 0 && (
          <div className="flex justify-between text-warning text-xs">
            <span>Outstanding</span>
            <span>{currency} {due.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        onClick={onCheckout}
        disabled={!hasItems || !branchId || isCheckingOut}
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing…
          </>
        ) : (
          <>Checkout — {currency} {total.toFixed(2)}</>
        )}
      </Button>
    </div>
  );
}