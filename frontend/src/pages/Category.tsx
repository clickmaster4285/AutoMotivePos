import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryStatusMutation,
  useUpdateCategoryMutation,
} from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Grid, Pencil, Trash2, RefreshCw, Loader2, Power, PowerOff, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { canPerformAction } from '@/lib/permissions';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const { toast } = useToast();
  const { currentUser } = useAppState();
  const categoriesQuery = useCategoriesQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const toggleCategoryStatusMutation = useToggleCategoryStatusMutation();
  const categories = categoriesQuery.data ?? [];
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = canPerformAction(currentUser, 'categories', 'create');
  const canEdit = canPerformAction(currentUser, 'categories', 'edit');
  const canDelete = canPerformAction(currentUser, 'categories', 'delete');

 const [form, setForm] = useState({
  categoryName: '',
  categoryCode: '',
  description: '',
  department: 'all' as
    | 'mechanical'
    | 'electrical'
    | 'paint'
    | 'service'
    | 'tires'
    | 'ac'
    | 'diagnostics'
    | 'detailing'
    | 'all'
});

  // Function to generate category code from name
  const generateCodeFromName = (name: string) => {
    if (!name.trim()) return '';
    
    // Convert to uppercase and remove special characters
    let code = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Take first 8 characters or less
    code = code.slice(0, 8);
    
    // If code is less than 3 characters, add random numbers
    if (code.length < 3) {
      code = code + Math.floor(Math.random() * 1000);
    }
    
    // Check for duplicates and add suffix if needed
    let finalCode = code;
    let counter = 1;
    while (categories.some(c => c.code === finalCode && (!editing || c.id !== editing.id))) {
      finalCode = `${code}${counter}`;
      counter++;
    }
    
    return finalCode;
  };

  // Auto-generate code when name changes
  const handleNameChange = (value: string) => {
    setForm(f => ({ 
      ...f, 
      categoryName: value,
      // Only auto-generate if code is empty or was auto-generated
      categoryCode: (!f.categoryCode || f.categoryCode === generateCodeFromName(f.categoryName)) 
        ? generateCodeFromName(value) 
        : f.categoryCode
    }));
  };

  // Manual auto-generate button handler
  const handleAutoGenerateCode = () => {
    if (!form.categoryName.trim()) {
      toast({
        title: 'Cannot generate code',
        description: 'Please enter a category name first',
        variant: 'destructive'
      });
      return;
    }
    
    const newCode = generateCodeFromName(form.categoryName);
    setForm(f => ({ ...f, categoryCode: newCode }));
    toast({
      title: 'Code generated',
      description: `Generated code: ${newCode}`,
    });
  };

  const filtered = categories.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      categoryName: '',
      categoryCode: '',
      description: '',
      department: 'All'
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      categoryName: c.name,
      categoryCode: c.code,
      description: c.description || '',
      department: c.department
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.categoryName.trim() || !form.categoryCode.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name and code are required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await updateCategoryMutation.mutateAsync({
          id: editing.id,
          body: {
            categoryName: form.categoryName,
            categoryCode: form.categoryCode,
            description: form.description,
            department: form.department,
          },
        });
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        await createCategoryMutation.mutateAsync(form);
        toast({ title: 'Success', description: 'Category created successfully' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await toggleCategoryStatusMutation.mutateAsync(category.id);
      toast({
        title: 'Success',
        description: `Category ${category.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle category status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will set its status to INACTIVE.')) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Category deleted successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

const getDepartmentBadgeColor = (department: string) => {
  switch (department) {
    case 'mechanical':
      return 'bg-primary text-blue-700';
    case 'electrical':
      return 'bg-primary text-yellow-700';
    case 'paint':
      return 'bg-red-100 text-red-700';
    case 'service':
      return 'bg-green-100 text-green-700';
    case 'tires':
      return 'bg-orange-100 text-orange-700';
    case 'ac':
      return 'bg-teal-100 text-teal-700';
    case 'diagnostics':
      return 'bg-purple-100 text-purple-700';
    case 'detailing':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-primary text-gray-900 font-medium';
  }
};

  if (categoriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage product categories and departments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void categoriesQuery.refetch()}
            className="gap-2"
            disabled={categoriesQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Grid className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {search ? 'No categories match your search' : 'No categories found'}
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}    className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td onClick={() => setDetailCategory(c)} className="p-3 font-mono text-xs font-medium text-foreground">
                      {c.code}
                    </td>
                    <td onClick={() => setDetailCategory(c)}  className="p-3 font-medium text-foreground">
                      {c.name}
                    </td>
                    <td onClick={() => setDetailCategory(c)} className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDepartmentBadgeColor(c.department)}`}>
                        {c.department}
                      </span>
                    </td>
                    <td onClick={() => setDetailCategory(c)} className="p-3 text-muted-foreground max-w-xs truncate">
                      {c.description || '—'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        c.status === 'ACTIVE' 
                          ? 'bg-green-700 text-green-100' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {c.status === 'ACTIVE' ? (
                          <Power className="h-3 w-3" />
                        ) : (
                          <PowerOff className="h-3 w-3" />
                        )}
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleStatus(c)}
                          >
                            {c.status === 'ACTIVE' ? (
                              <PowerOff className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Power className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </Button>
                        )}
                       
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  value={form.categoryName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g., Casual Shirts"
                />
              </div>
              <div className="space-y-2">
                <Label>Category Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.categoryCode}
                    onChange={e => setForm(f => ({ ...f, categoryCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CSHIRT"
                    className="uppercase flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAutoGenerateCode}
                    title="Auto-generate code from name"
                    disabled={!form.categoryName.trim()}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value as any }))}
              >
                 <option value="all">All</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Paint">Paint</option>
                <option value="Service">Service</option>
                <option value="Tires">Tires</option>
                <option value="AC">AC</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Detailing">Detailing</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the category"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting || !form.categoryName.trim() || !form.categoryCode.trim()}>
              {submitting ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

            {/* Detail Dialog - ADD THIS ENTIRE COMPONENT */}
      <Dialog open={!!detailCategory} onOpenChange={() => setDetailCategory(null)}>
        <DialogContent className="max-w-lg">
          {detailCategory && (
            <>
              <DialogHeader>
                <DialogTitle>{detailCategory.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs block">Category Code</span>
                    <span className="text-foreground font-mono font-medium">{detailCategory.code}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Department</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getDepartmentBadgeColor(detailCategory.department)}`}>
                      {detailCategory.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Status</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      detailCategory.status === 'ACTIVE' 
                        ? 'bg-green-700 text-green-100' 
                        : 'bg-red-600 text-red-100'
                    }`}>
                      {detailCategory.status === 'ACTIVE' ? (
                        <Power className="h-3 w-3" />
                      ) : (
                        <PowerOff className="h-3 w-3" />
                      )}
                      {detailCategory.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Created</span>
                    <span className="text-foreground text-sm">
                      {detailCategory.createdAt ? new Date(detailCategory.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {detailCategory.description && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">Description</span>
                    <div className="p-2 bg-muted rounded-md text-foreground">
                      {detailCategory.description}
                    </div>
                  </div>
                )}
                
                {/* Statistics Section */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                    <Grid className="h-3 w-3" /> Statistics
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">Total Products</p>
                      <p className="text-lg font-semibold text-foreground">
                        {detailCategory.productCount || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">Active Products</p>
                      <p className="text-lg font-semibold text-foreground">
                        {detailCategory.activeProductCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {canEdit && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        setDetailCategory(null);
                        openEdit(detailCategory);
                      }}
                    >
                      <Pencil className="h-3 w-3" /> Edit Category
                    </Button>
                  )}
                  {canEdit && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        handleToggleStatus(detailCategory);
                        setDetailCategory(null);
                      }}
                    >
                      {detailCategory.status === 'ACTIVE' ? (
                        <><PowerOff className="h-3 w-3" /> Deactivate</>
                      ) : (
                        <><Power className="h-3 w-3" /> Activate</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}