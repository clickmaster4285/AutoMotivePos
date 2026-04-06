// components/reports/ReportFilters.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Calendar, ChevronDown } from 'lucide-react';

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ReportFiltersProps {
  viewAllOrg: boolean;
  branches: any[];
  selectedBranchId: string | undefined;
  onBranchChange: (branchId: string | undefined) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
}

export function ReportFilters({
  viewAllOrg,
  branches,
  selectedBranchId,
  onBranchChange,
  dateRange,
  onDateRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: ReportFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const getDateRangeText = () => {
    const option = dateFilterOptions.find(o => o.value === dateRange);
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
    }
    return option?.label || 'Select Range';
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {viewAllOrg && branches && branches.length > 0 && (
            <select
              value={selectedBranchId || 'all'}
              onChange={(e) => onBranchChange(e.target.value === 'all' ? undefined : e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-border bg-background"
            >
              <option value="all">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1 h-8 px-3 text-xs rounded-md border border-border bg-background hover:bg-accent/50"
            >
              <Calendar className="h-3.5 w-3.5" />
              {getDateRangeText()}
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-md border border-border bg-popover shadow-lg">
                <div className="p-1">
                  {dateFilterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onDateRangeChange(option.value as DateRange);
                        if (option.value !== 'custom') setShowDatePicker(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-accent ${dateRange === option.value ? 'bg-accent' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {dateRange === 'custom' && (
                  <div className="border-t border-border p-3 space-y-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => onCustomStartDateChange(e.target.value)}
                      className="w-full h-7 text-xs rounded border border-border bg-background px-2"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => onCustomEndDateChange(e.target.value)}
                      className="w-full h-7 text-xs rounded border border-border bg-background px-2"
                    />
                    <Button size="sm" className="w-full h-7 text-xs" onClick={() => setShowDatePicker(false)}>
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}