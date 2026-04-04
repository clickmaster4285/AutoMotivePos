// pages/CentralizedProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Barcode, 
  Tag, 
  Warehouse, 
  Building2, 
  DollarSign, 
  Coins, 
  Boxes, 
  Activity,
  History,
  User,
  Calendar,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  fetchCentralizedProductById, 
  CentralizedProduct,
  CentralizedProductHistory
} from '@/api/centralizedProducts';
import { useCategoriesQuery } from '@/hooks/useCategories';
import { useWarehousesQuery } from '@/hooks/api/useWarehouses';
import { useSuppliersQuery } from '@/hooks/api/useSuppliers';
import { canPerformAction } from '@/lib/permissions';
import { format } from 'date-fns';

export default function CentralizedProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppState();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<CentralizedProduct | null>(null);
  const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<CentralizedProductHistory[]>([]);
    

    console.log('Product history:', history); // Debug log
    console.log('Product details:', product); // Debug log

  const categoriesQuery = useCategoriesQuery();
  const warehousesQuery = useWarehousesQuery();
  const suppliersQuery = useSuppliersQuery();
  
  const categories = categoriesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const canEdit = canPerformAction(currentUser, 'centralized_products', 'update') || currentUser?.role === 'manager';
  const canDelete = canPerformAction(currentUser, 'centralized_products', 'delete') || currentUser?.role === 'manager';

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id]);

  const loadProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchCentralizedProductById(id);
      setProduct(data.product);
      setHistory(data.history || []);
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: 'Failed to load product details', 
        variant: 'destructive' 
      });
      navigate('/centralized-products');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId || '-';
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w: any) => w.id === warehouseId);
    return warehouse?.name || warehouseId || '-';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || supplierId || '-';
  };

  

const getHistoryActionIcon = (action: string) => {
  switch (action) {
    case 'added':
      return <PlusCircle className="w-4 h-4 text-green-600" />;
    case 'allocated_to_branch':
      return <TrendingDown className="w-4 h-4 text-orange-600" />;
    case 'received_from_branch':
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case 'price_cost_updated':
      return <DollarSign className="w-4 h-4 text-purple-600" />;
    default:
      return <History className="w-4 h-4 text-muted-foreground" />;
  }
};

const getHistoryActionColor = (action: string) => {
  switch (action) {
    case 'added':
      return 'bg-green-100 text-green-800';
    case 'allocated_to_branch':
      return 'bg-orange-100 text-orange-800';
    case 'received_from_branch':
      return 'bg-blue-100 text-blue-800';
    case 'price_cost_updated':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getHistoryDisplayText = (record: CentralizedProductHistory) => {
  switch (record.action) {
    case 'price_cost_updated':
      return record.note || record.notes || 'Price/Cost updated';
    case 'added':
      return `Stock added: +${record.quantity}`;
    case 'allocated_to_branch':
      return `Allocated to branch: ${record.quantity}`;
    case 'received_from_branch':
      return `Received from branch: +${Math.abs(record.quantity)}`;
    default:
      return `${record.action}: ${record.quantity}`;
  }
};

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-12">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/centralized-products')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/centralized-products')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              {product.name}
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm">SKU: {product.sku}</p>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/centralized-products/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Barcode className="w-3 h-3" /> SKU
              </span>
              <span className="font-mono text-sm">{product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Category
              </span>
              <span>{getCategoryName(product.categoryId)}</span>
            </div>
            {product.Brand && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{product.Brand}</span>
              </div>
            )}
            {product.vehicleCompatibility && product.vehicleCompatibility.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Vehicle Compatibility</span>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {product.vehicleCompatibility.map((vehicle, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Inventory & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Boxes className="w-3 h-3" /> Total Stock
              </span>
              <span className="font-bold text-lg">{product.totalStock || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Warehouse className="w-3 h-3" /> Main Warehouse
              </span>
              <span>{getWarehouseName(product.mainWarehouseId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Supplier
              </span>
              <span>{product.supplierId ? getSupplierName(product.supplierId) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Selling Price
              </span>
              <span className="font-bold text-green-600">${(product.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Coins className="w-3 h-3" /> Cost Price
              </span>
              <span>${(product.cost || 0).toFixed(2)}</span>
            </div>
            {product.cost && product.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className={((product.price - product.cost) / product.price * 100) > 0 ? 'text-green-600' : 'text-red-600'}>
                  {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDate(product.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDate(product.updatedAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span>v{product.__v || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Stock Movement History
          </CardTitle>
          <CardDescription>
            Complete history of all stock movements and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No history records found</p>
            </div>
          ) : (
            <div className="space-y-4">
             {history.map((record, index) => (
  <div key={record._id || index} className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-1">
      {getHistoryActionIcon(record.action)}
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge className={getHistoryActionColor(record.action)}>
            {record.action.replace(/_/g, ' ').toUpperCase()}
          </Badge>
          <span className="text-sm font-medium">
            {getHistoryDisplayText(record)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {/* <User className="w-3 h-3" />
          <span>{record.user || 'System'}</span> */}
          <Calendar className="w-3 h-3 ml-2" />
          <span>{formatDate(record.date)}</span>
        </div>
      </div>
      {/* {record.note && (
        <p className="text-sm text-muted-foreground mt-1">{record.note}</p>
      )} */}
    </div>
  </div>
))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}