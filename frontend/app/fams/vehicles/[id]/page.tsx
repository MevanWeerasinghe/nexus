"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  Fuel,
  Infinity,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createVehicleFuelLog,
  getFuelPrices,
  getEmployees,
  FuelGrade,
  FuelLog,
  getVehicle,
  getVehicleFuelLogs,
  updateVehicleFuelLog,
  updateVehicle,
  Employee,
  Vehicle,
} from "@/modules/fams/api";
import { isAuthenticated } from "@/lib/auth";

const VEHICLE_TYPES = ["Car", "Bike", "Van", "Lorry"] as const;
const OWNERSHIP_TYPES = ["Office Vehicle", "Personal Vehicle"] as const;
const fuelLogSchema = z.object({
  issue_date: z.string().optional(),
  receipt_number: z.string().min(1, "Receipt number is required"),
  liters_issued: z.string().min(1, "Liters issued is required"),
  fuel_grade: z.string().min(1, "Fuel grade is required"),
  price_per_liter_lkr: z.string().min(1, "Price per liter is required"),
});

type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

const vehicleEditSchema = z.object({
  vehicle_number: z.string().min(1, "Vehicle number is required"),
  vehicle_type: z.enum(VEHICLE_TYPES),
  model: z.string().min(1, "Vehicle model is required"),
  ownership_type: z.enum(OWNERSHIP_TYPES),
  employee_id: z.string().optional(),
  unlimited_fuel: z.boolean().default(false),
  monthly_allocation: z.string().optional(),
  fuel_capacity_liters: z.string().min(1, "Engine capacity is required"),
  fuel_type: z.enum(["Petrol", "Diesel"]),
}).superRefine((values, context) => {
  if (!values.unlimited_fuel) {
    if (!values.monthly_allocation || values.monthly_allocation.trim() === "") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Monthly allocation is required when unlimited fuel is disabled",
        path: ["monthly_allocation"],
      });
    } else {
      const allocation = Number(values.monthly_allocation);
      if (!Number.isFinite(allocation) || allocation <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Monthly allocation must be greater than zero",
          path: ["monthly_allocation"],
        });
      }
    }
  }

  const capacity = Number(values.fuel_capacity_liters);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Engine capacity must be greater than zero",
      path: ["fuel_capacity_liters"],
    });
  }
});

type VehicleEditFormValues = z.infer<typeof vehicleEditSchema>;

const PETROL_GRADES: FuelGrade[] = ["92 Octane", "95 Octane"];
const DIESEL_GRADES: FuelGrade[] = ["Auto Diesel", "Super Diesel 4 Star"];

