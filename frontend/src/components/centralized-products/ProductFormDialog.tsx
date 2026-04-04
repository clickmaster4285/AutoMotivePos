// components/centralized-products/ProductFormDialog.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  createCentralizedProduct,
  updateCentralizedProduct,
  adjustCentralizedProductStock,
  CentralizedProduct,
} from '@/api/centralizedProducts';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: CentralizedProduct | null;
  categories: any[];
  warehouses: any[];
  suppliers: any[];
  onSuccess: () => void;
  onAddSupplier: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  categories,
  warehouses,
  suppliers,
  onSuccess,
  onAddSupplier,
}: ProductFormDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
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
    vehicleCompatibility: [] as string[],
    Brand: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.categoryId || '',
        mainWarehouse: editingProduct.mainWarehouseId || '',
        supplier_id: editingProduct.supplierId || '',
        price: editingProduct.price || 0,
        cost: editingProduct.cost || 0,
        totalStock: editingProduct.totalStock || 0,
        status: editingProduct.status,
        Brand: editingProduct.Brand || '',
        vehicleCompatibility: editingProduct.vehicleCompatibility || [],
      });
    } else {
      setForm({
        name: '',
        sku: '',
        category: categories[0]?.id || '',
        mainWarehouse: warehouses[0]?.id || '',
        supplier_id: '',
        price: 0,
        cost: 0,
        totalStock: 0,
        status: 'ACTIVE',
        vehicleCompatibility: [],
        Brand: '',
      });
    }
    setVehicleInput('');
  }, [editingProduct, open, categories, warehouses]);

  const generateSKU = (name: string) => {
    if (!name.trim()) return '';
    let sku = `SKU-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;
    return sku;
  };

  const handleNameChange = (value: string) => {
    setForm(f => ({
      ...f,
      name: value,
      sku: (!f.sku || f.sku.startsWith('SKU-')) ? generateSKU(value) : f.sku,
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Name required', variant: 'destructive' });
      return;
    }
    if (!form.sku.trim()) {
      toast({ title: 'Validation', description: 'SKU required', variant: 'destructive' });
      return;
    }
    if (!form.category) {
      toast({ title: 'Validation', description: 'Category required', variant: 'destructive' });
      return;
    }
    if (!form.mainWarehouse) {
      toast({ title: 'Validation', description: 'Main warehouse required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const previousStock = Number(editingProduct.totalStock ?? 0);
        const nextStock = Number(form.totalStock ?? 0);
        const stockDelta = nextStock - previousStock;

        const { totalStock: _ignoredTotalStock, ...restForm } = form;
        await updateCentralizedProduct(editingProduct.id, restForm);

        if (stockDelta !== 0) {
          await adjustCentralizedProductStock(editingProduct.id, stockDelta);
        }
        toast({ title: 'Updated', description: 'Product updated successfully' });
      } else {
        await createCentralizedProduct(form);
        toast({ title: 'Created', description: 'Product created successfully' });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Edit' : 'Add'} Centralized Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                value={form.name} 
                placeholder='Enter Product Name' 
                onChange={e => handleNameChange(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <div className="flex gap-2">
                <Input 
                  value={form.sku} 
                  placeholder='Enter SKU' 
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setForm(f => ({ ...f, sku: generateSKU(f.name) }))}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={val => setForm(f => ({ ...f, category: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Main Warehouse *</Label>
              <Select value={form.mainWarehouse} onValueChange={val => setForm(f => ({ ...f, mainWarehouse: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}{w.code ? ` (${w.code})` : ''}
                    </SelectItem>
                  ))}
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
            <div className="flex gap-2">
              <Select 
                value={form.supplier_id || '__none'} 
                onValueChange={val => {
                  if (val === '__add_new') {
                    onAddSupplier();
                  } else {
                    setForm(f => ({ ...f, supplier_id: val === '__none' ? '' : val }));
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No supplier</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new" className="text-primary font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      + Add New Supplier
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
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
              <Input 
                type="number" 
                value={form.price} 
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input 
                type="number" 
                value={form.cost} 
                onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Total Stock</Label>
            <Input 
              type="number" 
              value={form.totalStock} 
              onChange={e => setForm(f => ({ ...f, totalStock: Number(e.target.value) }))} 
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={form.status} 
              onValueChange={val => setForm(f => ({ ...f, status: val as 'ACTIVE' | 'INACTIVE' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}