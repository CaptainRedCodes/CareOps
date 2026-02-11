import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/api/client";
import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, Mail, MessageSquare, Save, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

export default function SetupIntegrations() {
    const { user } = useAuth();
    const { workspaceId } = useParams(); // Note: Changed to workspaceId based on App route param

    // We'll fetch the actual ID from the URL param if available, otherwise just use a placeholder for now
    // In a real app, we'd probably fetch the workspace details first

    const [activeTab, setActiveTab] = useState<"email" | "sms">("email");
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [integrations, setIntegrations] = useState<any[]>([]);

    // Email Config State
    const [emailConfig, setEmailConfig] = useState({
        host: "",
        port: "587",
        username: "",
        password: "",
        from_email: "",
    });

    // SMS Config State
    const [smsConfig, setSmsConfig] = useState({
        account_sid: "",
        auth_token: "",
        from_number: "",
    });

    // Test Recipient
    const [testRecipient, setTestRecipient] = useState(user?.email || "");
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        // Correct endpoint usage: /workspaces/{id}/integrations
        // We'll need to grab the workspace ID from the URL or state
        // For now, let's assume the ID is passed via URL params: /workspace/:id/integrations
        if (workspaceId) {
            fetchIntegrations();
        }
    }, [workspaceId]);

    const fetchIntegrations = async () => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/integrations`);
            setIntegrations(data);

            const emailInt = data.find((i: any) => i.channel_type === "email");
            if (emailInt) {
                setEmailConfig({
                    host: emailInt.config_json.host || "",
                    port: emailInt.config_json.port || "587",
                    username: emailInt.config_json.username || "",
                    password: emailInt.config_json.password || "", // Often not returned for security, but we'll bind it if present
                    from_email: emailInt.config_json.from_email || "",
                });
            }

            const smsInt = data.find((i: any) => i.channel_type === "sms");
            if (smsInt) {
                setSmsConfig({
                    account_sid: smsInt.config_json.account_sid || "",
                    auth_token: smsInt.config_json.auth_token || "",
                    from_number: smsInt.config_json.from_number || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch integrations", error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setTestResult(null);
        try {
            if (activeTab === "email") {
                // Check if exists
                const existing = integrations.find((i) => i.channel_type === "email");
                if (existing) {
                    await api.put(`/workspaces/${workspaceId}/integrations/${existing.id}`, {
                        config_json: emailConfig,
                    });
                } else {
                    await api.post(`/workspaces/${workspaceId}/integrations`, {
                        channel_type: "email",
                        provider: "smtp",
                        config_json: emailConfig,
                    });
                }
            } else {
                const existing = integrations.find((i) => i.channel_type === "sms");
                if (existing) {
                    await api.put(`/workspaces/${workspaceId}/integrations/${existing.id}`, {
                        config_json: smsConfig,
                    });
                } else {
                    await api.post(`/workspaces/${workspaceId}/integrations`, {
                        channel_type: "sms",
                        provider: "twilio",
                        config_json: smsConfig,
                    });
                }
            }
            await fetchIntegrations(); // Refresh to get IDs
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const currentInt = integrations.find((i) => i.channel_type === activeTab);
            if (!currentInt) {
                setTestResult({ success: false, message: "Please save configuration first." });
                return;
            }

            const { data } = await api.post(
                `/workspaces/${workspaceId}/integrations/${currentInt.id}/test`,
                { test_recipient: testRecipient }
            );

            setTestResult({
                success: data.success,
                message: data.message
            });
            if (data.success) fetchIntegrations(); // Refresh verified status
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.response?.data?.detail || "Test failed."
            });
        } finally {
            setTesting(false);
        }
    };

    const currentIntegration = integrations.find((i) => i.channel_type === activeTab);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-4xl px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-8">
                        <h1 className="editorial-heading text-3xl text-foreground">Integrations</h1>
                        <p className="mt-2 text-muted-foreground">
                            Configure how CareOps communicates with your contacts.
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                        {/* Sidebar Tabs */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => { setActiveTab("email"); setTestResult(null); }}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === "email"
                                        ? "bg-brand/10 text-brand"
                                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                                    }`}
                            >
                                <Mail className="h-4 w-4" />
                                Email (SMTP)
                                {integrations.find(i => i.channel_type === "email")?.is_verified && (
                                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                                )}
                            </button>
                            <button
                                onClick={() => { setActiveTab("sms"); setTestResult(null); }}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === "sms"
                                        ? "bg-brand/10 text-brand"
                                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                                    }`}
                            >
                                <MessageSquare className="h-4 w-4" />
                                SMS (Twilio)
                                {integrations.find(i => i.channel_type === "sms")?.is_verified && (
                                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                                )}
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="space-y-6">
                            <Card className="border-border/50 bg-surface-card shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-heading">
                                                {activeTab === "email" ? "SMTP Configuration" : "Twilio Configuration"}
                                            </CardTitle>
                                            <CardDescription>
                                                {activeTab === "email"
                                                    ? "Connect your email provider to send notifications and campaigns."
                                                    : "Connect Twilio to send SMS reminders and alerts."}
                                            </CardDescription>
                                        </div>
                                        {currentIntegration?.is_verified ? (
                                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Unverified
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activeTab === "email" ? (
                                        <>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>SMTP Host</Label>
                                                    <Input
                                                        placeholder="smtp.gmail.com"
                                                        value={emailConfig.host}
                                                        onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Port</Label>
                                                    <Input
                                                        placeholder="587"
                                                        value={emailConfig.port}
                                                        onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Username</Label>
                                                <Input
                                                    placeholder="user@example.com"
                                                    value={emailConfig.username}
                                                    onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••••••"
                                                    value={emailConfig.password}
                                                    onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                                                />
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="space-y-2">
                                                <Label>From Email</Label>
                                                <Input
                                                    placeholder="noreply@yourdomain.com"
                                                    value={emailConfig.from_email}
                                                    onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Account SID</Label>
                                                <Input
                                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    value={smsConfig.account_sid}
                                                    onChange={(e) => setSmsConfig({ ...smsConfig, account_sid: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Auth Token</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="•••••••••••••••••••••••••••••"
                                                    value={smsConfig.auth_token}
                                                    onChange={(e) => setSmsConfig({ ...smsConfig, auth_token: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>From Number</Label>
                                                <Input
                                                    placeholder="+15551234567"
                                                    value={smsConfig.from_number}
                                                    onChange={(e) => setSmsConfig({ ...smsConfig, from_number: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={handleTest}
                                            disabled={loading || testing || !currentIntegration}
                                        >
                                            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Test Connection
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="bg-brand text-white hover:bg-brand-hover"
                                        >
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save Configuration
                                        </Button>
                                    </div>

                                    {/* Test Result Feedback */}
                                    {testResult && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className={`rounded-lg border px-4 py-3 text-sm flex items-start gap-2 ${testResult.success
                                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700"
                                                    : "bg-red-500/5 border-red-500/20 text-red-700"
                                                }`}
                                        >
                                            {testResult.success ? (
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                            ) : (
                                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            )}
                                            {testResult.message}
                                        </motion.div>
                                    )}

                                    {/* Test Recipient Input (only visible when testing) */}
                                    <div className="pt-2">
                                        <Label className="text-xs text-muted-foreground">Test Recipient (for Test Connection)</Label>
                                        <Input
                                            value={testRecipient}
                                            onChange={(e) => setTestRecipient(e.target.value)}
                                            className="mt-1 h-8 text-sm"
                                            placeholder="Enter email or phone..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
