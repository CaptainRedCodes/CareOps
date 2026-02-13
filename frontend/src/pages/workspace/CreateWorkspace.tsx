import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api, { showSuccess, showError } from "@/api/client";
import { motion } from "motion/react";
import { ArrowLeft, Building2, MapPin, Globe, Mail, CheckCircle2 } from "lucide-react";

const TIMEZONES = [
    "Asia/Kolkata",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
];

export default function CreateWorkspace() {
    const navigate = useNavigate();
    const [businessName, setBusinessName] = useState("");
    const [address, setAddress] = useState("");
    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [contactEmail, setContactEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/workspaces", {
                business_name: businessName,
                address,
                timezone,
                contact_email: contactEmail,
            });
            showSuccess("Workspace created successfully!");
            navigate(`/workspace/${res.data.id}/setup`);
        } catch (err: any) {
            const message = err.response?.data?.error?.message || err.response?.data?.detail || "Failed to create workspace.";
            showError(message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: "Business name", done: businessName.length > 0 },
        { label: "Address", done: address.length > 0 },
        { label: "Timezone", done: true },
        { label: "Contact email", done: contactEmail.includes("@") },
    ];

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="mx-auto max-w-5xl px-6 py-10">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    {/* Sidebar — progress */}
                    <motion.aside
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="sticky top-24 border-border bg-card">
                            <CardHeader>
                                <CardTitle className="font-heading text-base">
                                    Setup Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2
                                            className={`h-4 w-4 shrink-0 transition-colors ${step.done
                                                ? "text-brand"
                                                : "text-muted-foreground/30"
                                                }`}
                                        />
                                        <span
                                            className={`text-sm ${step.done
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                                <Separator className="my-2" />
                                <p className="text-xs text-muted-foreground">
                                    {steps.filter((s) => s.done).length}/{steps.length} completed
                                </p>
                            </CardContent>
                        </Card>
                    </motion.aside>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="font-heading text-xl">
                                    Create a new workspace
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Add your business details to set up your operations hub.
                                </p>
                            </CardHeader>

                            <CardContent>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="businessName" className="flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-brand" />
                                            Business Name
                                        </Label>
                                        <Input
                                            id="businessName"
                                            placeholder="Luxe Salon & Spa"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-brand" />
                                            Address
                                        </Label>
                                        <Input
                                            id="address"
                                            placeholder="123 Main St, Suite 200, City"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone" className="flex items-center gap-1.5">
                                            <Globe className="h-3.5 w-3.5 text-brand" />
                                            Timezone
                                        </Label>
                                        <select
                                            id="timezone"
                                            value={timezone}
                                            onChange={(e) => setTimezone(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz} value={tz} className="bg-card text-foreground">
                                                    {tz}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail" className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-brand" />
                                            Contact Email
                                        </Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            placeholder="hello@luxesalon.com"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-brand text-white hover:bg-brand-hover font-semibold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            "Create Workspace"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
