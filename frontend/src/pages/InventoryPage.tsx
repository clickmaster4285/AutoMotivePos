import { useState, useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdjustProductStockMutation,
} from '@/hooks/api/useProducts';
import { useCategoriesQuery } from '@/hooks/useCategories';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Package, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Product, Category } from '@/types';

export default function InventoryPage() {
  const { currentUser, categories: localCategories, warehouses: localWarehouses, currentBranchId } = useAppState();
  const productsQuery = useProductsQuery();
  const categoriesQuery = useCategoriesQuery();
  const warehousesQuery = useWarehousesQuery();
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const adjustProductStockMutation = useAdjustProductStockMutation();
  const products = productsQuery.data ?? [];
  const categories = (categoriesQuery.data && categoriesQuery.data.length > 0)
    ? categoriesQuery.data
    : localCategories;
  const warehouses = (warehousesQuery.data && warehousesQuery.data.length > 0)
    ? warehousesQuery.data
    : localWarehouses;
  const canCreate = canPerformAction(currentUser, 'inventory', 'create');
  const canEdit = canPerformAction(currentUser, 'inventory', 'edit');
  const canDelete = canPerformAction(currentUser, 'inventory', 'delete');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      .filter(p => catFilter === 'all' || (p as any).categoryId === catFilter);
  }, [products, search, catFilter]);

  const branchWarehouses = warehouses.filter((w: any) =>
    // backend warehouses may not have branch info; fall back to all
    !('branchId' in w) || !currentBranchId ? true : w.branchId === currentBranchId
  );

  const [form, setForm] = useState({
    name: '', sku: '', category: '', price: '', cost: '',
    stock: '', minStock: '5', warehouseId: '',
  });

  const openCreate = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      sku: '',
      category: categories[0]?.id || '',
      price: '',
      cost: '',
      stock: '',
      minStock: '5',
      warehouseId: branchWarehouses[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: (p as any).categoryId || categories[0]?.id || '',
      price: String(p.price ?? 0),
      cost: String((p as any).cost ?? p.price ?? 0),
      stock: String(p.stock ?? 0),
      minStock: '5',
      warehouseId: branchWarehouses[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const body = {
      name: form.name,
      sku: form.sku,
      description: undefined,
      categoryId: form.category,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      status: "ACTIVE" as const,
    };
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, body });
    } else {
      await createProductMutation.mutateAsync(body);
    }
    setDialogOpen(false);
  };

  const handleAdjust = async () => {
    if (adjustTarget && adjustQty) {
      const current = adjustTarget.stock ?? 0;
      const delta = parseInt(adjustQty);
      const nextStock = current + (isNaN(delta) ? 0 : delta);
      await adjustProductStockMutation.mutateAsync({ id: adjustTarget.id, stock: nextStock });
      setAdjustDialogOpen(false);
      setAdjustQty('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Manage parts and products</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: Category) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {productsQuery.isLoading || categoriesQuery.isLoading || warehousesQuery.isLoading ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Loading inventory...
        </div>
      ) : (
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
                {(canEdit || canDelete) && <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={canEdit || canDelete ? 7 : 6} className="p-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />No products found
                </td></tr>
              ) : filteredProducts.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{p.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{(p as any).categoryId || '—'}</span></td>
                  <td className="p-3 text-right text-muted-foreground font-mono text-xs">
                    {(p as any).cost != null ? `$${(p as any).cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-medium text-foreground font-mono text-xs">${(p.price ?? 0).toFixed(2)}</td>
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAdjustTarget(p); setAdjustDialogOpen(true); }}>
                              <Package className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteProductMutation.mutate(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingProduct ? 'Update product details and save.' : 'Enter product details to create a new product.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: Category) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={form.warehouseId} onValueChange={v => setForm(f => ({ ...f, warehouseId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{branchWarehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Cost</Label><Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Min Stock</Label><Input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editingProduct ? 'Update' : 'Add'} Product</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustTarget?.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Adjust the stock quantity for the selected product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">Current stock: <span className="font-mono font-semibold text-foreground">{adjustTarget?.stock}</span></p>
            <div className="space-y-2">
              <Label>Adjustment (use negative to reduce)</Label>
              <Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. 10 or -5" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdjust}>Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
