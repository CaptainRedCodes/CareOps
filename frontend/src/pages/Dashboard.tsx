import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/api/client";
import { motion } from "motion/react";
import { Plus, Building2, Clock, MapPin } from "lucide-react";

interface Workspace {
    id: string;
    business_name: string;
    address: string;
    timezone: string;
    contact_email: string;
    created_at: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get("/workspaces")
            .then(({ data }) => setWorkspaces(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const firstName = user?.full_name.split(" ")[0] ?? "there";

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="mx-auto max-w-6xl px-6 py-10">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-10"
                >
                    <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                        Good{" "}
                        {new Date().getHours() < 12
                            ? "morning"
                            : new Date().getHours() < 17
                                ? "afternoon"
                                : "evening"}
                        , {firstName}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Here's an overview of your workspaces.
                    </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-8"
                >
                    <Link to="/workspace/new">
                        <Button className="gap-2 bg-amber-brand text-charcoal-deep hover:bg-amber-hover font-semibold">
                            <Plus className="h-4 w-4" />
                            New Workspace
                        </Button>
                    </Link>
                </motion.div>

                {/* Grid */}
                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="border-border bg-card">
                                <CardHeader>
                                    <div className="skeleton-pulse h-5 w-3/4 rounded bg-muted" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="skeleton-pulse h-4 w-full rounded bg-muted" />
                                    <div className="skeleton-pulse h-4 w-2/3 rounded bg-muted" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : workspaces.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center"
                    >
                        <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                        <h3 className="font-heading text-lg font-semibold">
                            No workspaces yet
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first workspace to get started.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {workspaces.map((ws, i) => (
                            <motion.div
                                key={ws.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1 * i }}
                            >
                                <Card className="card-shimmer group relative cursor-pointer border-border bg-card transition-all hover:border-amber-brand/30 hover:shadow-[0_0_30px_rgba(232,168,56,0.06)]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                            <Building2 className="h-5 w-5 text-amber-brand" />
                                            {ws.business_name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {ws.address}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            {ws.timezone}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
