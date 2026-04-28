"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldAlert,
  Tags,
  Users,
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

          <Link href="/itams/categories">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Tags className="h-5 w-5" />
              {sidebarOpen && "Categories"}
            </Button>
          </Link>
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
    </div>
  );
}
