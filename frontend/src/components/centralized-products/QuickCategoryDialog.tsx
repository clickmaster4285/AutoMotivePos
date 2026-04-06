// components/centralized-products/QuickCategoryDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCreateCategoryMutation } from '@/hooks/useCategories';

interface QuickCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (category: any) => void;
}

export function QuickCategoryDialog({ open, onOpenChange, onSuccess }: QuickCategoryDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const createCategoryMutation = useCreateCategoryMutation();
  
  const [form, setForm] = useState({
    categoryName: '',
    categoryCode: '',
    description: '',
    department: 'all' as 'mechanical' | 'electrical' | 'paint' | 'service' | 'tires' | 'ac' | 'diagnostics' | 'detailing' | 'all'
  });

  const generateCodeFromName = (name: string) => {
    if (!name.trim()) return '';
    let code = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    code = code.slice(0, 8);
    if (code.length < 3) {
      code = code + Math.floor(Math.random() * 1000);
    }
    return code;
  };

  const handleNameChange = (value: string) => {
    setForm(f => ({ 
      ...f, 
      categoryName: value,
      categoryCode: (!f.categoryCode || f.categoryCode === generateCodeFromName(f.categoryName)) 
        ? generateCodeFromName(value) 
        : f.categoryCode
    }));
  };

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
      const result = await createCategoryMutation.mutateAsync(form);
      toast({ title: 'Success', description: 'Category created successfully' });
      onSuccess(result);
      onOpenChange(false);
      // Reset form
      setForm({
        categoryName: '',
        categoryCode: '',
        description: '',
        department: 'all'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={form.categoryName}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g., Engine Parts"
              />
            </div>
            <div className="space-y-2">
              <Label>Category Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.categoryCode}
                  onChange={e => setForm(f => ({ ...f, categoryCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., ENG"
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
            <Select 
              value={form.department} 
              onValueChange={val => setForm(f => ({ ...f, department: val as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="paint">Paint</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="tires">Tires</SelectItem>
                <SelectItem value="ac">AC</SelectItem>
                <SelectItem value="diagnostics">Diagnostics</SelectItem>
                <SelectItem value="detailing">Detailing</SelectItem>
              </SelectContent>
            </Select>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}