import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Navbar() {
    const { user, logout } = useAuth();

    if (!user) return null;

    const initials = user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/60 px-6 py-3 backdrop-blur-xl">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-brand/10 text-sm font-bold text-amber-brand ring-1 ring-amber-brand/20">
                    CO
                </div>
                <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                    CareOps
                </span>
            </div>
            {/* User */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-brand/20 text-xs font-semibold text-amber-brand">
                        {initials}
                    </div>
                    <span className="hidden text-sm font-medium text-foreground sm:inline">
                        {user.full_name}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}
