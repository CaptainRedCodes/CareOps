import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

const steps = [
    { id: "business", label: "Business Profile", path: "/onboarding/business" },
    { id: "services", label: "Services", path: "/onboarding/services" },
    { id: "staff", label: "Staff", path: "/onboarding/staff" },
    { id: "inventory", label: "Inventory", path: "/onboarding/inventory" },
];

export default function OnboardingLayout() {
    const location = useLocation();

    // Determine current step index
    const currentPath = location.pathname;
    const currentStepIndex = steps.findIndex((step) => currentPath.includes(step.path));

    // If we are at /onboarding (welcome), index is -1
    const isWelcome = calculateIsWelcome(currentPath);

    function calculateIsWelcome(path: string) {
        return path === "/onboarding" || path === "/onboarding/";
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container h-full flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        CareOps
                    </div>
                    {/* Only show progress if not on welcome screen */}
                    {!isWelcome && (
                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Setup Progress</span>
                            <span className="font-medium text-foreground">
                                {Math.max(0, currentStepIndex + 1)} / {steps.length}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar / Stepper (only visible after welcome) */}
                    {!isWelcome && (
                        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-heading text-lg font-medium">Setup Guide</h3>
                                <div className="space-y-2 relative">
                                    {/* Vertical line */}
                                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border -z-10" />

                                    {steps.map((step, index) => {
                                        const isCompleted = index < currentStepIndex;
                                        const isCurrent = index === currentStepIndex;

                                        return (
                                            <div key={step.id} className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors bg-background",
                                                        isCompleted
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : isCurrent
                                                                ? "border-primary text-foreground ring-4 ring-primary/10"
                                                                : "border-muted-foreground/30 text-muted-foreground"
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </div>
                                                <span
                                                    className={cn(
                                                        "text-sm font-medium transition-colors",
                                                        isCompleted || isCurrent
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm space-y-2">
                                <p className="font-medium text-foreground">Need help?</p>
                                <p className="text-muted-foreground">
                                    Our support team is available 24/7 to assist you with the setup.
                                </p>
                            </div>
                        </aside>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="stagger-in">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
