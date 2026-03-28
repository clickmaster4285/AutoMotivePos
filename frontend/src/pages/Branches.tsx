import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Building2, 
  Pencil, 
  MapPin, 
  Clock, 
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Store
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  fetchBranches, 
  createBranch, 
  updateBranch, 
  toggleBranchStatus,
  type CreateBranchBody 
} from '@/api/branches';
import { useAppState } from '@/providers/AppStateProvider';
import { canPerformAction } from '@/lib/permissions';
import type { Branch } from '@/types';

// Extended Branch type with all backend fields
interface ExtendedBranch extends Branch {
  tax_region?: string;
  opening_time?: string;
  closing_time?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  branch_manager?: string;
  address_details?: {
    country: string;
    state: string;
    city: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const timeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'AE', name: 'UAE' },
];

export default function BranchesPage() {
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const [branches, setBranches] = useState<ExtendedBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ExtendedBranch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = canPerformAction(currentUser, 'branches', 'create');
  const canEdit = canPerformAction(currentUser, 'branches', 'edit');
  const canDelete = canPerformAction(currentUser, 'branches', 'delete');

  const [form, setForm] = useState({
    branch_name: '',
    tax_region: '',
    opening_time: '09:00',
    closing_time: '18:00',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    branch_manager: '',
    address: {
      country: '',
      state: '',
      city: '',
    },
  });

  // Fetch branches on mount
  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await fetchBranches();
      setBranches(data as ExtendedBranch[]);
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load branches. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Filter branches based on search and status
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      // Convert address object to string for search
      const addressString = branch.address_details 
        ? `${branch.address_details.city} ${branch.address_details.state} ${branch.address_details.country}`.toLowerCase()
        : '';
      
      const matchesSearch = !search || 
        branch.name.toLowerCase().includes(search.toLowerCase()) ||
        addressString.includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && branch.status === 'ACTIVE') ||
        (statusFilter === 'inactive' && branch.status === 'INACTIVE');
      
      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  const openCreate = () => {
    setEditingBranch(null);
    setForm({
      branch_name: '',
      tax_region: '',
      opening_time: '09:00',
      closing_time: '18:00',
      status: 'ACTIVE',
      branch_manager: '',
      address: {
        country: '',
        state: '',
        city: '',
      },
    });
    setDialogOpen(true);
  };

  const openEdit = (branch: ExtendedBranch) => {
    console.log('Editing branch:', branch); // Debug log
    setEditingBranch(branch);
    setForm({
      branch_name: branch.name || '',
      tax_region: branch.tax_region || '',
      opening_time: branch.opening_time || '09:00',
      closing_time: branch.closing_time || '18:00',
      status: branch.status || 'ACTIVE',
      branch_manager: branch.branch_manager || '',
      address: {
        country: branch.address_details?.country || '',
        state: branch.address_details?.state || '',
        city: branch.address_details?.city || '',
      },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.branch_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Branch name is required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Clean up address - only include fields that have values
      const cleanAddress: any = {};
      if (form.address.country && form.address.country.trim()) cleanAddress.country = form.address.country;
      if (form.address.state && form.address.state.trim()) cleanAddress.state = form.address.state;
      if (form.address.city && form.address.city.trim()) cleanAddress.city = form.address.city;
      
      const data: CreateBranchBody = {
        branch_name: form.branch_name.trim(),
        tax_region: form.tax_region?.trim() || undefined,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        status: form.status,
        branch_manager: form.branch_manager?.trim() || undefined,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : undefined,
      };

      console.log('Saving branch data:', data); // Debug log

      if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, data);
        // Update the branch in the list
        setBranches(prev => prev.map(b => 
          b.id === updated.id 
            ? { 
                ...updated, 
                ...data,
                address_details: data.address,
                status: data.status,
              } as ExtendedBranch 
            : b
        ));
        toast({
          title: 'Success',
          description: 'Branch updated successfully',
        });
      } else {
        const created = await createBranch(data);
        setBranches(prev => [...prev, { 
          ...created, 
          ...data,
          address_details: data.address,
          status: data.status,
        } as ExtendedBranch]);
        toast({
          title: 'Success',
          description: 'Branch created successfully',
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save branch:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branch. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: ExtendedBranch) => {
    try {
      const updated = await toggleBranchStatus(branch.id);
      setBranches(prev => prev.map(b => 
        b.id === updated.id 
          ? { ...updated, status: updated.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' } as ExtendedBranch 
          : b
      ));
      toast({
        title: 'Success',
        description: `Branch ${updated.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Failed to toggle branch status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update branch status',
        variant: 'destructive',
      });
    }
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    if (status === 'ACTIVE') {
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Helper function to format address for display
  const formatAddress = (branch: ExtendedBranch): string => {
    if (branch.address_details) {
      const parts = [
        branch.address_details.city,
        branch.address_details.state,
        branch.address_details.country
      ].filter(p => p && p.trim());
      return parts.length > 0 ? parts.join(', ') : 'No address provided';
    }
    return 'No address provided';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Branches</h1>
          <p className="page-subtitle">Manage your business locations</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or address..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadBranches} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              {branches.filter(b => b.status === 'ACTIVE').length} active, {branches.filter(b => b.status === 'INACTIVE').length} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {branches.filter(b => b.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Locations</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {branches.filter(b => b.status === 'INACTIVE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No branches found</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first branch'}
          </p>
          {canCreate && (
            <Button onClick={openCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${branch.status === 'INACTIVE' ? 'opacity-75' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {branch.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-start gap-1 text-xs">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {formatAddress(branch)}
                      </div>
                    </CardDescription>
                  </div>
                  <StatusBadge status={branch.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {branch.opening_time && branch.closing_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {branch.opening_time} - {branch.closing_time}
                    </span>
                  </div>
                )}
                {branch.branch_manager && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Manager: {branch.branch_manager}</span>
                  </div>
                )}
                {branch.tax_region && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Tax Region: {branch.tax_region}</span>
                  </div>
                )}
              </CardContent>
              {(canEdit || canDelete) && (
                <div className="absolute bottom-4 right-4 flex gap-1">
                  {canEdit && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openEdit(branch)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleToggleStatus(branch)}
                      >
                        {branch.status === 'ACTIVE' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingBranch ? 'Update branch details and save.' : 'Enter branch details to create a new location.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Branch Name *</Label>
                <Input 
                  value={form.branch_name} 
                  onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))}
                  placeholder="e.g., Downtown Auto Center"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Branch Manager</Label>
                <Input 
                  value={form.branch_manager} 
                  onChange={e => setForm(f => ({ ...f, branch_manager: e.target.value }))}
                  placeholder="Name of branch manager"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tax Region</Label>
                <Input 
                  value={form.tax_region} 
                  onChange={e => setForm(f => ({ ...f, tax_region: e.target.value }))}
                  placeholder="e.g., California, UK, etc."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select 
                  value={form.address.country} 
                  onValueChange={v => setForm(f => ({ ...f, address: { ...f.address, country: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input 
                  value={form.address.state} 
                  onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                  placeholder="State or province"
                />
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <Input 
                  value={form.address.city} 
                  onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                  placeholder="City"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Opening Time</Label>
                  <Select 
                    value={form.opening_time} 
                    onValueChange={v => setForm(f => ({ ...f, opening_time: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Closing Time</Label>
                  <Select 
                    value={form.closing_time} 
                    onValueChange={v => setForm(f => ({ ...f, closing_time: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <Label>Branch Status</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${form.status === 'ACTIVE' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={form.status === 'ACTIVE'} 
                    onCheckedChange={checked => setForm(f => ({ ...f, status: checked ? 'ACTIVE' : 'INACTIVE' }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting || !form.branch_name.trim()}>
              {submitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}