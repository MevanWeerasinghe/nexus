"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Asset, Employee } from "@/lib/api-service";

interface AssignAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAsset: Asset | null;
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectedEmployeeChange: (value: string) => void;
  assigning: boolean;
  onAssign: () => void;
}

export default function AssignAssetDialog({
  open,
  onOpenChange,
  selectedAsset,
  employees,
  selectedEmployeeId,
  onSelectedEmployeeChange,
  assigning,
  onAssign,
}: AssignAssetDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) => (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query)
    ));
  }, [employees, searchTerm]);

  const selectedEmployee = employees.find((employee) => employee.id.toString() === selectedEmployeeId);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setPickerOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!pickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogDescription>
            {selectedAsset && (
              <>Assign <strong>{selectedAsset.asset_tag}</strong> ({selectedAsset.manufacturer} {selectedAsset.model_name}) to an employee</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative" ref={pickerRef}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              onClick={() => setPickerOpen((prev) => !prev)}
            >
              <span className="truncate text-left">
                {selectedEmployeeId === "unassigned"
                  ? "Unassigned"
                  : selectedEmployee
                    ? `${selectedEmployee.name} (${selectedEmployee.email})`
                    : "Select an employee..."}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-60" />
            </Button>

            {pickerOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-md border bg-background p-2 shadow-md">
                <Input
                  placeholder="Search employee by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <div className="mt-2 max-h-52 overflow-y-auto space-y-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between font-normal"
                    onClick={() => {
                      onSelectedEmployeeChange("unassigned");
                      setPickerOpen(false);
                    }}
                  >
                    <span className="truncate">Unassigned</span>
                    {selectedEmployeeId === "unassigned" && <Check className="h-4 w-4" />}
                  </Button>

                  {filteredEmployees.map((employee) => {
                    const value = employee.id.toString();
                    return (
                      <Button
                        key={employee.id}
                        type="button"
                        variant="ghost"
                        className="w-full justify-between font-normal"
                        onClick={() => {
                          onSelectedEmployeeChange(value);
                          setPickerOpen(false);
                        }}
                      >
                        <span className="truncate text-left">{employee.name} ({employee.email})</span>
                        {selectedEmployeeId === value && <Check className="h-4 w-4" />}
                      </Button>
                    );
                  })}

                  {employees.length > 0 && filteredEmployees.length === 0 && (
                    <p className="px-2 py-1 text-sm text-muted-foreground">No employees match your search.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {employees.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No employees found. Go to Employees page to add some.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAssign} disabled={assigning}>
            {assigning ? "Assigning..." : "Save Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}