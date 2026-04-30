"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Asset, Category } from "@/modules/itam/api";

export interface EditAssetFormData {
  serial_number: string;
  category_id: string;
  manufacturer: string;
  model_name: string;
  purchase_date: string;
  purchase_price: string;
  warranty_months: string;
  warranty_provider?: string;
  warranty_start_date?: string;
  location: string;
  notes: string;
}

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAsset: Asset | null;
  editForm: EditAssetFormData;
  categories: Category[];
  saving: boolean;
  onFieldChange: (field: keyof EditAssetFormData, value: string) => void;
  onSave: () => void;
}

export default function EditAssetDialog({
  open,
  onOpenChange,
  editingAsset,
  editForm,
  categories,
  saving,
  onFieldChange,
  onSave,
}: EditAssetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-4xl p-0 gap-0 overflow-hidden">
        {editingAsset && (
          <>
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5">
              <div className="flex items-center gap-3">
                <Pencil className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">Edit Asset</h2>
                  <p className="text-slate-300 text-sm">
                    Update details for {editingAsset.asset_tag}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto bg-slate-50/50">
              <div className="rounded-lg border bg-white p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_asset_tag" className="text-xs uppercase tracking-wide text-muted-foreground">Asset Tag</Label>
                    <Input
                      id="edit_asset_tag"
                      value={editingAsset.asset_tag}
                      readOnly
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_serial_number" className="text-xs uppercase tracking-wide text-muted-foreground">Serial Number *</Label>
                    <Input
                      id="edit_serial_number"
                      value={editForm.serial_number}
                      onChange={(e) => onFieldChange("serial_number", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit_category" className="text-xs uppercase tracking-wide text-muted-foreground">Category *</Label>
                    <Select value={editForm.category_id} onValueChange={(value) => onFieldChange("category_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_manufacturer" className="text-xs uppercase tracking-wide text-muted-foreground">Manufacturer</Label>
                    <Input
                      id="edit_manufacturer"
                      value={editForm.manufacturer}
                      onChange={(e) => onFieldChange("manufacturer", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_model_name" className="text-xs uppercase tracking-wide text-muted-foreground">Model Name</Label>
                    <Input
                      id="edit_model_name"
                      value={editForm.model_name}
                      onChange={(e) => onFieldChange("model_name", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_date" className="text-xs uppercase tracking-wide text-muted-foreground">Purchase Date</Label>
                    <Input
                      id="edit_purchase_date"
                      type="date"
                      value={editForm.purchase_date}
                      onChange={(e) => onFieldChange("purchase_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_price" className="text-xs uppercase tracking-wide text-muted-foreground">Purchase Price (LKR)</Label>
                    <Input
                      id="edit_purchase_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editForm.purchase_price}
                      onChange={(e) => onFieldChange("purchase_price", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_warranty_months" className="text-xs uppercase tracking-wide text-muted-foreground">Warranty (months)</Label>
                    <Input
                      id="edit_warranty_months"
                      type="number"
                      placeholder="0"
                      value={editForm.warranty_months}
                      onChange={(e) => onFieldChange("warranty_months", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_warranty_provider" className="text-xs uppercase tracking-wide text-muted-foreground">Warranty Provider</Label>
                    <Input
                      id="edit_warranty_provider"
                      value={editForm.warranty_provider || ''}
                      onChange={(e) => onFieldChange("warranty_provider" as any, e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_warranty_start" className="text-xs uppercase tracking-wide text-muted-foreground">Warranty Start</Label>
                    <Input
                      id="edit_warranty_start"
                      type="date"
                      value={editForm.warranty_start_date || ''}
                      onChange={(e) => onFieldChange("warranty_start_date" as any, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_location" className="text-xs uppercase tracking-wide text-muted-foreground">Location</Label>
                    <Input
                      id="edit_location"
                      value={editForm.location}
                      onChange={(e) => onFieldChange("location", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_notes" className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={editForm.notes}
                    onChange={(e) => onFieldChange("notes", e.target.value)}
                    className="min-h-[88px] resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving || !editForm.serial_number || !editForm.category_id}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}