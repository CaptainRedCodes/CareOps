import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { ShieldAlert, Lock } from "lucide-react";
import api from "@/api/client";

export default function ForceChangePassword() {
    const { user, setTokensAndFetchUser } = useAuth();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await api.put("/auth/force-change-password", {
                new_password: newPassword,
            });
            // Refresh tokens to clear must_change_password flag
            const token = localStorage.getItem("access_token");
            if (token) await setTokensAndFetchUser(token, localStorage.getItem("refresh_token") || "");
            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="rounded-xl border border-border/50 bg-surface-card p-8 shadow-xl">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/20">
                            <ShieldAlert className="h-7 w-7 text-brand" />
                        </div>
                        <h1 className="editorial-heading text-2xl text-foreground">
                            Set Your Password
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Welcome to CareOps, <strong className="text-foreground">{user?.full_name}</strong>!
                            <br />
                            Please choose a new password to secure your account.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="newPw" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                New Password
                            </Label>
                            <div className="input-glow rounded-md transition-shadow">
                                <Input
                                    id="newPw"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoFocus
                                    className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPw" className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                Confirm New Password
                            </Label>
                            <div className="input-glow rounded-md transition-shadow">
                                <Input
                                    id="confirmPw"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11 border-border/50 bg-surface-elevated placeholder:text-muted-foreground/40 focus-visible:ring-brand/30"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="btn-glow h-11 w-full gap-2 bg-brand font-semibold text-white hover:bg-brand-hover"
                        >
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Set Password & Continue
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-xs text-muted-foreground/60">
                        You must set a new password before using CareOps.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
