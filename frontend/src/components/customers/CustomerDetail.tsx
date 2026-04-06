// src/components/customers/CustomerDetail.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Car } from 'lucide-react';
import type { Customer } from '@/types';

interface CustomerDetailProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  if (!customer) return null;

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Phone:</span>{' '}
              <span className="text-foreground">{customer.phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="text-foreground">{customer.email || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Spent:</span>{' '}
              <span className="text-foreground font-mono">$0.00</span>
            </div>
            <div>
              <span className="text-muted-foreground">Credit:</span>{' '}
              <span className="text-yellow-600 font-mono">
                ${(customer.creditBalance || 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          {customer.address && (
            <div>
              <span className="text-muted-foreground">Address:</span>{' '}
              <span className="text-foreground">{customer.address}</span>
            </div>
          )}
          
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Car className="h-3 w-3" /> Vehicles
            </p>
            {customer.vehicles && customer.vehicles.length > 0 ? (
              customer.vehicles.map((v, idx) => (
                <div key={v._id || v.id || `${v.plateNumber}-${idx}`} className="p-2 bg-muted rounded mb-1 text-foreground">
                  {v.year} {v.make} {v.model} —{' '}
                  <span className="font-mono">{v.plateNumber}</span>
                  {v.color && <span className="ml-2 text-muted-foreground">({v.color})</span>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-xs">No vehicles registered</p>
            )}
          </div>
          
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Service History</p>
            <p className="text-muted-foreground text-xs">No service history available</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}