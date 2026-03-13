"use client";

import { useState, useEffect } from "react";
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
import { Plus, Cpu, Pencil, Trash2, Search, Package, DollarSign } from "lucide-react";
import { 
  getComponents, 
  createComponent, 
  updateComponent,
  deleteComponent,
  getSuppliers,
  Component,
  ComponentCreate,
  Supplier 
} from "@/lib/api-service";

// Common component categories
const COMPONENT_CATEGORIES = [
  "RAM",
  "SSD",
  "HDD",
  "Battery",
  "Power Supply",
  "Graphics Card",
  "CPU",
  "Motherboard",
  "Network Card",
  "Display Panel",
  "Keyboard",
  "Trackpad",
  "Fan",
  "Other"
];

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
  const [formData, setFormData] = useState<ComponentCreate & { status?: string }>({
    name: "",
    category: "",
    serial_number: "",
    purchase_price: undefined,
    purchase_date: "",
    supplier_id: undefined,
    specifications: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== "all") filters.category = categoryFilter;
      if (statusFilter !== "all") filters.status = statusFilter;
      
      const data = await getComponents(filters);
      setComponents(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load components");
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

  useEffect(() => {
    fetchComponents();
    fetchSuppliers();
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
      category: "",
      serial_number: "",
      purchase_price: undefined,
      purchase_date: "",
      supplier_id: undefined,
      specifications: "",
      notes: "",
    });
    setFormError(null);
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name.trim() || !formData.category) {
      setFormError("Component name and category are required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createComponent({
        name: formData.name.trim(),
        category: formData.category,
        serial_number: formData.serial_number?.trim() || undefined,
        purchase_price: formData.purchase_price || undefined,
        purchase_date: formData.purchase_date || undefined,
        supplier_id: formData.supplier_id || undefined,
        specifications: formData.specifications?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchComponents();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create component");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingComponent || !formData.name.trim() || !formData.category) {
      setFormError("Component name and category are required");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateComponent(editingComponent.id, {
        name: formData.name.trim(),
        category: formData.category,
        serial_number: formData.serial_number?.trim() || undefined,
        purchase_price: formData.purchase_price || undefined,
        purchase_date: formData.purchase_date || undefined,
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
      setFormError(err.response?.data?.detail || "Failed to update component");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      category: component.category,
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
      setError(err.response?.data?.detail || "Failed to delete component");
    }
  };

  // Get unique categories from existing components
  const uniqueCategories = [...new Set([...COMPONENT_CATEGORIES, ...components.map(c => c.category)])].sort();

  // Stable input handlers to prevent focus loss
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, serial_number: e.target.value }));
  };

  const handleSupplierChange = (value: string) => {
    setFormData(prev => ({ ...prev, supplier_id: value === "none" ? undefined : parseInt(value) }));
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
    <div className="p-6 space-y-6">
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
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Add New Component</DialogTitle>
              <DialogDescription>
                Add a new hardware component to inventory (RAM, SSD, batteries, etc.)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddComponent}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Component Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="16GB DDR4 RAM"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPONENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={handleSerialChange}
                      placeholder="SN123456789"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price || ""}
                      onChange={handlePriceChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={handleDateChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specifications">Specifications</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={handleSpecsChange}
                    placeholder="DDR4, 3200MHz, CL16..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={handleNotesChange}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Add Component"}
                </Button>
              </DialogFooter>
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
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Component Inventory ({components.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No components found. Add your first component to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-medium">{component.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{component.category}</Badge>
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
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {component.purchase_price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
        <DialogContent className="sm:max-w-[650px]">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purchase_price">Purchase Price</Label>
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

              <div className="space-y-2">
                <Label htmlFor="edit-specifications">Specifications</Label>
                <Textarea
                  id="edit-specifications"
                  value={formData.specifications}
                  onChange={handleSpecsChange}
                  placeholder="DDR4, 3200MHz, CL16..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="Additional notes..."
                  rows={2}
                />
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
