"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Compass,
  Cpu,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { isAuthenticated, canAccessITAM, clearAuthTokens } from "@/lib/auth";

export default function ITAMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    // Check if user has ITAM access
    setHasAccess(canAccessITAM());
  }, [router]);

  const handleLogout = () => {
    clearAuthTokens();
    router.push("/login");
  };

  // Show loading while checking access
  if (hasAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have ITAM role
  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the IT Asset Management module.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to request access.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } relative border-r bg-muted/50 transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <h2 className="text-lg font-semibold">ITAM</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pb-2">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start gap-3">
              <ArrowLeft className="h-4 w-4" />
              {sidebarOpen ? "Back to Module Hub" : "Hub"}
            </Button>
          </Link>
        </div>

        <nav className="space-y-2 p-4">
          <Link href="/itams">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <LayoutDashboard className="h-5 w-5" />
              {sidebarOpen && "Dashboard"}
            </Button>
          </Link>

          <Link href="/itams/assets">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Package className="h-5 w-5" />
              {sidebarOpen && "Assets"}
            </Button>
          </Link>

          <Link href="/itams/employees">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Users className="h-5 w-5" />
              {sidebarOpen && "Employees"}
            </Button>
          </Link>

          <Link href="/itams/suppliers">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Building2 className="h-5 w-5" />
              {sidebarOpen && "Suppliers"}
            </Button>
          </Link>

          <Link href="/itams/components">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Cpu className="h-5 w-5" />
              {sidebarOpen && "Components"}
            </Button>
          </Link>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setModuleDialogOpen(true)}
          >
            <Compass className="h-5 w-5" />
            {sidebarOpen && "Module Compass"}
          </Button>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles className="h-4 w-4" />
                  Workspace Navigation
                </div>
                <h3 className="mt-1 text-2xl font-semibold">Module Compass</h3>
                <p className="mt-1 text-sm text-slate-300">Jump between active and upcoming modules from one place.</p>
              </div>
              <Badge className="bg-white/10 text-white hover:bg-white/10">NEXUS</Badge>
            </div>
          </div>

          <DialogHeader className="sr-only">
            <DialogTitle>Module Compass</DialogTitle>
            <DialogDescription>Select a module to navigate.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <p className="font-medium">IT Asset Management</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Assets, components, suppliers, and employee assignment tracking.</p>
              <div className="flex gap-2">
                <Link href="/itams" className="w-full" onClick={() => setModuleDialogOpen(false)}>
                  <Button className="w-full">Open ITAM</Button>
                </Link>
                <Link href="/" onClick={() => setModuleDialogOpen(false)}>
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Hub
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">Maintenance</p>
                </div>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">Scheduled service, work orders, and maintenance lifecycle dashboards.</p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="rounded-xl border border-dashed bg-muted/40 p-4 md:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Need to switch context quickly?</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Use Back to Module Hub from the sidebar anytime, then enter any available module.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
