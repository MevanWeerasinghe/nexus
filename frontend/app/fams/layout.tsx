"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Menu, Receipt, ShieldAlert, Tags, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { canAccessFAMS, clearAuthTokens, isAuthenticated } from "@/lib/auth";

export default function FAMSLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setHasAccess(canAccessFAMS());
  }, [router]);

  const handleLogout = () => {
    clearAuthTokens();
    router.push("/login");
  };

  if (hasAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access Fleet & Allocation Management.
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
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} relative border-r bg-muted/50 transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-lg font-semibold">FAMS</h2>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
          <Link href="/fams/vehicles">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Truck className="h-5 w-5" />
              {sidebarOpen && "Vehicles"}
            </Button>
          </Link>

          <Link href="/fams/fuel-logs">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Receipt className="h-5 w-5" />
              {sidebarOpen && "Fuel Logs"}
            </Button>
          </Link>

          <Link href="/fams/fuel-prices">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Tags className="h-5 w-5" />
              {sidebarOpen && "Fuel Prices"}
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
