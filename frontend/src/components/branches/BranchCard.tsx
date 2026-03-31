// components/branches/BranchCard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Clock, User, AlertCircle, Pencil, CheckCircle2, XCircle } from "lucide-react";
import type { Branch } from "@/types";

interface BranchCardProps {
  branch: Branch;
  canEdit: boolean;
  onEdit: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
}

export function BranchCard({ branch, canEdit, onEdit, onToggleStatus }: BranchCardProps) {
  const status = branch.status ?? "ACTIVE";
  
  const formatAddress = (branch: Branch): string => {
    if (branch.address_details) {
      const parts = [
        branch.address_details.city,
        branch.address_details.state,
        branch.address_details.country,
      ].filter((p) => p && p.trim());
      return parts.length > 0 ? parts.join(", ") : "No address provided";
    }
    return branch.address || "No address provided";
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-lg ${
        status === "INACTIVE" ? "opacity-75 bg-muted/30" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {branch.name}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-start gap-1 text-xs">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {formatAddress(branch)}
              </div>
            </CardDescription>
          </div>
          {status === "ACTIVE" ? (
            <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {branch.opening_time && branch.closing_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {branch.opening_time} - {branch.closing_time}
            </span>
          </div>
        )}
        
        {branch.branch_manager && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Manager: {branch.branch_manager}</span>
          </div>
        )}
        
        {branch.tax_region && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Tax Region: {branch.tax_region}</span>
          </div>
        )}
      </CardContent>
      
      {canEdit && (
        <div className="absolute bottom-4 right-4 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(branch)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleStatus(branch)}
            title={status === "ACTIVE" ? "Deactivate branch" : "Activate branch"}
          >
            {status === "ACTIVE" ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}