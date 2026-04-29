"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, RefreshCw, Trash2, UserPlus, Unlink, Eye, FileDown } from "lucide-react";
import AddAssetForm from "@/components/AddAssetForm";
import AssignAssetDialog from "@/components/assets/AssignAssetDialog";
import AssetProfileDialog from "@/components/assets/AssetProfileDialog";
import AssignmentHistoryDialog from "@/components/assets/AssignmentHistoryDialog";
import UnassignReasonDialog from "@/components/assets/UnassignReasonDialog";
import EditAssetDialog, { EditAssetFormData } from "@/components/assets/EditAssetDialog";
import InstallComponentDialog from "@/components/assets/InstallComponentDialog";
import GenerateAssetReportDialog from "@/components/assets/GenerateAssetReportDialog";
import GenerateAssetProfileReportDialog from "@/components/assets/GenerateAssetProfileReportDialog";
import { 
  getAssets, 
  getCategories,
  getEmployees,
  createAsset, 
  deleteAsset,
  updateAsset,
  assignAsset,
  getAssignmentHistory,
  getAssetComponents,
  getAvailableComponents,
  installComponent,
  removeComponent,
  generateAssetPdfReport,
  generateAssetProfilePdfReport,
  Asset, 
  Category,
  Employee, 
  AssetCreate,
  AssetReportRequest,
  AssetProfileReportRequest,
  AssignmentHistory,
  AssetComponentHistory,
  Component
} from "@/modules/itam/api";
import { isAuthenticated } from "@/lib/auth";

const ASSET_STATUSES = ["Available", "Deployed", "In Maintenance", "Retired", "Disposed"] as const;

const statusColors: Record<string, string> = {
  available: "bg-blue-100 text-blue-800",
  deployed: "bg-green-100 text-green-800",
  "in maintenance": "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-800",
  disposed: "bg-red-100 text-red-800",
};

