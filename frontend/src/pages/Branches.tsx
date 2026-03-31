// pages/BranchesPage.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppState } from "@/providers/AppStateProvider";
import { canPerformAction } from "@/lib/permissions";
import type { Branch } from "@/types";
import {
  useBranches as useBranchesQuery,
  useCreateBranchMutation,
  useToggleBranchStatusMutation,
  useUpdateBranchMutation,
} from "@/hooks/useBranches";
import type { CreateBranchBody } from "@/api/branches";
import { useStaffList } from "@/api/users.api";
import { BranchStats } from "@/components/branches/BranchStats";
import { BranchFilters } from "@/components/branches/BranchFilters";
import { BranchCard } from "@/components/branches/BranchCard";
import { BranchDialog } from "@/components/branches/BranchDialog";

export default function BranchesPage() {
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const branchesQuery = useBranchesQuery();
  const staffQuery = useStaffList();
  const createBranchMutation = useCreateBranchMutation();
  const updateBranchMutation = useUpdateBranchMutation();
  const toggleBranchStatusMutation = useToggleBranchStatusMutation();

  const branches = branchesQuery.data ?? [];
  const managerOptions = useMemo(() => {
    const users = staffQuery.data ?? [];
    return users
      .filter((u) => String(u.role ?? "").toLowerCase() === "manager")
      .map((u) => ({
        value: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u._id,
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Unnamed Manager",
      }));
  }, [staffQuery.data]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const canCreate = canPerformAction(currentUser, "branches", "create");
  const canEdit = canPerformAction(currentUser, "branches", "edit");

  const [formData, setFormData] = useState({
    branch_name: "",
    tax_region: "",
    opening_time: "09:00",
    closing_time: "18:00",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    branch_manager: "",
    address: {
      country: "",
      state: "",
      city: "",
    },
  });

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const addressString = branch.address_details
        ? `${branch.address_details.city} ${branch.address_details.state} ${branch.address_details.country}`.toLowerCase()
        : "";
      const matchesSearch =
        !search ||
        branch.name.toLowerCase().includes(search.toLowerCase()) ||
        addressString.includes(search.toLowerCase());
      const status = branch.status ?? "ACTIVE";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && status === "ACTIVE") ||
        (statusFilter === "inactive" && status === "INACTIVE");
      return matchesSearch && matchesStatus;
    });
  }, [branches, search, statusFilter]);

  const openCreate = () => {
    setEditingBranch(null);
    setFormData({
      branch_name: "",
      tax_region: "",
      opening_time: "09:00",
      closing_time: "18:00",
      status: "ACTIVE",
      branch_manager: "",
      address: { country: "", state: "", city: "" },
    });
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.name || "",
      tax_region: branch.tax_region || "",
      opening_time: branch.opening_time || "09:00",
      closing_time: branch.closing_time || "18:00",
      status: branch.status || "ACTIVE",
      branch_manager: branch.branch_manager || "",
      address: {
        country: branch.address_details?.country || "",
        state: branch.address_details?.state || "",
        city: branch.address_details?.city || "",
      },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.branch_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Branch name is required",
        variant: "destructive",
      });
      return;
    }

    const cleanAddress: Record<string, string> = {};
    if (formData.address.country.trim()) cleanAddress.country = formData.address.country;
    if (formData.address.state.trim()) cleanAddress.state = formData.address.state;
    if (formData.address.city.trim()) cleanAddress.city = formData.address.city;

    const data: CreateBranchBody = {
      branch_name: formData.branch_name.trim(),
      tax_region: formData.tax_region?.trim() || undefined,
      opening_time: formData.opening_time,
      closing_time: formData.closing_time,
      status: formData.status,
      branch_manager: formData.branch_manager?.trim() || undefined,
      address: Object.keys(cleanAddress).length > 0 ? cleanAddress : undefined,
    };

    try {
      if (editingBranch) {
        await updateBranchMutation.mutateAsync({ id: editingBranch.id, body: data });
        toast({ title: "Success", description: "Branch updated successfully" });
      } else {
        await createBranchMutation.mutateAsync(data);
        toast({ title: "Success", description: "Branch created successfully" });
      }
      setDialogOpen(false);
      await branchesQuery.refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save branch",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    const newStatus = (branch.status ?? "ACTIVE") === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    
    try {
      await toggleBranchStatusMutation.mutateAsync(branch.id);
      toast({
        title: "Success",
        description: `Branch ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      });
      await branchesQuery.refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update branch status",
        variant: "destructive",
      });
    }
  };

  const activeCount = branches.filter((b) => (b.status ?? "ACTIVE") === "ACTIVE").length;
  const inactiveCount = branches.length - activeCount;

  if (branchesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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

      <BranchFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => branchesQuery.refetch()}
        isRefreshing={branchesQuery.isFetching}
      />

      <BranchStats
        total={branches.length}
        active={activeCount}
        inactive={inactiveCount}
      />

      {filteredBranches.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No branches found</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first branch"}
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
            <BranchCard
              key={branch.id}
              branch={branch}
              canEdit={canEdit}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingBranch={editingBranch}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
        isSaving={createBranchMutation.isPending || updateBranchMutation.isPending}
        managerOptions={managerOptions}
        isManagersLoading={staffQuery.isLoading}
      />
    </div>
  );
}