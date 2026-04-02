import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({
  products,
  isLoading,
  canEdit,
  canDelete,
  onEdit,
  onAdjust,
  onDelete,
}: ProductTableProps) {
  
  if (isLoading) {
    return (
      <div className="table-container p-12 text-center text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
        Loading inventory...
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left p-3 font-medium text-muted-foreground">SKU</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Cost</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
              {(canEdit || canDelete) && (
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={canEdit || canDelete ? 7 : 6} className="p-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No products found
                </td>
              </tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{p.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {(p as any).categoryName || '—'}
                    </span>
                  </td>
                  <td className="p-3 text-right text-muted-foreground font-mono text-xs">
                    {(p as any).cost != null ? `$${(p as any).cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-medium text-foreground font-mono text-xs">
                    ${(p.price ?? 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono text-xs ${(p.stock ?? 0) <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {(p.stock ?? 0) <= 0 && <AlertTriangle className="h-3 w-3" />}
                      {p.stock ?? 0}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onAdjust(p)}
                            >
                              <Package className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onDelete(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}