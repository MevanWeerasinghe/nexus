"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Category, AssetCreate, Supplier, getSuppliers } from "@/lib/api-service";
import { Loader2, Shield, Package, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const assetFormSchema = z.object({
  asset_tag: z.string().min(1, "Asset Tag is required"),
  serial_number: z.string().min(1, "Serial Number is required"),
  category_id: z.string().min(1, "Category is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model_name: z.string().min(1, "Model is required"),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  notes: z.string().optional(),
  include_warranty: z.boolean().default(false),
  warranty_provider: z.string().optional(),
  warranty_duration: z.string().optional(),
  warranty_start_date: z.string().optional(),
  warranty_terms: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AddAssetFormProps {
  onSubmit: (data: AssetCreate) => Promise<void>;
  categories: Category[];
}

export default function AddAssetForm({ onSubmit, categories }: AddAssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_tag: "",
      serial_number: "",
      category_id: "",
      supplier_id: "",
      manufacturer: "",
      model_name: "",
      purchase_date: "",
      purchase_price: "",
      notes: "",
      include_warranty: false,
      warranty_provider: "",
      warranty_duration: "12",
      warranty_start_date: "",
      warranty_terms: "",
    },
  });

  const includeWarranty = form.watch("include_warranty");
  const selectedSupplierId = form.watch("supplier_id");
  const selectedSupplier = suppliers.find((supplier) => supplier.id.toString() === selectedSupplierId);
  const canConfigureWarranty = Boolean(selectedSupplierId);

  useEffect(() => {
    form.setValue("warranty_provider", selectedSupplier?.name || "");

    if (!selectedSupplierId) {
      form.setValue("include_warranty", false);
      form.setValue("warranty_start_date", "");
      form.setValue("warranty_terms", "");
      form.setValue("warranty_duration", "12");
    }
  }, [selectedSupplierId, selectedSupplier, form]);

  const handleSubmit = async (values: AssetFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data: AssetCreate = {
        asset_tag: values.asset_tag,
        serial_number: values.serial_number,
        category_id: parseInt(values.category_id),
        supplier_id: parseInt(values.supplier_id),
        manufacturer: values.manufacturer,
        model_name: values.model_name,
        purchase_date: values.purchase_date || undefined,
        purchase_price: values.purchase_price ? parseFloat(values.purchase_price) : undefined,
        status: "Available",
        notes: values.notes || undefined,
      };

      const warrantyProviderName = suppliers.find(
        (supplier) => supplier.id.toString() === values.supplier_id
      )?.name;

      if (values.include_warranty && warrantyProviderName && values.warranty_start_date) {
        data.warranty = {
          provider_name: warrantyProviderName,
          duration_months: parseInt(values.warranty_duration || "12"),
          start_date: values.warranty_start_date,
          terms_conditions: values.warranty_terms || undefined,
        };
      }

      await onSubmit(data);
      form.reset();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
        {error && (
          <div className="mx-6 mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out px-6 pb-4",
              includeWarranty ? "w-1/2 border-r" : "w-full"
            )}
          >
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              Asset Information
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="asset_tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Asset Tag *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., LAP-001" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Serial Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial Number" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
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
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Supplier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder={loadingSuppliers ? "Loading..." : "Select supplier"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Manufacturer *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dell" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Model *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., XPS 15" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Price (Rs)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" className="h-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." className="resize-none h-16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_warranty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Add Warranty Tracking
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {canConfigureWarranty
                          ? "Track detailed warranty information"
                          : "Select a supplier first to enable warranty tracking"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (!canConfigureWarranty) return;
                          field.onChange(checked);
                        }}
                        disabled={!canConfigureWarranty}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              includeWarranty ? "w-1/2 opacity-100" : "w-0 opacity-0"
            )}
          >
            <div className="px-6 pb-4 min-w-[350px]">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                Warranty Details
              </div>

              <div className="space-y-3 bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="warranty_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Provider *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Auto-filled from supplier"
                            className="h-9 bg-background"
                            value={field.value || selectedSupplier?.name || ""}
                            readOnly
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Duration (Months) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            className="h-9 bg-background"
                            disabled={!canConfigureWarranty}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="warranty_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 bg-background" disabled={!canConfigureWarranty} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">End date calculated automatically</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warranty_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Terms & Conditions
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Coverage details, exclusions, claim process..."
                          className="resize-none h-24 bg-background"
                          disabled={!canConfigureWarranty}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 border">
                  <p className="font-medium text-foreground mb-1">Tip</p>
                  <p>Warranty information will be tracked separately and shown in the asset profile with active/expired status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
