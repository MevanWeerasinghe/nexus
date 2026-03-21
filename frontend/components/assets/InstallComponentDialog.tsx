"use client";

import { RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Component } from "@/modules/itam/api";

interface InstallComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableComponents: Component[];
  selectedComponentId: string;
  onSelectedComponentChange: (value: string) => void;
  installNotes: string;
  onInstallNotesChange: (value: string) => void;
  installing: boolean;
  onInstall: () => void;
}

export default function InstallComponentDialog({
  open,
  onOpenChange,
  availableComponents,
  selectedComponentId,
  onSelectedComponentChange,
  installNotes,
  onInstallNotesChange,
  installing,
  onInstall,
}: InstallComponentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Install Component
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Component</label>
            <Select value={selectedComponentId} onValueChange={onSelectedComponentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a component to install..." />
              </SelectTrigger>
              <SelectContent>
                {availableComponents.map((component) => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{component.name}</span>
                      <span className="text-muted-foreground">({component.category})</span>
                      {component.serial_number && (
                        <span className="text-xs font-mono text-muted-foreground">- {component.serial_number}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableComponents.length === 0 && (
              <p className="text-xs text-muted-foreground">No available components. Add components in the Components page first.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this installation..."
              value={installNotes}
              onChange={(e) => onInstallNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onInstall} disabled={!selectedComponentId || installing}>
            {installing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Installing...
              </>
            ) : (
              "Install Component"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}