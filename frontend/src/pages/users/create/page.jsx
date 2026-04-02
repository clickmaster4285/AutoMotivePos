'use client';

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { StaffForm } from '@/components/users/StaffForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/context/roles';
import { useBranches } from '@/hooks/useBranches';

const StaffCreatePage = () => {
  const {
    formData,
    isUserLoading,
    permissionsLoading,
    transformedAllPermissions,
    updateFormField,
    handleSubmit,
    resetForm,
    createUserMutation,
    updateUserMutation,
  } = useUsersHook();

  const { data: branches = [], isLoading: branchesLoading } = useBranches();

  if (isUserLoading || branchesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header mb-0">
        <Button variant="ghost" asChild className="mb-2 -ml-2 gap-2 px-2">
          <Link to="/hr/employees">
            <ChevronLeft className="h-4 w-4" /> User management
          </Link>
        </Button>
        <h1 className="page-title">Add user</h1>
        <p className="page-subtitle">Create a staff profile, employment details, and system access</p>
      </div>

      <StaffForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        editingUser={null}
        createUserMutation={createUserMutation}
        updateUserMutation={updateUserMutation}
        allPermissions={transformedAllPermissions}
        permissionsLoading={permissionsLoading}
        ROLES={ROLES}
        branches={branches}
      />
    </div>
  );
};

export default StaffCreatePage;
