import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "@/api/client";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* ── Left: Decorative editorial panel ─────────────────────────── */}
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
                        Don't worry,
                        <br />
                        we've got
                        <br />
                        <em className="text-brand">you covered.</em>
                    </h1>
                    <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-muted">
                        It happens to the best of us. Enter your email and we'll send
                        you a link to reset your password.
                    </p>
                </motion.div>

                <div className="relative z-10" />
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/[0.04] blur-[120px]" />
            </div>

            {/* ── Right: Form panel ────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
                {/* Mobile brand */}
                <div className="mb-10 flex items-center gap-3 lg:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/20">
                        CO
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-ink-muted uppercase">
                        CareOps
                    </span>
                </div>

                <div className="stagger-in mx-auto w-full max-w-sm">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                                <CheckCircle2 className="h-8 w-8 text-brand" />
                            </div>
                            <h2 className="editorial-heading text-3xl text-foreground">
                                Check your email
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                If an account with <strong className="text-foreground">{email}</strong> exists,
                                we've sent a password reset link.
                            </p>
                            <Link
                                to="/login"
                                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div>
                                <h2 className="editorial-heading text-4xl text-foreground sm:text-5xl">
                                    Reset password
                                </h2>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Enter your email and we'll send you a reset link.
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

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-glow mt-2 h-11 w-full bg-brand font-semibold text-white hover:bg-brand-hover"
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>

                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                Remember your password?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand-hover/50"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
