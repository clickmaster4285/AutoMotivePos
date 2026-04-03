import { useEffect, useState, useMemo } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useBranchesForUi } from '@/hooks/useBranches';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useWarehousesByBranchQuery } from '@/hooks/api/useWarehouses';
import { useCreateStockTransferMutation, useStockTransfersQuery } from '@/hooks/api/useStockTransfers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, ArrowRightLeft } from 'lucide-react';

export default function StockTransfersPage() {
  const { currentBranchId, currentUser } = useAppState();
  const { branches } = useBranchesForUi();
  const { data: stockTransfers = [] } = useStockTransfersQuery();
  const { data: products = [] } = useProductsQuery();
  const createTransferMutation = useCreateStockTransferMutation();
  
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailTransfer, setDetailTransfer] = useState<any | null>(null);
  const [fromBranchId, setFromBranchId] = useState(currentBranchId);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Fetch warehouses based on selected branches
  const { data: fromWarehouses = [] } = useWarehousesByBranchQuery(fromBranchId);
  const { data: toWarehouses = [] } = useWarehousesByBranchQuery(toBranchId);

  // Filter transfers by search only (no branch filtering)
  const list = useMemo(() => {
    const filtered = stockTransfers.filter(t => 
      !search || t.productName?.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [stockTransfers, search]);

  // Filter products that have stock in the source branch/warehouse
  const sourceProducts = products.filter(
    p => p.branch_id === fromBranchId && 
         (!fromWarehouseId || p.warehouse_id === fromWarehouseId) && 
         (p.stock || 0) > 0
  );
  
  const selectedProduct = products.find(p => p.id === productId);
  const isAdmin = currentUser?.role === 'admin';
  
  // Reset from branch if current branch is not available
  useEffect(() => {
    if (!branches.length) return;
    const hasCurrent = branches.some(b => b.id === currentBranchId);
    const hasSelected = branches.some(b => b.id === fromBranchId);
    if (!hasSelected) {
      setFromBranchId(hasCurrent ? currentBranchId : branches[0]?.id);
    }
  }, [branches, currentBranchId, fromBranchId]);

  // Reset warehouse and product when from branch changes
  useEffect(() => {
    setFromWarehouseId('');
    setProductId('');
  }, [fromBranchId]);

  // Reset to warehouse when to branch changes
  useEffect(() => {
    setToWarehouseId('');
  }, [toBranchId]);

  const openDialog = () => {
    const hasCurrent = branches.some(b => b.id === currentBranchId);
    setFromBranchId(hasCurrent ? currentBranchId : (branches[0]?.id ?? ''));
    setFromWarehouseId(''); 
    setToBranchId(''); 
    setToWarehouseId('');
    setProductId(''); 
    setQuantity('');
    setDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!productId || !toBranchId || !toWarehouseId || !quantity || !selectedProduct) return;
    const qty = parseInt(quantity);
    if (qty <= 0 || qty > (selectedProduct.stock || 0)) return;

    try {
      await createTransferMutation.mutateAsync({
        product_id: productId,
        from_branch_id: fromBranchId,
        from_warehouse_id: fromWarehouseId,
        to_branch_id: toBranchId,
        to_warehouse_id: toWarehouseId,
        quantity: qty,
      });
      setDialogOpen(false);
      // Reset form
      setFromWarehouseId('');
      setToBranchId('');
      setToWarehouseId('');
      setProductId('');
      setQuantity('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Stock Transfers</h1>
          <p className="page-subtitle">Transfer inventory between branches and warehouses</p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" /> 
          New Transfer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search transfers..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {list.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No transfers yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-3 font-medium text-muted-foreground">From</th>
                <th className="text-left p-3 font-medium text-muted-foreground">To</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-left p-3 font-medium text-muted-foreground">By</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 font-medium text-foreground">{t.productName}</td>
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 text-muted-foreground text-xs">
                    {t.fromBranchName} / {t.fromWarehouseName}
                  </td>
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 text-muted-foreground text-xs">
                    {t.toBranchName} / {t.toWarehouseName}
                  </td>
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 text-right font-mono font-semibold text-foreground">
                    {t.quantity}
                  </td>
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 text-muted-foreground text-xs">{t.userName}</td>
                  <td  onClick={() => setDetailTransfer(t)} className="p-3 text-right text-xs text-muted-foreground">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Stock Transfer</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* From Branch and Warehouse */}
            <div className="grid grid-cols-2 gap-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label>From Branch</Label>
                  <Select 
                    value={fromBranchId} 
                    onValueChange={v => { 
                      setFromBranchId(v); 
                      setFromWarehouseId(''); 
                      setProductId(''); 
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <Select 
                  value={fromWarehouseId} 
                  onValueChange={v => { 
                    setFromWarehouseId(v); 
                    setProductId(''); 
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromWarehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* To Branch and Warehouse */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>To Branch</Label>
                <Select 
                  value={toBranchId} 
                  onValueChange={v => { 
                    setToBranchId(v); 
                    setToWarehouseId(''); 
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>To Warehouse</Label>
                <Select 
                  value={toWarehouseId} 
                  onValueChange={setToWarehouseId}
                  disabled={!toBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!toBranchId ? "Select branch first" : "Select warehouse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {toWarehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select 
                  value={productId} 
                  onValueChange={setProductId}
                  disabled={!fromWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!fromWarehouseId ? "Select warehouse first" : "Select product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.stock || 0} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>
                  Quantity 
                  {selectedProduct && (
                    <span className="text-muted-foreground ml-1">
                      (max {selectedProduct.stock || 0})
                    </span>
                  )}
                </Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  min="1" 
                  max={selectedProduct?.stock || 0}
                  disabled={!productId}
                  placeholder="Enter quantity"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleTransfer} 
              disabled={
                !productId || 
                !toBranchId || 
                !toWarehouseId || 
                !quantity || 
                createTransferMutation.isPending
              }
            >
              {createTransferMutation.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



            {/* Detail Dialog - Click on transfer row to view details */}
      <Dialog open={!!detailTransfer} onOpenChange={() => setDetailTransfer(null)}>
        <DialogContent className="max-w-2xl">
          {detailTransfer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Stock Transfer Details
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Transfer ID: {detailTransfer.id}
                </p>
              </DialogHeader>
              
              <div className="space-y-6 py-2">
                {/* Product Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    Product Details
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Product Name</p>
                        <p className="text-base font-semibold text-foreground">{detailTransfer.productName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Quantity Transferred</p>
                        <p className="text-2xl font-bold text-primary">{detailTransfer.quantity}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Flow - From & To */}
                <div className="grid grid-cols-2 gap-4">
                  {/* From Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      Source Location
                    </h3>
                    <div className="bg-primary dark:bg-red-950/20 rounded-lg p-4 border-l-4 border-primary/600">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Branch</p>
                          <p className="text-sm font-medium text-gray-900">{detailTransfer.fromBranchName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Warehouse</p>
                          <p className="text-sm font-medium text-gray-900">{detailTransfer.fromWarehouseName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* To Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      Destination Location
                    </h3>
                    <div className="bg-foreground dark:bg-green-950/20 rounded-lg p-4 border-l-4 border-primary/600">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Branch</p>
                          <p className="text-sm font-medium text-gray-900">{detailTransfer.toBranchName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Warehouse</p>
                          <p className="text-sm font-medium text-gray-900">{detailTransfer.toWarehouseName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transfer Information */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Transfer Information</h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Initiated By</p>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {detailTransfer.userName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{detailTransfer.userName}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transfer Date</p>
                        <p className="text-sm text-foreground">
                          {detailTransfer.createdAt ? new Date(detailTransfer.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-700 text-green-100">
                          Completed
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reference Number</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {detailTransfer.referenceNumber || detailTransfer.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes/Remarks (if any) */}
                {(detailTransfer as any).notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Remarks</h3>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-foreground">{(detailTransfer as any).notes}</p>
                    </div>
                  </div>
                )}

                {/* Stock Impact Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Stock Impact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-foreground dark:bg-red-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Source Stock Change</p>
                      <p className="text-lg font-bold text-red-600">-{detailTransfer.quantity}</p>
                    </div>
                    <div className="bg-foreground dark:bg-green-950/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Destination Stock Change</p>
                      <p className="text-lg font-bold text-green-600">+{detailTransfer.quantity}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Only show for recent transfers or if user has permission */}
                {(detailTransfer as any).canCancel && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        setDetailTransfer(null);
                        // Add logic to view product details
                      }}
                    >
                      View Product
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this transfer?')) {
                          // Add cancel transfer logic here
                          setDetailTransfer(null);
                        }
                      }}
                    >
                      Cancel Transfer
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}