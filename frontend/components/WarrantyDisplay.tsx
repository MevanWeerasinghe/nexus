"use client";

import { ComponentWarranty } from "@/lib/api-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Shield, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WarrantyDisplayProps {
  warranty: ComponentWarranty | undefined;
  onEdit?: () => void;
  onDelete?: () => void;
  formatDate?: (dateString: string | null) => string;
}

export default function WarrantyDisplay({
  warranty,
  onEdit,
  onDelete,
  formatDate,
}: WarrantyDisplayProps) {
  const defaultFormatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const fmt = formatDate || defaultFormatDate;

  if (!warranty) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p>No warranty information</p>
      </div>
    );
  }

  const isActive = new Date(warranty.end_date) >= new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Warranty Details</h3>
        <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {isActive ? "Active" : "Expired"}
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Provider</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              {(onEdit || onDelete) && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium break-words">{warranty.provider_name}</TableCell>
              <TableCell>{warranty.duration_months} months</TableCell>
              <TableCell>{fmt(warranty.start_date)}</TableCell>
              <TableCell>{fmt(warranty.end_date)}</TableCell>
              {(onEdit || onDelete) && (
                <TableCell className="flex gap-2">
                  {onEdit && (
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {warranty.terms_conditions && (
        <div className="bg-muted/30 rounded-lg p-3 border text-sm">
          <p className="font-semibold text-xs text-muted-foreground mb-1">TERMS & CONDITIONS</p>
          <p className="text-foreground whitespace-pre-wrap text-sm">{warranty.terms_conditions}</p>
        </div>
      )}
    </div>
  );
}
