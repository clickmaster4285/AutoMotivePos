// src/components/customers/CustomerForm.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Customer, Vehicle } from '@/types';
import { DialogFooter } from '../ui/dialog';

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  branch_id: string;
  vehicles: Vehicle[];
}

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  branches: { id: string; name: string }[];
  isAdmin: boolean;
  currentBranchId?: string;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  initialData,
  branches,
  isAdmin,
  currentBranchId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save Customer'
}: CustomerFormProps) {
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    branch_id: initialData?.branch_id || currentBranchId || branches[0]?.id || '',
  });
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialData?.vehicles || []);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', plateNumber: '', color: '' });
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);

  // Vehicle CRUD operations
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
    setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
    toast({ title: 'Success', description: 'Vehicle added successfully' });
  };

  const editVehicle = (index: number) => {
    const vehicle = vehicles[index];
    setNewVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      plateNumber: vehicle.plateNumber,
      color: vehicle.color || '',
    });
    setEditingVehicleIndex(index);
  };

  const updateVehicle = () => {
    if (editingVehicleIndex === null) return;
    
    if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
      toast({ 
        title: 'Validation Error', 
        description: 'Make, model, and plate number are required', 
        variant: 'destructive' 
      });
      return;
    }

    const updatedVehicles = [...vehicles];
    updatedVehicles[editingVehicleIndex] = {
      ...updatedVehicles[editingVehicleIndex],
      make: newVehicle.make,
      model: newVehicle.model,
      year: parseInt(newVehicle.year) || new Date().getFullYear(),
      plateNumber: newVehicle.plateNumber,
      color: newVehicle.color || '',
    };
    
    setVehicles(updatedVehicles);
    setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
    setEditingVehicleIndex(null);
    toast({ title: 'Success', description: 'Vehicle updated successfully' });
  };

  const deleteVehicle = (index: number) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    
    const updatedVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(updatedVehicles);
    
    if (editingVehicleIndex === index) {
      setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
      setEditingVehicleIndex(null);
    }
    
    toast({ title: 'Success', description: 'Vehicle removed successfully' });
  };

  const cancelVehicleEdit = () => {
    setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
    setEditingVehicleIndex(null);
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

    await onSubmit({
      ...form,
      vehicles: vehicles.filter(v => v.make && v.model && v.plateNumber)
    });
  };

  return (
    <div className="grid gap-4 py-4">
      {/* Customer Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input 
            value={form.name} 
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Customer name"
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
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {isAdmin && branches.length > 0 && (
          <div className="space-y-2">
            <Label>Branch *</Label>
            <Select value={form.branch_id} onValueChange={(v) => setForm(f => ({ ...f, branch_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            value={form.email} 
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email address"
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input 
            value={form.address} 
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Address"
          />
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Vehicles</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addVehicle}
            disabled={!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Vehicle
          </Button>
        </div>

        {/* Vehicle List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {vehicles.map((v, idx) => (
            <div key={v._id || v.id || `${v.plateNumber}-${idx}`} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <div className="flex-1">
                <span className="text-foreground font-medium">
                  {v.year} {v.make} {v.model}
                </span>
                <span className="text-muted-foreground ml-2">• {v.plateNumber}</span>
                {v.color && <span className="text-muted-foreground ml-2">({v.color})</span>}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => editVehicle(idx)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive"
                  onClick={() => deleteVehicle(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No vehicles added. Click "Add Vehicle" to add one.
            </p>
          )}
        </div>

        {/* Add/Edit Vehicle Form */}
        {(vehicles.length === 0 || editingVehicleIndex !== null) && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
            <Label className="text-sm">
              {editingVehicleIndex !== null ? 'Edit Vehicle' : 'New Vehicle'}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <Input 
                placeholder="Make *" 
                value={newVehicle.make} 
                onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))}
                className="col-span-1"
              />
              <Input 
                placeholder="Model *" 
                value={newVehicle.model} 
                onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))}
                className="col-span-1"
              />
              <Input 
                placeholder="Year" 
                value={newVehicle.year} 
                onChange={e => setNewVehicle(v => ({ ...v, year: e.target.value }))}
                className="col-span-1"
                type="number"
              />
              <Input 
                placeholder="Plate *" 
                value={newVehicle.plateNumber} 
                onChange={e => setNewVehicle(v => ({ ...v, plateNumber: e.target.value }))}
                className="col-span-1"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Input 
                placeholder="Color" 
                value={newVehicle.color} 
                onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
                className="col-span-3"
              />
              {editingVehicleIndex !== null ? (
                <div className="flex gap-1 col-span-1">
                  <Button size="sm" onClick={updateVehicle}>Update</Button>
                  <Button size="sm" variant="ghost" onClick={cancelVehicleEdit}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" onClick={addVehicle}>Add</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">* Required fields</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim() || !form.phone.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}