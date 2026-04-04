// components/branches/BranchFilters.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";

interface BranchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function BranchFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  isRefreshing,
}: BranchFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active Only</SelectItem>
          <SelectItem value="inactive">Inactive Only</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        onClick={onRefresh}
        className="gap-2"
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}