'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Landmark, CreditCard, Wallet, Building2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export const FinancialDetails = ({ formData, updateFormField }) => {
  const payTypes = [
    { value: 'SALARY', label: 'Monthly Salary' },
    { value: 'HOURLY', label: 'Hourly Rate' },
    { value: 'FIXED', label: 'Fixed Contract' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHECK', label: 'Check' },
  ];

  return (
    <div className="space-y-8">
      {/* Compensation Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <Banknote className="h-4 w-4" />
          <span>Compensation</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="baseAmount" className="text-xs font-semibold">Base Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">$</span>
              <Input
                id="baseAmount"
                type="number"
                placeholder="0.00"
                className="pl-7  font-mono"
                value={formData.salary.baseAmount === "" || formData.salary.baseAmount == null ? "" : formData.salary.baseAmount}
                onChange={(e) => {
                  const v = e.target.value;
                  updateFormField("salary.baseAmount", v === "" ? "" : Number(v));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Pay Type</Label>
            <Select 
              value={formData.salary.payType} 
              onValueChange={(val) => updateFormField('salary.payType', val)}
            >
              <SelectTrigger className="w-full ">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {payTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Payment Method</Label>
            <Select 
              value={formData.salary.paymentMethod} 
              onValueChange={(val) => updateFormField('salary.paymentMethod', val)}
            >
              <SelectTrigger className="w-full ">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Bank Details Section (Conditional) */}
      {formData.salary.paymentMethod === 'BANK_TRANSFER' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
            <Landmark className="h-4 w-4" />
            <span>Bank Account Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-muted/5">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-xs font-semibold">Bank Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bankName"
                  placeholder="e.g. JPMorgan Chase"
                  className="pl-10 "
                  value={formData.salary.bankDetails.bankName}
                  onChange={(e) => updateFormField('salary.bankDetails.bankName', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-xs font-semibold">Account Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  className="pl-10  font-mono"
                  value={formData.salary.bankDetails.accountNumber}
                  onChange={(e) => updateFormField('salary.bankDetails.accountNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="iban" className="text-xs font-semibold">IBAN / Swift Code (Optional)</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="iban"
                  placeholder="International Bank Account Number"
                  className="pl-10  font-mono uppercase"
                  value={formData.salary.bankDetails.iban}
                  onChange={(e) => updateFormField('salary.bankDetails.iban', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
