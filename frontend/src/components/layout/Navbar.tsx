import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const initials = user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/60 px-6 py-3 backdrop-blur-xl">
            {/* Left brand */}
            <div className="flex items-center gap-5">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                        CO
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        CareOps
                    </span>
                </Link>
                <div className="hidden h-5 w-px bg-border/50 sm:block" />
                <Link
                    to="/dashboard"
                    className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                    Workspaces
                </Link>
            </div>

            {/* Right user info */}
            <div className="flex items-center gap-3">
                <Link
                    to="/profile"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-elevated"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20">
                        {initials}
                    </div>
                    <span className="hidden text-sm font-medium text-foreground sm:inline">
                        {user.full_name}
                    </span>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Sign out"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}
