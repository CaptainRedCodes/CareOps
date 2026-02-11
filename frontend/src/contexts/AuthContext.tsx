import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import api from "@/api/client";

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    auth_provider: string;
    is_email_verified: boolean;
    must_change_password: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (
        email: string,
        password: string,
        fullName: string
    ) => Promise<{ requiresVerification: boolean }>;
    logout: () => void;
    setTokensAndFetchUser: (
        accessToken: string,
        refreshToken: string
    ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetchUser().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        await fetchUser();
        return user!;
    };

    const register = async (
        email: string,
        password: string,
        fullName: string
    ): Promise<{ requiresVerification: boolean }> => {
        await api.post("/auth/register", {
            email,
            password,
            full_name: fullName,
        });
        // Don't auto-login — user must verify email first
        return { requiresVerification: true };
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
    };

    const setTokensAndFetchUser = async (
        accessToken: string,
        refreshToken: string
    ) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        await fetchUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                setTokensAndFetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
