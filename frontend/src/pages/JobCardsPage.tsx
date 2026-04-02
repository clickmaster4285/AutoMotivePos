import { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppState } from '@/providers/AppStateProvider';
import { useCustomersQuery } from '@/hooks/useCustomers';
import { useProductsQuery } from '@/hooks/api/useProducts';
import { useJobCardsQuery, useCreateJobCardMutation, useUpdateJobCardStatusMutation } from '@/hooks/api/useJobCards';
import { useStaffList } from '@/api/users.api';
import { useBranchesForUi } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Wrench, Clock, CheckCircle, Truck as TruckIcon, Pause } from 'lucide-react';
import { canPerformAction, canViewAllBranchesData } from '@/lib/permissions';
import type { JobCard, JobStatus, JobService, JobPart } from '@/types';

const statusConfig: Record<JobStatus, { label: string; class: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', class: 'status-pending', icon: Clock },
  in_progress: { label: 'In Progress', class: 'status-progress', icon: Wrench },
  waiting_parts: { label: 'Waiting Parts', class: 'status-waiting', icon: Pause },
  completed: { label: 'Completed', class: 'status-completed', icon: CheckCircle },
  delivered: { label: 'Delivered', class: 'status-delivered', icon: TruckIcon },
  paid: { label: 'Paid', class: 'status-paid', icon: CheckCircle },
};

