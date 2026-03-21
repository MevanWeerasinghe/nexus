"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Filter, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Asset, AssetProfileReportRequest } from "@/modules/itam/api";

interface GenerateAssetProfileReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onGenerate: (payload: AssetProfileReportRequest) => Promise<Blob | null>;
  generating: boolean;
}

const DEFAULT_FIELDS = {
  include_asset_overview: true,
  include_financial_details: true,
  include_warranty_details: true,
  include_assignment_snapshot: true,
  include_assignment_history: true,
  include_component_history: true,
  include_component_specs: false,
  include_notes: true,
};

export default function GenerateAssetProfileReportDialog({
  open,
  onOpenChange,
  asset,
  onGenerate,
  generating,
}: GenerateAssetProfileReportDialogProps) {
  const [reportTitle, setReportTitle] = useState("Asset Lifecycle Report");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [activeTab, setActiveTab] = useState("configure");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const enabledCount = useMemo(() => Object.values(fields).filter(Boolean).length, [fields]);

  const setField = (name: keyof typeof DEFAULT_FIELDS, value: boolean) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    const payload: AssetProfileReportRequest = {
      report_title: reportTitle.trim() || `Asset Lifecycle Report - ${asset?.asset_tag || "Asset"}`,
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
    const fileName = `${(reportTitle || "asset_lifecycle_report")
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
      include_asset_overview: true,
      include_financial_details: true,
      include_warranty_details: true,
      include_assignment_snapshot: false,
      include_assignment_history: true,
      include_component_history: true,
      include_component_specs: false,
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
          <DialogTitle>Generate Asset Profile Report</DialogTitle>
          <DialogDescription>
            Customize sections, preview the PDF, then download the final report.
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
                    Report Context
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Generate a lifecycle report from purchase date to today.</p>
                </div>

                <div className="space-y-2">
                  <Label>Report Title</Label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Asset Lifecycle Report"
                  />
                </div>

                <div className="rounded-lg border bg-white p-3 text-xs text-slate-600 space-y-1">
                  <div className="font-medium text-slate-800">Selected Asset</div>
                  <div>Asset Tag: {asset?.asset_tag || "-"}</div>
                  <div>Model: {asset ? `${asset.manufacturer} ${asset.model_name}` : "-"}</div>
                  <div>Purchase Date: {asset?.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("en-US") : "-"}</div>
                  <div>Enabled sections: {enabledCount}</div>
                </div>
              </div>

              <div className="p-5 space-y-4 overflow-hidden">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <SlidersHorizontal className="h-4 w-4" />
                    Report Sections
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Choose which lifecycle sections to include.</p>
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
                  <ToggleField label="Asset Overview" checked={fields.include_asset_overview} onChange={(v) => setField("include_asset_overview", v)} />
                  <ToggleField label="Financial Details" checked={fields.include_financial_details} onChange={(v) => setField("include_financial_details", v)} />
                  <ToggleField label="Warranty Details" checked={fields.include_warranty_details} onChange={(v) => setField("include_warranty_details", v)} />
                  <ToggleField label="Assignment Snapshot" checked={fields.include_assignment_snapshot} onChange={(v) => setField("include_assignment_snapshot", v)} />
                  <ToggleField label="Assignment History" checked={fields.include_assignment_history} onChange={(v) => setField("include_assignment_history", v)} />
                  <ToggleField label="Hardware Components" checked={fields.include_component_history} onChange={(v) => setField("include_component_history", v)} />
                  <ToggleField label="Component Specifications" checked={fields.include_component_specs} onChange={(v) => setField("include_component_specs", v)} />
                  <ToggleField label="Asset Notes" checked={fields.include_notes} onChange={(v) => setField("include_notes", v)} />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary">PDF</Badge>
                  <span className="text-xs text-muted-foreground">Sectioned narrative + lifecycle tables.</span>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating || !asset} className="flex-1">
                    {generating ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              {pdfUrl ? (
                <iframe src={pdfUrl} className="w-full h-full border-0" title="Asset Profile PDF Preview" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No preview available</div>
              )}
            </div>

            <div className="border-t bg-slate-50 px-4 py-2 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleGenerateNew} disabled={generating} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </Button>
              <Button onClick={handleDownload} disabled={!pdfBlob} size="sm">
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
