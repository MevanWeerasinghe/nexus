"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Fuel, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAuthenticated } from "@/lib/auth";
import { FuelGrade, getFuelPrices, updateFuelPrices } from "@/modules/fams/api";

type FuelPriceForm = Record<FuelGrade, string>;

const INITIAL_FORM: FuelPriceForm = {
  "92 Octane": "",
  "95 Octane": "",
  "Auto Diesel": "",
  "Super Diesel 4 Star": "",
};

function getErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === "string" ? item : item?.msg || JSON.stringify(item))).join(" | ");
  }
  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }
  return err?.message || "Failed to save fuel prices";
}

export default function FuelPricesPage() {
  const router = useRouter();
  const [form, setForm] = useState<FuelPriceForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await getFuelPrices();
      const nextForm: FuelPriceForm = { ...INITIAL_FORM };
      prices.forEach((item) => {
        nextForm[item.fuel_grade] = item.price_per_liter_lkr != null ? String(item.price_per_liter_lkr) : "";
      });
      setForm(nextForm);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadPrices();
  }, [router]);

  const handleInput = (grade: FuelGrade, value: string) => {
    setForm((prev) => ({ ...prev, [grade]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const grades: FuelGrade[] = ["92 Octane", "95 Octane", "Auto Diesel", "Super Diesel 4 Star"];

    try {
      const payload = grades.map((grade) => {
        const parsed = Number(form[grade]);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`Enter a valid price for ${grade}`);
        }
        return { fuel_grade: grade, price_per_liter_lkr: parsed };
      });

      await updateFuelPrices(payload);
      setSuccess("Fuel prices saved successfully.");
      await loadPrices();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Prices</h1>
          <p className="text-muted-foreground">Set and update standard prices used during fuel log issuance.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Prices
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-emerald-300/40 bg-emerald-100/40 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading fuel prices...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-amber-600" />
                Petrol Prices
              </CardTitle>
              <CardDescription>Configure petrol grades used during fuel issue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">92 Octane (LKR/L)</label>
                <Input type="number" min="0" step="0.01" value={form["92 Octane"]} onChange={(e) => handleInput("92 Octane", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">95 Octane (LKR/L)</label>
                <Input type="number" min="0" step="0.01" value={form["95 Octane"]} onChange={(e) => handleInput("95 Octane", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-sky-600" />
                Diesel Prices
              </CardTitle>
              <CardDescription>Configure diesel grades used during fuel issue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto Diesel (LKR/L)</label>
                <Input type="number" min="0" step="0.01" value={form["Auto Diesel"]} onChange={(e) => handleInput("Auto Diesel", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Super Diesel 4 Star (LKR/L)</label>
                <Input type="number" min="0" step="0.01" value={form["Super Diesel 4 Star"]} onChange={(e) => handleInput("Super Diesel 4 Star", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
