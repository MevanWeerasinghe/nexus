"use client";

import {
  Banknote,
  Calendar,
  Cpu,
  FileDown,
  History,
  Info,
  MapPin,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  Unlink,
  UserPlus,
  Wrench,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Asset, AssetComponentHistory } from "@/modules/itam/api";

interface AssetProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileAsset: Asset | null;
  componentHistory: AssetComponentHistory[];
  loadingComponents: boolean;
  assetStatuses: readonly string[];
  getStatusColor: (status: string) => string;
  getCategoryName: (categoryId: number) => string;
  formatDate: (dateString: string | null) => string;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onOpenInstallDialog: () => void;
  onRemoveComponent: (historyId: number, reason: string) => void;
  onOpenHistoryDialog: () => void;
  onOpenGenerateReportDialog: () => void;
}

export default function AssetProfileDialog({
  open,
  onOpenChange,
  profileAsset,
  componentHistory,
  loadingComponents,
  assetStatuses,
  getStatusColor,
  getCategoryName,
  formatDate,
  onEdit,
  onAssign,
  onUnassign,
  onDelete,
  onStatusChange,
  onOpenInstallDialog,
  onRemoveComponent,
  onOpenHistoryDialog,
  onOpenGenerateReportDialog,
}: AssetProfileDialogProps) {
  const activeComponents = componentHistory.filter((item) => !item.removed_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{profileAsset ? `Asset Profile - ${profileAsset.asset_tag}` : "Asset Profile"}</DialogTitle>
          <DialogDescription>
            View asset details, assignment timeline, warranty information, and installed hardware components.
          </DialogDescription>
        </DialogHeader>
        {profileAsset && (
          <>
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{profileAsset.asset_tag}</h2>
                  <p className="text-slate-300">
                    {profileAsset.manufacturer} {profileAsset.model_name}
                  </p>
                  <p className="text-sm text-slate-400 font-mono">{profileAsset.serial_number}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <Badge className={`${getStatusColor(profileAsset.status)} text-sm px-3 py-1`}>
                    {profileAsset.status}
                  </Badge>
                  {profileAsset.usage_type?.toLowerCase() === "personal" && (
                    <div className="rounded-full border border-white/15 bg-amber-100/60 px-3 py-1 text-sm font-semibold text-amber-800">
                      Personal
                    </div>
                  )}
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-200">
                    {getCategoryName(profileAsset.category_id)}
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-200">
                    {activeComponents.length} active component{activeComponents.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-6 py-4 bg-slate-50 border-b">
              <Button variant="default" size="sm" onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onAssign} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {profileAsset.employee_id ? "Reassign" : "Assign"}
              </Button>
              <Button variant="outline" size="sm" onClick={onOpenGenerateReportDialog} className="gap-2">
                <FileDown className="h-4 w-4" />
                Generate Report
              </Button>
              {profileAsset.employee_id && (
                <Button variant="outline" size="sm" onClick={onUnassign} className="gap-2">
                  <Unlink className="h-4 w-4" />
                  Unassign
                </Button>
              )}
              <div className="flex-1" />
              <Select value={profileAsset.status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status} value={status} disabled={status === "Deployed"}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={onDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            <div className="p-5 lg:p-6">
              <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      <UserPlus className="h-4 w-4" />
                      Assignment
                    </div>
                    {profileAsset.employee ? (
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                          {profileAsset.employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{profileAsset.employee.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{profileAsset.employee.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Not assigned to any employee</p>
                    )}
                  </div>

                  {profileAsset.supplier && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                        <Building2 className="h-4 w-4" />
                        Supplier
                      </div>
                      <div className="space-y-2 min-w-0">
                        <p className="font-semibold">{profileAsset.supplier.name}</p>
                        {profileAsset.supplier.contact_email && (
                          <p className="text-sm text-muted-foreground break-all">{profileAsset.supplier.contact_email}</p>
                        )}
                        {profileAsset.supplier.phone && (
                          <p className="text-sm text-muted-foreground">{profileAsset.supplier.phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <MapPin className="h-3 w-3" />
                        Location
                      </div>
                      <p className="font-medium text-sm">{profileAsset.location || "Not specified"}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Calendar className="h-3 w-3" />
                        Purchased
                      </div>
                      <p className="font-medium text-sm">{formatDate(profileAsset.purchase_date ?? null)}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Banknote className="h-3 w-3" />
                        Price (LKR)
                      </div>
                      <p className="font-medium text-sm">
                        {profileAsset.purchase_price ? `LKR ${profileAsset.purchase_price.toLocaleString()}` : "-"}
                      </p>
                    </div>
                  </div>

                  {profileAsset.notes && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <Info className="h-4 w-4" />
                        Notes
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{profileAsset.notes}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full gap-2 h-11" onClick={onOpenHistoryDialog}>
                    <History className="h-4 w-4" />
                    View Assignment History
                  </Button>
                </div>

                <div className="space-y-5">
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                      <Shield className="h-4 w-4" />
                      Warranty Information
                      {profileAsset.is_warranty_active === true && (
                        <Badge className="text-xs bg-green-600 hover:bg-green-600 ml-auto">Active</Badge>
                      )}
                      {profileAsset.is_warranty_active === false && profileAsset.warranty && (
                        <Badge variant="destructive" className="text-xs ml-auto">Expired</Badge>
                      )}
                    </div>
                    {profileAsset.warranty ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3 border">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Provider</p>
                            <p className="font-medium text-sm break-words">{profileAsset.warranty.provider_name}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3 border">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                            <p className="font-medium text-sm">{profileAsset.warranty.duration_months} months</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3 border">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Start Date</p>
                            <p className="font-medium text-sm">{formatDate(profileAsset.warranty.start_date)}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3 border">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">End Date</p>
                            <p className="font-medium text-sm">{formatDate(profileAsset.warranty.end_date)}</p>
                          </div>
                        </div>
                        {profileAsset.warranty.terms_conditions && (
                          <div className="rounded-lg bg-slate-50 p-3 border">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Terms & Conditions</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profileAsset.warranty.terms_conditions}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No warranty information</p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                      <Cpu className="h-4 w-4" />
                      Hardware Components
                      <Button variant="outline" size="sm" className="ml-auto h-8 text-xs" onClick={onOpenInstallDialog}>
                        <Wrench className="h-3 w-3 mr-1" />
                        Install Component
                      </Button>
                    </div>
                    {loadingComponents ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading components...
                      </div>
                    ) : componentHistory.length > 0 ? (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {componentHistory.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-3 ${!item.removed_date ? "bg-green-50 border-green-200" : "bg-slate-50"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-sm">{item.component?.name || "Unknown Component"}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {item.component?.category || "Unknown"}
                                  </Badge>
                                  {!item.removed_date && (
                                    <Badge className="text-xs bg-green-600 hover:bg-green-600">Installed</Badge>
                                  )}
                                </div>
                                {item.component?.serial_number && (
                                  <p className="text-xs text-muted-foreground font-mono break-all">{item.component.serial_number}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Installed: {formatDate(item.installed_date)}
                                </p>
                                {item.removed_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Removed: {formatDate(item.removed_date)}
                                    {item.removal_reason && ` - ${item.removal_reason}`}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground italic break-words">{item.notes}</p>
                                )}
                              </div>
                              {!item.removed_date && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  onClick={() => onRemoveComponent(item.id, "Removed by user")}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-center py-8">No components installed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}