const getStatusColor = (status: string): string => {
  return statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
};

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [profileReportDialogOpen, setProfileReportDialogOpen] = useState(false);
  const [generatingProfileReport, setGeneratingProfileReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState<EditAssetFormData>({
    serial_number: "",
    category_id: "",
    manufacturer: "",
    model_name: "",
    purchase_date: "",
    purchase_price: "",
    warranty_months: "",
    location: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileAsset, setProfileAsset] = useState<Asset | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Component history state
  const [componentHistory, setComponentHistory] = useState<AssetComponentHistory[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [installNotes, setInstallNotes] = useState("");
  const [installing, setInstalling] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [pendingUnassignAssetId, setPendingUnassignAssetId] = useState<number | null>(null);
  const [pendingUnassignAssetTag, setPendingUnassignAssetTag] = useState<string | undefined>(undefined);
  const [pendingUnassignCloseProfile, setPendingUnassignCloseProfile] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (categoryFilter !== "all") filters.category_id = parseInt(categoryFilter);
      
      const data = await getAssets(filters);
      setAssets(data);
    } catch (err: any) {
      console.error("Failed to fetch assets:", err);
      setError(err.response?.data?.detail || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchCategories();
    fetchEmployees();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchAssets();
    }
  }, [fetchAssets]);

  const handleAddAsset = async (data: AssetCreate) => {
    try {
      await createAsset(data);
      setDialogOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to create asset:", err);
      throw err;
    }
  };

  const standaloneCategories = categories.filter((category) => category.category_type === "standalone");

  const getDeleteAssetErrorMessage = (err: any) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    return "Failed to delete asset";
  };

  const handleDeleteBlocked = (message: string) => {
    window.alert(message);
  };

  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    const asset = assets.find((item) => item.id === id);
    if (asset?.employee_id) {
      handleDeleteBlocked("This asset is currently assigned to an employee. First you need to unassign the employee before deleting it.");
      return;
    }
    
    try {
      await deleteAsset(id);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      const message = getDeleteAssetErrorMessage(err);
      if (message.toLowerCase().includes("unassign")) {
        handleDeleteBlocked(message);
        return;
      }
      setError(message);
    }
  };

  const openAssignDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedEmployeeId(asset.employee_id?.toString() || "unassigned");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedAsset) return;

    const employeeId = selectedEmployeeId && selectedEmployeeId !== "unassigned" ? parseInt(selectedEmployeeId) : null;

    if (employeeId === null && selectedAsset.employee_id != null) {
      setAssignDialogOpen(false);
      setSelectedEmployeeId("");
      setSelectedAsset(null);
      setPendingUnassignAssetId(selectedAsset.id);
      setPendingUnassignAssetTag(selectedAsset.asset_tag);
      setPendingUnassignCloseProfile(false);
      setUnassignDialogOpen(true);
      return;
    }
    
    setAssigning(true);
    try {
      await assignAsset(selectedAsset.id, employeeId);
      setAssignDialogOpen(false);
      setSelectedAsset(null);
      setSelectedEmployeeId("");
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to assign asset:", err);
      setError(err.response?.data?.detail || "Failed to assign asset");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (assetId: number) => {
    const asset = assets.find((item) => item.id === assetId);
    setPendingUnassignAssetId(assetId);
    setPendingUnassignAssetTag(asset?.asset_tag);
    setPendingUnassignCloseProfile(false);
    setUnassignDialogOpen(true);
  };

  const handleConfirmUnassign = async (reason: string) => {
    if (!pendingUnassignAssetId) return;

    setUnassigning(true);
    try {
      await assignAsset(pendingUnassignAssetId, null, reason);
      setUnassignDialogOpen(false);
      setPendingUnassignAssetId(null);
      setPendingUnassignAssetTag(undefined);
      if (pendingUnassignCloseProfile) {
        setProfileDialogOpen(false);
      }
      setPendingUnassignCloseProfile(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to unassign asset:", err);
      setError(err.response?.data?.detail || "Failed to unassign asset");
    } finally {
      setUnassigning(false);
    }
  };

  const handleStatusChange = async (assetId: number, newStatus: string) => {
    try {
      await updateAsset(assetId, { status: newStatus });
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.detail || "Failed to update asset status");
    }
  };

  const openEditDialog = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      serial_number: asset.serial_number || "",
      category_id: asset.category_id.toString(),
      manufacturer: asset.manufacturer || "",
      model_name: asset.model_name || "",
      purchase_date: asset.purchase_date ? asset.purchase_date.split("T")[0] : "",
      purchase_price: asset.purchase_price?.toString() || "",
      warranty_months: asset.warranty_months?.toString() || "",
      location: asset.location || "",
      notes: asset.notes || "",
    });
    setEditDialogOpen(true);
  };

  const openProfileDialog = async (asset: Asset) => {
    setProfileAsset(asset);
    setProfileDialogOpen(true);
    
    // Fetch component history
    setLoadingComponents(true);
    try {
      const history = await getAssetComponents(asset.id);
      setComponentHistory(history);
    } catch (err) {
      console.error("Failed to fetch component history:", err);
    } finally {
      setLoadingComponents(false);
    }
  };

  const openInstallComponentDialog = async () => {
    setInstallDialogOpen(true);
    try {
      const components = await getAvailableComponents();
      setAvailableComponents(components);
    } catch (err) {
      console.error("Failed to fetch available components:", err);
    }
  };

  const handleInstallComponent = async () => {
    if (!profileAsset || !selectedComponentId) return;
    setInstalling(true);
    try {
      await installComponent(profileAsset.id, {
        component_id: parseInt(selectedComponentId),
        notes: installNotes || undefined
      });
      // Refresh component history
      const history = await getAssetComponents(profileAsset.id);
      setComponentHistory(history);
      setInstallDialogOpen(false);
      setSelectedComponentId("");
      setInstallNotes("");
    } catch (err) {
      console.error("Failed to install component:", err);
    } finally {
      setInstalling(false);
    }
  };

  const handleRemoveComponent = async (historyId: number, reason: string) => {
    if (!profileAsset) return;
    try {
      await removeComponent(profileAsset.id, historyId, reason);
      // Refresh component history
      const history = await getAssetComponents(profileAsset.id);
      setComponentHistory(history);
    } catch (err) {
      console.error("Failed to remove component:", err);
    }
  };

  const openHistoryDialog = async () => {
    if (!profileAsset) return;
    setHistoryDialogOpen(true);
    setLoadingHistory(true);
    try {
      const history = await getAssignmentHistory(profileAsset.id);
      setAssignmentHistory(history);
    } catch (err) {
      console.error("Failed to fetch assignment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProfileEdit = () => {
    if (profileAsset) {
      setProfileDialogOpen(false);
      openEditDialog(profileAsset);
    }
  };

  const handleProfileAssign = () => {
    if (profileAsset) {
      setProfileDialogOpen(false);
      openAssignDialog(profileAsset);
    }
  };

  const handleOpenProfileReportDialog = () => {
    if (!profileAsset) return;
    setProfileReportDialogOpen(true);
  };

  const handleProfileUnassign = async () => {
    if (!profileAsset) return;
    setPendingUnassignAssetId(profileAsset.id);
    setPendingUnassignAssetTag(profileAsset.asset_tag);
    setPendingUnassignCloseProfile(true);
    setUnassignDialogOpen(true);
  };

  const handleProfileDelete = async () => {
    if (!profileAsset) return;
    if (!confirm("Are you sure you want to delete this asset?")) return;

    if (profileAsset.employee_id) {
      handleDeleteBlocked("This asset is currently assigned to an employee. First you need to unassign the employee before deleting it.");
      return;
    }
    
    try {
      await deleteAsset(profileAsset.id);
      setProfileDialogOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      const message = getDeleteAssetErrorMessage(err);
      if (message.toLowerCase().includes("unassign")) {
        handleDeleteBlocked(message);
        return;
      }
      setError(message);
    }
  };

  const handleProfileStatusChange = async (newStatus: string) => {
    if (!profileAsset) return;
    try {
      await updateAsset(profileAsset.id, { status: newStatus });
      // Update local state so dialog reflects change
      // If status changed to Available, Retired, or Disposed, employee is auto-unassigned
      const shouldUnassign = ['Available', 'Retired', 'Disposed'].includes(newStatus);
      setProfileAsset({ 
        ...profileAsset, 
        status: newStatus,
        ...(shouldUnassign ? { employee_id: undefined, employee: undefined } : {})
      });
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.detail || "Failed to update asset status");
    }
  };

  const handleEditAsset = async () => {
    if (!editingAsset) return;

    setSaving(true);
    try {
      const updateData: any = {
        serial_number: editForm.serial_number,
        category_id: parseInt(editForm.category_id),
        manufacturer: editForm.manufacturer || null,
        model_name: editForm.model_name || null,
        purchase_date: editForm.purchase_date || null,
        purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : null,
        warranty_months: editForm.warranty_months ? parseInt(editForm.warranty_months) : null,
        location: editForm.location || null,
        notes: editForm.notes || null,
      };
      await updateAsset(editingAsset.id, updateData);
      setEditDialogOpen(false);
      setEditingAsset(null);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to update asset:", err);
      setError(err.response?.data?.detail || "Failed to update asset");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditFormChange = (field: keyof EditAssetFormData, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleGenerateReport = async (payload: AssetReportRequest): Promise<Blob | null> => {
    try {
      setGeneratingReport(true);
      const pdfBlob = await generateAssetPdfReport(payload);
      return pdfBlob;
    } catch (err: any) {
      console.error("Failed to generate asset report:", err);
      let errorMessage = "Failed to generate PDF report";

      const responseData = err?.response?.data;
      if (responseData instanceof Blob) {
        try {
          const text = await responseData.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed?.detail) {
              errorMessage = parsed.detail;
            }
          } catch {
            if (text && text.trim()) {
              errorMessage = text.slice(0, 400);
            }
          }
        } catch {
          // Keep fallback message when blob cannot be parsed.
        }
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      }

      setError(errorMessage);
      return null;
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateProfileReport = async (payload: AssetProfileReportRequest): Promise<Blob | null> => {
    if (!profileAsset) {
      setError("No asset selected for profile report");
      return null;
    }

    try {
      setGeneratingProfileReport(true);
      const pdfBlob = await generateAssetProfilePdfReport(profileAsset.id, payload);
      return pdfBlob;
    } catch (err: any) {
      console.error("Failed to generate asset profile report:", err);
      let errorMessage = "Failed to generate asset profile PDF report";

      const responseData = err?.response?.data;
      if (responseData instanceof Blob) {
        try {
          const text = await responseData.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed?.detail) {
              errorMessage = parsed.detail;
            }
          } catch {
            if (text && text.trim()) {
              errorMessage = text.slice(0, 400);
            }
          }
        } catch {
          // Keep fallback message when blob cannot be parsed.
        }
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      }

      setError(errorMessage);
      return null;
    } finally {
      setGeneratingProfileReport(false);
    }
  };

  return (
    <div className="h-[calc(100dvh-1rem)] p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Manage your IT assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setReportDialogOpen(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={fetchAssets} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details of the new asset
                </DialogDescription>
              </DialogHeader>
              <AddAssetForm 
                onSubmit={handleAddAsset} 
                categories={standaloneCategories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Asset Tag, Serial Number, or Model..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Deployed">Deployed</SelectItem>
            <SelectItem value="In Maintenance">In Maintenance</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
            <SelectItem value="Disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {standaloneCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            Total: {assets.length} assets
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading assets...
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warranty Expiry</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{asset.asset_tag}</span>
                            {asset.usage_type?.toLowerCase() === "personal" && (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md uppercase tracking-wide mr-0">
                                PSNL
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{asset.serial_number}</TableCell>
                        <TableCell>{getCategoryName(asset.category_id)}</TableCell>
                        <TableCell>
                          {asset.manufacturer} {asset.model_name}
                        </TableCell>
                        <TableCell>
                          {asset.employee ? (
                            <span className="text-sm">{asset.employee.name}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={asset.status}
                            onValueChange={(value) => handleStatusChange(asset.id, value)}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <Badge
                                className={getStatusColor(asset.status)}
                                variant="outline"
                              >
                                {asset.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_STATUSES.map((status) => (
                                <SelectItem 
                                  key={status} 
                                  value={status}
                                  disabled={status === "Deployed"}
                                >
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {formatDate(asset.warranty_expiry_date ?? null)}
                            {asset.is_warranty_active === false && asset.warranty_expiry_date && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openProfileDialog(asset)}
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAssignDialog(asset)}
                              title={asset.employee_id ? "Change Assignment" : "Assign to Employee"}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            {asset.employee_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnassign(asset.id)}
                                title="Unassign"
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No assets found. Click "Add New Asset" to create one.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssetProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profileAsset={profileAsset}
        componentHistory={componentHistory}
        loadingComponents={loadingComponents}
        assetStatuses={ASSET_STATUSES}
        getStatusColor={getStatusColor}
        getCategoryName={getCategoryName}
        formatDate={formatDate}
        onEdit={handleProfileEdit}
        onAssign={handleProfileAssign}
        onUnassign={handleProfileUnassign}
        onDelete={handleProfileDelete}
        onStatusChange={handleProfileStatusChange}
        onOpenInstallDialog={openInstallComponentDialog}
        onRemoveComponent={handleRemoveComponent}
        onOpenHistoryDialog={openHistoryDialog}
        onOpenGenerateReportDialog={handleOpenProfileReportDialog}
      />

      <GenerateAssetProfileReportDialog
        open={profileReportDialogOpen}
        onOpenChange={setProfileReportDialogOpen}
        asset={profileAsset}
        onGenerate={handleGenerateProfileReport}
        generating={generatingProfileReport}
      />

      <InstallComponentDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        availableComponents={availableComponents}
        selectedComponentId={selectedComponentId}
        onSelectedComponentChange={setSelectedComponentId}
        installNotes={installNotes}
        onInstallNotesChange={setInstallNotes}
        installing={installing}
        onInstall={handleInstallComponent}
      />

      <AssignmentHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        assetTag={profileAsset?.asset_tag}
        loadingHistory={loadingHistory}
        assignmentHistory={assignmentHistory}
        formatDate={formatDate}
      />

      <EditAssetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingAsset={editingAsset}
        editForm={editForm}
        categories={standaloneCategories}
        saving={saving}
        onFieldChange={handleEditFormChange}
        onSave={handleEditAsset}
      />

      <AssignAssetDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedAsset={selectedAsset}
        employees={employees}
        selectedEmployeeId={selectedEmployeeId}
        onSelectedEmployeeChange={setSelectedEmployeeId}
        assigning={assigning}
        onAssign={handleAssign}
      />

      <GenerateAssetReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onGenerate={handleGenerateReport}
        generating={generatingReport}
      />

      <UnassignReasonDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        assetTag={pendingUnassignAssetTag}
        submitting={unassigning}
        onConfirm={handleConfirmUnassign}
      />
    </div>
  );
}
