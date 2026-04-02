'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Briefcase, Calendar, UserCog, Clock, CalendarDays, Building2 } from "lucide-react";
import { ROLES } from "@/context/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const EmploymentDetails = ({ formData, updateFormField, branches }) => {

  
  const employmentStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    const currentDays = formData.shift.workDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateFormField('shift.workDays', newDays);
  };

  return (
    <div className="space-y-8">
      {/* Job Information */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
            <Briefcase className="h-4 w-4" />
            <span>Job Information</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full border">
            <Label htmlFor="isActive" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Account Active</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(val) => updateFormField('isActive', val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="designation" className="text-xs font-semibold">Designation / Job Title</Label>
            <Input
              id="designation"
              placeholder="e.g. Senior Technician"
              value={formData.employment.designation}
              onChange={(e) => updateFormField('employment.designation', e.target.value)}
              className=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-xs font-semibold">Department</Label>
            <Input
              id="department"
              placeholder="e.g. Mechanical, Tires & Wheels"
              value={formData.employment.department}
              onChange={(e) => updateFormField('employment.department', e.target.value)}
              className=""
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Employment Status</Label>
            <Select
              value={formData.employment.status}
              onValueChange={(val) => updateFormField('employment.status', val)}
            >
              <SelectTrigger className="w-full ">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {employmentStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate" className="text-xs font-semibold">Hire Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hireDate"
                type="date"
                className="pl-10 "
                value={formData.employment.hireDate}
                onChange={(e) => updateFormField('employment.hireDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shift Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <Clock className="h-4 w-4" />
          <span>Shift Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Start Time</Label>
            <Input
              type="time"
              value={formData.shift.startTime}
              onChange={(e) => updateFormField('shift.startTime', e.target.value)}
              className=" font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">End Time</Label>
            <Input
              type="time"
              value={formData.shift.endTime}
              onChange={(e) => updateFormField('shift.endTime', e.target.value)}
              className=" font-mono"
            />
          </div>

          <div className="md:col-span-2 space-y-3">
            <Label className="text-xs font-semibold flex items-center gap-2">
              <CalendarDays className="h-3 w-3" /> Working Days
            </Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer transition-all select-none",
                    formData.shift.workDays.includes(day)
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "hover:border-primary/50"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role & Assignment */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <UserCog className="h-4 w-4" />
          <span>Role & Assignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">System Role *</Label>
            <Select
              value={formData.role || ""}
              onValueChange={(value) => updateFormField('role', value)}
            >
              <SelectTrigger className="w-full ">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Optional: Show default message if no role selected */}
            {!formData.role && (
              <p className="text-xs text-muted-foreground mt-1">
                Default role will be <span className="font-medium">Staff</span> if not selected
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Assigned branch</Label>
            <div className="flex-1">
              <Select
                value={formData.branch_id || "none"}
                onValueChange={(value) => updateFormField('branch_id', value === "none" ? "" : value)}
              >
                <SelectTrigger className="w-full ">
                  <SelectValue placeholder="Select branch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No branch</SelectItem>
                  {branches && branches.length > 0 ? (
                    branches.map(branch => (
                      <SelectItem key={branch._id ?? branch.id} value={branch._id ?? branch.id}>
                        {branch.branch_name ?? branch.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-branches" disabled>
                      No branches available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Add or manage branches under{" "}
              <Link to="/branches" className="text-primary underline-offset-2 hover:underline font-medium">
                Branches
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};