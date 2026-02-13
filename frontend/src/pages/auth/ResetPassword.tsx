import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/api/client";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", {
                token,
                new_password: password,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                    <h2 className="font-heading text-xl text-foreground">Invalid Link</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
                    >
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* ── Left: Decorative editorial panel ─────────────────────────── */}
            <div className="auth-panel-bg relative hidden w-[55%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <div className="dot-grid absolute inset-0" />
                <div className="accent-line absolute left-[30%] top-0 h-[60%]" />

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
                        Set a new
                        <br />
                        <em className="text-brand">password.</em>
                    </h1>
                    <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-muted">
                        Choose a strong password that you haven't used before.
                        We recommend at least 8 characters.
                    </p>
                </motion.div>

                <div className="relative z-10" />
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/[0.04] blur-[120px]" />
            </div>

            {/* ── Right: Form panel ────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
                <div className="stagger-in mx-auto w-full max-w-sm">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                                <CheckCircle2 className="h-8 w-8 text-brand" />
                            </div>
                            <h2 className="editorial-heading text-3xl text-foreground">
                                Password reset!
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Your password has been successfully reset. You can now sign in.
                            </p>
                            <Link to="/login">
                                <Button className="btn-glow mt-8 h-11 w-full bg-brand font-semibold text-white hover:bg-brand-hover">
                                    Sign In
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div>
                                <h2 className="editorial-heading text-4xl text-foreground sm:text-5xl">
                                    New password
                                </h2>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Enter your new password below.
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mt-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        New Password
                                    </Label>
                                    <div className="input-glow rounded-md transition-shadow">
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="h-11 border-border/50 bg-surface-card placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        Confirm Password
                                    </Label>
                                    <div className="input-glow rounded-md transition-shadow">
                                        <Input
                                            id="confirm"
                                            type="password"
                                            placeholder="Re-enter password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-11 border-border/50 bg-surface-card placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-glow mt-2 h-11 w-full bg-brand font-semibold text-white hover:bg-brand-hover"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>

                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-hover"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to Sign In
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
