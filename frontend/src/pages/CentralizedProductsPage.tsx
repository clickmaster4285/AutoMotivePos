// pages/CentralizedProductsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Package, Pencil, Trash2, Sparkles, Loader2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCentralizedProducts,
  createCentralizedProduct,
  updateCentralizedProduct,
  adjustCentralizedProductStock,
  updateCentralizedProductPrice,
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
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [updatePriceDialogOpen, setUpdatePriceDialogOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<CentralizedProduct | null>(null);
  const [addStockQty, setAddStockQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [vehicleInput, setVehicleInput] = useState('');
  
  
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
     vehicleCompatibility: [] as string[], // <-- new
     Brand: '', 
  });

const canCreate = canPerformAction(currentUser, 'centralized_products', 'create');
  const canEdit = canPerformAction(currentUser, 'centralized_products', 'update') || currentUser?.role === 'manager';
  const canDelete = canPerformAction(currentUser, 'centralized_products', 'delete') || currentUser?.role === 'manager';
  console.log('CentralizedProducts perms:', { canEdit, canDelete, role: currentUser?.role, hasCentralizedUpdate: currentUser?.permissions?.includes('inventory:centralized_inventory:update') });
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
      category: "",
      mainWarehouse: "",
      supplier_id: '',
      price: 0,
      cost: 0,
      totalStock: 0,
      status: 'ACTIVE',
       vehicleCompatibility: [] as string[], // <-- new
  Brand: '', 
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
       Brand: p.Brand || '', // <-- new
    vehicleCompatibility: p.vehicleCompatibility || [], // <-- new
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
        const previousStock = Number(editing.totalStock ?? 0);
        const nextStock = Number(form.totalStock ?? 0);
        const stockDelta = nextStock - previousStock;

        // Update non-stock fields via regular update endpoint
        const { totalStock: _ignoredTotalStock, ...restForm } = form;
        await updateCentralizedProduct(editing.id, restForm);

        // Adjust stock through dedicated endpoint so increments from 0 work reliably
        if (stockDelta !== 0) {
          await adjustCentralizedProductStock(editing.id, stockDelta);
        }
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

  const openAddStock = (p: CentralizedProduct) => {
    setActionTarget(p);
    setAddStockQty('');
    setAddStockDialogOpen(true);
  };

  const handleAddStock = async () => {
    if (!actionTarget) return;
    const qty = Number(addStockQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: 'Validation', description: 'Enter a valid stock quantity greater than 0', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await adjustCentralizedProductStock(actionTarget.id, qty);
      toast({ title: 'Updated', description: 'Stock added successfully' });
      setAddStockDialogOpen(false);
      setAddStockQty('');
      setActionTarget(null);
      await loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add stock', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdatePrice = (p: CentralizedProduct) => {
    setActionTarget(p);
    setNewPrice(String(p.price ?? 0));
    setNewCost(String(p.cost ?? 0));
    setUpdatePriceDialogOpen(true);
  };

  const handleUpdatePrice = async () => {
    if (!actionTarget) return;
    const price = Number(newPrice);
    const cost = Number(newCost);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(cost) || cost < 0) {
      toast({ title: 'Validation', description: 'Enter valid price and cost (0 or greater)', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await updateCentralizedProductPrice(actionTarget.id, { price, cost });
      toast({ title: 'Updated', description: 'Price and cost updated successfully' });
      setUpdatePriceDialogOpen(false);
      setNewPrice('');
      setNewCost('');
      setActionTarget(null);
      await loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update price/cost', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAddStock(p)}>
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUpdatePrice(p)}>
                            Update Price/Cost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Centralized Product</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} placeholder='Enter Product Name' onChange={e => handleNameChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <div className="flex gap-2">
                  <Input value={form.sku} placeholder='Enter SKU' onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
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
  <Label>Brand</Label>
  <Input
    value={form.Brand}
    placeholder="Enter brand name"
    onChange={e => setForm(f => ({ ...f, Brand: e.target.value }))}
  />
            </div>
            
            <div className="space-y-2">
              <Label>Supplier</Label>
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

            
          <div className="space-y-2">
  <Label>Vehicle Compatibility</Label>
  <div className="flex gap-2">
    <Input
      value={vehicleInput}
      onChange={e => setVehicleInput(e.target.value)}
      placeholder="e.g. Toyota Corolla"
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (vehicleInput.trim()) {
            setForm(f => ({
              ...f,
              vehicleCompatibility: [...f.vehicleCompatibility, vehicleInput.trim()]
            }));
            setVehicleInput('');
          }
        }
      }}
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (vehicleInput.trim()) {
          setForm(f => ({
            ...f,
            vehicleCompatibility: [...f.vehicleCompatibility, vehicleInput.trim()]
          }));
          setVehicleInput('');
        }
      }}
    >
      Add
    </Button>
  </div>
  
  {form.vehicleCompatibility.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-2">
      {form.vehicleCompatibility.map((vehicle, index) => (
        <div
          key={index}
          className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
        >
          <span>{vehicle}</span>
          <button
            type="button"
            onClick={() => {
              setForm(f => ({
                ...f,
                vehicleCompatibility: f.vehicleCompatibility.filter((_, i) => i !== index)
              }));
            }}
            className="text-muted-foreground hover:text-destructive ml-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}
  <p className="text-sm text-muted-foreground">Type a vehicle and click Add or press Enter</p>
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

      <Dialog
        open={addStockDialogOpen}
        onOpenChange={(open) => {
          setAddStockDialogOpen(open);
          if (!open) {
            setAddStockQty('');
            setActionTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stock — {actionTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Current stock: <span className="font-mono">{actionTarget?.totalStock ?? 0}</span>
            </p>
            <div className="space-y-2">
              <Label>Quantity to add</Label>
              <Input
                type="number"
                min={1}
                value={addStockQty}
                onChange={(e) => setAddStockQty(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStockDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={submitting}>{submitting ? 'Updating...' : 'Add Stock'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={updatePriceDialogOpen}
        onOpenChange={(open) => {
          setUpdatePriceDialogOpen(open);
          if (!open) {
            setNewPrice('');
            setNewCost('');
            setActionTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Price/Cost — {actionTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Current price: <span className="font-mono">{actionTarget?.price ?? 0}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Current cost: <span className="font-mono">{actionTarget?.cost ?? 0}</span>
            </p>
            <div className="space-y-2">
              <Label>New price</Label>
              <Input
                type="number"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 1200"
              />
            </div>
            <div className="space-y-2">
              <Label>New cost</Label>
              <Input
                type="number"
                min={0}
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="e.g. 900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatePriceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePrice} disabled={submitting}>{submitting ? 'Updating...' : 'Update Price/Cost'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}