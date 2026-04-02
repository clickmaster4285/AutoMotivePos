import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Product, Category } from '@/types';
import type { CentralizedProduct } from '@/api/centralizedProducts';

interface ProductFormData {
  centralizedProductId: string;
  stock: string;
  minStock: string;
  warehouseId: string;
  branchId: string;
}

interface ProductDialogsProps {
  dialogOpen: boolean;
  adjustDialogOpen: boolean;
  editingProduct: Product | null;
  adjustTarget: Product | null;
  form: ProductFormData;
  isAdmin: boolean;
  branches: any[];
  categories: Category[];
  centralizedProducts: CentralizedProduct[];
  branchWarehouses: any[];
  adjustQty: string;
  onDialogOpenChange: (open: boolean) => void;
  onAdjustDialogOpenChange: (open: boolean) => void;
  onFormChange: (form: ProductFormData) => void;
  onSave: () => void;
  onAdjust: () => void;
  onAdjustQtyChange: (qty: string) => void;
  getWarehousesForBranch: (branchId: string) => any[];
}

export function ProductDialogs({
  dialogOpen,
  adjustDialogOpen,
  editingProduct,
  adjustTarget,
  form,
  isAdmin,
  branches,
  categories,
  centralizedProducts,
  branchWarehouses,
  adjustQty,
  onDialogOpenChange,
  onAdjustDialogOpenChange,
  onFormChange,
  onSave,
  onAdjust,
  onAdjustQtyChange,
  getWarehousesForBranch,
}: ProductDialogsProps) {
  const selectedCentralized = centralizedProducts.find((p) => p.id === form.centralizedProductId);
  const availableCentralized = selectedCentralized?.totalStock ?? undefined;
  const currentBranchStock = adjustTarget?.stock ?? undefined;

  return (
    <>
      {/* Product Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingProduct ? 'Update product details and save.' : 'Enter product details to create a new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={form.branchId}
                    onValueChange={v => {
                      const nextWarehouses = getWarehousesForBranch(v);
                      onFormChange({
                        ...form,
                        branchId: v,
                        warehouseId: nextWarehouses[0]?.id || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Select
                  value={form.centralizedProductId || '__none'}
                  onValueChange={v => onFormChange({ ...form, centralizedProductId: v === '__none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select centralized product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select product...</SelectItem>
                    {centralizedProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.sku ? ` (${p.sku})` : ''}{typeof p.totalStock === 'number' ? ` — ${p.totalStock} available` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCentralized && (
                  <p className="text-xs text-muted-foreground">
                    Available in centralized stock:{' '}
                    <span className="font-mono text-foreground">{availableCentralized ?? '—'}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select
                  value={form.warehouseId}
                  onValueChange={v => onFormChange({ ...form, warehouseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branchWarehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial Stock (will be deducted from centralized)</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={e => onFormChange({ ...form, stock: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={e => onFormChange({ ...form, minStock: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onSave}>{editingProduct ? 'Update' : 'Add'} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={onAdjustDialogOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustTarget?.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Adjust the stock quantity for the selected product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Current stock: <span className="font-mono font-semibold text-foreground">{adjustTarget?.stock}</span>
            </p>
            {typeof (adjustTarget as any)?.centralizedTotalStock === 'number' && (
              <p className="text-sm text-muted-foreground">
                Centralized available:{' '}
                <span className="font-mono font-semibold text-foreground">
                  {(adjustTarget as any).centralizedTotalStock}
                </span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Adjustment (use negative to reduce)</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => onAdjustQtyChange(e.target.value)}
                placeholder="e.g. 10 or -5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}