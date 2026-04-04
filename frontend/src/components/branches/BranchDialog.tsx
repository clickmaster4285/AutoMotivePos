// components/branches/BranchDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Building2, MapPin, Settings } from "lucide-react";
import type { Branch } from "@/types";
import { Country, State, City } from 'country-state-city';

const timeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

interface BranchFormData {
  branch_name: string;
  tax_region: string;
  opening_time: string;
  closing_time: string;
  status: "ACTIVE" | "INACTIVE";
  branch_manager: string;
  address: {
    country: string;
    state: string;
    city: string;
  };
}

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBranch: Branch | null;
  formData: BranchFormData;
  onFormChange: (data: BranchFormData) => void;
  onSave: () => void;
  isSaving: boolean;
  managerOptions: Array<{ value: string; label: string }>;
  isManagersLoading: boolean;
}

export function BranchDialog({
  open,
  onOpenChange,
  editingBranch,
  formData,
  onFormChange,
  onSave,
  isSaving,
  managerOptions,
  isManagersLoading,
}: BranchDialogProps) {
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries.map(c => ({ code: c.isoCode, name: c.name })));
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (formData.address.country) {
      const countryCode = countries.find(c => c.name === formData.address.country)?.code;
      if (countryCode) {
        const countryStates = State.getStatesOfCountry(countryCode);
        setStates(countryStates.map(s => ({ code: s.isoCode, name: s.name })));
      } else {
        setStates([]);
      }
    } else {
      setStates([]);
    }
    // Reset state and city when country changes
    if (formData.address.state) {
      onFormChange({
        ...formData,
        address: { ...formData.address, state: "", city: "" }
      });
    }
  }, [formData.address.country, countries]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.address.country && formData.address.state) {
      const countryCode = countries.find(c => c.name === formData.address.country)?.code;
      const stateCode = states.find(s => s.name === formData.address.state)?.code;
      if (countryCode && stateCode) {
        const citiesList = City.getCitiesOfState(countryCode, stateCode);
        setCities(citiesList.map(c => c.name));
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
    // Reset city when state changes
    if (formData.address.city) {
      onFormChange({
        ...formData,
        address: { ...formData.address, city: "" }
      });
    }
  }, [formData.address.state, formData.address.country, countries, states]);

  const nextStep = () => {
    if (step === 1 && !formData.branch_name.trim()) {
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleClose = () => {
    setStep(1);
    onOpenChange(false);
  };

  const handleSaveAndClose = () => {
    onSave();
    setStep(1);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Basic Information";
      case 2:
        return "Address Details";
      case 3:
        return "Settings";
      default:
        return "";
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1:
        return <Building2 className="h-5 w-5" />;
      case 2:
        return <MapPin className="h-5 w-5" />;
      case 3:
        return <Settings className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getStepIcon()}
            <DialogTitle>
              {editingBranch ? "Edit Branch" : "Add New Branch"} - {getStepTitle()}
            </DialogTitle>
          </div>
          <DialogDescription>
            Step {step} of 3 - Please fill in the required information
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-2 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch Name *</Label>
              <Input
                value={formData.branch_name}
                onChange={(e) =>
                  onFormChange({ ...formData, branch_name: e.target.value })
                }
                placeholder="e.g., Downtown Auto Center"
                autoFocus
              />
              {!formData.branch_name.trim() && (
                <p className="text-xs text-red-500">Branch name is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Branch Manager</Label>
              <Select
                value={formData.branch_manager}
                onValueChange={(v) =>
                  onFormChange({ ...formData, branch_manager: v })
                }
                disabled={isManagersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isManagersLoading ? "Loading managers..." : "Select manager"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.branch_manager && !managerOptions.some((m) => m.value === formData.branch_manager) && (
                    <SelectItem value={formData.branch_manager}>{formData.branch_manager}</SelectItem>
                  )}
                  {managerOptions.map((manager) => (
                    <SelectItem key={manager.value} value={manager.value}>
                      {manager.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tax Region</Label>
              <Input
                value={formData.tax_region}
                onChange={(e) =>
                  onFormChange({ ...formData, tax_region: e.target.value })
                }
                placeholder="e.g., California, UK, etc."
              />
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Country *</Label>
              <Select
                value={formData.address.country}
                onValueChange={(v) =>
                  onFormChange({
                    ...formData,
                    address: { ...formData.address, country: v, state: "", city: "" },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State/Province</Label>
              <Select
                value={formData.address.state}
                onValueChange={(v) =>
                  onFormChange({
                    ...formData,
                    address: { ...formData.address, state: v, city: "" },
                  })
                }
                disabled={!formData.address.country}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.address.country ? "Select state" : "Select country first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {states.map((s) => (
                    <SelectItem key={s.code} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={formData.address.city}
                onValueChange={(v) =>
                  onFormChange({
                    ...formData,
                    address: { ...formData.address, city: v },
                  })
                }
                disabled={!formData.address.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.address.state ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Select
                  value={formData.opening_time}
                  onValueChange={(v) =>
                    onFormChange({ ...formData, opening_time: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Select
                  value={formData.closing_time}
                  onValueChange={(v) =>
                    onFormChange({ ...formData, closing_time: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <Label>Branch Status</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    formData.status === "ACTIVE"
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={formData.status === "ACTIVE"}
                  onCheckedChange={(checked) =>
                    onFormChange({
                      ...formData,
                      status: checked ? "ACTIVE" : "INACTIVE",
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : prevStep}
            >
              {step === 1 ? "Cancel" : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </>
              )}
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep} disabled={step === 1 && !formData.branch_name.trim()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSaveAndClose}
                disabled={isSaving || !formData.branch_name.trim()}
              >
                {isSaving ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}