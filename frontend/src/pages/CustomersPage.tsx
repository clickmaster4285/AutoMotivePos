// src/pages/CustomersPage.tsx
import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { useCustomersQuery, useCreateCustomerMutation, useDeleteCustomerMutation, useUpdateCustomerMutation } from '@/hooks/useCustomers';
import { useBranchesForUi } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Users, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { canPerformAction } from '@/lib/permissions';
import { CustomerForm, CustomerFormData } from '@/components/customers/CustomerForm';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { useCustomerDialog } from '@/components/customers/useCustomerDialog';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const { toast } = useToast();
  const { currentUser, currentBranchId } = useAppState();
  const { branches = [] } = useBranchesForUi();
  const customersQuery = useCustomersQuery();
  const createCustomerMutation = useCreateCustomerMutation();
  const updateCustomerMutation = useUpdateCustomerMutation();
  const deleteCustomerMutation = useDeleteCustomerMutation();
  
  const customers = customersQuery.data ?? [];
  const canCreate = canPerformAction(currentUser, 'customers', 'create');
  const canEdit = canPerformAction(currentUser, 'customers', 'edit');
  const canDelete = canPerformAction(currentUser, 'customers', 'delete');
  const isAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { 
    isOpen, 
    editingCustomer, 
    viewingCustomer, 
    openCreateDialog, 
    openEditDialog, 
    openViewDialog, 
    closeDialog, 
    closeViewDialog 
  } = useCustomerDialog();

  const filtered = customers.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleSaveCustomer = async (data: CustomerFormData) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({ id: editingCustomer.id, body: data });
        toast({ title: 'Success', description: 'Customer updated successfully' });
      } else {
        await createCustomerMutation.mutateAsync(data);
        toast({ title: 'Success', description: 'Customer created successfully' });
      }
      closeDialog();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save customer', 
        variant: 'destructive' 
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their vehicles and service history.')) return;
    try {
      await deleteCustomerMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Customer deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    }
  };

  if (customersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer records and vehicles</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void customersQuery.refetch()}
            className="gap-2"
            disabled={customersQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {search ? 'No customers match your search' : 'No customers found'}
        </div>
      ) : (
        <CustomerTable
          customers={filtered}
          onViewCustomer={openViewDialog}
          onEditCustomer={openEditDialog}
          onDeleteCustomer={handleDeleteCustomer}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit' : 'Add'} Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            initialData={editingCustomer ? {
              name: editingCustomer.name,
              phone: editingCustomer.phone,
              email: editingCustomer.email,
              address: editingCustomer.address,
              branch_id: editingCustomer.branch_id,
              vehicles: editingCustomer.vehicles,
            } : undefined}
            branches={branches}
            isAdmin={isAdmin}
            currentBranchId={currentBranchId}
            onSubmit={handleSaveCustomer}
            onCancel={closeDialog}
            isSubmitting={submitting}
            submitLabel={editingCustomer ? 'Update Customer' : 'Create Customer'}
          />
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <CustomerDetail customer={viewingCustomer} onClose={closeViewDialog} />
    </div>
  );
}