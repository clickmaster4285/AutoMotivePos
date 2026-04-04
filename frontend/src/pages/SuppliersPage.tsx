import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import {
  useSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/hooks/api/useSuppliers';
import { useBranchesForUi } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Truck, Pencil, Trash2 } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Supplier } from '@/api/supplier';

export default function SuppliersPage() {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const { data: suppliers = [] } = useSuppliersQuery();
  const createSupplierMutation = useCreateSupplierMutation();
  const updateSupplierMutation = useUpdateSupplierMutation();
  const deleteSupplierMutation = useDeleteSupplierMutation();
  const canCreate = canPerformAction(currentUser, 'suppliers', 'create');
  const canEdit = canPerformAction(currentUser, 'suppliers', 'edit');
  const canDelete = canPerformAction(currentUser, 'suppliers', 'delete');
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId || '');

  const filtered = suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
   setSelectedBranchId(''); 
    setDialogOpen(true);
  };
const openEdit = (s: Supplier) => {
 
  setEditing(s);
  setForm({ 
    name: s.name, 
    contactPerson: s.contactPerson, 
    phone: s.phone, 
    email: s.email, 
    address: s.address 
  });
  setSelectedBranchId(s.branch_id || '');
  setDialogOpen(true);
};

  const handleSave = async () => {
    try {
      if (editing) {
        await updateSupplierMutation.mutateAsync({
          id: editing.id,
          body: {
            company_name: form.name,
            contact_person: form.contactPerson,
            phone: form.phone,
            email: form.email,
            address: form.address,
            ...(isAdmin ? { branch_id: selectedBranchId } : {}),
          },
        });
      } else {
        if (isAdmin && !selectedBranchId) {
          toast({
            title: 'Validation error',
            description: 'Please select a branch',
            variant: 'destructive',
          });
          return;
        }
        await createSupplierMutation.mutateAsync({
          company_name: form.name,
          contact_person: form.contactPerson,
          phone: form.phone,
          email: form.email,
          address: form.address,
          ...(isAdmin ? { branch_id: selectedBranchId } : {}),
        });
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save supplier';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0"><h1 className="page-title">Suppliers</h1><p className="page-subtitle">Manage supplier contacts</p></div>
        {canCreate && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Supplier</Button>}
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground"><Truck className="h-8 w-8 mx-auto mb-2 opacity-40" />No suppliers found</div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              {(canEdit || canDelete) && <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>}
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td  onClick={() => setDetailSupplier(s)}  className="p-3 font-medium text-foreground">{s.name}</td>
                  <td  onClick={() => setDetailSupplier(s)}  className="p-3 text-muted-foreground">{s.contactPerson}</td>
                  <td  onClick={() => setDetailSupplier(s)}  className="p-3 text-muted-foreground">{s.phone}</td>
                  <td  onClick={() => setDetailSupplier(s)}   className="p-3 text-muted-foreground">{s.email}</td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right">
                      {canEdit && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>}
                      {canDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSupplierMutation.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Supplier</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company Name</Label>
                <Input
                  value={form.name}
                  placeholder='Enter Company Name'
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} placeholder='Contact person name' onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} placeholder='+92 **********' onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} placeholder='Enter Email' onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} placeholder='Enter Address' onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            {isAdmin  && (
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
          <DialogFooter><Button onClick={handleSave} disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}>{editing ? 'Update' : 'Add'} Supplier</Button></DialogFooter>
        </DialogContent>
      </Dialog>

            {/* Detail Dialog - Click on supplier row to view details */}
      <Dialog open={!!detailSupplier} onOpenChange={() => setDetailSupplier(null)}>
        <DialogContent className="max-w-lg">
          {detailSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {detailSupplier.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                      <p className="text-sm font-medium text-foreground">{detailSupplier.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
                      <p className="text-sm text-foreground">{detailSupplier.contactPerson || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Contact Details
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                        <p className="text-sm text-foreground font-mono">{detailSupplier.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                        <p className="text-sm text-foreground break-words">{detailSupplier.email || '—'}</p>
                      </div>
                    </div>
                    {detailSupplier.address && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Address</p>
                        <p className="text-sm text-foreground">{detailSupplier.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Additional Information
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Branch</p>
                        <p className="text-sm text-foreground">
                          {branches.find(b => b.id === detailSupplier.branch_id)?.name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-700 text-green-100">
                          Active
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created Date</p>
                        <p className="text-sm text-foreground">
                          {(detailSupplier as any).createdAt ? new Date((detailSupplier as any).createdAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
                        <p className="text-sm font-semibold text-foreground">
                          {(detailSupplier as any).totalPurchases || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {canEdit && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        setDetailSupplier(null);
                        openEdit(detailSupplier);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Supplier
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        setDetailSupplier(null);
                        deleteSupplierMutation.mutate(detailSupplier.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Supplier
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
