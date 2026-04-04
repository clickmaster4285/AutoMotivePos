// components/centralized-products/ProductStockPriceDialogs.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  adjustCentralizedProductStock,
  updateCentralizedProductPrice,
  CentralizedProduct,
} from '@/api/centralizedProducts';

interface ProductStockPriceDialogsProps {
  addStockOpen: boolean;
  updatePriceOpen: boolean;
  onAddStockOpenChange: (open: boolean) => void;
  onUpdatePriceOpenChange: (open: boolean) => void;
  actionTarget: CentralizedProduct | null;
  onSuccess: () => void;
}

export function ProductStockPriceDialogs({
  addStockOpen,
  updatePriceOpen,
  onAddStockOpenChange,
  onUpdatePriceOpenChange,
  actionTarget,
  onSuccess,
}: ProductStockPriceDialogsProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [addStockQty, setAddStockQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');

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
      onAddStockOpenChange(false);
      setAddStockQty('');
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add stock', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
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
      onUpdatePriceOpenChange(false);
      setNewPrice('');
      setNewCost('');
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update price/cost', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStockClose = (open: boolean) => {
    if (!open) {
      setAddStockQty('');
      onAddStockOpenChange(false);
    }
  };

  const handleUpdatePriceClose = (open: boolean) => {
    if (!open) {
      setNewPrice('');
      setNewCost('');
      onUpdatePriceOpenChange(false);
    }
  };

  return (
    <>
      {/* Add Stock Dialog */}
      <Dialog open={addStockOpen} onOpenChange={handleAddStockClose}>
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
            <Button variant="outline" onClick={() => onAddStockOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={submitting}>
              {submitting ? 'Updating...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Price Dialog */}
      <Dialog open={updatePriceOpen} onOpenChange={handleUpdatePriceClose}>
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
            <Button variant="outline" onClick={() => onUpdatePriceOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpdatePrice} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Price/Cost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}