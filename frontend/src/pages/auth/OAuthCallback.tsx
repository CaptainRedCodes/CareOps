import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setTokensAndFetchUser } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (accessToken && refreshToken) {
            setTokensAndFetchUser(accessToken, refreshToken).then(() => {
                navigate("/dashboard", { replace: true });
            });
        } else {
            navigate("/login", { replace: true });
        }
    }, [searchParams, navigate, setTokensAndFetchUser]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                    Completing sign in...
                </p>
            </div>
        </div>
    );
}
