"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Filter, SlidersHorizontal, Download, RefreshCw } from "lucide-react";
import { AssetReportRequest } from "@/modules/itam/api";

interface GenerateAssetReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (payload: AssetReportRequest) => Promise<Blob | null>;
  generating: boolean;
}

const DEFAULT_FIELDS = {
  include_serial_number: true,
  include_category: true,
  include_model: true,
  include_supplier: true,
  include_assignee: true,
  include_purchase_date: true,
  include_purchase_price: true,
  include_warranty: true,
  include_location: true,
  include_notes: false,
};

export default function GenerateAssetReportDialog({
  open,
  onOpenChange,
  onGenerate,
  generating,
}: GenerateAssetReportDialogProps) {
  const [reportTitle, setReportTitle] = useState("Asset Inventory Report");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [activeTab, setActiveTab] = useState("configure");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const enabledCount = useMemo(
    () => Object.values(fields).filter(Boolean).length,
    [fields]
  );

  const setField = (name: keyof typeof DEFAULT_FIELDS, value: boolean) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    const payload = {
      report_title: reportTitle.trim() || "Asset Inventory Report",
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      fields,
    };

    const blob = await onGenerate(payload);
    if (blob) {
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setActiveTab("preview");
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const fileName = `${(reportTitle || "asset_report")
      .toLowerCase()
      .replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const link = document.createElement("a");
    link.href = pdfUrl || "";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateNew = () => {
    setPdfBlob(null);
    setPdfUrl(null);
    setActiveTab("configure");
  };

  const resetFields = () => setFields(DEFAULT_FIELDS);
  const compactFields = () =>
    setFields({
      include_serial_number: true,
      include_category: true,
      include_model: true,
      include_supplier: false,
      include_assignee: true,
      include_purchase_date: true,
      include_purchase_price: true,
      include_warranty: true,
      include_location: false,
      include_notes: false,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-[95vw] max-w-5xl overflow-hidden p-0 flex flex-col ${
          activeTab === "preview" ? "h-[96vh]" : "max-h-[90vh]"
        }`}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Generate Asset Report</DialogTitle>
          <DialogDescription>
            Configure filters and fields to customize your PDF report
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 overflow-hidden px-6 pb-6">
          <div className="border-b px-6 pt-6">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="configure">Configure Report</TabsTrigger>
              <TabsTrigger value="preview" disabled={!pdfUrl}>Preview & Download</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="configure" className="flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full">
              <div className="border-r bg-slate-50 p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Filter className="h-4 w-4" />
                    Report Filters
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Define which assets should be included.</p>
                </div>

                <div className="space-y-2">
                  <Label>Report Title</Label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Asset Inventory Report"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Deployed">Deployed</SelectItem>
                      <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                      <SelectItem value="Disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range (Purchase Date)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <p className="text-xs text-slate-500">Leave empty to include all dates.</p>
                </div>

                <div className="rounded-lg border bg-white p-3 text-xs text-slate-600">
                  <div className="font-medium text-slate-800 mb-1">Summary</div>
                  <div>Selected columns: {enabledCount}</div>
                  <div>Status: {status === "all" ? "All Assets" : status}</div>
                </div>
              </div>

              <div className="p-5 space-y-4 overflow-hidden">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <SlidersHorizontal className="h-4 w-4" />
                    Report Fields
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Select which columns to include in the report.</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium">Apply Preset</span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={compactFields}>
                      Compact
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={resetFields}>
                      Default
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleField label="Serial Number" checked={fields.include_serial_number} onChange={(v) => setField("include_serial_number", v)} />
                  <ToggleField label="Category" checked={fields.include_category} onChange={(v) => setField("include_category", v)} />
                  <ToggleField label="Model (Manufacturer + Model)" checked={fields.include_model} onChange={(v) => setField("include_model", v)} />
                  <ToggleField label="Supplier" checked={fields.include_supplier} onChange={(v) => setField("include_supplier", v)} />
                  <ToggleField label="Assignee" checked={fields.include_assignee} onChange={(v) => setField("include_assignee", v)} />
                  <ToggleField label="Purchase Date" checked={fields.include_purchase_date} onChange={(v) => setField("include_purchase_date", v)} />
                  <ToggleField label="Purchase Price" checked={fields.include_purchase_price} onChange={(v) => setField("include_purchase_price", v)} />
                  <ToggleField label="Warranty" checked={fields.include_warranty} onChange={(v) => setField("include_warranty", v)} />
                  <ToggleField label="Location" checked={fields.include_location} onChange={(v) => setField("include_location", v)} />
                  <ToggleField label="Notes" checked={fields.include_notes} onChange={(v) => setField("include_notes", v)} />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary">PDF</Badge>
                  <span className="text-xs text-muted-foreground">Auto pagination enabled for long reports.</span>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                    {generating ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>

            <div className="border-t bg-slate-50 px-4 py-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateNew}
                disabled={generating}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!pdfBlob}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
