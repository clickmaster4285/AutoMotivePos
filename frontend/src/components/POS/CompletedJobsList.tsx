// src/components/pos/CompletedJobsList.tsx
import type { JobCard } from '@/types';

interface CompletedJobsListProps {
  jobs: JobCard[];
  onSelectJob: (job: JobCard) => void;
  getJobTotal: (job: JobCard) => number;
}

export function CompletedJobsList({ jobs, onSelectJob, getJobTotal }: CompletedJobsListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-3 text-xs text-muted-foreground">
        No completed jobs
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-56 overflow-auto pr-1">
      {jobs.map((j) => (
        <button
          key={j.id}
          type="button"
          onClick={() => onSelectJob(j)}
          className="w-full text-left p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{j.jobNumber}</p>
              <p className="text-xs text-muted-foreground truncate">{j.customerName}</p>
              <p className="text-xs text-muted-foreground truncate">{j.vehicleName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">${getJobTotal(j).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">Pay & Checkout</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}