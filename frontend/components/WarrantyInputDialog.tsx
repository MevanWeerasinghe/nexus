"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { Supplier } from "@/lib/api-service";

export interface WarrantyData {
  provider_name: string;
  duration_months: number;
  start_date: string;
  terms_conditions?: string;
}

interface WarrantyInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WarrantyData) => Promise<void>;
  isLoading?: boolean;
  suppliers: Supplier[];
  initialData?: Partial<WarrantyData>;
  title?: string;
  description?: string;
}

export default function WarrantyInputDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  suppliers,
  initialData,
  title = "Add Warranty",
  description = "Enter warranty details for this item.",
}: WarrantyInputDialogProps) {
  const [formData, setFormData] = useState<WarrantyData>({
    provider_name: initialData?.provider_name || "",
    duration_months: initialData?.duration_months || 12,
    start_date: initialData?.start_date || "",
    terms_conditions: initialData?.terms_conditions || "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.provider_name.trim()) {
      setError("Provider name is required");
      return;
    }

    if (formData.duration_months <= 0) {
      setError("Duration must be greater than 0");
      return;
    }

    if (!formData.start_date) {
      setError("Start date is required");
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        provider_name: "",
        duration_months: 12,
        start_date: "",
        terms_conditions: "",
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save warranty");
    }
  };

  const handleSupplierSelect = (supplierName: string) => {
    setFormData((prev) => ({
      ...prev,
      provider_name: supplierName,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-sm">
              Provider Name *
            </Label>
            <div className="flex gap-2">
              <Input
                id="provider"
                placeholder="e.g., Dell, HP, etc."
                value={formData.provider_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    provider_name: e.target.value,
                  }))
                }
                disabled={isLoading}
              />
              {suppliers.length > 0 && (
                <Select value="" onValueChange={handleSupplierSelect}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Pick..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm">
                Duration (Months) *
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration_months: parseInt(e.target.value) || 12,
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm">
                Start Date *
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms" className="text-sm">
              Terms & Conditions
            </Label>
            <Textarea
              id="terms"
              placeholder="Coverage details, exclusions, claim process..."
              value={formData.terms_conditions || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  terms_conditions: e.target.value,
                }))
              }
              disabled={isLoading}
              className="resize-none h-20"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted rounded p-2 border">
            <p className="font-medium text-foreground mb-1">End Date Auto-calculated</p>
            <p>End date will be automatically calculated as: Start Date + {formData.duration_months} months</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Warranty"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
