"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";
import { Zap, Building2, LogOut } from "lucide-react";

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
          <h1 className="text-2xl font-bold">IT Asset Management System</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* IT Asset Management Card - Active */}
          <Link href="/itams">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <Badge variant="default">Active</Badge>
                </div>
                <CardTitle>IT Asset Management</CardTitle>
                <CardDescription>
                  Manage hardware, software, and assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track, monitor, and manage all your IT assets in one place.
                </p>
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Facility Maintenance Card - Coming Soon */}
          <div>
            <Card className="opacity-50 cursor-not-allowed h-full">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <CardTitle>Facility Maintenance</CardTitle>
                <CardDescription>
                  Schedule and track facility maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage maintenance schedules and work orders.
                </p>
                <Button className="w-full" disabled>
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
