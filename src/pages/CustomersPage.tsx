import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Users, Pencil, Trash2, Car } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Customer, Vehicle } from '@/types';

export default function CustomersPage() {
  const { customers, jobCards, invoices, currentUser, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const role = currentUser?.role;
  const canCreate = canPerformAction(role, 'customers', 'create');
  const canEdit = canPerformAction(role, 'customers', 'edit');
  const canDelete = canPerformAction(role, 'customers', 'delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vForm, setVForm] = useState({ make: '', model: '', year: '', plateNumber: '', color: '' });

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', address: '' });
    setVehicles([]);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address });
    setVehicles(c.vehicles);
    setDialogOpen(true);
  };

  const addVehicle = () => {
    if (vForm.make && vForm.model && vForm.plateNumber) {
      setVehicles(v => [...v, { id: uuid(), make: vForm.make, model: vForm.model, year: parseInt(vForm.year) || 2024, plateNumber: vForm.plateNumber, color: vForm.color }]);
      setVForm({ make: '', model: '', year: '', plateNumber: '', color: '' });
    }
  };

  const handleSave = () => {
    if (editing) {
      updateCustomer(editing.id, { ...form, vehicles });
    } else {
      addCustomer({ ...form, vehicles });
    }
    setDialogOpen(false);
  };

  const customerJobs = (customerId: string) => jobCards.filter(j => j.customerId === customerId);
  const customerSpend = (customerId: string) => invoices.filter(i => i.customerId === customerId).reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer records and vehicles</p>
        </div>
        {canCreate && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />No customers found
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Vehicles</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Jobs</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Spent</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Credit</th>
              {(canEdit || canDelete) && <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailCustomer(c)}>
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.phone}</td>
                  <td className="p-3 text-muted-foreground">{c.email}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{c.vehicles.length}</span></td>
                  <td className="p-3"><span className="text-xs font-mono">{customerJobs(c.id).length}</span></td>
                  <td className="p-3 text-right font-mono text-xs text-foreground">${customerSpend(c.id).toFixed(2)}</td>
                  <td className="p-3 text-right">
                    {(c.creditBalance || 0) > 0 ? (
                      <span className="text-xs font-mono text-warning">${c.creditBalance.toFixed(2)}</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      {canEdit && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>}
                      {canDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCustomer(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
        <DialogContent>
          {detailCustomer && (
            <>
              <DialogHeader><DialogTitle>{detailCustomer.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{detailCustomer.phone}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{detailCustomer.email}</span></div>
                  <div><span className="text-muted-foreground">Total Spent:</span> <span className="text-foreground font-mono">${customerSpend(detailCustomer.id).toFixed(2)}</span></div>
                  <div><span className="text-muted-foreground">Credit:</span> <span className="text-warning font-mono">${(detailCustomer.creditBalance || 0).toFixed(2)}</span></div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Car className="h-3 w-3" /> Vehicles</p>
                  {detailCustomer.vehicles.map(v => (
                    <div key={v.id} className="p-2 bg-muted rounded mb-1 text-foreground">
                      {v.year} {v.make} {v.model} — <span className="font-mono">{v.plateNumber}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Service History</p>
                  {customerJobs(detailCustomer.id).length === 0 ? (
                    <p className="text-muted-foreground text-xs">No service history</p>
                  ) : customerJobs(detailCustomer.id).map(j => (
                    <div key={j.id} className="flex justify-between p-2 bg-muted rounded mb-1">
                      <span className="font-mono text-xs text-foreground">{j.jobNumber}</span>
                      <span className="text-xs text-foreground">{j.vehicleName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{j.status.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Customer</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Vehicles</Label>
              <div className="grid grid-cols-5 gap-2">
                <Input placeholder="Make" value={vForm.make} onChange={e => setVForm(f => ({ ...f, make: e.target.value }))} />
                <Input placeholder="Model" value={vForm.model} onChange={e => setVForm(f => ({ ...f, model: e.target.value }))} />
                <Input placeholder="Year" value={vForm.year} onChange={e => setVForm(f => ({ ...f, year: e.target.value }))} />
                <Input placeholder="Plate" value={vForm.plateNumber} onChange={e => setVForm(f => ({ ...f, plateNumber: e.target.value }))} />
                <Button type="button" variant="secondary" size="sm" onClick={addVehicle}>Add</Button>
              </div>
              {vehicles.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span className="text-foreground">{v.year} {v.make} {v.model} — {v.plateNumber}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setVehicles(prev => prev.filter(x => x.id !== v.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Customer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
