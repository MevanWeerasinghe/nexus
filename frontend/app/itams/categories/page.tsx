"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Layers3, Plus, RefreshCw } from "lucide-react";
import { Category, createCategory, getCategories } from "@/modules/itam/api";

type CategoryType = "standalone" | "component";

const categoryTypeLabel: Record<CategoryType, string> = {
  standalone: "Standalone",
  component: "Embedded Component",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("standalone");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const standaloneCategories = useMemo(
    () => categories.filter((category) => category.category_type === "standalone"),
    [categories]
  );

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoryType === "standalone") {
      setParentCategoryId("");
    }
  }, [categoryType]);

  const resetForm = () => {
    setName("");
    setShortName("");
    setCategoryType("standalone");
    setParentCategoryId("");
    setDescription("");
    setFormError(null);
  };

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required");
      return;
    }

    if (!shortName.trim()) {
      setFormError("Short name prefix is required");
      return;
    }

    if (categoryType === "component" && !parentCategoryId) {
      setFormError("Embedded component category must select a parent standalone category");
      return;
    }

    try {
      setIsSubmitting(true);
      await createCategory({
        name: name.trim(),
        short_name: shortName.trim(),
        category_type: categoryType,
        parent_category_id: categoryType === "component" ? parseInt(parentCategoryId) : null,
        description: description.trim() || undefined,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParentName = (category: Category) => {
    if (!category.parent_category_id) {
      return "-";
    }
    return categories.find((item) => item.id === category.parent_category_id)?.name || "Unknown";
  };

  return (
    <div className="h-[calc(100dvh-1rem)] p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Define standalone asset categories and embedded component categories with short prefixes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchCategories}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>
                  Standalone categories generate asset tags like LAP00003. Embedded component categories can be nested under a standalone category.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCategory}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name *</Label>
                    <Input
                      id="category-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Laptop"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-short-name">Short Name Prefix *</Label>
                    <Input
                      id="category-short-name"
                      value={shortName}
                      onChange={(event) => setShortName(event.target.value.toUpperCase())}
                      placeholder="LAP"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-type">Category Type *</Label>
                    <Select value={categoryType} onValueChange={(value: CategoryType) => setCategoryType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standalone">Standalone</SelectItem>
                        <SelectItem value="component">Embedded Component</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {categoryType === "component" && (
                    <div className="space-y-2">
                      <Label htmlFor="category-parent">Embedded Into *</Label>
                      <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select standalone parent" />
                        </SelectTrigger>
                        <SelectContent>
                          {standaloneCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Optional notes about this category"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" />
            Category Registry
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Loading categories...
            </div>
          ) : (
            <div className="h-full overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Embedded Into</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No categories created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="font-mono">{category.short_name}</TableCell>
                        <TableCell>
                          <Badge variant={category.category_type === "standalone" ? "default" : "secondary"}>
                            {categoryTypeLabel[category.category_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{getParentName(category)}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
