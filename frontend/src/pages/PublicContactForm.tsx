import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import api from "@/api/client";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function PublicContactForm() {
    const { slug } = useParams();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.name) {
            setError("Name is required.");
            setLoading(false);
            return;
        }

        if (!formData.email && !formData.phone) {
            setError("Please provide at least one contact method (Email or Phone).");
            setLoading(false);
            return;
        }

        try {
            await api.post(`/forms/${slug}/submit`, formData);
            setSubmitted(true);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("This form does not exist or is no longer active.");
            } else {
                setError(err.response?.data?.detail || "Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">Message Sent!</h2>
                    <p className="text-muted-foreground">
                        Thank you for reaching out. We've received your message and will get back to you shortly.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-8"
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({ name: "", email: "", phone: "", message: "" });
                        }}
                    >
                        Send another message
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-elevated px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                {/* Branding Badge */}
                <div className="mb-8 text-center">
                    <span className="inline-flex items-center rounded-lg bg-surface-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border/50">
                        <span className="mr-2 rounded bg-brand px-1.5 py-0.5 text-[10px] text-white">CO</span>
                        CareOps
                    </span>
                </div>

                <Card className="border-border/50 bg-surface-card shadow-xl shadow-brand/5">
                    <CardHeader className="text-center">
                        <CardTitle className="font-heading text-2xl">Get in touch</CardTitle>
                        <CardDescription>
                            Leave us a message and we'll reply as soon as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Jane Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-surface-elevated/50"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-surface-elevated/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-surface-elevated/50"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                * Either email or phone is required.
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="How can we help you?"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="bg-surface-elevated/50 resize-none"
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden rounded-md bg-red-500/10 p-3 text-sm text-red-600"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                type="submit"
                                className="w-full bg-brand text-white hover:bg-brand-hover btn-glow"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Message"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    Powered by <strong>CareOps</strong>
                </p>
            </motion.div>
        </div>
    );
}
