// pages/CentralizedProductsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCentralizedProducts,
  createCentralizedProduct,
  updateCentralizedProduct,
  deleteCentralizedProduct,
  CentralizedProduct,
} from '@/api/centralizedProducts';
import { useCategoriesQuery } from '@/hooks/useCategories';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { canPerformAction } from '@/lib/permissions';
import { useSuppliersQuery } from '@/hooks/api/useSuppliers';

export default function CentralizedProductsPage() {
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const categoriesQuery = useCategoriesQuery();
  const warehousesQuery = useWarehousesQuery();
  const suppliersQuery = useSuppliersQuery();
  const categories = categoriesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const [products, setProducts] = useState<CentralizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CentralizedProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    mainWarehouse: '',
    supplier_id: '',
    price: 0,
    cost: 0,
    totalStock: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const canCreate = canPerformAction(currentUser, 'centralized_products', 'create');
  const canEdit = canPerformAction(currentUser, 'centralized_products', 'update');
  const canDelete = canPerformAction(currentUser, 'centralized_products', 'delete');
  // Fetch products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchCentralizedProducts();
      setProducts(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate SKU
  const generateSKU = (name: string) => {
    if (!name.trim()) return '';
    let sku = `SKU-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
    let counter = 1;
    while (products.some(p => p.sku === sku && (!editing || p.id !== editing.id))) {
      sku = `SKU-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}${counter}`;
      counter++;
    }
    return sku;
  };

  const handleNameChange = (value: string) => {
    setForm(f => ({
      ...f,
      name: value,
      sku: (!f.sku || f.sku.startsWith('SKU-')) ? generateSKU(value) : f.sku,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    const defaultCategory = categories[0]?.id || '';
    const defaultWarehouse = warehouses[0]?.id || '';
    setForm({
      name: '',
      sku: '',
      category: defaultCategory,
      mainWarehouse: defaultWarehouse,
      supplier_id: '',
      price: 0,
      cost: 0,
      totalStock: 0,
      status: 'ACTIVE',
    });
    setDialogOpen(true);
  };

  const openEdit = (p: CentralizedProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.categoryId || '',
      mainWarehouse: p.mainWarehouseId || '',
      supplier_id: p.supplierId || '',
      price: p.price || 0,
      cost: p.cost || 0,
      totalStock: p.totalStock || 0,
      status: p.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast({ title: 'Validation', description: 'Name required', variant: 'destructive' });
    if (!form.sku.trim()) return toast({ title: 'Validation', description: 'SKU required', variant: 'destructive' });
    if (!form.category) return toast({ title: 'Validation', description: 'Category required', variant: 'destructive' });
    if (!form.mainWarehouse) return toast({ title: 'Validation', description: 'Main warehouse required', variant: 'destructive' });
    setSubmitting(true);
    try {
      if (editing) {
        await updateCentralizedProduct(editing.id, form);
        toast({ title: 'Updated', description: 'Product updated successfully' });
      } else {
        await createCentralizedProduct(form);
        toast({ title: 'Created', description: 'Product created successfully' });
      }
      setDialogOpen(false);
      await loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteCentralizedProduct(id);
      toast({ title: 'Deleted', description: 'Product deleted successfully' });
      await loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Centralized Products</h1>
        {canCreate && <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Product</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center p-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground">No products found</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 text-left font-medium">SKU</th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Category</th>
              <th className="p-3 text-left font-medium">Main Warehouse</th>
              <th className="p-3 text-left font-medium">Price</th>
              <th className="p-3 text-left font-medium">Cost</th>
              <th className="p-3 text-left font-medium">Total Stock</th>
              <th className="p-3 text-left font-medium">Status</th>
              {(canEdit || canDelete) && <th className="p-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono">{p.sku}</td>
                <td className="p-3 flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" />{p.name}</td>
                <td className="p-3">{p.categoryName || (p.categoryId ? categoryNameById.get(p.categoryId) : '-') || '-'}</td>
                <td className="p-3">{p.mainWarehouseName ? `${p.mainWarehouseName}${p.mainWarehouseCode ? ` (${p.mainWarehouseCode})` : ''}` : '-'}</td>
                <td className="p-3">{p.price != null ? p.price.toFixed(2) : '-'}</td>
                <td className="p-3">{p.cost != null ? p.cost.toFixed(2) : '-'}</td>
                <td className="p-3">{p.totalStock || 0}</td>
                <td className={`p-3 ${p.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{p.status}</td>
                {(canEdit || canDelete) && (
                  <td className="p-3 text-right flex gap-1 justify-end">
                    {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>}
                    {canDelete && <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Product</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => handleNameChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <div className="flex gap-2">
                  <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                  <Button variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, sku: generateSKU(f.name) }))}><Sparkles className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={val => setForm(f => ({ ...f, category: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Main Warehouse *</Label>
                <Select value={form.mainWarehouse} onValueChange={val => setForm(f => ({ ...f, mainWarehouse: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supplier (optional)</Label>
              <Select value={form.supplier_id || '__none'} onValueChange={val => setForm(f => ({ ...f, supplier_id: val === '__none' ? '' : val }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No supplier</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Cost</Label>
                <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Stock</Label>
              <Input type="number" value={form.totalStock} onChange={e => setForm(f => ({ ...f, totalStock: Number(e.target.value) }))} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val as 'ACTIVE' | 'INACTIVE' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}