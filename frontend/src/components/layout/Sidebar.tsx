
import { Link, useLocation, useParams } from "react-router-dom";
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Calendar,
    CalendarDays,
    Settings,
    Users,
    Package,
    UserCheck,
    Clock,
    UsersRound,
    FormInput,
    Mail,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const location = useLocation();
    const { user } = useAuth();
    const { hasPermission, isAdmin, loading } = useHasPermission(workspaceId);

    if (!workspaceId) return null;

    const isAdminUser = user?.role === "admin" || isAdmin;

    const mainLinks = [
        {
            name: "Dashboard",
            href: `/workspace/${workspaceId}`,
            icon: LayoutDashboard,
            exact: true,
            permission: null as string | null
        },
        {
            name: "Inbox",
            href: `/workspace/${workspaceId}/communication`,
            icon: MessageSquare,
            permission: "inbox"
        },
        {
            name: "Forms",
            href: `/workspace/${workspaceId}/forms`,
            icon: FileText,
            permission: "forms"
        },
        {
            name: "Bookings",
            href: `/workspace/${workspaceId}/bookings`,
            icon: Calendar,
            permission: "bookings"
        },
        {
            name: "Contacts",
            href: `/workspace/${workspaceId}/contacts`,
            icon: UserCheck,
            permission: null
        },
        {
            name: "Leads",
            href: `/workspace/${workspaceId}/leads`,
            icon: UsersRound,
            permission: "leads"
        },
    ];

    const schedulingLinks = [
        {
            name: "Working Hours",
            href: `/workspace/${workspaceId}/working-hours`,
            icon: Clock,
            permission: null,
            adminOnly: true
        },
        {
            name: "Automation",
            href: `/workspace/${workspaceId}/automation`,
            icon: Zap,
            permission: null,
            adminOnly: true
        },
    ];

    const resourceLinks = [
        {
            name: "Inventory",
            href: `/workspace/${workspaceId}/inventory`,
            icon: Package,
            permission: "inventory"
        },
        {
            name: "Form Builder",
            href: `/workspace/${workspaceId}/form-builder`,
            icon: FormInput,
            permission: null,
            adminOnly: true
        },
        {
            name: "Gmail",
            href: `/workspace/${workspaceId}/gmail`,
            icon: Mail,
            permission: null,
            adminOnly: true
        },
        {
            name: "Staff",
            href: `/workspace/${workspaceId}/staff`,
            icon: Users,
            permission: null,
            adminOnly: true
        },
        {
            name: "Calendar",
            href: `/workspace/${workspaceId}/calendar`,
            icon: CalendarDays,
            permission: null,
            adminOnly: true
        },
        {
            name: "Settings",
            href: `/workspace/${workspaceId}/settings`,
            icon: Settings,
            permission: null,
            adminOnly: true
        },
    ];

    const filterLinks = (links: typeof mainLinks) => {
        return links.filter((link) => {
            if (loading) return false;
            if (link.adminOnly && !isAdminUser) return false;
            if (link.permission && !isAdminUser && !hasPermission(link.permission as any)) return false;
            return true;
        });
    };

    const visibleMainLinks = filterLinks(mainLinks);
    const visibleSchedulingLinks = filterLinks(schedulingLinks);
    const visibleResourceLinks = filterLinks(resourceLinks);

    const renderLinks = (links: typeof mainLinks) => {
        return links.map((link) => {
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
        });
    };

    return (
        <div className="w-64 border-r border-border bg-card flex flex-col py-4">
            {/* Main Section */}
            <div className="px-4 mb-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Workspace
                </h2>
            </div>
            <nav className="space-y-1 px-2 mb-6">
                {renderLinks(visibleMainLinks)}
            </nav>

            {/* Scheduling Section - Admin Only */}
            {visibleSchedulingLinks.length > 0 && (
                <>
                    <div className="px-4 mb-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Scheduling
                        </h2>
                    </div>
                    <nav className="space-y-1 px-2 mb-6">
                        {renderLinks(visibleSchedulingLinks)}
                    </nav>
                </>
            )}

            {/* Resources Section */}
            {visibleResourceLinks.length > 0 && (
                <>
                    <div className="px-4 mb-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Resources
                        </h2>
                    </div>
                    <nav className="space-y-1 px-2">
                        {renderLinks(visibleResourceLinks)}
                    </nav>
                </>
            )}
        </div>
    );
}
