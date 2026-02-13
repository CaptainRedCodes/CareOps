import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    User,
    Plus,
    Settings,
    Building2,
    Bell,
    ChevronDown,
    HelpCircle
} from "lucide-react";
import { useState } from "react";
import config from "@/config";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const [showWorkspaces, setShowWorkspaces] = useState(false);

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
                    <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        CareOps
                    </span>
                    <Badge variant="outline">beta</Badge>
                </Link>
                <div className="hidden h-5 w-px bg-border/50 sm:block" />

                {/* Workspaces Dropdown */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => setShowWorkspaces(!showWorkspaces)}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Workspaces
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {showWorkspaces && (
                        <div className="absolute top-full left-0 mt-2 w-56 py-2 bg-card border border-border rounded-lg shadow-lg">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                            >
                                <Building2 className="w-4 h-4" />
                                All Workspaces
                            </Link>
                            <Link
                                to="/workspace/new"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                            >
                                <Plus className="w-4 h-4" />
                                Create Workspace
                            </Link>
                        </div>
                    )}
                </div>

                {workspaceId && (
                    <Link
                        to={`/workspace/${workspaceId}`}
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Dashboard
                    </Link>
                )}
            </div>

            {/* Right user info */}
            <div className="flex items-center gap-2">
                {/* Notifications Bell */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Notifications"
                >
                    <Bell className="h-4 w-4" />
                </Button>

                {/* Help */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(`${config.frontendUrl}/help`, '_blank')}
                >
                    <HelpCircle className="w-4 h-4 mr-1.5" />
                    Help
                </Button>

                {/* Profile Dropdown */}
                <div className="relative">
                    <Link
                        to="/profile"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-elevated"
                    >
                         <Avatar>
                            <AvatarImage
                                src="https://github.com/evilrabbit.png"
                                alt="@evilrabbit"
                                className="grayscale"
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>

                {/* Settings */}
                {workspaceId && (
                    <Link to={`/workspace/${workspaceId}/settings`}>
                       
                    </Link>
                )}

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
