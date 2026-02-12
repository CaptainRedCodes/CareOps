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
    Clock,
    ArrowRight,
    UserPlus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import InviteStaffModal from "./InviteStaff";
import api from "@/api/client";

interface Workspace {
    id: string;
    business_name: string;
    address: string;
    timezone: string;
    contact_email: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

    useEffect(() => {
        api.get("/workspaces")
            .then((res) => setWorkspaces(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const isAdmin = user?.role === "admin";
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const handleInviteStaff = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setInviteModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="mx-auto max-w-6xl px-6 py-8">
                {/* ── Header ──────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="editorial-heading text-3xl text-foreground sm:text-4xl">
                        {greeting()},{" "}
                        <span className="text-brand">
                            {user?.full_name?.split(" ")[0]}
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Here's an overview of your operations.
                    </p>
                </motion.div>

                {/* ── Stats Row ────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8 grid gap-4 sm:grid-cols-3"
                >
                    {[
                        {
                            icon: Building2,
                            label: "Workspaces",
                            value: loading ? "—" : workspaces.length,
                        },
                        {
                            icon: Users,
                            label: "Staff Members",
                            value: "—",
                        },
                        {
                            icon: Clock,
                            label: "Last Active",
                            value: "Just now",
                        },
                    ].map((stat, i) => (
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

                {/* ── Quick Actions ────────────────────────────────── */}
                {isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="mb-8 flex flex-wrap gap-3"
                    >
                        <Link to="/workspace/new">
                            <Button className="btn-glow h-10 gap-2 bg-brand font-semibold text-white hover:bg-brand-hover">
                                <Plus className="h-4 w-4" />
                                New Workspace
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* ── Workspaces ───────────────────────────────────── */}
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
                                    className="h-40 animate-pulse rounded-xl border border-border/30 bg-surface-card"
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
                                    ? "Create your first workspace to get started."
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
                                    <Card className="group border-border/50 bg-surface-card transition-all hover:border-brand/20 hover:shadow-[0_0_30px_rgba(80,70,229,0.06)]">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                                                <Building2 className="h-4 w-4 text-brand" />
                                                {ws.business_name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                                <p>📍 {ws.address}</p>
                                                <p>🕐 {ws.timezone}</p>
                                                <p>✉️ {ws.contact_email}</p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleInviteStaff(ws)}
                                                        className="h-8 gap-1 text-xs text-brand hover:text-brand-hover"
                                                    >
                                                        <UserPlus className="h-3 w-3" />
                                                        Invite Staff
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-auto h-8 gap-1 text-xs text-brand hover:text-brand-hover"
                                                >
                                                    View
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Invite Staff Modal */}
            {selectedWorkspace && (
                <InviteStaffModal
                    workspaceId={selectedWorkspace.id}
                    workspaceName={selectedWorkspace.business_name}
                    isOpen={inviteModalOpen}
                    onClose={() => {
                        setInviteModalOpen(false);
                        setSelectedWorkspace(null);
                    }}
                    onSuccess={() => {
                        // Optionally refresh workspaces or show a notification
                        console.log("Staff invitation sent successfully");
                    }}
                />
            )}
        </div>
    );
}