import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import api from "@/api/client";
import config from "@/config";

export default function Login() {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const [resendMsg, setResendMsg] = useState("");

    // Redirect if already logged in
    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setShowResend(false);
        setResendMsg("");
        setSubmitting(true);
        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            const detail = err.response?.data?.detail || "Login failed.";
            setError(detail);
            // Check if unverified email
            if (detail.toLowerCase().includes("verify your email")) {
                setShowResend(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setResendMsg("");
        try {
            await api.post("/auth/resend-verification", { email });
            setResendMsg("Verification email sent! Check your inbox.");
        } catch {
            setResendMsg("Failed to resend. Please try again.");
        }
    };

const handleGoogleLogin = () => {
        window.location.href = `${config.apiUrl}/oauth/google/login`;
    };

    return (
        <div className="flex min-h-screen">
            {/* ── Left decorative panel ─────────────────────────────────── */}
            <div className="auth-panel-bg relative hidden w-[55%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <div className="dot-grid absolute inset-0" />
                <div className="accent-line absolute left-[35%] top-0 h-[55%]" />
                <div className="accent-line absolute left-[60%] bottom-0 h-[40%]" />

                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative z-10 flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                        CO
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-ink-muted uppercase">
                        CareOps
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative z-10"
                >
                    <h1 className="editorial-heading text-[clamp(3rem,6vw,5.5rem)] text-ink/90">
                        Precision
                        <br />
                        meets
                        <br />
                        <em className="text-brand">simplicity.</em>
                    </h1>
                    <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-muted">
                        CareOps transforms chaotic day-to-day operations into a smooth,
                        intuitive experience so you can focus on what matters.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="relative z-10 text-xs text-ink-muted/50"
                >
                    © {new Date().getFullYear()} CareOps
                </motion.div>

                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/[0.04] blur-[120px]" />
            </div>

            {/* ── Right form panel ──────────────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
                <div className="mb-10 flex items-center gap-3 lg:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                        CO
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-ink-muted uppercase">
                        CareOps
                    </span>
                </div>

                <div className="stagger-in mx-auto w-full max-w-sm">
                    <div>
                        <h2 className="editorial-heading text-4xl text-foreground sm:text-5xl">
                            Welcome back
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Sign in to your CareOps account.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                        >
                            {error}
                            {showResend && (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="mt-2 block font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
                                >
                                    Resend verification email
                                </button>
                            )}
                            {resendMsg && (
                                <p className="mt-1 text-xs text-brand">{resendMsg}</p>
                            )}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                Email
                            </Label>
                            <div className="input-glow rounded-md transition-shadow">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 border-border/50 bg-surface-card placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    Password
                                </Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-medium text-brand hover:text-brand-hover"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="input-glow rounded-md transition-shadow">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 border-border/50 bg-surface-card placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="btn-glow mt-2 h-11 w-full bg-brand font-semibold text-white hover:bg-brand-hover"
                        >
                            {submitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <Separator className="flex-1 bg-border/50" />
                        <span className="text-xs tracking-wider text-muted-foreground/60 uppercase">
                            or
                        </span>
                        <Separator className="flex-1 bg-border/50" />
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="mt-6 h-11 w-full gap-2 border-border/50 bg-surface-card text-sm font-medium text-foreground hover:border-ink-muted/20 hover:bg-surface-elevated"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand-hover/50"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
