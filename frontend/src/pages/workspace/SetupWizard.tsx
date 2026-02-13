import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    CheckCircle2,
    Circle,
    Radio,
    Calendar,
    Clock,
    ArrowRight,
    Loader2,
    PartyPopper,
    Building2,
    Mail,
    MessageSquare,
    CreditCard,
    Bell,
    ExternalLink,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api, { showSuccess, showError } from "@/api/client";

interface ActivationCheck {
    name: string;
    passed: boolean;
    detail: string;
}

interface ActivationStatus {
    is_activated: boolean;
    can_activate: boolean;
    checks: ActivationCheck[];
}

interface Step {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
}

const STEPS: Step[] = [
    {
        id: "communication",
        title: "Connect Channel",
        description: "Set up how you'll communicate with customers",
        icon: MessageSquare,
    },
    {
        id: "booking-types",
        title: "Add Services",
        description: "Create the services you offer",
        icon: Calendar,
    },
    {
        id: "availability",
        title: "Set Hours",
        description: "Define when you're available",
        icon: Clock,
    },
];

export default function SetupWizard() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ActivationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        loadStatus();
    }, [workspaceId]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/workspaces/${workspaceId}/activation-status`);
            setStatus(res.data);
        } catch (err) {
            console.error("Failed to load activation status", err);
        } finally {
            setLoading(false);
        }
    };

    const completedSteps = status?.checks
        .filter((c) => c.passed)
        .map((c) => {
            if (c.name.toLowerCase().includes("communication")) return "communication";
            if (c.name.toLowerCase().includes("booking")) return "booking-types";
            if (c.name.toLowerCase().includes("availability")) return "availability";
            return null;
        })
        .filter(Boolean) || [];

    const handleActivate = async () => {
        try {
            setActivating(true);
            await api.post(`/workspaces/${workspaceId}/activate`);
            await loadStatus();
            showSuccess("Workspace activated successfully!");
        } catch (err: any) {
            const message = err.response?.data?.error?.message || err.response?.data?.detail || "Failed to activate workspace";
            showError(message);
        } finally {
            setActivating(false);
        }
    };

    const getStepLink = (stepId: string): string => {
        if (stepId === "communication") return `/workspace/${workspaceId}/communication`;
        if (stepId === "booking-types") return `/workspace/${workspaceId}/bookings`;
        if (stepId === "availability") return `/workspace/${workspaceId}/working-hours`;
        return "#";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Failed to load workspace status</p>
                        <Button onClick={() => navigate("/dashboard")} className="mt-4">
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status.is_activated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg"
                >
                    <Card className="border-border bg-card">
                        <CardContent className="pt-12 pb-12 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                            >
                                <PartyPopper className="w-10 h-10 text-primary" />
                            </motion.div>
                            <h1 className="text-2xl font-heading font-semibold mb-2">
                                You're ready to go!
                            </h1>
                            <p className="text-muted-foreground mb-8">
                                Your workspace is now active. Start adding customers and receiving bookings.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => navigate(`/workspace/${workspaceId}`)}
                                    className="w-full"
                                >
                                    Go to Dashboard
                                    <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-2xl mx-auto px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-3xl font-heading font-medium mb-3">
                        Let's get you set up
                    </h1>
                    <p className="text-muted-foreground">
                        Complete these steps to start receiving bookings
                    </p>
                </motion.div>

                <div className="space-y-3">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = currentStep === index;
                        const Icon = step.icon;
                        
                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left ${
                                        isCurrent 
                                            ? "border-primary bg-primary/5" 
                                            : isCompleted 
                                                ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
                                                : "border-border bg-card hover:border-primary/30"
                                    }`}
                                >
                                    <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                                        isCompleted 
                                            ? "bg-green-500/10" 
                                            : isCurrent 
                                                ? "bg-primary/10" 
                                                : "bg-secondary"
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <Icon className={`w-6 h-6 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-foreground">{step.title}</div>
                                        <div className="text-sm text-muted-foreground">{step.description}</div>
                                    </div>
                                    <ArrowRight className={`w-5 h-5 shrink-0 ${
                                        isCompleted ? "text-green-500" : "text-muted-foreground"
                                    }`} />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {(() => {
                        const CurrentIcon = STEPS[currentStep].icon;
                        return (
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="mt-8"
                            >
                                <Card className="border-border bg-card">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <CurrentIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{STEPS[currentStep].title}</h3>
                                                <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
                                            </div>
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        
                                        <div className="space-y-3">
                                            {status.checks
                                                .filter(c => {
                                                    const name = c.name.toLowerCase();
                                                    const stepId = STEPS[currentStep].id;
                                                    if (stepId === "communication") return name.includes("communication");
                                                    if (stepId === "booking-types") return name.includes("booking");
                                                    if (stepId === "availability") return name.includes("availability");
                                                    return false;
                                                })
                                                .map((check, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`flex items-center gap-3 p-3 rounded-lg ${
                                                            check.passed 
                                                                ? "bg-green-500/5 border border-green-500/20" 
                                                                : "bg-secondary/50"
                                                        }`}
                                                    >
                                                        {check.passed ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">{check.name}</div>
                                                            <div className="text-xs text-muted-foreground">{check.detail}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(getStepLink(STEPS[currentStep].id))}
                                                className="flex-1"
                                            >
                                                Go to Settings
                                                <ExternalLink className="w-4 h-4 ml-2" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={loadStatus}
                                                className="px-4"
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                    >
                        Previous
                    </Button>
                    <div className="flex gap-2">
                        {currentStep < STEPS.length - 1 ? (
                            <Button 
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!completedSteps.includes(STEPS[currentStep].id)}
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleActivate}
                                disabled={!status.can_activate || activating}
                            >
                                {activating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        Activate Workspace
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
