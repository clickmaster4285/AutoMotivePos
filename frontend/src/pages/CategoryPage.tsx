import { useState } from 'react';
import { useAppState } from '@/providers/AppStateProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Tag, Pencil, Trash2, Package, Layers } from 'lucide-react';
import { canPerformAction } from '@/lib/permissions';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const { categories, currentUser, addCategory, updateCategory, deleteCategory } = useAppState();
  const canCreate = canPerformAction(currentUser, 'categories', 'create');
  const canEdit = canPerformAction(currentUser, 'categories', 'edit');
  const canDelete = canPerformAction(currentUser, 'categories', 'delete');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    categoryName: '',
    categoryCode: '',
    description: '',
    department: 'All',
    status: 'ACTIVE'
  });

  const filtered = categories.filter(c => 
    !search || 
    c.categoryName.toLowerCase().includes(search.toLowerCase()) ||
    c.categoryCode.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      categoryName: '',
      categoryCode: '',
      description: '',
      department: 'All',
      status: 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      categoryName: c.categoryName,
      categoryCode: c.categoryCode,
      description: c.description || '',
      department: c.department,
      status: c.status
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      updateCategory(editing.id, form);
    } else {
      addCategory({
        ...form,
        createdBy: currentUser?.id // This will be handled in the provider
      });
    }
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'Men': 'bg-blue-50 text-blue-700',
      'Women': 'bg-pink-50 text-pink-700',
      'Kids': 'bg-yellow-50 text-yellow-700',
      'Unisex': 'bg-purple-50 text-purple-700',
      'All': 'bg-gray-50 text-gray-700'
    };
    return colors[department] || colors['All'];
  };

  // Auto-generate category code from name (uppercase, no spaces)
  const generateCategoryCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
  };

  const handleCategoryNameChange = (name: string) => {
    setForm(f => ({ 
      ...f, 
      categoryName: name,
      // Auto-generate code only if it's a new category and code is empty
      categoryCode: editing ? f.categoryCode : generateCategoryCode(name)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage product categories and departments</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or code..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-container p-12 text-center text-muted-foreground">
          <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No categories found
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Category Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                {(canEdit || canDelete) && (
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {c.categoryName}
                    </div>
                  </td>
                  <td className="p-3">
                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {c.categoryCode}
                    </code>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getDepartmentColor(c.department)}`}>
                      {c.department}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">
                    {c.description || '—'}
                   </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                   </td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => {
                            if (confirm(`Delete category "${c.categoryName}"?`)) {
                              deleteCategory(c.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                     </td>
                  )}
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editing ? 'Edit' : 'Add'} Category
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input 
                value={form.categoryName} 
                onChange={e => handleCategoryNameChange(e.target.value)} 
                placeholder="e.g., Electronics, Clothing, Books"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category Code *</Label>
              <Input 
                value={form.categoryCode} 
                onChange={e => setForm(f => ({ ...f, categoryCode: e.target.value.toUpperCase() }))} 
                placeholder="e.g., ELEC, CLTH, BOOK"
                className="font-mono uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier. Auto-generated from name, but can be edited.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={val => setForm(f => ({ ...f, department: val as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Men">Men</SelectItem>
                  <SelectItem value="Women">Women</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="Optional description of the category"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.categoryName || !form.categoryCode}>
              {editing ? 'Update' : 'Add'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}