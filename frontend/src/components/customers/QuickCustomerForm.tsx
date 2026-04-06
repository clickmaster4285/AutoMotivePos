// src/components/customers/QuickCustomerForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCreateCustomerMutation } from '@/hooks/useCustomers';
import { Plus, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/types';

interface QuickCustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string, customerName: string) => void;
  defaultBranchId?: string;
}

export function QuickCustomerForm({ open, onClose, onSuccess, defaultBranchId }: QuickCustomerFormProps) {
  const { toast } = useToast();
  const createCustomerMutation = useCreateCustomerMutation();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: ''
  });

  const addVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
      toast({
        title: 'Validation Error',
        description: 'Make, model, and plate number are required',
        variant: 'destructive'
      });
      return;
    }

    const vehicle: Vehicle = {
      make: newVehicle.make,
      model: newVehicle.model,
      year: parseInt(newVehicle.year) || new Date().getFullYear(),
      plateNumber: newVehicle.plateNumber,
      color: newVehicle.color || '',
    };

    setVehicles([...vehicles, vehicle]);
    setNewVehicle({
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      plateNumber: '',
      color: ''
    });
    setShowVehicleForm(false);
    toast({ title: 'Success', description: 'Vehicle added successfully' });
  };

  const removeVehicle = (index: number) => {
    const updatedVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(updatedVehicles);
    toast({ title: 'Success', description: 'Vehicle removed successfully' });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name and phone are required', 
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCustomerMutation.mutateAsync({
        ...form,
        branch_id: defaultBranchId,
        vehicles: vehicles,
      });
      
      toast({ title: 'Success', description: 'Customer created successfully' });
      
      if (onSuccess) {
        onSuccess(result.id, result.name);
      }
      
      // Reset form
      setForm({ name: '', phone: '', email: '', address: '' });
      setVehicles([]);
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create customer', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Customer</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Customer Basic Info */}
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Customer name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input 
              value={form.phone} 
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label>Email (optional)</Label>
            <Input 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email address"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Address (optional)</Label>
            <Input 
              value={form.address} 
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Address"
            />
          </div>

          {/* Vehicles Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Vehicles (Optional)</Label>
              {!showVehicleForm && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVehicleForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Vehicle
                </Button>
              )}
            </div>

            {/* Vehicle List */}
            {vehicles.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {vehicles.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex-1">
                      <span className="text-foreground font-medium">
                        {v.year} {v.make} {v.model}
                      </span>
                      <span className="text-muted-foreground ml-2">• {v.plateNumber}</span>
                      {v.color && <span className="text-muted-foreground ml-2">({v.color})</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeVehicle(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Vehicle Form */}
            {showVehicleForm && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <Label className="text-sm">Add Vehicle</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Make *" 
                    value={newVehicle.make} 
                    onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))}
                  />
                  <Input 
                    placeholder="Model *" 
                    value={newVehicle.model} 
                    onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))}
                  />
                  <Input 
                    placeholder="Year" 
                    value={newVehicle.year} 
                    onChange={e => setNewVehicle(v => ({ ...v, year: e.target.value }))}
                    type="number"
                  />
                  <Input 
                    placeholder="Plate Number *" 
                    value={newVehicle.plateNumber} 
                    onChange={e => setNewVehicle(v => ({ ...v, plateNumber: e.target.value }))}
                  />
                  <Input 
                    placeholder="Color" 
                    value={newVehicle.color} 
                    onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
                    className="col-span-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addVehicle}>
                    Add Vehicle
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setShowVehicleForm(false);
                      setNewVehicle({
                        make: '',
                        model: '',
                        year: new Date().getFullYear().toString(),
                        plateNumber: '',
                        color: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">* Required fields</p>
              </div>
            )}

            {vehicles.length === 0 && !showVehicleForm && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No vehicles added. Click "Add Vehicle" to add one.
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.phone.trim()}>
            {submitting ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}