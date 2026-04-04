// src/pages/CustomersPage.tsx
import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useCustomersQuery, useCreateCustomerMutation, useDeleteCustomerMutation, useUpdateCustomerMutation } from '@/hooks/useCustomers';
import { useBranchesForUi } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Users, Pencil, Trash2, Car, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { canPerformAction } from '@/lib/permissions';
import type { Customer, Vehicle } from '@/types';

export default function CustomersPage() {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const customersQuery = useCustomersQuery();
  const createCustomerMutation = useCreateCustomerMutation();
  const updateCustomerMutation = useUpdateCustomerMutation();
  const deleteCustomerMutation = useDeleteCustomerMutation();
  const customers = customersQuery.data ?? [];
  
  const canCreate = canPerformAction(currentUser, 'customers', 'create');
  const canEdit = canPerformAction(currentUser, 'customers', 'edit');
  const canDelete = canPerformAction(currentUser, 'customers', 'delete');
  const isAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', plateNumber: '', color: '' });
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId || '');

  const filtered = customers.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', address: '' });
    setVehicles([]);
    setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
    setEditingVehicleIndex(null);
    setSelectedBranchId(currentBranchId || branches[0]?.id || '');
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ 
      name: c.name, 
      phone: c.phone, 
      email: c.email || '', 
      address: c.address || '' 
    });
    setVehicles(c.vehicles || []);
    setNewVehicle({ make: '', model: '', year: '', plateNumber: '', color: '' });
    setEditingVehicleIndex(null);
    setSelectedBranchId(c.branch_id || currentBranchId || branches[0]?.id || '');
    setDialogOpen(true);
  };

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

  const handleSave = async () => {
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
      const data = { 
        ...form, 
        branch_id: isAdmin ? selectedBranchId : currentBranchId,
        vehicles: vehicles.filter(v => v.make && v.model && v.plateNumber) 
      };
      
      if (editing) {
        await updateCustomerMutation.mutateAsync({ id: editing.id, body: data });
        toast({ title: 'Success', description: 'Customer updated successfully' });
      } else {
        await createCustomerMutation.mutateAsync(data);
        toast({ title: 'Success', description: 'Customer created successfully' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save customer', 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their vehicles and service history.')) return;
    try {
      await deleteCustomerMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Customer deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    }
  };

  if (customersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer records and vehicles</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void customersQuery.refetch()}
            className="gap-2"
            disabled={customersQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {search ? 'No customers match your search' : 'No customers found'}
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Vehicles</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Jobs</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Spent</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Credit</th>
                  {(canEdit || canDelete) && (
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr 
                    key={c.id} 
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" 
                    onClick={() => setDetailCustomer(c)}
                  >
                    <td className="p-3 font-medium text-foreground">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.phone}</td>
                    <td className="p-3 text-muted-foreground">{c.email || '—'}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {c.vehicles?.length || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-mono">0</span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-foreground">
                      $0.00
                    </td>
                    <td className="p-3 text-right">
                      {(c.creditBalance || 0) > 0 ? (
                        <span className="text-xs font-mono text-yellow-600">${c.creditBalance?.toFixed(2)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive" 
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
        <DialogContent className="max-w-lg">
          {detailCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{detailCustomer.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="text-foreground">{detailCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="text-foreground">{detailCustomer.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Spent:</span>{' '}
                    <span className="text-foreground font-mono">$0.00</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credit:</span>{' '}
                    <span className="text-yellow-600 font-mono">
                      ${(detailCustomer.creditBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {detailCustomer.address && (
                  <div>
                    <span className="text-muted-foreground">Address:</span>{' '}
                    <span className="text-foreground">{detailCustomer.address}</span>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                    <Car className="h-3 w-3" /> Vehicles
                  </p>
                  {detailCustomer.vehicles && detailCustomer.vehicles.length > 0 ? (
                    detailCustomer.vehicles.map((v, idx) => (
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
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Customer</DialogTitle>
          </DialogHeader>
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
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting || !form.name.trim() || !form.phone.trim() || (isAdmin && !selectedBranchId)}>
              {submitting ? 'Saving...' : editing ? 'Update Customer' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}