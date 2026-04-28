"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Cpu, Pencil, Trash2, Search, Package, Banknote, Shield, FileText } from "lucide-react";
import { 
  getComponents, 
  createComponent, 
  updateComponent,
  deleteComponent,
  getSuppliers,
  getCategories,
  addComponentWarranty,
  Component,
  ComponentCreate,
  Category,
  Supplier 
} from "@/modules/itam/api";
import { Switch } from "@/components/ui/switch";

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  installed: "bg-blue-100 text-blue-800",
  defective: "bg-red-100 text-red-800",
  disposed: "bg-gray-100 text-gray-800",
};

const getStatusColor = (status: string): string => {
  return statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
};

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ComponentCreate & { status?: string; include_warranty?: boolean; warranty_provider?: string; warranty_duration?: number; warranty_start_date?: string; warranty_terms?: string }>({
    name: "",
    category_id: 0,
    serial_number: "",
    purchase_price: undefined,
    purchase_date: "",
    supplier_id: undefined,
    specifications: "",
    notes: "",
    include_warranty: false,
    warranty_provider: "",
    warranty_duration: 12,
    warranty_start_date: "",
    warranty_terms: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const selectedSupplier = suppliers.find((supplier) => supplier.id === formData.supplier_id);
  const canConfigureWarranty = Boolean(formData.supplier_id);

  const getErrorMessage = (err: any, fallback: string): string => {
    const detail = err?.response?.data?.detail ?? err?.message;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && typeof item.msg === "string") return item.msg;
          return null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    if (detail && typeof detail === "object") {
      if (typeof detail.msg === "string") {
        return detail.msg;
      }
      return fallback;
    }

    return fallback;
  };

  const toApiDateTime = (dateValue?: string): string | undefined => {
    if (!dateValue) return undefined;
    // The backend expects datetime, while the UI date picker returns YYYY-MM-DD.
    if (dateValue.includes("T") || dateValue.includes("t") || dateValue.includes(" ") || dateValue.includes("_")) {
      return dateValue;
    }
    return `${dateValue}T00:00:00`;
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== "all") filters.category_id = parseInt(categoryFilter);
      if (statusFilter !== "all") filters.status = statusFilter;
      
      const data = await getComponents(filters);
      setComponents(data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load components"));
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.filter((category) => category.category_type === "component"));
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchSuppliers();
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchComponents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, categoryFilter, statusFilter]);

  const resetForm = () => {
    setFormData({
      name: "",
      category_id: 0,
      serial_number: "",
      purchase_price: undefined,
      purchase_date: "",
      supplier_id: undefined,
      specifications: "",
      notes: "",
      include_warranty: false,
      warranty_provider: "",
      warranty_duration: 12,
      warranty_start_date: "",
      warranty_terms: "",
    });
    setFormError(null);
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name.trim() || !formData.category_id) {
      setFormError("Component name and category are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const newComponent = await createComponent({
        name: formData.name.trim(),
        category_id: formData.category_id,
        serial_number: formData.serial_number?.trim() || undefined,
        purchase_price: formData.purchase_price || undefined,
        purchase_date: toApiDateTime(formData.purchase_date),
        supplier_id: formData.supplier_id || undefined,
        specifications: formData.specifications?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });
      
      // Add warranty if enabled
      if (formData.include_warranty && formData.warranty_start_date) {
        try {
          await addComponentWarranty(newComponent.id, {
            provider_name: formData.warranty_provider || "",
            duration_months: formData.warranty_duration || 12,
            start_date: formData.warranty_start_date,
            terms_conditions: formData.warranty_terms || undefined,
          });
        } catch (err: any) {
          console.error("Failed to add warranty:", err);
          // Continue anyway, component was created successfully
        }
      }
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchComponents();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Failed to create component"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingComponent || !formData.name.trim() || !formData.category_id) {
      setFormError("Component name and category are required");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateComponent(editingComponent.id, {
        name: formData.name.trim(),
        category_id: formData.category_id,
        serial_number: formData.serial_number?.trim() || undefined,
        purchase_price: formData.purchase_price || undefined,
        purchase_date: toApiDateTime(formData.purchase_date),
        supplier_id: formData.supplier_id || undefined,
        specifications: formData.specifications?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        status: formData.status || undefined,
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      setEditingComponent(null);
      fetchComponents();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Failed to update component"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      category_id: component.category_id,
      serial_number: component.serial_number || "",
      purchase_price: component.purchase_price || undefined,
      purchase_date: component.purchase_date?.split('T')[0] || "",
      supplier_id: component.supplier_id || undefined,
      specifications: component.specifications || "",
      notes: component.notes || "",
      status: component.status,
    });
    setFormError(null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteComponent = async (id: number, componentName: string) => {
    if (!confirm(`Are you sure you want to delete "${componentName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteComponent(id);
      fetchComponents();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to delete component"));
    }
  };

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  // Stable input handlers to prevent focus loss
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: parseInt(value) }));
  };

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, serial_number: e.target.value }));
  };

  const handleSupplierChange = (value: string) => {
    const supplierId = value === "none" ? undefined : parseInt(value);
    const supplierName = suppliers.find((supplier) => supplier.id === supplierId)?.name || "";

    setFormData((prev) => ({
      ...prev,
      supplier_id: supplierId,
      warranty_provider: supplierName,
      include_warranty: supplierId ? prev.include_warranty : false,
      warranty_start_date: supplierId ? prev.warranty_start_date : "",
      warranty_terms: supplierId ? prev.warranty_terms : "",
      warranty_duration: supplierId ? prev.warranty_duration : 12,
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, purchase_price: e.target.value ? parseFloat(e.target.value) : undefined }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, purchase_date: e.target.value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSpecsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, specifications: e.target.value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleIncludeWarrantyChange = (checked: boolean) => {
    if (!canConfigureWarranty) return;
    setFormData((prev) => ({
      ...prev,
      include_warranty: checked,
      warranty_provider: selectedSupplier?.name || "",
    }));
  };

  const handleWarrantyDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, warranty_duration: parseInt(e.target.value) || 12 }));
  };

  const handleWarrantyStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, warranty_start_date: e.target.value }));
  };

  const handleWarrantyTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, warranty_terms: e.target.value }));
  };

  const handleCloseDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  if (loading && components.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading components...</p>
      </div>
    );
  }

  // Stats
  const availableCount = components.filter(c => c.status === "Available").length;
  const installedCount = components.filter(c => c.status === "Installed").length;

  return (
    <div className="h-[calc(100dvh-1rem)] p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Components</h1>
          <p className="text-muted-foreground">Manage hardware components, upgrades, and repair parts</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className={cn("transition-all duration-300 ease-in-out", formData.include_warranty ? "w-[95vw] max-w-[1100px]" : "w-[95vw] sm:max-w-[600px]")}>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Add New Component</DialogTitle>
              <DialogDescription>
                Add a new hardware component to inventory (RAM, SSD, batteries, etc.)
              </DialogDescription>
            </DialogHeader>
            {formError && (
              <div className="mx-6 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddComponent}>
              <div className="flex">
                {/* Left: Component fields */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out px-6 pb-4",
                    formData.include_warranty ? "w-1/2 border-r" : "w-full"
                  )}
                >
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Component Information
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Component Name *</Label>
                        <Input
                          className="h-9"
                          value={formData.name}
                          onChange={handleNameChange}
                          placeholder="16GB DDR4 RAM"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category *</Label>
                        <Select value={formData.category_id ? formData.category_id.toString() : ""} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Serial Number</Label>
                        <Input
                          className="h-9"
                          value={formData.serial_number}
                          onChange={handleSerialChange}
                          placeholder="SN123456789"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Supplier</Label>
                        <Select
                          value={formData.supplier_id?.toString() || "none"}
                          onValueChange={handleSupplierChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Supplier</SelectItem>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Purchase Price (LKR)</Label>
                        <Input
                          className="h-9"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.purchase_price || ""}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Purchase Date</Label>
                        <Input
                          className="h-9"
                          type="date"
                          value={formData.purchase_date}
                          onChange={handleDateChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Specifications</Label>
                      <Textarea
                        value={formData.specifications}
                        onChange={handleSpecsChange}
                        placeholder="DDR4, 3200MHz, CL16..."
                        className="resize-none h-16"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={handleNotesChange}
                        placeholder="Additional notes..."
                        className="resize-none h-16"
                      />
                    </div>

                    {/* Warranty toggle */}
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Add Warranty Tracking
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {canConfigureWarranty
                            ? "Track detailed warranty information"
                            : "Select a supplier first to enable warranty tracking"}
                        </p>
                      </div>
                      <Switch
                        checked={formData.include_warranty || false}
                        onCheckedChange={handleIncludeWarrantyChange}
                        disabled={!canConfigureWarranty}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Warranty panel — slides in */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    formData.include_warranty ? "w-1/2 opacity-100" : "w-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-4 min-w-[340px]">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-primary">
                      <Shield className="h-4 w-4" />
                      Warranty Details
                    </div>

                    <div className="space-y-3 bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Provider *</Label>
                          <Input
                            className="h-9 bg-background"
                            value={selectedSupplier?.name || ""}
                            readOnly
                            disabled
                            placeholder="Auto-filled from supplier"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Duration (Months) *</Label>
                          <Input
                            className="h-9 bg-background"
                            type="number"
                            min="1"
                            placeholder="12"
                            value={formData.warranty_duration || 12}
                            onChange={handleWarrantyDurationChange}
                            disabled={!canConfigureWarranty}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Start Date *</Label>
                        <Input
                          className="h-9 bg-background"
                          type="date"
                          value={formData.warranty_start_date || ""}
                          onChange={handleWarrantyStartDateChange}
                          disabled={!canConfigureWarranty}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">End date calculated automatically</p>

                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Terms & Conditions
                        </Label>
                        <Textarea
                          className="resize-none h-24 bg-background"
                          value={formData.warranty_terms || ""}
                          onChange={handleWarrantyTermsChange}
                          placeholder="Coverage details, exclusions, claim process..."
                          disabled={!canConfigureWarranty}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 border">
                        <p className="font-medium text-foreground mb-1">Tip</p>
                        <p>Warranty will be tracked and shown in the component profile with active/expired status.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Add Component"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Components</p>
                <p className="text-2xl font-bold">{components.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installed</p>
                <p className="text-2xl font-bold">{installedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Installed">Installed</SelectItem>
            <SelectItem value="Defective">Defective</SelectItem>
            <SelectItem value="Disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Components Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Component Inventory ({components.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {components.length === 0 ? (
            <div className="h-full text-center py-8 text-muted-foreground flex items-center justify-center">
              No components found. Add your first component to get started.
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Price (LKR)</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{component.category || categoryNameById.get(component.category_id) || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        {component.serial_number || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {component.supplier?.name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {component.purchase_price ? (
                          <span className="flex items-center gap-1">
                            <Banknote className="h-3 w-3 text-muted-foreground" />
                            {`LKR ${component.purchase_price.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {component.warranty ? (
                          <div className="flex items-center gap-1">
                            <Badge className="bg-green-100 text-green-800">
                              <Shield className="h-3 w-3 mr-1" />
                              {component.warranty.duration_months}m
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(component.status)}>
                          {component.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(component)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteComponent(component.id, component.name)}
                            disabled={component.status === "Installed"}
                            title={component.status === "Installed" ? "Cannot delete installed component" : "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          resetForm();
          setEditingComponent(null);
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>
              Update component information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditComponent}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Component Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="16GB DDR4 RAM"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={formData.category_id ? formData.category_id.toString() : ""}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serial_number">Serial Number</Label>
                  <Input
                    id="edit-serial_number"
                    value={formData.serial_number}
                    onChange={handleSerialChange}
                    placeholder="SN123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier_id">Supplier</Label>
                  <Select
                    value={formData.supplier_id?.toString() || "none"}
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Supplier</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purchase_price">Purchase Price (LKR)</Label>
                  <Input
                    id="edit-purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price || ""}
                    onChange={handlePriceChange}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-purchase_date">Purchase Date</Label>
                  <Input
                    id="edit-purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status || "Available"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Installed">Installed</SelectItem>
                    <SelectItem value="Defective">Defective</SelectItem>
                    <SelectItem value="Disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-specifications">Specifications</Label>
                  <Textarea
                    id="edit-specifications"
                    value={formData.specifications}
                    onChange={handleSpecsChange}
                    placeholder="DDR4, 3200MHz, CL16..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={handleNotesChange}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
