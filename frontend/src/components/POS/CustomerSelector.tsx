// src/components/pos/CustomerSelector.tsx
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { QuickCustomerForm } from '@/components/customers/QuickCustomerForm';
import type { Customer } from '@/types';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: string;
  selectedCustomerName: string;
  onCustomerSelect: (customerId: string, customerName: string) => void;
  branchId?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function CustomerSelector({
  customers,
  selectedCustomerId,
  selectedCustomerName,
  onCustomerSelect,
  branchId,
  placeholder = "Walk-in Customer",
  className = "",
  triggerClassName = "h-8 text-xs"
}: CustomerSelectorProps) {
  const [showQuickForm, setShowQuickForm] = useState(false);

  const handleValueChange = (value: string) => {
    if (value === '__new') {
      setShowQuickForm(true);
    } else if (value === '__walkin') {
      onCustomerSelect('', 'Walk-in Customer');
    } else {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        onCustomerSelect(customer.id, customer.name);
      }
    }
  };

  const handleCustomerCreated = (customerId: string, customerName: string) => {
    onCustomerSelect(customerId, customerName);
    setShowQuickForm(false);
  };

  const displayValue = selectedCustomerId || '__walkin';

  return (
    <div className={className}>
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__walkin">Walk-in Customer</SelectItem>
          <SelectItem value="__new" className="text-primary font-medium">
            <div className="flex items-center gap-2">
              <Plus className="h-3 w-3" /> Add New Customer
            </div>
          </SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} - {c.phone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <QuickCustomerForm
        open={showQuickForm}
        onClose={() => setShowQuickForm(false)}
        onSuccess={handleCustomerCreated}
        defaultBranchId={branchId}
      />
    </div>
  );
}