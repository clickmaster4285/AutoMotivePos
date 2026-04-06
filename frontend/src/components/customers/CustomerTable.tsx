// src/components/customers/CustomerTable.tsx
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types';

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CustomerTable({ 
  customers, 
  onViewCustomer, 
  onEditCustomer, 
  onDeleteCustomer, 
  canEdit, 
  canDelete 
}: CustomerTableProps) {
  if (customers.length === 0) {
    return null;
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Vehicles</th>
              {/* <th className="text-left p-3 font-medium text-muted-foreground">Jobs</th> */}
             
             
              {(canEdit || canDelete) && (
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr 
                key={c.id} 
                className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" 
                onClick={() => onViewCustomer(c)}
              >
                <td className="p-3 font-medium text-foreground">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.phone}</td>
                <td className="p-3 text-muted-foreground">{c.email || '—'}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {c.vehicles?.length || 0}
                  </span>
                </td>
                {/* <td className="p-3">
                  <span className="text-xs font-mono">0</span>
                </td> */}
                
               
                {(canEdit || canDelete) && (
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => onEditCustomer(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => onDeleteCustomer(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}