// src/components/pos/ProductGrid.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Loader2 } from 'lucide-react';
import type { Product } from '@/api/product';

interface ProductGridProps {
  products: Product[];
  search: string;
  onSearchChange: (value: string) => void;
  barcodeInput: string;
  onBarcodeChange: (value: string) => void;
  onBarcodeScan: () => void;
  onProductSelect: (productId: string) => void;
  isLoading?: boolean;
  currency?: string;
}

export function ProductGrid({
  products,
  search,
  onSearchChange,
  barcodeInput,
  onBarcodeChange,
  onBarcodeScan,
  onProductSelect,
  isLoading = false,
  currency
}: ProductGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1">
          <Input
            placeholder="SKU"
            value={barcodeInput}
            onChange={(e) => onBarcodeChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onBarcodeScan()}
            className="w-40"
          />
          <Button variant="outline" size="icon" onClick={onBarcodeScan}>
            <ScanBarcode className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Products</p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onProductSelect(p.id)}
                className="p-3 text-left bg-card border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-semibold text-primary">
                    {currency} {(p.price ?? 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.stock ?? 0} in stock</span>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}