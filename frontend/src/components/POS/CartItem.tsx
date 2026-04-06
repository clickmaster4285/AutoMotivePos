// src/components/pos/CartItem.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/types';

interface CartItemProps {
  item: InvoiceItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
  currency?:(id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onUpdateDiscount, onRemove ,currency}: CartItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{item.type}</span>
          {item.discount > 0 && <span className="text-destructive">-{item.discount}%</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, -1)}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, 1)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <Input
        type="number"
        className="w-12 h-6 text-[10px] text-center"
        placeholder="%"
        value={item.discount || ''}
        onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
      />
      <span className="font-mono text-xs w-16 text-right">{currency} {item.total.toFixed(2)}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemove(item.id)}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}