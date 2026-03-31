import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Product, Category } from '@/types';

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  price: string;
  cost: string;
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
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={e => onFormChange({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={e => onFormChange({ ...form, sku: e.target.value })}
                />
              </div>
            </div>
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
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={v => onFormChange({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: Category) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={e => onFormChange({ ...form, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={e => onFormChange({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
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