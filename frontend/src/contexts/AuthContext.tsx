import {
    createContext,
    useContext,
    useState,
    useEffect,
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
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    setTokensAndFetchUser: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(null);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
    };

    const setTokensAndFetchUser = async (accessToken: string, refreshToken: string) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        await fetchProfile();
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetchProfile().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        await fetchProfile();
    };

    const register = async (email: string, password: string, fullName: string) => {
        await api.post("/auth/register", {
            email,
            password,
            full_name: fullName,
        });
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, setTokensAndFetchUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
