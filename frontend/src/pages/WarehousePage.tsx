import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Pencil, Trash2, MapPin, Package, Sparkles } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import { useToast } from '@/components/ui/use-toast';
import { City, Country, State } from "country-state-city";
import {
  useWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} from '@/hooks/api/useWarehouses';
import { useBranchesForUi } from '@/hooks/useBranches';
import type { Warehouse } from '@/api/warehouse';

export default function WarehousesPage() {
  const { toast } = useToast();
  const { currentUser } = useAppState();
  const { branches, isLoadingBranches } = useBranchesForUi();
  const warehousesQuery = useWarehousesQuery();
  const createWarehouseMutation = useCreateWarehouseMutation();
  const updateWarehouseMutation = useUpdateWarehouseMutation();
  const deleteWarehouseMutation = useDeleteWarehouseMutation();
  const warehouses = warehousesQuery.data ?? [];
  
  const isAdmin = String(currentUser?.role ?? '').toLowerCase() === 'admin';


  const canCreate = canPerformAction(currentUser, 'warehouses', 'create');
  const canEdit = canPerformAction(currentUser, 'warehouses', 'edit');
  const canDelete = canPerformAction(currentUser, 'warehouses', 'delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    branch_id: '',
    warehouse_type: 'MAIN',
    location: {
      country: '',
      state: '',
      city: '',
    },
  });

  const [countryIso, setCountryIso] = useState<string>("");
  const [stateIso, setStateIso] = useState<string>("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => (countryIso ? State.getStatesOfCountry(countryIso) : []), [countryIso]);
  const cities = useMemo(() => (countryIso && stateIso ? City.getCitiesOfState(countryIso, stateIso) : []), [countryIso, stateIso]);

  const findCountryIsoByName = (name: string | undefined): string => {
    const n = String(name ?? "").trim().toLowerCase();
    if (!n) return "";
    return countries.find((c) => c.name.trim().toLowerCase() === n)?.isoCode ?? "";
  };
  const findStateIsoByName = (cIso: string, name: string | undefined): string => {
    const n = String(name ?? "").trim().toLowerCase();
    if (!cIso || !n) return "";
    return State.getStatesOfCountry(cIso).find((s) => s.name.trim().toLowerCase() === n)?.isoCode ?? "";
  };

  // Function to generate warehouse code from name
  const generateCodeFromName = (name: string) => {
    if (!name.trim()) return '';
    
    // Convert to uppercase and remove special characters
    let code = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Take first 6 characters
    code = code.slice(0, 6);
    
    // If code is less than 3 characters, add random numbers
    if (code.length < 3) {
      code = code + Math.floor(Math.random() * 100);
    }
    
    // Add WH prefix for warehouse
    code = `WH-${code}`;
    
    // Check for duplicates and add suffix if needed
    let finalCode = code;
    let counter = 1;
    while (warehouses.some(w => w.code === finalCode && (!editing || w.id !== editing.id))) {
      finalCode = `${code}${counter}`;
      counter++;
    }
    
    return finalCode;
  };

  // Auto-generate code when name changes
  const handleNameChange = (value: string) => {
    setForm(f => ({ 
      ...f, 
      name: value,
      // Only auto-generate if code is empty or starts with WH-
      code: (!f.code || f.code.startsWith('WH-')) 
        ? generateCodeFromName(value) 
        : f.code
    }));
  };

  // Manual auto-generate button handler
  const handleAutoGenerateCode = () => {
    if (!form.name.trim()) {
      toast({
        title: 'Cannot generate code',
        description: 'Please enter a warehouse name first',
        variant: 'destructive'
      });
      return;
    }
    
    const newCode = generateCodeFromName(form.name);
    setForm(f => ({ ...f, code: newCode }));
    toast({
      title: 'Code generated',
      description: `Generated code: ${newCode}`,
    });
  };

 const filtered = warehouses
  .filter(w =>
    !search ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.location?.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.location?.state || '').toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (a.id < b.id) return 1;
    if (a.id > b.id) return -1;
    return 0;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      branch_id: '',
      name: '',
      code: '',
      warehouse_type: 'MAIN',
      status: 'ACTIVE',
      location: {
        country: '',
        state: '',
        city: '',
      },
    });
    setCountryIso("");
    setStateIso("");
    setDialogOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    const existingCountry = (w as any).location?.country || '';
    const existingState = (w as any).location?.state || '';
    const nextCountryIso = findCountryIsoByName(existingCountry);
    const nextStateIso = findStateIsoByName(nextCountryIso, existingState);

    setEditing(w);
    setForm({
      branch_id: (w as any).branch_id || (w as any).branchId || branches[0]?.id || '',
      name: w.name,
      code: w.code,
      warehouse_type: (w as any).warehouse_type || (w as any).type || 'MAIN',
      status: w.status,
      location: {
        country: (w as any).location?.country || '',
        state: (w as any).location?.state || '',
        city: (w as any).location?.city || '',
      },
    });
    setCountryIso(nextCountryIso);
    setStateIso(nextStateIso);
    setDialogOpen(true);
  };

  // If user clears the country/state strings manually (or via API), keep dependent picks consistent
  useEffect(() => {
    if (!dialogOpen) return;
    if (!form.location.country) {
      setCountryIso("");
      setStateIso("");
      return;
    }
    const nextCountryIso = findCountryIsoByName(form.location.country);
    if (nextCountryIso && nextCountryIso !== countryIso) {
      setCountryIso(nextCountryIso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, form.location.country]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (!form.location.state) {
      setStateIso("");
      return;
    }
    if (!countryIso) return;
    const nextStateIso = findStateIsoByName(countryIso, form.location.state);
    if (nextStateIso && nextStateIso !== stateIso) {
      setStateIso(nextStateIso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, countryIso, form.location.state]);

  const handleSave = async () => {
    // Validation
    if (!form.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Warehouse name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!form.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Warehouse code is required',
        variant: 'destructive'
      });
      return;
    }



    // Prepare data matching MongoDB schema
    const warehouseData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      status: form.status,
      warehouse_type: form.warehouse_type,
      branch_id: form.branch_id || undefined,
      location: {
        country: form.location.country || undefined,
        state: form.location.state || undefined,
        city: form.location.city || undefined,
      },
    };

    // Remove empty location fields
    if (warehouseData.location) {
      Object.keys(warehouseData.location).forEach(key => {
        if (!warehouseData.location[key]) {
          delete warehouseData.location[key];
        }
      });
      if (Object.keys(warehouseData.location).length === 0) {
        delete warehouseData.location;
      }
    }

    // Remove branch_id if empty
    if (!warehouseData.branch_id) {
      delete warehouseData.branch_id;
    }

   

    setSubmitting(true);
    try {
      if (editing) {
        await updateWarehouseMutation.mutateAsync({ 
          id: editing.id, 
          body: warehouseData 
        });
        toast({ 
          title: 'Success', 
          description: 'Warehouse updated successfully' 
        });
      } else {
        await createWarehouseMutation.mutateAsync(warehouseData);
        toast({ 
          title: 'Success', 
          description: 'Warehouse created successfully' 
        });
      }
      setDialogOpen(false);
      await warehousesQuery.refetch();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to save warehouse',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await deleteWarehouseMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Warehouse deleted successfully' });
      await warehousesQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to delete warehouse',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'text-green-100 bg-green-700' : 'text-red-100 bg-red-700';
  };

  const getWarehouseTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      MAIN: 'Main Warehouse',
      SUB: 'Sub Warehouse',
      DISTRIBUTION: 'Distribution Center',
      RETAIL: 'Retail Storage',
    };
    return types[type] || 'Main Warehouse';
  };

  const getLocationDisplay = (location: any) => {
    const parts = [];
    if (location?.city) parts.push(location.city);
    if (location?.state) parts.push(location.state);
    if (location?.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(', ') : 'No location set';
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

      {warehousesQuery.isLoading || isLoadingBranches ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Loading warehouses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No warehouses found
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
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
                  const branch = branches.find(b => b.id === (w as any).branch_id);
                  const locationDisplay = getLocationDisplay((w as any).location);
                  
                  return (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs font-medium text-foreground">
                        {w.code}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {w.name}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-primary text-gray-900 font-medium">
                          {getWarehouseTypeLabel((w as any).warehouse_type || 'MAIN')}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {branch?.name || '—'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {locationDisplay}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(w.status)}`}>
                          {w.status}
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => openEdit(w)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDelete(w.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g., Northside Storage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., WH-NORTH"
                      className="uppercase flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAutoGenerateCode}
                      title="Auto-generate code from name"
                      disabled={!form.name.trim()}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the sparkle icon to auto-generate code from warehouse name
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse Type</Label>
                  <Select 
                    value={form.warehouse_type} 
                    onValueChange={val => setForm(f => ({ ...f, warehouse_type: val }))}
                  >
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

                {isAdmin &&  <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={form.branch_id}
                    onValueChange={val => setForm(f => ({ ...f, branch_id: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>}
          


              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={form.status} 
                  onValueChange={val => setForm(f => ({ ...f, status: val as 'ACTIVE' | 'INACTIVE' }))}
                >
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

            {/* Location Information */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Location Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={countryIso || "none"}
                    onValueChange={(iso) => {
                      if (iso === "none") {
                        setCountryIso("");
                        setStateIso("");
                        setForm((f) => ({
                          ...f,
                          location: { ...f.location, country: "", state: "", city: "" },
                        }));
                        return;
                      }
                      const c = countries.find((x) => x.isoCode === iso);
                      setCountryIso(iso);
                      setStateIso("");
                      setForm((f) => ({
                        ...f,
                        location: { ...f.location, country: c?.name ?? "", state: "", city: "" },
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No country</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={stateIso || "none"}
                    onValueChange={(iso) => {
                      if (iso === "none") {
                        setStateIso("");
                        setForm((f) => ({
                          ...f,
                          location: { ...f.location, state: "", city: "" },
                        }));
                        return;
                      }
                      const s = states.find((x) => x.isoCode === iso);
                      setStateIso(iso);
                      setForm((f) => ({
                        ...f,
                        location: { ...f.location, state: s?.name ?? "", city: "" },
                      }));
                    }}
                    disabled={!countryIso}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={countryIso ? "Select state" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No state</SelectItem>
                      {states.map((s) => (
                        <SelectItem key={`${s.countryCode}-${s.isoCode}`} value={s.isoCode}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={form.location.city || "none"}
                    onValueChange={(name) => {
                      setForm((f) => ({
                        ...f,
                        location: { ...f.location, city: name === "none" ? "" : name },
                      }));
                    }}
                    disabled={!countryIso || !stateIso}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={countryIso && stateIso ? "Select city" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No city</SelectItem>
                      {cities.map((c) => (
                        <SelectItem key={`${c.countryCode}-${c.stateCode}-${c.name}`} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={submitting || !form.name.trim() || !form.code.trim()}
            >
              {submitting ? 'Saving...' : editing ? 'Update Warehouse' : 'Add Warehouse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}