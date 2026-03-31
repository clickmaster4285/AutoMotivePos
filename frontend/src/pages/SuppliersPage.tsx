import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import {
  useSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/hooks/api/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Truck, Pencil, Trash2 } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Supplier } from '@/api/supplier';

export default function SuppliersPage() {
  const { currentUser } = useAppState();
  const { data: suppliers = [] } = useSuppliersQuery();
  const createSupplierMutation = useCreateSupplierMutation();
  const updateSupplierMutation = useUpdateSupplierMutation();
  const deleteSupplierMutation = useDeleteSupplierMutation();
  const canCreate = canPerformAction(currentUser, 'suppliers', 'create');
  const canEdit = canPerformAction(currentUser, 'suppliers', 'edit');
  const canDelete = canPerformAction(currentUser, 'suppliers', 'delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });

  const filtered = suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' }); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email, address: s.address }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editing) {
      await updateSupplierMutation.mutateAsync({
        id: editing.id,
        body: {
          company_name: form.name,
          contact_person: form.contactPerson,
          phone: form.phone,
          email: form.email,
          address: form.address,
        },
      });
    } else {
      await createSupplierMutation.mutateAsync({
        company_name: form.name,
        contact_person: form.contactPerson,
        phone: form.phone,
        email: form.email,
        address: form.address,
      });
    }
    setDialogOpen(false);
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
                  <td className="p-3 font-medium text-foreground">{s.name}</td>
                  <td className="p-3 text-muted-foreground">{s.contactPerson}</td>
                  <td className="p-3 text-muted-foreground">{s.phone}</td>
                  <td className="p-3 text-muted-foreground">{s.email}</td>
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
              <div className="space-y-2"><Label>Company Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}>{editing ? 'Update' : 'Add'} Supplier</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
