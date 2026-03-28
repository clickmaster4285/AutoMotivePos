'use client';

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Edit, Trash2, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      navigate('/user-management');
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
        <Link to="/user-management" className="text-primary underline-offset-2 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header mb-0 flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 -ml-2 gap-2 px-2">
            <Link to="/user-management">
              <ChevronLeft className="h-4 w-4" /> User management
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
              <Link to={`/user-management/${staff._id}/edit`}>
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

      <Card className="border-border/80 shadow-sm max-w-4xl">
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
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="text-sm font-mono">{staff.userId ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              {staff.email || '—'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              {formatPhoneNumberForDisplay(staff.phone)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <Badge variant="outline" className="font-medium mt-1">
              {getRoleLabel(staff.role)}
            </Badge>
          </div>
          {staff.createdAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p className="text-base">
                {new Date(staff.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          {staff.lastLogin && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last login</p>
              <p className="text-base">
                {new Date(staff.lastLogin).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {staff.permissions && staff.permissions.length > 0 ? (
                staff.permissions.map((p) => (
                  <Badge key={p} variant="secondary" className="font-normal text-xs">
                    {p.replace(/:/g, ' · ')}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No explicit permissions assigned.</p>
              )}
            </div>
          </div>
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
