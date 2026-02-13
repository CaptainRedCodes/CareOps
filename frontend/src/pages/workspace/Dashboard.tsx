import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import {
  Plus,
  Building2,
  Users,
  Calendar,
  FileText,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import api from "@/api/client";

interface Workspace {
  id: string;
  business_name: string;
  address: string;
  timezone: string;
  contact_email: string;
  staff_count?: number;
  total_bookings?: number;
  pending_forms?: number;
  is_active?: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get("/workspaces");
        setWorkspaces(res.data);
      } catch (error) {
        console.error("Failed to fetch workspaces", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const isAdmin = user?.role === "admin";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
      hour < 17 ? "Good afternoon" :
        "Good evening";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="editorial-heading text-3xl text-foreground sm:text-4xl">
              {greeting},{" "}
              <span className="text-brand">
                {user?.full_name?.split(" ")[0]}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your operations, staff, and inventory in one place.
            </p>
          </div>

          {isAdmin && (
            <Link to="/workspace/new">
              <Button className="btn-glow h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover">
                <Plus className="h-4 w-4" />
                New Workspace
              </Button>
            </Link>
          )}
        </motion.div>

        {/* ── Overview Stats ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              icon: Building2,
              label: "Workspaces",
              value: loading ? "—" : workspaces.length,
            },
            {
              icon: Users,
              label: "Total Staff",
              value: loading
                ? "—"
                : workspaces.reduce((sum, w) => sum + (w.staff_count || 0), 0),
            },
            {
              icon: Calendar,
              label: "Total Bookings",
              value: loading
                ? "—"
                : workspaces.reduce((sum, w) => sum + (w.total_bookings || 0), 0),
            },
            {
              icon: FileText,
              label: "Pending Forms",
              value: loading
                ? "—"
                : workspaces.reduce((sum, w) => sum + (w.pending_forms || 0), 0),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-surface-card p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Workspaces Section ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Your Workspaces
            </h2>
            {workspaces.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 animate-pulse rounded-xl border border-border/30 bg-surface-card"
                />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-surface-card p-12 text-center">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
              <h3 className="font-heading text-lg font-semibold text-foreground">
                No workspaces yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAdmin
                  ? "Create your first workspace to start managing operations."
                  : "You haven't been assigned to any workspaces yet."}
              </p>
              {isAdmin && (
                <Link to="/workspace/new">
                  <Button className="btn-glow mt-6 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover">
                    <Plus className="h-4 w-4" />
                    Create Workspace
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws, i) => (
                <motion.div
                  key={ws.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <Card className="group border-border/50 bg-surface-card transition-all hover:border-brand/30 hover:shadow-[0_0_30px_rgba(80,70,229,0.06)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                        <Building2 className="h-4 w-4 text-brand" />
                        {ws.business_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/70">📍</span>
                          <span className="truncate">{ws.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/70">🕐</span>
                          <span>{ws.timezone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/70">✉️</span>
                          <span className="truncate">{ws.contact_email}</span>
                        </div>
                      </div>

                      {/* ── Quick Stats Row ───────────────────── */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/5 px-2.5 py-1 text-brand font-medium">
                          <Users className="h-3 w-3" />
                          {ws.staff_count ?? 0} staff
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${ws.is_active ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {ws.is_active ? 'Active' : 'Setup'}
                        </span>
                      </div>

                      {/* ── Actions ─────────────────────────── */}
                      <div className="mt-5 flex items-center justify-end">
                        <Link to={`/workspace/${ws.id}`} className="w-full sm:w-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto h-9 gap-2 text-sm font-medium text-brand hover:text-brand-hover hover:bg-brand/5"
                          >
                            View Workspace
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

    </div>
  );
}
