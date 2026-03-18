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
import { Asset, Category } from "@/lib/api-service";

export interface EditAssetFormData {
  asset_tag: string;
  serial_number: string;
  category_id: string;
  manufacturer: string;
  model_name: string;
  purchase_date: string;
  purchase_price: string;
  warranty_months: string;
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
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {editingAsset && (
          <>
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-center gap-3">
                <Pencil className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Edit Asset</h2>
                  <p className="text-slate-300 text-sm">
                    Update details for {editingAsset.asset_tag}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_asset_tag" className="text-xs uppercase tracking-wide text-muted-foreground">Asset Tag *</Label>
                  <Input
                    id="edit_asset_tag"
                    value={editForm.asset_tag}
                    onChange={(e) => onFieldChange("asset_tag", e.target.value)}
                    required
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

              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-4 gap-4">
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
                  <Label htmlFor="edit_location" className="text-xs uppercase tracking-wide text-muted-foreground">Location</Label>
                  <Input
                    id="edit_location"
                    value={editForm.location}
                    onChange={(e) => onFieldChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes" className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
                <Input
                  id="edit_notes"
                  value={editForm.notes}
                  onChange={(e) => onFieldChange("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving || !editForm.asset_tag || !editForm.serial_number || !editForm.category_id}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}