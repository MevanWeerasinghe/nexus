"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Car,
  Eye,
  Fuel,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import {
  createVehicle,
  deleteVehicle,
  getEmployees,
  getVehicles,
  Employee,
  Vehicle,
  VehicleCreate,
} from "@/modules/fams/api";
import { isAuthenticated } from "@/lib/auth";

const vehicleSchema = z.object({
  vehicle_number: z.string().min(1, "Vehicle number is required"),
  vehicle_type: z.enum(["Car", "Bike"]),
  model: z.string().min(1, "Vehicle model is required"),
  employee_id: z.string().optional(),
  monthly_allocation: z.string().min(1, "Monthly allocation is required"),
  fuel_type: z.enum(["Petrol", "Diesel"]),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function FAMSVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_number: "",
      vehicle_type: "Car",
      model: "",
      employee_id: "unassigned",
      monthly_allocation: "",
      fuel_type: "Petrol",
    },
  });

  const loadPageData = async (searchTerm = "") => {
    setLoading(true);
    setError(null);
    try {
      const [vehicleData, employeeData] = await Promise.all([
        getVehicles(searchTerm || undefined),
        getEmployees(),
      ]);
      setVehicles(vehicleData);
      setEmployees(employeeData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadPageData();
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated()) {
        loadPageData(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const employeeMap = useMemo(() => {
    return new Map(employees.map((employee) => [employee.id, employee]));
  }, [employees]);

  const handleCreateVehicle = async (values: VehicleFormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload: VehicleCreate = {
        vehicle_number: values.vehicle_number.trim(),
        vehicle_type: values.vehicle_type,
        model: values.model.trim(),
        employee_id: values.employee_id && values.employee_id !== "unassigned" ? parseInt(values.employee_id, 10) : undefined,
        monthly_allocation: parseFloat(values.monthly_allocation),
        fuel_type: values.fuel_type,
      };

      await createVehicle(payload);
      form.reset();
      setDialogOpen(false);
      await loadPageData(search);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm("Delete this vehicle and all its fuel logs?")) {
      return;
    }

    try {
      await deleteVehicle(vehicleId);
      await loadPageData(search);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete vehicle");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
        </div>

          <Button variant="outline" onClick={() => loadPageData(search)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Register Vehicle</DialogTitle>
                <DialogDescription>
                  Add a vehicle and set its monthly fuel allocation.
                </DialogDescription>
              </DialogHeader>

              <Form form={form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(handleCreateVehicle)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicle_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Number</FormLabel>
                          <FormControl>
                            <Input placeholder="CAA-1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicle_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Car">Car</SelectItem>
                              <SelectItem value="Bike">Bike</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Toyota Axio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Employee</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Optional" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                              {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                  {employee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthly_allocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Fuel Allocation (L)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuel_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Petrol">Petrol</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Vehicle
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Vehicle Master List
          </CardTitle>
          <CardDescription>
            Search by vehicle number, model, or employee name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search vehicles..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading vehicles...
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Assigned Employee</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Monthly Allocation</TableHead>
                    <TableHead className="text-right">Remaining Fuel</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground py-10" colSpan={8}>
                        No vehicles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                        <TableCell>{vehicle.vehicle_type}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.employee?.name || employeeMap.get(vehicle.employee_id || -1)?.name || "Unassigned"}</TableCell>
                        <TableCell>{vehicle.fuel_type}</TableCell>
                        <TableCell className="text-right">{vehicle.monthly_allocation.toFixed(2)} L</TableCell>
                        <TableCell className="text-right font-semibold">
                          {vehicle.remaining_fuel.toFixed(2)} L
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => router.push(`/fams/vehicles/${vehicle.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          Remaining fuel is calculated from monthly allocation minus issued liters in the current calendar month.
        </CardContent>
      </Card>
    </div>
  );
}
