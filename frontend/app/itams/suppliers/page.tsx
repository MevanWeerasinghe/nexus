"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Building2, Pencil, Trash2, Search, Mail, Phone, MapPin } from "lucide-react";
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier,
  deleteSupplier, 
  Supplier,
  SupplierCreate 
} from "@/modules/itam/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SupplierCreate>({
    name: "",
    contact_email: "",
    phone: "",
    address: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(searchTerm || undefined);
      setSuppliers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      contact_email: "",
      phone: "",
      address: "",
    });
    setFormError(null);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name.trim()) {
      setFormError("Supplier name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createSupplier({
        name: formData.name.trim(),
        contact_email: formData.contact_email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
      });
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingSupplier || !formData.name.trim()) {
      setFormError("Supplier name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateSupplier(editingSupplier.id, {
        name: formData.name.trim(),
        contact_email: formData.contact_email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to update supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_email: supplier.contact_email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setFormError(null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: number, supplierName: string) => {
    if (!confirm(`Are you sure you want to delete "${supplierName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteSupplier(id);
      fetchSuppliers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete supplier");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, contact_email: e.target.value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: e.target.value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, address: e.target.value }));
  };

  const handleCloseDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-1rem)] p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage vendors and suppliers for assets and components</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Create a new supplier record for tracking asset and component purchases.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSupplier}>
              <div className="space-y-4 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="add-name">Supplier Name *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="ABC Tech Solutions"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-contact_email">Contact Email</Label>
                  <Input
                    id="add-contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleEmailChange}
                    placeholder="contact@supplier.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input
                    id="add-phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-address">Address</Label>
                  <Textarea
                    id="add-address"
                    value={formData.address}
                    onChange={handleAddressChange}
                    placeholder="123 Business Street, City, Country"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Supplier"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suppliers Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Suppliers ({suppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {suppliers.length === 0 ? (
            <div className="h-full text-center py-8 text-muted-foreground flex items-center justify-center">
              No suppliers found. Add your first supplier to get started.
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        {supplier.contact_email ? (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {supplier.contact_email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {supplier.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.address ? (
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={supplier.address}>
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            {supplier.address}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
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
          setEditingSupplier(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSupplier}>
            <div className="space-y-4 py-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Supplier Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="ABC Tech Solutions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact_email">Contact Email</Label>
                <Input
                  id="edit-contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleEmailChange}
                  placeholder="contact@supplier.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  placeholder="123 Business Street, City, Country"
                  rows={3}
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
