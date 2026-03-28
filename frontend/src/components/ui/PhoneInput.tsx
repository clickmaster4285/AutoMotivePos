import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function PhoneInput({ value, onChange, label, placeholder, required, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-xs font-semibold">
          {label}
          {required ? " *" : ""}
        </Label>
      )}
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="tel"
          className="pl-10 "
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
    </div>
  );
}
