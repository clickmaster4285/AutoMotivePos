import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface InventoryHeaderProps {
  canCreate: boolean;
  onAddProduct: () => void;
}

export function InventoryHeader({ canCreate, onAddProduct }: InventoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="page-header mb-0">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Manage parts and products</p>
      </div>
      {canCreate && (
        <Button onClick={onAddProduct} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      )}
    </div>
  );
}