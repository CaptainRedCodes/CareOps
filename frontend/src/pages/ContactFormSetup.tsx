import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import api from "@/api/client";
import { motion, AnimatePresence } from "motion/react";
import { Save, Loader2, Link as LinkIcon, ExternalLink, Copy, Check } from "lucide-react";
import { useParams } from "react-router-dom";

export default function ContactFormSetup() {
    const { user } = useAuth();
    const { workspaceId } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const [slug, setSlug] = useState("");
    const [welcomeMessage, setWelcomeMessage] = useState("Thank you for contacting us! We'll get back to you shortly.");
    const [isActive, setIsActive] = useState(true);

    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        if (workspaceId) fetchFormConfig();
    }, [workspaceId]);

    const fetchFormConfig = async () => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/contact-form`);
            if (data) {
                setSlug(data.slug);
                setWelcomeMessage(data.welcome_message);
                setIsActive(data.is_active);
            } else {
                // Default slug suggestion based on user name/email or random
                setSlug(`contact-${Math.random().toString(36).substring(2, 8)}`);
            }
        } catch (error) {
            console.error("Failed to fetch contact form", error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                slug,
                welcome_message: welcomeMessage,
                is_active: isActive
            };

            const { data } = await api.post(`/workspaces/${workspaceId}/contact-form`, payload);
            setSlug(data.slug); // Update in case sanitized
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    const publicUrl = `${window.location.origin}/forms/${slug}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading && initialLoad) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-4xl px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="editorial-heading text-3xl text-foreground">Contact Form</h1>
                            <p className="mt-2 text-muted-foreground">
                                Allow customers to reach you via a public link.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            <Card className="border-border/50 bg-surface-card shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-heading">Configuration</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="active-mode" className="text-sm font-medium">
                                                {isActive ? "Active" : "Inactive"}
                                            </Label>
                                            <Switch
                                                id="active-mode"
                                                checked={isActive}
                                                onCheckedChange={setIsActive}
                                            />
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Customize your public contact form settings.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Public URL Slug</Label>
                                        <div className="flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-surface-elevated px-3 text-sm text-muted-foreground">
                                                {window.location.host}/forms/
                                            </span>
                                            <Input
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                className="rounded-l-none"
                                                placeholder="my-business-name"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Only lowercase letters, numbers, and hyphens.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Welcome Message</Label>
                                        <Textarea
                                            value={welcomeMessage}
                                            onChange={(e) => setWelcomeMessage(e.target.value)}
                                            rows={4}
                                            placeholder="Thank you for contacting us..."
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This message will be sent automatically via Email or SMS when someone submits the form.
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-brand text-white hover:bg-brand-hover"
                                        >
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar / Preview Actions */}
                        <div className="space-y-6">
                            <Card className="border-border/50 bg-surface-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Share
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-lg border border-border bg-surface-elevated p-3">
                                        <p className="break-all text-sm font-medium text-foreground">
                                            {publicUrl}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="w-full" onClick={copyToClipboard}>
                                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                        <Button variant="outline" className="w-full" asChild>
                                            <a href={`/forms/${slug}`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Open
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="rounded-xl border border-dashed border-border/50 bg-surface-elevated/50 p-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Changes are applied immediately.
                                    Test your form to ensure the welcome message is delivered correctly.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
