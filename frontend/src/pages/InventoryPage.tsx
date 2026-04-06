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
import { QuickWarehouseDialog } from '@/components/centralized-products/QuickWarehouseDialog';

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
  
  // State for warehouse quick creation
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  
  // Create a map of warehouse IDs to warehouse objects for quick lookup
  const warehousesMap = useMemo(() => {
    const warehousesData = warehousesQuery.data ?? localWarehouses;
    const map = new Map();
    warehousesData.forEach((warehouse: any) => {
      map.set(warehouse.id, warehouse);
    });
    return map;
  }, [warehousesQuery.data, localWarehouses]);
  
  // Transform products to add warehouse names from the warehousesMap
  const products = useMemo(() => {
    const rawProducts = productsQuery.data ?? [];
    return rawProducts.map((product: any) => {
      // Get warehouse ID (could be in warehouse_id or warehouse field)
      const warehouseId = product.warehouse_id || product.warehouse;
      
      // Look up warehouse details from our map
      const warehouseDetails = warehousesMap.get(warehouseId);
      
      return {
        ...product,
        // Ensure warehouse_id is a string
        warehouse_id: warehouseId,
        // Add warehouse name and code from the map
        warehouse_name: warehouseDetails?.name || product.warehouse_name,
        warehouse_code: warehouseDetails?.code || product.warehouse_code,
        // Keep the full warehouse object if available
        warehouse: warehouseDetails || product.warehouse,
        // Handle branch data similarly
        branch_name: product.branch_name || product.branch?.name,
      };
    });
  }, [productsQuery.data, warehousesMap]);
  
  const centralizedProducts = centralizedProductsQuery.data ?? [];
  
  const warehouses = useMemo(() => {
    const apiWarehouses = warehousesQuery.data ?? [];
    if (apiWarehouses.length > 0) {
      return apiWarehouses;
    }
    return localWarehouses;
  }, [warehousesQuery.data, localWarehouses]);
  
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
      .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const getWarehousesForBranch = (branchId: string) => {
    if (!branchId) return warehouses;
    const matched = warehouses.filter((w: any) => {
      const warehouseBranchId = w.branch_id || w.branchId;
      if (!warehouseBranchId) return true;
      return warehouseBranchId === branchId;
    });
    return matched.length > 0 ? matched : warehouses;
  };

  const activeBranchId = isAdmin ? form.branchId : currentBranchId;
  const branchWarehouses = getWarehousesForBranch(activeBranchId || '');

  // Refresh warehouses function
  const refreshWarehouses = () => {
    warehousesQuery.refetch();
  };

  // Handle warehouse creation success
  const handleWarehouseCreated = (newWarehouse: any) => {
    refreshWarehouses();
    // Auto-select the newly created warehouse
    setForm(prev => ({ ...prev, warehouseId: newWarehouse.id }));
    toast({
      title: 'Success',
      description: 'Warehouse created and selected',
    });
  };

  const openCreate = () => {
    setEditingProduct(null);
    const initialBranchId = currentBranchId || branches[0]?.id || '';
    const initialWarehouses = getWarehousesForBranch(initialBranchId);
    setForm({
      centralizedProductId: '',
      stock: '',
      minStock: '5',
      branchId: initialBranchId,
      warehouseId: initialWarehouses[0]?.id || '',
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
      minStock: String(p.minStock ?? 5),
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
    
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, body });
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await createProductMutation.mutateAsync(body);
        toast({ title: 'Success', description: 'Product created successfully' });
      }
      setDialogOpen(false);
      await productsQuery.refetch();
      await centralizedProductsQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const handleAdjust = async () => {
    if (!adjustTarget || !adjustQty) return;
    
    const delta = parseInt(adjustQty);
    const safeDelta = isNaN(delta) ? 0 : delta;
    
    if (safeDelta === 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }
    
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

    try {
      if (safeDelta > 0 && centralizedForAdjust?.id) {
        await adjustCentralizedProductStock(centralizedForAdjust.id, -safeDelta);
      }

      await adjustProductStockMutation.mutateAsync({ id: adjustTarget.id, stock: safeDelta });
      toast({ title: 'Success', description: 'Stock adjusted successfully' });
      setAdjustDialogOpen(false);
      setAdjustQty('');
      await productsQuery.refetch();
      await centralizedProductsQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
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
        onDelete={async (id) => {
          if (confirm('Are you sure you want to delete this product?')) {
            try {
              await deleteProductMutation.mutateAsync(id);
              toast({ title: 'Success', description: 'Product deleted successfully' });
              await productsQuery.refetch();
            } catch (error: any) {
              toast({
                title: 'Error',
                description: error.message || 'Failed to delete product',
                variant: 'destructive',
              });
            }
          }
        }}
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
        onAddWarehouse={() => setShowWarehouseDialog(true)} // Add this prop
      />

      {/* Quick Warehouse Dialog */}
      <QuickWarehouseDialog
        open={showWarehouseDialog}
        onOpenChange={setShowWarehouseDialog}
        onSuccess={handleWarehouseCreated}
      />
    </div>
  );
}