export default function JobCardsPage() {
  const { currentBranchId, currentUser } = useAppState();
  const { data: customers = [] } = useCustomersQuery();
  const { data: products = [] } = useProductsQuery();
  const { data: jobCards = [] } = useJobCardsQuery();
  const { data: staff = [] } = useStaffList();
  const { branches = [] } = useBranchesForUi();
  const createJobCardMutation = useCreateJobCardMutation();
  const updateStatusMutation = useUpdateJobCardStatusMutation();
  const role = currentUser?.role;
  const isAdmin = role === 'admin';
  const canCreate = canPerformAction(currentUser, 'jobs', 'create');
  const canEditJob = canPerformAction(currentUser, 'jobs', 'edit');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<JobCard | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId);
  const [createStatus, setCreateStatus] = useState<JobStatus>('pending');
  const createBranchId = isAdmin ? selectedBranchId : currentBranchId;

  const viewAllOrg = canViewAllBranchesData(currentUser);
  const technicians = useMemo(() => {
    return staff
      .filter((u) => String(u.role || '').toLowerCase() === 'technician')
      .map((u) => ({
        id: u._id,
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Technician',
        branchId: typeof u.branch_id === 'string' ? u.branch_id : u.branch_id?._id,
      }))
      .filter((u) => viewAllOrg || u.branchId === createBranchId);
  }, [staff, viewAllOrg, createBranchId]);
  const branchJobs = useMemo(() => {
    let list = jobCards;
    // Technicians only see their own jobs
    if (role === 'technician') {
      list = list.filter(j => j.technicianId === currentUser?.id);
    } else if (!viewAllOrg) {
      list = list.filter(j => j.branchId === currentBranchId);
    }
    return list
      .filter(j => statusFilter === 'all' || j.status === statusFilter)
      .filter(j => !search || j.jobNumber.toLowerCase().includes(search.toLowerCase()) || j.customerName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobCards, currentBranchId, statusFilter, search, viewAllOrg, role, currentUser?.id]);

  const branchProducts = products.filter((p) => p.branch_id === createBranchId);

  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [techId, setTechId] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<JobService[]>([]);
  const [parts, setParts] = useState<JobPart[]>([]);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');

  const selectedCustomer = customers.find(c => c.id === customerId);

  const openCreate = () => {
    setCustomerId(''); setVehicleId(''); setTechId(''); setNotes('');
    setSelectedBranchId(currentBranchId);
    setCreateStatus('pending');
    setServices([]); setParts([]);
    setDialogOpen(true);
  };

  const addService = () => {
    if (svcName && svcPrice) {
      setServices(s => [...s, { id: uuid(), name: svcName, price: parseFloat(svcPrice) || 0 }]);
      setSvcName(''); setSvcPrice('');
    }
  };

  const addPart = (productId: string) => {
    const product = branchProducts.find(p => p.id === productId);
    if (product && !parts.find(p => p.productId === productId)) {
      setParts(prev => [
        ...prev,
        {
          id: uuid(),
          productId,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price ?? 0,
        },
      ]);
    }
  };

  const handleCreate = async () => {
    const customer = customers.find(c => c.id === customerId);
    const vehicle = customer?.vehicles.find(v => (v._id || v.id) === vehicleId);
    const tech = technicians.find(u => u.id === techId);
    if (!customer || !vehicle) return;

    await createJobCardMutation.mutateAsync({
      customerId,
      customerName: customer.name,
      vehicleId,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      branchId: createBranchId,
      technicianId: techId || undefined,
      technicianName: tech?.name,
      status: createStatus,
      services,
      parts,
      notes,
    });
    setDialogOpen(false);
  };

  const getTotal = (j: JobCard) => {
    const svcTotal = j.services.reduce((s, sv) => s + sv.price, 0);
    const partTotal = j.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    return svcTotal + partTotal;
  };

  const techPerformance = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number }> = {};
    jobCards.forEach(j => {
      if (j.technicianId && j.technicianName) {
        if (!map[j.technicianId]) map[j.technicianId] = { name: j.technicianName, total: 0, completed: 0 };
        map[j.technicianId].total++;
        if (j.status === 'completed' || j.status === 'paid') map[j.technicianId].completed++;
      }
    });
    return Object.values(map);
  }, [jobCards]);

  // Technicians can only update status (limited transitions)
  const allowedStatusTransitions: Record<string, JobStatus[]> = {
    technician: ['in_progress', 'waiting_parts', 'completed'],
  };

  const getAvailableStatuses = () => {
        if (role === 'technician') {
      return Object.entries(statusConfig).filter(([k]) => allowedStatusTransitions.technician.includes(k as JobStatus));
    }
        // Hide legacy `delivered` from UI selections.
        return Object.entries(statusConfig).filter(([k]) => k !== 'delivered');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Job Cards</h1>
          <p className="page-subtitle">
            {role === 'technician' ? 'Your assigned jobs' : 'Workshop job management'}
          </p>
        </div>
        {canCreate && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Job Card</Button>}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig)
              .filter(([k]) => k !== 'delivered')
              .map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {(viewAllOrg || role === 'branch_manager') && techPerformance.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {techPerformance.map(tp => (
            <div key={tp.name} className="bg-card border rounded-lg p-3 min-w-[160px] shrink-0">
              <p className="text-xs text-muted-foreground">{tp.name}</p>
              <p className="text-lg font-bold text-foreground">{tp.completed}/{tp.total}</p>
              <p className="text-[10px] text-muted-foreground">completed jobs</p>
            </div>
          ))}
        </div>
      )}

      {branchJobs.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {role === 'technician' ? 'No jobs assigned to you' : 'No job cards found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchJobs.map(job => {
            const sc = statusConfig[job.status];
            return (
              <div key={job.id} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailJob(job)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold text-foreground">{job.jobNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sc.class}`}>{sc.label}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{job.customerName}</p>
                <p className="text-xs text-muted-foreground">{job.vehicleName}</p>
                {job.technicianName && <p className="text-xs text-muted-foreground mt-1">Tech: {job.technicianName}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</span>
                  <span className="text-sm font-semibold text-foreground">${getTotal(job).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailJob} onOpenChange={() => setDetailJob(null)}>
        <DialogContent className="max-w-lg">
          {detailJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailJob.jobNumber}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusConfig[detailJob.status].class}`}>
                    {statusConfig[detailJob.status].label}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium text-foreground">{detailJob.customerName}</span></div>
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium text-foreground">{detailJob.vehicleName}</span></div>
                  {detailJob.technicianName && <div><span className="text-muted-foreground">Technician:</span> <span className="font-medium text-foreground">{detailJob.technicianName}</span></div>}
                </div>
                {detailJob.services.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Services</p>
                    {detailJob.services.map(s => (
                      <div key={s.id} className="flex justify-between text-sm py-1">
                        <span className="text-foreground">{s.name}</span><span className="font-mono text-foreground">${s.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {detailJob.parts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parts</p>
                    {detailJob.parts.map(p => (
                      <div key={p.id} className="flex justify-between text-sm py-1">
                        <span className="text-foreground">{p.productName} x{p.quantity}</span><span className="font-mono text-foreground">${(p.quantity * p.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span className="text-foreground">Total</span><span className="text-foreground">${getTotal(detailJob).toFixed(2)}</span>
                </div>
                {canEditJob && (
                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <Select
                      value={detailJob.status}
                      onValueChange={async v => {
                        const nextStatus = v as JobStatus;
                        await updateStatusMutation.mutateAsync({ id: detailJob.id, status: nextStatus });
                        setDetailJob({ ...detailJob, status: nextStatus });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getAvailableStatuses().map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Job Card</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={createStatus} onValueChange={v => setCreateStatus(v as JobStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig)
                      .filter(([k]) => k !== 'delivered')
                      .map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={v => { setCustomerId(v); setVehicleId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} disabled={!selectedCustomer}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {selectedCustomer?.vehicles.map((v, idx) => {
                      const vehicleKey = v._id || v.id || `${v.plateNumber}-${idx}`;
                      return <SelectItem key={vehicleKey} value={vehicleKey}>{v.year} {v.make} {v.model}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Technician</Label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Services</Label>
              <div className="flex gap-2">
                <Input placeholder="Service name" value={svcName} onChange={e => setSvcName(e.target.value)} />
                <Input placeholder="Price" type="number" className="w-24" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} />
                <Button type="button" variant="secondary" size="sm" onClick={addService}>Add</Button>
              </div>
              {services.map(s => (
                <div key={s.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                  <span>{s.name}</span><span className="font-mono">${s.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Parts</Label>
              <Select onValueChange={addPart}>
                <SelectTrigger><SelectValue placeholder="Add a part..." /></SelectTrigger>
                <SelectContent>
                  {branchProducts
                    .filter((p) => (p.stock ?? 0) > 0)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (${(p.price ?? 0).toFixed(2)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {parts.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>{p.productName}</span>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="w-16 h-7 text-xs" value={p.quantity} min={1}
                      onChange={e => setParts(prev => prev.map(x => x.id === p.id ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} />
                    <span className="font-mono text-xs">${(p.quantity * p.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={!customerId || !vehicleId}>Create Job Card</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
