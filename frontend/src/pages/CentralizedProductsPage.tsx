// pages/CentralizedProductsPage.tsx
import { useEffect, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package, Loader2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCentralizedProducts,
  deleteCentralizedProduct,
  CentralizedProduct,
} from '@/api/centralizedProducts';
import { useCategoriesQuery } from '@/hooks/useCategories';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { canPerformAction } from '@/lib/permissions';
import { useSuppliersQuery } from '@/hooks/api/useSuppliers';
import { ProductFormDialog } from '@/components/centralized-products/ProductFormDialog';
import { SupplierDialog } from '@/components/centralized-products/SupplierDialog';
import { ProductStockPriceDialogs } from '@/components/centralized-products/ProductStockPriceDialogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pencil, Trash2 } from 'lucide-react';

export default function CentralizedProductsPage() {
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const categoriesQuery = useCategoriesQuery();
  const warehousesQuery = useWarehousesQuery();
  const suppliersQuery = useSuppliersQuery();
  
  const categories = categoriesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const [products, setProducts] = useState<CentralizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CentralizedProduct | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [stockPriceDialogsOpen, setStockPriceDialogsOpen] = useState({
    addStock: false,
    updatePrice: false
  });
  const [actionTarget, setActionTarget] = useState<CentralizedProduct | null>(null);

  const canCreate = canPerformAction(currentUser, 'centralized_products', 'create');
  const canEdit = canPerformAction(currentUser, 'centralized_products', 'update') || currentUser?.role === 'manager';
  const canDelete = canPerformAction(currentUser, 'centralized_products', 'delete') || currentUser?.role === 'manager';

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
    loadProducts();
  }, []);

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
    setStockPriceDialogsOpen({ addStock: true, updatePrice: false });
  };

  const openUpdatePrice = (p: CentralizedProduct) => {
    setActionTarget(p);
    setStockPriceDialogsOpen({ addStock: false, updatePrice: true });
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Centralized Products</h1>
        {canCreate && (
          <Button onClick={() => {
            setEditingProduct(null);
            setProductDialogOpen(true);
          }}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        )}
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
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 font-mono cursor-pointer">{p.sku}</td>
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 flex items-center gap-2 cursor-pointer">
                  <Package className="w-4 h-4 text-muted-foreground" />{p.name}
                </td>
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 cursor-pointer">{p.categoryName || '-'}</td>
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 cursor-pointer">{p.mainWarehouseName || '-'}</td>
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 cursor-pointer">{p.price != null ? p.price.toFixed(2) : '-'}</td>
                <td onClick={() => navigate(`/centralized-products/${p.id}`)} className="p-3 cursor-pointer">{p.cost != null ? p.cost.toFixed(2) : '-'}</td>
                <td className="p-3">{p.totalStock || 0}</td>
                <td className={`p-3 ${p.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{p.status}</td>
                {(canEdit || canDelete) && (
                  <td className="p-3 text-right flex gap-1 justify-end">
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingProduct(p);
                        setProductDialogOpen(true);
                      }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
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

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingProduct={editingProduct}
        categories={categories}
        warehouses={warehouses}
        suppliers={suppliers}
        onSuccess={loadProducts}
        onAddSupplier={() => setSupplierDialogOpen(true)}
      />

      {/* Supplier Dialog */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onSuccess={(newSupplierId) => {
          suppliersQuery.refetch();
          // You can optionally auto-select the new supplier in the product form
        }}
      />

      {/* Stock & Price Dialogs */}
      <ProductStockPriceDialogs
        addStockOpen={stockPriceDialogsOpen.addStock}
        updatePriceOpen={stockPriceDialogsOpen.updatePrice}
        onAddStockOpenChange={(open) => setStockPriceDialogsOpen(prev => ({ ...prev, addStock: open }))}
        onUpdatePriceOpenChange={(open) => setStockPriceDialogsOpen(prev => ({ ...prev, updatePrice: open }))}
        actionTarget={actionTarget}
        onSuccess={loadProducts}
      />
    </div>
  );
}