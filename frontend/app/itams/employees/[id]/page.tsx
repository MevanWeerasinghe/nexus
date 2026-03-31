"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, User, Mail, Building, Package, Unlink, Network, Pencil } from "lucide-react";
import { getEmployee, getEmployeeAssets, assignAsset, updateEmployee, Employee, Asset } from "@/modules/itam/api";
import UnassignReasonDialog from "@/components/assets/UnassignReasonDialog";

const DEPARTMENTS = [
  "Admin",
  "Directors",
  "IT",
  "Finance",
  "Airfreight",
  "Ocean freight",
  "Sales",
  "Import",
  "Wharf",
  "ACV",
  "CFS Welisara",
  "CFS GTL",
] as const;

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = parseInt(params.id as string);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [pendingUnassignAssetId, setPendingUnassignAssetId] = useState<number | null>(null);
  const [pendingUnassignAssetTag, setPendingUnassignAssetTag] = useState<string | undefined>(undefined);
  const [unassigning, setUnassigning] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editIpAddress, setEditIpAddress] = useState("");

  const getErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === "string" ? item : item?.msg || JSON.stringify(item)))
        .join(" | ");
    }
    if (detail && typeof detail === "object") {
      return detail.msg || JSON.stringify(detail);
    }
    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeeData, assetsData] = await Promise.all([
        getEmployee(employeeId),
        getEmployeeAssets(employeeId),
      ]);
      setEmployee(employeeData);
      setAssets(assetsData);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load employee details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const handleUnassignAsset = async (assetId: number, assetTag: string) => {
    setPendingUnassignAssetId(assetId);
    setPendingUnassignAssetTag(assetTag);
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
      fetchData();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to unassign asset"));
    } finally {
      setUnassigning(false);
    }
  };

  const openEditDialog = () => {
    if (!employee) {
      return;
    }
    setEditName(employee.name || "");
    setEditDepartment(employee.department || "");
    setEditIpAddress(employee.ip_address || "");
    setEditFormError(null);
    setIsEditDialogOpen(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) {
      return;
    }

    setEditFormError(null);
    if (!editName.trim() || !editDepartment) {
      setEditFormError("Name and department are required");
      return;
    }

    try {
      setIsEditSubmitting(true);
      await updateEmployee(employee.id, {
        name: editName.trim(),
        department: editDepartment,
        ip_address: editIpAddress.trim() || undefined,
      });
      setIsEditDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setEditFormError(getErrorMessage(err, "Failed to update employee"));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading employee details...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || "Employee not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/itams/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/itams/employees">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{employee.name}</h1>
          <p className="text-muted-foreground">Employee Details</p>
        </div>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openEditDialog}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee details. Email cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditEmployee}>
              <div className="space-y-4 py-4">
                {editFormError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editFormError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="profileEditName">Name *</Label>
                  <Input
                    id="profileEditName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEditEmail">Email (Locked)</Label>
                  <Input id="profileEditEmail" value={employee.email} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEditDepartment">Department *</Label>
                  <Select value={editDepartment} onValueChange={setEditDepartment}>
                    <SelectTrigger id="profileEditDepartment">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEditIpAddress">IP Address</Label>
                  <Input
                    id="profileEditIpAddress"
                    value={editIpAddress}
                    onChange={(e) => setEditIpAddress(e.target.value)}
                    placeholder="192.168.1.10"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditSubmitting}>
                  {isEditSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">IP Address</p>
                <p className="font-medium">{employee.ip_address || "Not specified"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assigned Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assets assigned to this employee</p>
              <p className="text-sm">Go to Assets page to assign equipment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.asset_tag}</TableCell>
                    <TableCell>{asset.category?.name || "-"}</TableCell>
                    <TableCell>{asset.manufacturer}</TableCell>
                    <TableCell>{asset.model_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{asset.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignAsset(asset.id, asset.asset_tag)}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
