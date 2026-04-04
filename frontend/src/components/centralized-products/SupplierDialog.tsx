// components/centralized-products/SupplierDialog.tsx
import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCreateSupplierMutation } from '@/hooks/api/useSuppliers';
import { useBranchesForUi } from '@/hooks/useBranches';

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (supplierId: string) => void;
}

export function SupplierDialog({ open, onOpenChange, onSuccess }: SupplierDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const createSupplierMutation = useCreateSupplierMutation();
  const { branches = [] } = useBranchesForUi();
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId || '');

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Company name required', variant: 'destructive' });
      return;
    }
    
    if (isAdmin && !selectedBranchId) {
      toast({ title: 'Validation', description: 'Please select a branch', variant: 'destructive' });
      return;
    }

    try {
      const newSupplier = await createSupplierMutation.mutateAsync({
        company_name: form.name,
        contact_person: form.contactPerson,
        phone: form.phone,
        email: form.email,
        address: form.address,
        ...(isAdmin ? { branch_id: selectedBranchId } : {}),
      });
      
      toast({ title: 'Success', description: 'Supplier created successfully' });
      onOpenChange(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      setSelectedBranchId(currentBranchId || '');
      
      if (onSuccess) {
        onSuccess(newSupplier.id);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create supplier', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                placeholder='Enter Company Name'
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input 
                value={form.contactPerson} 
                placeholder='Contact person name' 
                onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={form.phone} 
                placeholder='+92 **********' 
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={form.email} 
                placeholder='Enter Email' 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Address</Label>
            <Input 
              value={form.address} 
              placeholder='Enter Address' 
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
            />
          </div>
          
          {isAdmin && (
            <div className="space-y-2">
              <Label>Branch</Label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createSupplierMutation.isPending}>
            {createSupplierMutation.isPending ? 'Creating...' : 'Create Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}