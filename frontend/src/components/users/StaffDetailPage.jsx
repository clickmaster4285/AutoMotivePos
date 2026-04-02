'use client';

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Edit, Trash2, CheckCircle, XCircle, ChevronLeft, Briefcase, Clock, Banknote, MapPin, Landmark, Shield } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';

import { usePermissions } from '@/hooks/usePermissions';
import { useUserQuery, useDeleteStaff } from '@/api/users.api';
import { ROLES } from '@/context/roles';

const getRoleLabel = (roleValue) => {
  const role = ROLES.find((r) => r.value === roleValue);
  return role ? role.label : roleValue;
};

const getStatusBadge = (user) => (user.isActive ? 'Active' : 'Inactive');
const getStatusVariant = (user) => (user.isActive ? 'success' : 'destructive');

export const StaffDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: staff, isLoading, error } = useUserQuery(id);
  const deleteStaffMutation = useDeleteStaff();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (!staff?._id) return;
    const toastId = toast.loading('Deleting staff member...');
    try {
      await deleteStaffMutation.mutateAsync(staff._id);
      toast.success('Staff member deleted successfully.', { id: toastId });
      setIsDeleteDialogOpen(false);
      navigate('/hr/employees');
    } catch (err) {
      toast.error('Failed to delete staff member.', {
        id: toastId,
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  }, [staff, deleteStaffMutation, navigate]);

  const canEdit = useMemo(() => can('users:update'), [can]);
  const canDelete = useMemo(() => can('users:delete'), [can]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        Error loading staff details: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 text-muted-foreground">
        Staff member not found.{' '}
        <Link to="/hr/employees" className="text-primary underline-offset-2 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workDays = Array.isArray(staff.shift?.workDays) ? staff.shift.workDays : [];

  return (
    <div className="space-y-6">
      <div className="page-header mb-0 flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-2 gap-2 px-2">
            <Link to="/hr/employees">
              <ChevronLeft className="h-4 w-4" /> HR
            </Link>
          </Button>
          <h1 className="page-title">
            {staff.firstName} {staff.lastName || ''}
          </h1>
          <p className="page-subtitle">Profile and access</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button asChild className="gap-2">
              <Link to={`/hr/employees/${staff._id}/edit`}>
                <Edit className="h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/80 shadow-sm max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/60">
          <div className="flex items-center gap-4">
            <UserAvatar user={staff} size="xl" className="ring-2 ring-primary/20" />
            <div>
              <CardTitle className="text-xl font-heading tracking-tight">
                {staff.firstName} {staff.lastName || ''}
              </CardTitle>
              <Badge variant={getStatusVariant(staff)} className="mt-2 capitalize">
                {staff.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {getStatusBadge(staff)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Identity & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">{staff.userId ?? staff._id ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Email</p>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  {staff.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Phone</p>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  {formatPhoneNumberForDisplay(staff.phone)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-semibold text-muted-foreground">Role</p>
                <Badge variant="outline" className="font-medium">
                  {getRoleLabel(staff.role)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-lg border bg-muted/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System access</p>
                  <p className="text-sm font-semibold">{staff.hasSystemAccess ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-lg border bg-muted/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">2FA</p>
                  <p className="text-sm font-semibold">{staff.isTwoFactorEnabled ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {staff.createdAt && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Joined</p>
                  <p className="text-sm">
                    {new Date(staff.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
              {staff.lastLogin && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Last login</p>
                  <p className="text-sm">
                    {new Date(staff.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employment + Shift */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Employment & Shift
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{staff.employment?.department || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Designation</p>
                  <p className="text-sm font-medium">{staff.employment?.designation || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{staff.employment?.status || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Hire date</p>
                  <p className="text-sm font-medium">
                    {staff.employment?.hireDate ? new Date(staff.employment.hireDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Shift time
                </p>
                <p className="text-sm font-mono font-semibold">
                  {staff.shift?.startTime || '—'} - {staff.shift?.endTime || '—'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work days</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day) => {
                    const active = workDays.includes(day);
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                          {day.slice(0, 3)}
                        </span>
                        <span className={active ? "h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.35)]" : "h-3 w-3 rounded-full bg-muted-foreground/20"} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll + Contacts */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" /> Payroll & Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Pay type</p>
                  <p className="text-sm font-medium">{staff.salary?.payType || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">Base amount</p>
                  <p className="text-sm font-mono font-semibold">
                    ${(staff.salary?.baseAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground">Payment method</p>
                  <p className="text-sm font-medium">{String(staff.salary?.paymentMethod || '—').replace(/_/g, ' ')}</p>
                </div>
              </div>

              {(staff.salary?.bankDetails?.bankName || staff.salary?.bankDetails?.accountNumber) && (
                <div className="rounded-lg border bg-muted/10 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5" /> Bank details
                  </p>
                  <p className="text-sm font-medium">{staff.salary?.bankDetails?.bankName || '—'}</p>
                  <p className="text-xs font-mono text-muted-foreground">{staff.salary?.bankDetails?.accountNumber || ''}</p>
                  {staff.salary?.bankDetails?.iban && (
                    <p className="text-[10px] font-mono text-muted-foreground/70">IBAN: {staff.salary.bankDetails.iban}</p>
                  )}
                </div>
              )}

              <div className="rounded-lg border bg-muted/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </p>
                <p className="text-sm text-muted-foreground">
                  {staff.address?.street || ''}{staff.address?.street ? <br /> : null}
                  {staff.address?.city || ''}{staff.address?.city ? ', ' : ''}{staff.address?.state || ''} {staff.address?.zip || ''}{(staff.address?.city || staff.address?.state || staff.address?.zip) ? <br /> : null}
                  {staff.address?.country || '—'}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Emergency contact</p>
                <p className="text-sm font-medium">{staff.emergencyContact?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{staff.emergencyContact?.relationship || '—'}</p>
                <p className="text-xs font-mono text-muted-foreground">{staff.emergencyContact?.phone || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          {/* Permissions */}
          <Card className="border-border/60 shadow-none lg:col-span-3">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm">Permissions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {Array.isArray(staff.permissions) && staff.permissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-xs uppercase tracking-tighter">Module</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter">Menu</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter text-center">Create</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter text-center">Read</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter text-center">Update</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Group permissions by module:menu
                      const grouped = new Map();

                      staff.permissions
                        .filter(Boolean)
                        .forEach((perm) => {
                          const [module, menu, action] = String(perm).split(':');
                          const key = `${module}:${menu}`;

                          if (!grouped.has(key)) {
                            grouped.set(key, { module, menu, actions: new Set() });
                          }
                          if (action) {
                            grouped.get(key).actions.add(action.toLowerCase());
                          }
                        });

                      return Array.from(grouped.values())
                        .sort((a, b) => String(a.module).localeCompare(String(b.module)) ||
                          String(a.menu).localeCompare(String(b.menu)))
                        .map(({ module, menu, actions }) => (
                          <TableRow key={`${module}:${menu}`} className="hover:bg-muted/5">
                            <TableCell className="text-sm font-medium capitalize">
                              {String(module || '—').replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell className="text-sm capitalize">
                              {String(menu || '—').replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell className="text-center">
                              {actions.has('create') ? (
                                <span className="text-green-600 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✗</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {actions.has('read') ? (
                                <span className="text-green-600 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✗</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {actions.has('update') ? (
                                <span className="text-green-600 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✗</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {actions.has('delete') ? (
                                <span className="text-green-600 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✗</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                    })()}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No explicit permissions assigned.</p>
              )}
            </CardContent>
          </Card>

          {/* Histories */}
          <Card className="border-border/60 shadow-none lg:col-span-3">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Salary history</p>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-xs uppercase tracking-tighter">Effective</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter text-right">Amount</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(staff.salaryHistory) && staff.salaryHistory.length > 0 ? (
                      [...staff.salaryHistory].reverse().slice(0, 20).map((x, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">{x.effectiveDate ? new Date(x.effectiveDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-sm font-mono font-semibold text-right">${Number(x.baseAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{x.payType || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">No records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Shift history</p>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-xs uppercase tracking-tighter">Effective</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter">Time</TableHead>
                      <TableHead className="text-xs uppercase tracking-tighter">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(staff.shiftHistory) && staff.shiftHistory.length > 0 ? (
                      [...staff.shiftHistory].reverse().slice(0, 20).map((x, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">{x.effectiveDate ? new Date(x.effectiveDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-sm font-mono font-semibold">{x.startTime || '—'} - {x.endTime || '—'}</TableCell>
                          <TableCell className="text-sm">{Array.isArray(x.workDays) ? x.workDays.map((d) => String(d).slice(0, 3)).join(', ') : '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">No records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {staff?.firstName} {staff?.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteStaffMutation.isPending}
            >
              {deleteStaffMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
