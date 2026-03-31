"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Users, Eye, Trash2, Pencil } from "lucide-react";
import { getEmployees, createEmployee, deleteEmployee, updateEmployee, Employee } from "@/modules/itam/api";

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [formError, setFormError] = useState<string | null>(null);
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

  const filteredEmployees =
    departmentFilter === "all"
      ? employees
      : employees.filter((employee) => employee.department === departmentFilter);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!name.trim() || !email.trim() || !department) {
      setFormError("Name, email, and department are required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createEmployee({
        name: name.trim(),
        email: email.trim(),
        department,
        ip_address: ipAddress.trim() || undefined,
      });
      
      // Reset form and close dialog
      setName("");
      setEmail("");
      setDepartment("");
      setIpAddress("");
      setIsDialogOpen(false);
      
      // Refresh employee list
      fetchEmployees();
    } catch (err: any) {
      setFormError(getErrorMessage(err, "Failed to create employee"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditName(employee.name || "");
    setEditDepartment(employee.department || "");
    setEditIpAddress(employee.ip_address || "");
    setEditFormError(null);
    setIsEditDialogOpen(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) {
      return;
    }

    setEditFormError(null);
    if (!editName.trim() || !editDepartment) {
      setEditFormError("Name and department are required");
      return;
    }

    try {
      setIsEditSubmitting(true);
      await updateEmployee(editingEmployee.id, {
        name: editName.trim(),
        department: editDepartment,
        ip_address: editIpAddress.trim() || undefined,
      });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      setEditFormError(getErrorMessage(err, "Failed to update employee"));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: number, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete "${employeeName}"? All assets assigned to this employee will be unassigned.`)) {
      return;
    }

    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to delete employee"));
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-1rem)] p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage staff members for asset assignment</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new employee record for asset assignment. Employees do not have system login access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee}>
              <div className="space-y-4 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="department">
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
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input
                    id="ipAddress"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.10"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Employee"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                  <Label htmlFor="editName">Name *</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email (Locked)</Label>
                  <Input
                    id="editEmail"
                    value={editingEmployee?.email || ""}
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Department *</Label>
                  <Select value={editDepartment} onValueChange={setEditDepartment}>
                    <SelectTrigger id="editDepartment">
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
                  <Label htmlFor="editIpAddress">IP Address</Label>
                  <Input
                    id="editIpAddress"
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Employees Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Employees ({filteredEmployees.length})
            </CardTitle>
            <div className="w-full md:w-64">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="h-full text-center py-10 text-muted-foreground flex items-center justify-center">
              <div>
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employees found</p>
              <p className="text-sm">
                {departmentFilter === "all"
                  ? 'Click "Add Employee" to create one'
                  : "Try a different department filter"}
              </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{employee.ip_address || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/itams/employees/${employee.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