export default function VehicleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = Number(params.id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [priceByGrade, setPriceByGrade] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFuelDialogOpen, setEditFuelDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFuelSubmitting, setEditFuelSubmitting] = useState(false);
  const [editEmployeeSearch, setEditEmployeeSearch] = useState("");
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      issue_date: "",
      receipt_number: "",
      liters_issued: "",
      fuel_grade: "",
      price_per_liter_lkr: "",
    },
  });

  const editForm = useForm<VehicleEditFormValues>({
    resolver: zodResolver(vehicleEditSchema),
    defaultValues: {
      vehicle_number: "",
      vehicle_type: "Car",
      model: "",
      ownership_type: "Office Vehicle",
      employee_id: "unassigned",
      unlimited_fuel: false,
      monthly_allocation: "",
      fuel_capacity_liters: "",
      fuel_type: "Petrol",
    },
  });

  const editFuelForm = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      issue_date: "",
      receipt_number: "",
      liters_issued: "",
      fuel_grade: "",
      price_per_liter_lkr: "",
    },
  });

  const selectedGrade = form.watch("fuel_grade");
  const editSelectedGrade = editFuelForm.watch("fuel_grade");
  const editUnlimitedFuel = editForm.watch("unlimited_fuel");

  const gradeOptions = useMemo(() => {
    if (!vehicle) {
      return [];
    }
    return vehicle.fuel_type === "Petrol" ? PETROL_GRADES : DIESEL_GRADES;
  }, [vehicle]);

  const filteredEditEmployees = useMemo(() => {
    const term = editEmployeeSearch.trim().toLowerCase();
    if (!term) {
      return employees;
    }
    return employees.filter((employee) => employee.name.toLowerCase().includes(term));
  }, [employees, editEmployeeSearch]);

  const loadData = async () => {
    if (!Number.isFinite(vehicleId)) {
      setError("Invalid vehicle ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [vehicleData, logsData, pricesData, employeeData] = await Promise.all([
        getVehicle(vehicleId),
        getVehicleFuelLogs(vehicleId),
        getFuelPrices(),
        getEmployees(),
      ]);
      setVehicle(vehicleData);
      setFuelLogs(logsData);
      setEmployees(employeeData);

      const nextPriceMap: Record<string, number> = {};
      pricesData.forEach((item) => {
        if (typeof item.price_per_liter_lkr === "number" && item.price_per_liter_lkr > 0) {
          nextPriceMap[item.fuel_grade] = item.price_per_liter_lkr;
        }
      });
      setPriceByGrade(nextPriceMap);

      const defaultGrade = vehicleData.fuel_type === "Petrol" ? PETROL_GRADES[0] : DIESEL_GRADES[0];
      form.setValue("fuel_grade", defaultGrade);
      form.setValue(
        "price_per_liter_lkr",
        nextPriceMap[defaultGrade] ? String(nextPriceMap[defaultGrade]) : ""
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedGrade) {
      return;
    }
    const price = priceByGrade[selectedGrade];
    form.setValue("price_per_liter_lkr", price ? String(price) : "");
  }, [form, selectedGrade, priceByGrade]);

  useEffect(() => {
    if (!editSelectedGrade) {
      return;
    }
    const price = priceByGrade[editSelectedGrade];
    editFuelForm.setValue("price_per_liter_lkr", price ? String(price) : "");
  }, [editFuelForm, editSelectedGrade, priceByGrade]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [vehicleId, router]);

  const handleCreateFuelLog = async (values: FuelLogFormValues) => {
    if (!vehicle) return;

    setSubmitting(true);
    setError(null);
    try {
      const unitPrice = Number(values.price_per_liter_lkr || "");
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        setError(`Fuel price is not configured for ${values.fuel_grade}. Please update Fuel Prices first.`);
        setSubmitting(false);
        return;
      }

      await createVehicleFuelLog(vehicle.id, {
        issue_date: values.issue_date || undefined,
        receipt_number: values.receipt_number.trim(),
        liters_issued: parseFloat(values.liters_issued),
        fuel_grade: values.fuel_grade as FuelGrade,
        price_per_liter_lkr: unitPrice,
      });

      form.reset({
        issue_date: "",
        receipt_number: "",
        liters_issued: "",
        fuel_grade: gradeOptions[0] || "",
        price_per_liter_lkr: "",
      });
      setDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create fuel log");
    } finally {
      setSubmitting(false);
    }
  };

  const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (num: number) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openFuelLogEditDialog = (log: FuelLog) => {
    setEditingFuelLog(log);
    editFuelForm.reset({
      issue_date: toDateTimeLocal(log.issue_date),
      receipt_number: log.receipt_number,
      liters_issued: String(log.liters_issued),
      fuel_grade: log.fuel_grade,
      price_per_liter_lkr: String(log.price_per_liter_lkr),
    });
    setEditFuelDialogOpen(true);
  };

  const handleUpdateFuelLog = async (values: FuelLogFormValues) => {
    if (!vehicle || !editingFuelLog) {
      return;
    }

    setEditFuelSubmitting(true);
    setError(null);
    try {
      const unitPrice = Number(values.price_per_liter_lkr || "");
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        setError(`Fuel price is not configured for ${values.fuel_grade}. Please update Fuel Prices first.`);
        setEditFuelSubmitting(false);
        return;
      }

      await updateVehicleFuelLog(vehicle.id, editingFuelLog.id, {
        issue_date: values.issue_date || undefined,
        receipt_number: values.receipt_number.trim(),
        liters_issued: parseFloat(values.liters_issued),
        fuel_grade: values.fuel_grade as FuelGrade,
        price_per_liter_lkr: unitPrice,
      });

      setEditFuelDialogOpen(false);
      setEditingFuelLog(null);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update fuel log");
    } finally {
      setEditFuelSubmitting(false);
    }
  };

  const openEditDialog = () => {
    if (!vehicle) {
      return;
    }
    setEditEmployeeSearch("");
    editForm.reset({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      model: vehicle.model,
      ownership_type: vehicle.ownership_type,
      employee_id: vehicle.employee_id ? String(vehicle.employee_id) : "unassigned",
      unlimited_fuel: vehicle.unlimited_fuel,
      monthly_allocation: vehicle.unlimited_fuel ? "" : String(vehicle.monthly_allocation),
      fuel_capacity_liters: vehicle.fuel_capacity_liters ? String(vehicle.fuel_capacity_liters) : "",
      fuel_type: vehicle.fuel_type,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateVehicle = async (values: VehicleEditFormValues) => {
    if (!vehicle) {
      return;
    }

    setEditSubmitting(true);
    setError(null);
    try {
      await updateVehicle(vehicle.id, {
        vehicle_number: values.vehicle_number.trim(),
        vehicle_type: values.vehicle_type,
        model: values.model.trim(),
        ownership_type: values.ownership_type,
        employee_id: values.employee_id && values.employee_id !== "unassigned" ? parseInt(values.employee_id, 10) : undefined,
        unlimited_fuel: values.unlimited_fuel,
        ...(values.unlimited_fuel ? {} : { monthly_allocation: parseFloat(values.monthly_allocation || "0") }),
        fuel_capacity_liters: parseFloat(values.fuel_capacity_liters),
        fuel_type: values.fuel_type,
      });

      setEditDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update vehicle");
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading vehicle details...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => router.push("/fams/vehicles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicles
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Vehicle not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="ghost" onClick={() => router.push("/fams/vehicles")} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{vehicle.vehicle_number}</h1>
          <p className="text-muted-foreground">Fuel allocation and transaction history</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openEditDialog}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Vehicle</DialogTitle>
                <DialogDescription>Update vehicle details and allocation settings.</DialogDescription>
              </DialogHeader>

              <Form form={editForm}>
                <form onSubmit={editForm.handleSubmit(handleUpdateVehicle)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="vehicle_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
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
                              {VEHICLE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="ownership_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Ownership</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ownership" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OWNERSHIP_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
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
                              <div className="px-2 pb-2">
                                <Input
                                  placeholder="Search employee..."
                                  value={editEmployeeSearch}
                                  onChange={(event) => setEditEmployeeSearch(event.target.value)}
                                  onKeyDown={(event) => event.stopPropagation()}
                                />
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {filteredEditEmployees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="fuel_capacity_liters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engine Capacity (CC)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <FormField
                        control={editForm.control}
                        name="unlimited_fuel"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <div className="inline-flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm">
                                <FormLabel className="text-sm font-medium leading-none">Unlimited fuel</FormLabel>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="monthly_allocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Fuel Allocation (L)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={editUnlimitedFuel ? "Unlimited mode enabled" : "40"}
                                disabled={editUnlimitedFuel}
                                {...field}
                                value={editUnlimitedFuel ? "" : field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
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

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editSubmitting}>
                      {editSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Update Vehicle
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Fuel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Fuel Issuance</DialogTitle>
                <DialogDescription>
                  Record a fuel receipt for this vehicle.
                </DialogDescription>
              </DialogHeader>

              <Form form={form}>
                <form onSubmit={form.handleSubmit(handleCreateFuelLog)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issue_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receipt_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Physical Receipt Number</FormLabel>
                          <FormControl>
                            <Input placeholder="RCPT-00125" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="liters_issued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Liters Issued</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuel_grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Grade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gradeOptions.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-4">
                    <FormField
                      control={form.control}
                      name="price_per_liter_lkr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Price Per Liter (LKR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Set in Fuel Prices page"
                              readOnly
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Auto-filled from Fuel Prices based on selected grade.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save Log
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={editFuelDialogOpen} onOpenChange={setEditFuelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Fuel Log</DialogTitle>
                <DialogDescription>
                  Update fuel transaction details for this vehicle.
                </DialogDescription>
              </DialogHeader>

              <Form form={editFuelForm}>
                <form onSubmit={editFuelForm.handleSubmit(handleUpdateFuelLog)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editFuelForm.control}
                      name="issue_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editFuelForm.control}
                      name="receipt_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Physical Receipt Number</FormLabel>
                          <FormControl>
                            <Input placeholder="RCPT-00125" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editFuelForm.control}
                      name="liters_issued"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Liters Issued</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editFuelForm.control}
                      name="fuel_grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Grade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gradeOptions.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-4">
                    <FormField
                      control={editFuelForm.control}
                      name="price_per_liter_lkr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Price Per Liter (LKR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Set in Fuel Prices page"
                              readOnly
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Auto-filled from Fuel Prices based on selected grade.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditFuelDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editFuelSubmitting}>
                      {editFuelSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Update Log
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Monthly Share
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {vehicle.unlimited_fuel ? (
              <span className="inline-flex items-center gap-2 text-primary">
                Unlimited
              </span>
            ) : (
              `${vehicle.monthly_allocation.toFixed(2)} L`
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remaining Fuel</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {vehicle.unlimited_fuel ? (
              <span className="inline-flex items-center gap-2 text-primary">
                Unlimited
              </span>
            ) : (
              `${(vehicle.remaining_fuel ?? 0).toFixed(2)} L`
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fuel Type</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{vehicle.fuel_type}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ownership</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{vehicle.ownership_type}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Engine Capacity</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {vehicle.fuel_capacity_liters ? `${vehicle.fuel_capacity_liters.toFixed(0)} CC` : "-"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Assigned Employee</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{vehicle.employee?.name || "Unassigned"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fuel Log History
          </CardTitle>
          <CardDescription>
            Complete issuance trail for this vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt Number</TableHead>
                  <TableHead>Fuel Grade</TableHead>
                  <TableHead className="text-right">Liters Issued</TableHead>
                  <TableHead className="text-right">Price / L</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center text-muted-foreground py-10" colSpan={7}>
                      No fuel logs recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  fuelLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(log.issue_date)}
                        </div>
                      </TableCell>
                      <TableCell>{log.receipt_number}</TableCell>
                      <TableCell>{log.fuel_grade}</TableCell>
                      <TableCell className="text-right">{log.liters_issued.toFixed(2)} L</TableCell>
                      <TableCell className="text-right">{formatCurrency(log.price_per_liter_lkr)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(log.total_cost_lkr)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openFuelLogEditDialog(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
