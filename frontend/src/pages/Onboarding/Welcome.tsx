import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/5 text-primary mb-4 ring-1 ring-primary/20">
                <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-heading font-medium text-foreground tracking-tight">
                    Welcome to CareOps
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Let's set up your digital workspace. We'll guide you through configuring your business profile, services, team, and inventory.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-8">
                <div className="p-4 rounded-xl border border-border bg-card/50 text-left space-y-2 hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <h3 className="font-medium text-foreground">Business Profile</h3>
                    <p className="text-sm text-muted-foreground">Set up your brand identity and location.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/50 text-left space-y-2 hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="font-medium text-foreground">Services & Booking</h3>
                    <p className="text-sm text-muted-foreground">Define what you offer and your schedule.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/50 text-left space-y-2 hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="font-medium text-foreground">Staff Management</h3>
                    <p className="text-sm text-muted-foreground">Add your team and assign roles.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/50 text-left space-y-2 hover:border-primary/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <h3 className="font-medium text-foreground">Inventory</h3>
                    <p className="text-sm text-muted-foreground">Track resources and products.</p>
                </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    size="lg"
                    className="h-12 px-8 text-base font-medium rounded-full btn-glow"
                    onClick={() => navigate("/onboarding/business")}
                >
                    Start Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 px-8 text-base font-medium rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/dashboard")}
                >
                    Skip for now
                </Button>
            </div>
        </div>
    );
}
