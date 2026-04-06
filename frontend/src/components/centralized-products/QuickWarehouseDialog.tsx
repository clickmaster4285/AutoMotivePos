// components/centralized-products/QuickWarehouseDialog.tsx
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCreateWarehouseMutation } from '@/hooks/api/useWarehouses';
import { useBranchesForUi } from '@/hooks/useBranches';
import { City, Country, State } from "country-state-city";

interface QuickWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (warehouse: any) => void;
}

export function QuickWarehouseDialog({ open, onOpenChange, onSuccess }: QuickWarehouseDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const createWarehouseMutation = useCreateWarehouseMutation();
  const { branches } = useBranchesForUi();
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    warehouse_type: 'MAIN',
    branch_id: '',
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

  const generateCodeFromName = (name: string) => {
    if (!name.trim()) return '';
    let code = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    code = code.slice(0, 6);
    if (code.length < 3) {
      code = code + Math.floor(Math.random() * 100);
    }
    return `WH-${code}`;
  };

  const handleNameChange = (value: string) => {
    setForm(f => ({ 
      ...f, 
      name: value,
      code: (!f.code || f.code.startsWith('WH-')) 
        ? generateCodeFromName(value) 
        : f.code
    }));
  };

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

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Warehouse name and code are required',
        variant: 'destructive'
      });
      return;
    }

    const warehouseData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
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

    if (!warehouseData.branch_id) {
      delete warehouseData.branch_id;
    }

    setSubmitting(true);
    try {
      const result = await createWarehouseMutation.mutateAsync(warehouseData);
      toast({ title: 'Success', description: 'Warehouse created successfully' });
      onSuccess(result);
      onOpenChange(false);
      // Reset form
      setForm({
        name: '',
        code: '',
        warehouse_type: 'MAIN',
        branch_id: '',
        location: { country: '', state: '', city: '' },
      });
      setCountryIso("");
      setStateIso("");
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to create warehouse',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Warehouse
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
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

            <div className="space-y-2">
              <Label>Branch (Optional)</Label>
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
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-foreground">Location Details (Optional)</h3>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={submitting || !form.name.trim() || !form.code.trim()}
          >
            {submitting ? 'Creating...' : 'Create Warehouse'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}