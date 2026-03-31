import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Pencil, Trash2, MapPin, Package } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Warehouse } from '@/types';

export default function WarehousesPage() {
  const { warehouses, branches, currentUser, addWarehouse, updateWarehouse, deleteWarehouse } = useAppState();
  const canCreate = canPerformAction(currentUser, 'warehouses', 'create');
  const canEdit = canPerformAction(currentUser, 'warehouses', 'edit');
  const canDelete = canPerformAction(currentUser, 'warehouses', 'delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({
    branch_id: '',
    warehouse_name: '',
    warehouse_type: 'MAIN',
    status: 'ACTIVE',
    location: {
      country: '',
      state: '',
      city: '',
      address_line: ''
    }
  });

  const filtered = warehouses.filter(w => 
    !search || 
    w.warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
    w.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      branch_id: branches[0]?.id || '',
      warehouse_name: '',
      warehouse_type: 'MAIN',
      status: 'ACTIVE',
      location: { country: '', state: '', city: '', address_line: '' }
    });
    setDialogOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({
      branch_id: w.branch_id,
      warehouse_name: w.warehouse_name,
      warehouse_type: w.warehouse_type,
      status: w.status,
      location: w.location || { country: '', state: '', city: '', address_line: '' }
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) updateWarehouse(editing.id, form);
    else addWarehouse(form);
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getWarehouseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'MAIN': 'Main Warehouse',
      'SUB': 'Sub Warehouse',
      'DISTRIBUTION': 'Distribution Center',
      'RETAIL': 'Retail Storage'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Warehouses</h1>
          <p className="page-subtitle">Manage warehouse locations and inventory storage</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search warehouses by name or city..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No warehouses found
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Warehouse Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Branch</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                {(canEdit || canDelete) && (
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const branch = branches.find(b => b.id === w.branch_id);
                const location = w.location;
                const locationDisplay = [location?.city, location?.state, location?.country]
                  .filter(Boolean)
                  .join(', ');
                
                return (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {w.warehouse_name}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {getWarehouseTypeLabel(w.warehouse_type)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {branch?.name || 'Not Assigned'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {locationDisplay || 'No location set'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-3 text-right">
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWarehouse(w.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Warehouse</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse Name *</Label>
                  <Input 
                    value={form.warehouse_name} 
                    onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} 
                    placeholder="e.g., Northside Storage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={form.branch_id} onValueChange={val => setForm(f => ({ ...f, branch_id: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse Type</Label>
                  <Select value={form.warehouse_type} onValueChange={val => setForm(f => ({ ...f, warehouse_type: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAIN">Main Warehouse</SelectItem>
                      <SelectItem value="SUB">Sub Warehouse</SelectItem>
                      <SelectItem value="DISTRIBUTION">Distribution Center</SelectItem>
                      <SelectItem value="RETAIL">Retail Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input 
                    value={form.location.country} 
                    onChange={e => setForm(f => ({ 
                      ...f, 
                      location: { ...f.location, country: e.target.value }
                    }))} 
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Province</Label>
                  <Input 
                    value={form.location.state} 
                    onChange={e => setForm(f => ({ 
                      ...f, 
                      location: { ...f.location, state: e.target.value }
                    }))} 
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input 
                    value={form.location.city} 
                    onChange={e => setForm(f => ({ 
                      ...f, 
                      location: { ...f.location, city: e.target.value }
                    }))} 
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line</Label>
                  <Input 
                    value={form.location.address_line} 
                    onChange={e => setForm(f => ({ 
                      ...f, 
                      location: { ...f.location, address_line: e.target.value }
                    }))} 
                    placeholder="Street address"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Warehouse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}