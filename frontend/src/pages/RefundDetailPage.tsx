// pages/RefundDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  RotateCcw, 
  Receipt, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Tag, 
  Package, 
  Activity,
  Building2,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { fetchRefundById, type Refund } from '@/api/refund';
import { format } from 'date-fns';

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRefundDetails();
    }
  }, [id]);

  const loadRefundDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const refundData = await fetchRefundById(id);
     
      setRefund(refundData);
    } catch (err) {
      console.error("Failed to load refund details:", err);
      toast({ 
        title: 'Error', 
        description: 'Failed to load refund details', 
        variant: 'destructive' 
      });
      navigate('/refunds');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading refund details...</p>
        </div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="text-center p-12">
        <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Refund Not Found</h2>
        <p className="text-muted-foreground mb-4">The refund you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/refunds')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Refunds
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/refunds')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-destructive" />
              Refund Details
            </h1>
            <p className="text-muted-foreground text-sm font-mono">
              {refund.refundNumber || refund.id.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!refund.isVoid && (
            <Badge variant={refund.type === 'full' ? 'default' : 'secondary'} className="capitalize">
              {refund.type === 'full' ? 'Full Refund' : 'Partial Refund'}
            </Badge>
          )}
          {refund.isVoid && (
            <Badge variant="destructive">
              VOIDED
            </Badge>
          )}
          {!refund.isVoid && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Refund Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Refund Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" /> Refund Number
              </span>
              <span className="font-mono text-sm">{refund.refundNumber || refund.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Type
              </span>
              <span className="capitalize font-medium">{refund.type || 'full'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span className="text-sm max-w-[200px] text-right break-words">{refund.reason || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Status
              </span>
              <span className={refund.isVoid ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                {refund.isVoid ? 'Voided' : 'Active'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sale Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Original Sale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" /> Invoice Number
              </span>
              <span className="font-mono text-sm font-medium">{refund.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Branch
              </span>
              <span>{refund.branchName || refund.branchId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Customer
              </span>
              <span className="font-medium">{refund.customerName || 'Walk-in Customer'}</span>
            </div>
            {/* <Button 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={() => navigate(`/transactions/${refund.invoiceId}`)}
            >
              View Original Transaction →
            </Button> */}
          </CardContent>
        </Card>

        {/* Amount & Processor Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount & Processor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">Refund Amount</span>
              <span className="font-bold text-destructive text-2xl">{formatCurrency(refund.total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Processed By
              </span>
              <span className="font-medium">{refund.processedByName || refund.processedBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Processed Date
              </span>
              <span>{formatDate(refund.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunded Items Card */}
      {refund.items && refund.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Refunded Items
            </CardTitle>
            <CardDescription>
              {refund.items.length} item{refund.items.length !== 1 ? 's' : ''} refunded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-5">Item Name</div>
                <div className="col-span-2 text-center">Type</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-1 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              {/* Table Rows */}
              <div className="space-y-2">
                {refund.items.map((item, index) => (
                  <div key={item.invoiceItemId || index} className="grid grid-cols-12 gap-4 text-sm py-2 border-b last:border-0">
                    <div className="col-span-5 font-medium truncate">{item.name}</div>
                    <div className="col-span-2 text-center">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-1 text-right">{formatCurrency(item.unitPrice)}</div>
                    <div className="col-span-2 text-right font-semibold text-destructive">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Row */}
              <div className="flex justify-end pt-4 mt-2 border-t">
                <div className="w-80">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-base">Total Refund Amount:</span>
                    <span className="font-bold text-destructive text-xl">{formatCurrency(refund.total)}</span>
                  </div>
                </div>
              </div>
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
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Created
            </span>
            <span>{formatDate(refund.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last Updated
            </span>
            <span>{formatDate(refund.updatedAt)}</span>
          </div>
         
        </CardContent>
      </Card>
    </div>
  );
}