"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getFuelLogs, FuelLogDetail } from "@/modules/fams/api";
import { isAuthenticated } from "@/lib/auth";

export default function FuelLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<FuelLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));

  const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  };

  const formatErrorMessage = (detail: unknown): string => {
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg?: unknown }).msg ?? "Validation error");
          }
          return "Validation error";
        })
        .filter(Boolean);
      if (msgs.length > 0) {
        return msgs.join(". ");
      }
    }
    return "Failed to load fuel logs";
  };

  const loadFuelLogs = async (year: string, month: string) => {
    setLoading(true);
    setError(null);
    try {
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0)
        .getDate()
        .toString()
        .padStart(2, "0");
      const endDateValue = `${year}-${month}-${endDate}`;

      const data = await getFuelLogs(startDate, endDateValue);
      setLogs(data);
    } catch (err: any) {
      setError(formatErrorMessage(err?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadFuelLogs(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, router]);

  const filteredAndSortedLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = logs;

    if (term) {
      result = logs.filter(
        (log) =>
          log.vehicle_number.toLowerCase().includes(term) ||
          log.employee_name?.toLowerCase().includes(term) ||
          log.receipt_number.toLowerCase().includes(term) ||
          log.fuel_grade.toLowerCase().includes(term)
      );
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.issue_date);
      const dateB = new Date(b.issue_date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [logs, search]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 h-screen flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fuel Receipt Logs</h1>
        <p className="text-muted-foreground">All fuel issuance receipts - latest first</p>
      </div>

      {/* Filter Card - Sticky */}
      <Card className="sticky top-0 z-30 border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter & Search
          </CardTitle>
          <CardDescription>Select month/year and search by employee, vehicle, or receipt number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Employee, vehicle, receipt, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground flex-1">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading fuel logs...
        </div>
      ) : filteredAndSortedLogs.length === 0 ? (
        <Card className="flex-1">
          <CardContent className="py-12 text-center text-muted-foreground h-full flex items-center justify-center">
            {logs.length === 0 ? "No fuel logs found for the selected month." : "No logs match your search criteria."}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">
              Receipt Transactions
              <span className="text-sm font-normal text-muted-foreground ml-2">({filteredAndSortedLogs.length} logs)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="rounded-none border-none overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-background">
                  <TableRow>
                    <TableHead>Issued Date</TableHead>
                    <TableHead className="pl-2">Receipt #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Fuel Grade</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Price / L</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(log.issue_date)}</TableCell>
                      <TableCell className="font-medium pl-2 pr-1">
                        <div className="inline-flex items-center gap-1.5">
                          <span>{log.receipt_number}</span>
                          {log.is_cancelled && (
                            <Badge variant="destructive" className="px-1.5 py-0 pr-1 text-[10px] leading-4 uppercase tracking-wide">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.vehicle_number}</span>
                          <span className="text-xs text-muted-foreground">{log.vehicle_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.employee_name || "Unassigned"}</TableCell>
                      <TableCell>{log.fuel_grade}</TableCell>
                      <TableCell className="text-right">{log.liters_issued.toFixed(2)} L</TableCell>
                      <TableCell className="text-right">{formatCurrency(log.price_per_liter_lkr)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(log.total_cost_lkr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
