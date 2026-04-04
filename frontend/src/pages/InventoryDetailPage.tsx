// pages/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Store, 
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
  RefreshCw,
  Link,
  AlertCircle,
  Building2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { fetchProductById, type Product, type ProductHistory } from '@/api/product';
import { format } from 'date-fns';

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
  }, [id]);

  const loadProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const productData = await fetchProductById(id);
      
      setProduct(productData);
    } catch (err) {
      console.error("Failed to load product details:", err);
      toast({ 
        title: 'Error', 
        description: 'Failed to load product details', 
        variant: 'destructive' 
      });
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const getHistoryActionIcon = (action: string) => {
    switch (action) {
      case 'stock_added':
        return <PlusCircle className="w-4 h-4 text-green-600" />;
      case 'sold':
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getHistoryActionColor = (action: string) => {
    switch (action) {
      case 'stock_added':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHistoryDisplayText = (record: ProductHistory) => {
    switch (record.action) {
      case 'stock_added':
        return `Stock added: +${record.quantity}`;
      case 'sold':
        return `Sold: ${record.quantity}`;
      case 'refunded':
        return `Refunded: +${record.quantity}`;
      default:
        return `${record.action}: ${record.quantity}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  const getStockStatusColor = (stock: number | undefined, minStock: number | undefined) => {
    if (!stock || stock === 0) return 'text-red-600';
    if (minStock && stock <= minStock) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStockStatusText = (stock: number | undefined, minStock: number | undefined) => {
    if (!stock || stock === 0) return 'Out of Stock';
    if (minStock && stock <= minStock) return 'Low Stock';
    return 'In Stock';
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
        <Button onClick={() => navigate('/inventory')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
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
            onClick={() => navigate('/inventory')}
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
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Product Information Card */}
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
              <span>{product.categoryName || '-'}</span>
            </div>
            {product.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="text-sm">{product.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock & Location Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              Stock & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Boxes className="w-3 h-3" /> Current Stock
              </span>
              <div className="text-right">
                <span className={`font-bold text-lg ${getStockStatusColor(product.stock, product.minStock)}`}>
                  {product.stock || 0}
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {getStockStatusText(product.stock, product.minStock)}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Stock Level</span>
              <span>{product.minStock || 5}</span>
            </div>
            {product.stock !== undefined && product.minStock !== undefined && product.stock <= product.minStock && (
              <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 p-2 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>Low stock alert! Current stock is at or below minimum level.</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Store className="w-3 h-3" /> Branch
              </span>
              <span>{product.branch_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Warehouse className="w-3 h-3" /> Warehouse
              </span>
              <div className="text-right">
                <div>{product.warehouse_name || '-'}</div>
                {product.warehouse_code && (
                  <span className="text-xs text-muted-foreground">({product.warehouse_code})</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
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
                <span className="text-muted-foreground">Profit Margin</span>
                <span className={(product.price - product.cost) > 0 ? 'text-green-600' : 'text-red-600'}>
                  ${(product.price - product.cost).toFixed(2)} 
                  ({((product.price - product.cost) / product.price * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Centralized Product Card */}
      {product.centralizedProductId && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-4 h-4 text-primary" />
              Linked Centralized Product
            </CardTitle>
            <CardDescription>
              This inventory item is linked to a centralized product. Stock adjustments affect centralized inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{product.centralizedProductName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-mono">{product.centralizedProductSku || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Central Stock</span>
                <span className="font-bold">{product.centralizedTotalStock || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={product.centralizedProductStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                  {product.centralizedProductStatus || '-'}
                </Badge>
              </div>
            </div>
            <Button 
              variant="link" 
              className="mt-3 p-0 h-auto"
              onClick={() => navigate(`/centralized-products/${product.centralizedProductId}`)}
            >
              View Centralized Product Details →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History Timeline */}
      {product.history && product.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Stock Movement History
            </CardTitle>
            <CardDescription>
              Complete history of all stock movements and changes for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {product.history.map((record, index) => (
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
                    {record.note && (
                      <p className="text-sm text-muted-foreground mt-1">{record.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          {product.createdBy && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created By</span>
              <span>{product.createdBy.name} ({product.createdBy.email})</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}