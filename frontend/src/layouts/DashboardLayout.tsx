import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Users,
    Briefcase,
    Package,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Plus,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Bookings", icon: Calendar, path: "/bookings" },
    { label: "Customers", icon: Users, path: "/customers" },
    { label: "Services", icon: Briefcase, path: "/services" },
    { label: "Inventory", icon: Package, path: "/inventory" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Settings", icon: Settings, path: "/settings" },
];

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={cn(
                    "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        CareOps
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4.5 w-4.5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-2 hover:bg-secondary h-14">
                                <div className="flex items-center gap-3 text-left">
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`} />
                                        <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate leading-none">{user?.full_name || "User"}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || "user@example.com"}</p>
                                    </div>
                                    <div className="text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" side="top">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate("/profile")}>
                                <Users className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Preferences
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 transition-opacity duration-200">
                {/* Topbar */}
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="hidden sm:flex relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search bookings, customers..."
                                className="pl-9 h-9 bg-secondary/50 border-transparent focus:bg-background focus:border-input transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex gap-2 rounded-full border-dashed"
                            onClick={() => navigate("/bookings/new")}
                        >
                            <Plus className="h-4 w-4" />
                            New Booking
                        </Button>

                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-secondary/30">
                    <div className="max-w-7xl mx-auto stagger-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
