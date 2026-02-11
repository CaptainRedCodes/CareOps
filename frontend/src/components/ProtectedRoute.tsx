import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Force staff to change password on first login
    if (
        user.must_change_password &&
        window.location.pathname !== "/force-change-password"
    ) {
        return <Navigate to="/force-change-password" replace />;
    }

    return <Outlet />;
}
