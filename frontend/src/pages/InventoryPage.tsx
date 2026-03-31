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
import { useBranchesForUi } from '@/hooks/useBranches';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { canPerformAction } from '@/lib/permissions';
import type { Product, Category } from '@/types';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { ProductTable } from '@/components/inventory/ProductTable';
import { ProductDialogs } from '@/components/inventory/ProductDialogs';

export default function InventoryPage() {
  const { currentUser, categories: localCategories, warehouses: localWarehouses, currentBranchId } = useAppState();
  const { branches } = useBranchesForUi();
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
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const [form, setForm] = useState({
    name: '', sku: '', category: '', price: '', cost: '',
    stock: '', minStock: '5', warehouseId: '', branchId: '',
  });

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      .filter(p => catFilter === 'all' || (p as any).categoryId?._id === catFilter);
  }, [products, search, catFilter]);

  const getWarehousesForBranch = (branchId: string) => {
    if (!branchId) return warehouses;
    const matched = warehouses.filter((w: any) => {
      const warehouseBranchId = (w as any).branch_id || (w as any).branchId;
      if (!warehouseBranchId) return true;
      return warehouseBranchId === branchId;
    });
    return matched.length > 0 ? matched : warehouses;
  };

  const activeBranchId = isAdmin ? form.branchId : currentBranchId;
  const branchWarehouses = getWarehousesForBranch(activeBranchId || '');

  const openCreate = () => {
    setEditingProduct(null);
    const initialBranchId = currentBranchId || branches[0]?.id || '';
    const initialWarehouses = getWarehousesForBranch(initialBranchId);
    setForm({
      name: '',
      sku: '',
      category: categories[0]?.id || '',
      price: '',
      cost: '',
      stock: '',
      minStock: '5',
      branchId: initialBranchId,
      warehouseId: initialWarehouses[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: (p as any).categoryId?._id || categories[0]?.id || '',
      price: String(p.price ?? 0),
      cost: String((p as any).cost ?? p.price ?? 0),
      stock: String(p.stock ?? 0),
      minStock: '5',
      branchId: (p as any).branch_id || currentBranchId || branches[0]?.id || '',
      warehouseId: (p as any).warehouse_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const body = {
      name: form.name,
      sku: form.sku,
      description: undefined,
      category: form.category,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 5,
      branch_id: isAdmin ? (form.branchId || undefined) : undefined,
      warehouse_id: form.warehouseId,
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
      const delta = parseInt(adjustQty);
      await adjustProductStockMutation.mutateAsync({ id: adjustTarget.id, stock: isNaN(delta) ? 0 : delta });
      setAdjustDialogOpen(false);
      setAdjustQty('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <InventoryHeader canCreate={canCreate} onAddProduct={openCreate} />
      
      <InventoryFilters
        search={search}
        catFilter={catFilter}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryFilterChange={setCatFilter}
      />
      
      <ProductTable
        products={filteredProducts}
        isLoading={productsQuery.isLoading || categoriesQuery.isLoading || warehousesQuery.isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={openEdit}
        onAdjust={p => {
          setAdjustTarget(p);
          setAdjustDialogOpen(true);
        }}
        onDelete={id => deleteProductMutation.mutate(id)}
      />
      
      <ProductDialogs
        dialogOpen={dialogOpen}
        adjustDialogOpen={adjustDialogOpen}
        editingProduct={editingProduct}
        adjustTarget={adjustTarget}
        form={form}
        isAdmin={isAdmin}
        branches={branches}
        categories={categories}
        branchWarehouses={branchWarehouses}
        adjustQty={adjustQty}
        onDialogOpenChange={setDialogOpen}
        onAdjustDialogOpenChange={setAdjustDialogOpen}
        onFormChange={setForm}
        onSave={handleSave}
        onAdjust={handleAdjust}
        onAdjustQtyChange={setAdjustQty}
        getWarehousesForBranch={getWarehousesForBranch}
      />
    </div>
  );
}