"use client";

import { Clock, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AssignmentHistory } from "@/lib/api-service";

interface AssignmentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetTag?: string;
  loadingHistory: boolean;
  assignmentHistory: AssignmentHistory[];
  formatDate: (dateString: string | null) => string;
}

export default function AssignmentHistoryDialog({
  open,
  onOpenChange,
  assetTag,
  loadingHistory,
  assignmentHistory,
  formatDate,
}: AssignmentHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5" />
            <div>
              <h2 className="text-lg font-bold">Assignment History</h2>
              {assetTag && <p className="text-slate-300 text-sm">{assetTag}</p>}
            </div>
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loadingHistory ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : assignmentHistory.length > 0 ? (
            <div className="space-y-3">
              {assignmentHistory.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-start gap-3 ${index !== assignmentHistory.length - 1 ? "pb-3 border-b" : ""}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                    {record.employee_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{record.employee_name}</p>
                      {!record.unassigned_at && (
                        <Badge className="text-xs bg-green-600 hover:bg-green-600">Current</Badge>
                      )}
                    </div>
                    {record.employee_email && (
                      <p className="text-xs text-muted-foreground">{record.employee_email}</p>
                    )}
                    {record.employee_department && (
                      <p className="text-xs text-muted-foreground">{record.employee_department}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDate(record.assigned_at)}
                        {record.unassigned_at && <> → {formatDate(record.unassigned_at)}</>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No assignment history</p>
              <p className="text-xs text-muted-foreground mt-1">This asset has never been assigned</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}