"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";
import { Zap, Building2, Fuel, LogOut } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">NEXUS</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome</h2>
          <p className="text-xl text-muted-foreground">
            Choose a module to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* IT Asset Management Card - Active */}
          <Link href="/itams">
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <Badge variant="default">Active</Badge>
                </div>
                <CardTitle className="text-xl leading-tight min-h-14">IT Asset Management</CardTitle>
                <CardDescription className="min-h-12">
                  Manage hardware, software, and assets
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground min-h-10">
                  Track, monitor, and manage all your IT assets in one place.
                </p>
                <Button className="w-full mt-4">
                  Open Module
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Facility Maintenance Card - Coming Soon */}
          <Link href="/fams">
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Fuel className="h-8 w-8 text-primary" />
                  <Badge variant="default">Active</Badge>
                </div>
                <CardTitle className="text-xl leading-tight min-h-14">Fleet & Allocation Management</CardTitle>
                <CardDescription className="min-h-12">
                  Track vehicle fuel allocations and transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground min-h-10">
                  Manage fleet fuel issuance, remaining quotas, and vehicle-wise logs.
                </p>
                <Button className="w-full mt-4">
                  Open Module
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Facility Maintenance Card - Coming Soon */}
          <div>
            <Card className="h-full opacity-50 cursor-not-allowed flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-xl leading-tight min-h-14">Facility Maintenance</CardTitle>
                <CardDescription className="min-h-12">
                  Schedule and track facility maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground min-h-10">
                  Manage maintenance schedules and work orders.
                </p>
                <Button className="w-full mt-4" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
