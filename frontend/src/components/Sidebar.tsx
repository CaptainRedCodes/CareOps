
import { Link, useLocation, useParams } from "react-router-dom";
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Calendar,
    Settings,
    Users,
    Package,
    UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll inline helper

export default function Sidebar() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const location = useLocation();

    if (!workspaceId) return null;

    const links = [
        {
            name: "Dashboard",
            href: `/workspace/${workspaceId}`,
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: "Communication",
            href: `/workspace/${workspaceId}/communication`,
            icon: MessageSquare
        },
        {
            name: "Forms",
            href: `/workspace/${workspaceId}/forms`,
            icon: FileText
        },
        {
            name: "Bookings",
            href: `/workspace/${workspaceId}/bookings`,
            icon: Calendar
        },
        {
            name: "Contacts",
            href: `/workspace/${workspaceId}/contacts`,
            icon: UserCheck
        },
        // Resources
        {
            name: "Inventory",
            href: `/workspace/${workspaceId}/inventory`,
            icon: Package
        },
        {
            name: "Staff",
            href: `/workspace/${workspaceId}/staff`,
            icon: Users
        },
        {
            name: "Settings",
            href: `/workspace/${workspaceId}/settings`,
            icon: Settings
        },
    ];

    return (
        <div className="w-64 border-r border-border bg-card flex flex-col py-4">
            <div className="px-4 mb-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Workspace
                </h2>
            </div>
            <nav className="space-y-1 px-2">
                {links.map((link) => {
                    const isActive = link.exact
                        ? location.pathname === link.href
                        : location.pathname.startsWith(link.href);

                    return (
                        <Link
                            key={link.name}
                            to={link.href}
                            className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"}
              `}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
