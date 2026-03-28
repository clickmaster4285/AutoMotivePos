import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Grid, Pencil, Trash2, RefreshCw, Loader2, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { canPerformAction } from '@/lib/permissions';
import type { Category } from '@/types';
import { categoryService } from '@/services/category-service';

export default function CategoriesPage() {
  const { toast } = useToast();
  const { currentUser } = useAppState();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = canPerformAction(currentUser, 'categories', 'create');
  const canEdit = canPerformAction(currentUser, 'categories', 'edit');
  const canDelete = canPerformAction(currentUser, 'categories', 'delete');

  const [form, setForm] = useState({
    categoryName: '',
    categoryCode: '',
    description: '',
    department: 'All' as 'Men' | 'Women' | 'Kids' | 'Unisex' | 'All'
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
        await categoryService.update(editing.id, form);
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        await categoryService.create(form);
        toast({ title: 'Success', description: 'Category created successfully' });
      }
      await loadCategories();
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
      await categoryService.toggleStatus(category.id);
      toast({
        title: 'Success',
        description: `Category ${category.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`
      });
      await loadCategories();
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
      await categoryService.delete(id);
      toast({ title: 'Success', description: 'Category deleted successfully' });
      await loadCategories();
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
      case 'Men':
        return 'bg-blue-100 text-blue-700';
      case 'Women':
        return 'bg-pink-100 text-pink-700';
      case 'Kids':
        return 'bg-green-100 text-green-700';
      case 'Unisex':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
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
          <Button variant="outline" onClick={loadCategories} className="gap-2">
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
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs font-medium text-foreground">
                      {c.code}
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDepartmentBadgeColor(c.department)}`}>
                        {c.department}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">
                      {c.description || '—'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        c.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
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
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                  onChange={e => setForm(f => ({ ...f, categoryName: e.target.value }))}
                  placeholder="e.g., Casual Shirts"
                />
              </div>
              <div className="space-y-2">
                <Label>Category Code *</Label>
                <Input
                  value={form.categoryCode}
                  onChange={e => setForm(f => ({ ...f, categoryCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CSHIRT"
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value as any }))}
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Unisex">Unisex</option>
                <option value="All">All</option>
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
    </div>
  );
}