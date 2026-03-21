"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UnassignReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetTag?: string;
  submitting: boolean;
  onConfirm: (reason: string) => void;
}

export default function UnassignReasonDialog({
  open,
  onOpenChange,
  assetTag,
  submitting,
  onConfirm,
}: UnassignReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Reason is required");
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unassign Asset</DialogTitle>
          <DialogDescription>
            {assetTag
              ? `Provide a required reason to unassign ${assetTag}.`
              : "Provide a required reason to unassign this asset."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="unassign-reason">Reason *</Label>
          <Textarea
            id="unassign-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for removing this asset"
            className="min-h-24"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Removing..." : "Remove Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
