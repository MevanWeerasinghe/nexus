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
  Loader2,
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
  FuelGrade,
  FuelLog,
  getVehicle,
  getVehicleFuelLogs,
  Vehicle,
} from "@/modules/fams/api";
import { isAuthenticated } from "@/lib/auth";

const fuelLogSchema = z.object({
  issue_date: z.string().optional(),
  receipt_number: z.string().min(1, "Receipt number is required"),
  liters_issued: z.string().min(1, "Liters issued is required"),
  fuel_grade: z.string().min(1, "Fuel grade is required"),
  price_per_liter_lkr: z.string().min(1, "Price per liter is required"),
});

type FuelLogFormValues = z.infer<typeof fuelLogSchema>;

const PETROL_GRADES: FuelGrade[] = ["92 Octane", "95 Octane"];
const DIESEL_GRADES: FuelGrade[] = ["Auto Diesel", "Super Diesel 4 Star"];

export default function VehicleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = Number(params.id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const gradeOptions = useMemo(() => {
    if (!vehicle) {
      return [];
    }
    return vehicle.fuel_type === "Petrol" ? PETROL_GRADES : DIESEL_GRADES;
  }, [vehicle]);

  const loadData = async () => {
    if (!Number.isFinite(vehicleId)) {
      setError("Invalid vehicle ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [vehicleData, logsData] = await Promise.all([
        getVehicle(vehicleId),
        getVehicleFuelLogs(vehicleId),
      ]);
      setVehicle(vehicleData);
      setFuelLogs(logsData);

      const defaultGrade = vehicleData.fuel_type === "Petrol" ? PETROL_GRADES[0] : DIESEL_GRADES[0];
      form.setValue("fuel_grade", defaultGrade);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

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
      await createVehicleFuelLog(vehicle.id, {
        issue_date: values.issue_date || undefined,
        receipt_number: values.receipt_number.trim(),
        liters_issued: parseFloat(values.liters_issued),
        fuel_grade: values.fuel_grade as FuelGrade,
        price_per_liter_lkr: parseFloat(values.price_per_liter_lkr),
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
                      name="price_per_liter_lkr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Per Liter (LKR)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="365" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Monthly Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{vehicle.monthly_allocation.toFixed(2)} L</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remaining Fuel</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{vehicle.remaining_fuel.toFixed(2)} L</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fuel Type</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{vehicle.fuel_type}</CardContent>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center text-muted-foreground py-10" colSpan={6}>
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
