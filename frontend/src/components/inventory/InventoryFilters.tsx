import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { Category } from '@/types';

interface InventoryFiltersProps {
  search: string;
  catFilter: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
}

export function InventoryFilters({
  search,
  catFilter,
  categories,
  onSearchChange,
  onCategoryFilterChange,
}: InventoryFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={catFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c: Category) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}