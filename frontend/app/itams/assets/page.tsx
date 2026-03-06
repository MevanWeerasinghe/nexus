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
  DialogFooter,
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
import { Plus, Search, RefreshCw, Trash2, UserPlus, Unlink, Pencil, Eye, Calendar, MapPin, DollarSign, Shield, Tag, Hash, Building, Package, History, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import AddAssetForm from "@/components/AddAssetForm";
import { 
  getAssets, 
  getCategories,
  getEmployees,
  createAsset, 
  deleteAsset,
  updateAsset,
  assignAsset,
  getAssignmentHistory,
  Asset, 
  Category,
  Employee, 
  AssetCreate,
  AssignmentHistory
} from "@/lib/api-service";
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
  const [editForm, setEditForm] = useState({
    asset_tag: "",
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

  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      await deleteAsset(id);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      setError(err.response?.data?.detail || "Failed to delete asset");
    }
  };

  const openAssignDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedEmployeeId(asset.employee_id?.toString() || "unassigned");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedAsset) return;
    
    setAssigning(true);
    try {
      const employeeId = selectedEmployeeId && selectedEmployeeId !== "unassigned" ? parseInt(selectedEmployeeId) : null;
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
    if (!confirm("Unassign this asset from the current employee?")) return;
    
    try {
      await assignAsset(assetId, null);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to unassign asset:", err);
      setError(err.response?.data?.detail || "Failed to unassign asset");
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
      asset_tag: asset.asset_tag,
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

  const handleProfileUnassign = async () => {
    if (!profileAsset) return;
    if (!confirm("Unassign this asset from the current employee?")) return;
    
    try {
      await assignAsset(profileAsset.id, null);
      setProfileDialogOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to unassign asset:", err);
      setError(err.response?.data?.detail || "Failed to unassign asset");
    }
  };

  const handleProfileDelete = async () => {
    if (!profileAsset) return;
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      await deleteAsset(profileAsset.id);
      setProfileDialogOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      setError(err.response?.data?.detail || "Failed to delete asset");
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
        asset_tag: editForm.asset_tag,
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Manage your IT assets</p>
        </div>
        <div className="flex gap-2">
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details of the new asset
                </DialogDescription>
              </DialogHeader>
              <AddAssetForm 
                onSubmit={handleAddAsset} 
                categories={categories}
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
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            Total: {assets.length} assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading assets...
            </div>
          ) : (
            <Table>
              <TableHeader>
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
                      <TableCell className="font-semibold">{asset.asset_tag}</TableCell>
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
          )}
        </CardContent>
      </Card>

      {/* Asset Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          {profileAsset && (
            <>
              {/* Header Section */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{profileAsset.asset_tag}</h2>
                    <p className="text-slate-300">
                      {profileAsset.manufacturer} {profileAsset.model_name}
                    </p>
                    <p className="text-sm text-slate-400 font-mono">{profileAsset.serial_number}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge 
                      className={`${getStatusColor(profileAsset.status)} text-sm px-3 py-1`}
                    >
                      {profileAsset.status}
                    </Badge>
                    <p className="text-sm text-slate-400">
                      {getCategoryName(profileAsset.category_id)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 border-b">
                <Button variant="default" size="sm" onClick={handleProfileEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleProfileAssign} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {profileAsset.employee_id ? "Reassign" : "Assign"}
                </Button>
                {profileAsset.employee_id && (
                  <Button variant="outline" size="sm" onClick={handleProfileUnassign} className="gap-2">
                    <Unlink className="h-4 w-4" />
                    Unassign
                  </Button>
                )}
                <div className="flex-1" />
                <Select
                  value={profileAsset.status}
                  onValueChange={handleProfileStatusChange}
                >
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Change Status" />
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
                <Button variant="destructive" size="sm" onClick={handleProfileDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Assignment Card */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <UserPlus className="h-4 w-4" />
                    Assignment
                  </div>
                  {profileAsset.employee ? (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {profileAsset.employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{profileAsset.employee.name}</p>
                        <p className="text-sm text-muted-foreground">{profileAsset.employee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Not assigned to any employee</p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <p className="font-medium">{profileAsset.location || "Not specified"}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Calendar className="h-3 w-3" />
                      Purchased
                    </div>
                    <p className="font-medium">{formatDate(profileAsset.purchase_date ?? null)}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <DollarSign className="h-3 w-3" />
                      Price
                    </div>
                    <p className="font-medium">
                      {profileAsset.purchase_price ? `$${profileAsset.purchase_price.toLocaleString()}` : "-"}
                    </p>
                  </div>
                </div>

                {/* Warranty Section */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Shield className="h-4 w-4" />
                    Warranty Information
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                      <p className="font-medium">
                        {profileAsset.warranty_months ? `${profileAsset.warranty_months} months` : "No warranty"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Expiry Date</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatDate(profileAsset.warranty_expiry_date ?? null)}</p>
                        {profileAsset.is_warranty_active === false && profileAsset.warranty_expiry_date && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        {profileAsset.is_warranty_active === true && (
                          <Badge className="text-xs bg-green-600 hover:bg-green-600">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {profileAsset.notes && (
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Notes</div>
                    <p className="text-sm whitespace-pre-wrap">{profileAsset.notes}</p>
                  </div>
                )}

                {/* View Assignment History Button */}
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={openHistoryDialog}
                >
                  <History className="h-4 w-4" />
                  View Assignment History
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-bold">Assignment History</h2>
                {profileAsset && (
                  <p className="text-slate-300 text-sm">{profileAsset.asset_tag}</p>
                )}
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
                    className={`flex items-start gap-3 ${index !== assignmentHistory.length - 1 ? 'pb-3 border-b' : ''}`}
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
                          {record.unassigned_at && (
                            <> → {formatDate(record.unassigned_at)}</>
                          )}
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

      {/* Edit Asset Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          {editingAsset && (
            <>
              {/* Header Section */}
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

              {/* Form Content */}
              <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
                {/* Identity Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_asset_tag" className="text-xs uppercase tracking-wide text-muted-foreground">Asset Tag *</Label>
                    <Input
                      id="edit_asset_tag"
                      value={editForm.asset_tag}
                      onChange={(e) => setEditForm({ ...editForm, asset_tag: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_serial_number" className="text-xs uppercase tracking-wide text-muted-foreground">Serial Number *</Label>
                    <Input
                      id="edit_serial_number"
                      value={editForm.serial_number}
                      onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Category & Device Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_category" className="text-xs uppercase tracking-wide text-muted-foreground">Category *</Label>
                    <Select value={editForm.category_id} onValueChange={(value) => setEditForm({ ...editForm, category_id: value })}>
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
                      onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_model_name" className="text-xs uppercase tracking-wide text-muted-foreground">Model Name</Label>
                    <Input
                      id="edit_model_name"
                      value={editForm.model_name}
                      onChange={(e) => setEditForm({ ...editForm, model_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Purchase & Warranty Info */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_date" className="text-xs uppercase tracking-wide text-muted-foreground">Purchase Date</Label>
                    <Input
                      id="edit_purchase_date"
                      type="date"
                      value={editForm.purchase_date}
                      onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_price" className="text-xs uppercase tracking-wide text-muted-foreground">Purchase Price</Label>
                    <Input
                      id="edit_purchase_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editForm.purchase_price}
                      onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_warranty_months" className="text-xs uppercase tracking-wide text-muted-foreground">Warranty (months)</Label>
                    <Input
                      id="edit_warranty_months"
                      type="number"
                      placeholder="0"
                      value={editForm.warranty_months}
                      onChange={(e) => setEditForm({ ...editForm, warranty_months: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_location" className="text-xs uppercase tracking-wide text-muted-foreground">Location</Label>
                    <Input
                      id="edit_location"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit_notes" className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
                  <Input
                    id="edit_notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Actions - Fixed */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditAsset} disabled={saving || !editForm.asset_tag || !editForm.serial_number || !editForm.category_id}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
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
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name} ({emp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employees.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No employees found. Go to Employees page to add some.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? "Assigning..." : "Save Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
