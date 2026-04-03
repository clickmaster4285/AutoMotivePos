import { useState, useMemo, useEffect } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdjustProductStockMutation,
} from '@/hooks/api/useProducts';
import { useQuery } from '@tanstack/react-query';
import {
  fetchCentralizedProducts,
  adjustCentralizedProductStock,
  type CentralizedProduct,
} from '@/api/centralizedProducts';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { canPerformAction } from '@/lib/permissions';
import { useToast } from '@/components/ui/use-toast';
import type { Product, Category } from '@/types';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { ProductTable } from '@/components/inventory/ProductTable';
import { ProductDialogs } from '@/components/inventory/ProductDialogs';

export default function InventoryPage() {
  const { currentUser, warehouses: localWarehouses, currentBranchId } = useAppState();
  const { toast } = useToast();
  const { branches } = useBranchesForUi();
  const productsQuery = useProductsQuery();
  const warehousesQuery = useWarehousesQuery();
  const centralizedProductsQuery = useQuery({
    queryKey: ['centralized-products', 'inventory-picklist'],
    queryFn: () => fetchCentralizedProducts(),
  });
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const adjustProductStockMutation = useAdjustProductStockMutation();
  
  const products = productsQuery.data ?? [];
  const centralizedProducts = centralizedProductsQuery.data ?? [];
  
  const warehouses = (warehousesQuery.data && warehousesQuery.data.length > 0)
    ? warehousesQuery.data
    : localWarehouses;
  
  const canCreate = canPerformAction(currentUser, 'inventory', 'create');
  const canEdit = canPerformAction(currentUser, 'inventory', 'edit');
  const canDelete = canPerformAction(currentUser, 'inventory', 'delete');
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const [form, setForm] = useState({
    centralizedProductId: '',
    stock: '',
    minStock: '5',
    warehouseId: '',
    branchId: '',
  });

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

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
      centralizedProductId: '',
      stock: '',
      minStock: '5',
      branchId: '',
      warehouseId: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    const fallbackCentralized =
      centralizedProducts.find((cp) => cp.id === (p as any).centralizedProductId) ||
      centralizedProducts.find((cp) => cp.sku === (p as any).sku) ||
      centralizedProducts.find((cp) => cp.name === (p as any).name);

    setEditingProduct(p);
    setForm({
      centralizedProductId: (p as any).centralizedProductId || fallbackCentralized?.id || '',
      stock: String(p.stock ?? 0),
      minStock: '5',
      branchId: (p as any).branch_id || currentBranchId || branches[0]?.id || '',
      warehouseId: (p as any).warehouse_id || '',
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen || !editingProduct || form.centralizedProductId) return;

    const fallbackCentralized =
      centralizedProducts.find((cp) => cp.id === (editingProduct as any).centralizedProductId) ||
      centralizedProducts.find((cp) => cp.sku === (editingProduct as any).sku) ||
      centralizedProducts.find((cp) => cp.name === (editingProduct as any).name);

    if (fallbackCentralized?.id) {
      setForm((prev) => ({ ...prev, centralizedProductId: fallbackCentralized.id }));
    }
  }, [dialogOpen, editingProduct, form.centralizedProductId, centralizedProducts]);

  const handleSave = async () => {
    // Require inventory create permission for new products
    if (!editingProduct && !canCreate) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to create inventory items.',
        variant: 'destructive',
      });
      return;
    }

    const selected = centralizedProducts.find((cp) => cp.id === form.centralizedProductId);
    const parsedStock = parseInt(form.stock) || 0;

    if (editingProduct && selected && typeof selected.totalStock === 'number' && parsedStock > selected.totalStock) {
      toast({
        title: 'Stock limit reached',
        description: `Cannot set stock above centralized stock (${selected.totalStock}).`,
        variant: 'destructive',
      });
      return;
    }

    const body = {
      centralizedProductId: form.centralizedProductId || undefined,
      name: selected?.name,
      sku: selected?.sku,
      description: undefined,
      category: selected?.categoryId,
      price: selected?.price,
      cost: undefined,
      stock: parsedStock,
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
      const safeDelta = isNaN(delta) ? 0 : delta;
      const centralizedForAdjust = centralizedProducts.find(
        (cp) => cp.id === (adjustTarget as any).centralizedProductId
      );
      const centralizedAvailable =
        typeof centralizedForAdjust?.totalStock === 'number'
          ? centralizedForAdjust.totalStock
          : typeof (adjustTarget as any).centralizedTotalStock === 'number'
            ? (adjustTarget as any).centralizedTotalStock
            : undefined;

      if (typeof centralizedAvailable === 'number' && safeDelta > centralizedAvailable) {
        toast({
          title: 'Stock limit reached',
          description: `Cannot add more than centralized available stock (${centralizedAvailable}).`,
          variant: 'destructive',
        });
        return;
      }

      // Adding stock to branch inventory consumes stock from centralized inventory.
      if (safeDelta > 0 && centralizedForAdjust?.id) {
        await adjustCentralizedProductStock(centralizedForAdjust.id, -safeDelta);
      }

      await adjustProductStockMutation.mutateAsync({ id: adjustTarget.id, stock: safeDelta });
      setAdjustDialogOpen(false);
      setAdjustQty('');
      await centralizedProductsQuery.refetch();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <InventoryHeader canCreate={canCreate} onAddProduct={openCreate} />
      
      <InventoryFilters
        search={search}
        onSearchChange={setSearch}
      />
      
      <ProductTable
        products={filteredProducts}
        isLoading={
          productsQuery.isLoading ||
          warehousesQuery.isLoading ||
          centralizedProductsQuery.isLoading
        }
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
        categories={[] as any}
        centralizedProducts={centralizedProducts}
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