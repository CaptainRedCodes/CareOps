import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/api/client";

interface InviteStaffModalProps {
    workspaceId: string;
    workspaceName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface Invitation {
    id: string;
    email: string;
    status: string;
    created_at: string;
}

export default function InviteStaffModal({
    workspaceId,
    workspaceName,
    isOpen,
    onClose,
    onSuccess,
}: InviteStaffModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(false);

    // Fetch existing invitations when modal opens
    const fetchInvitations = async () => {
        setLoadingInvitations(true);
        try {
            const res = await api.get(`/workspaces/${workspaceId}/invitations`);
            setInvitations(res.data);
        } catch (err) {
            console.error("Failed to fetch invitations:", err);
        } finally {
            setLoadingInvitations(false);
        }
    };

    // Load invitations when modal opens
    useState(() => {
        if (isOpen) {
            fetchInvitations();
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // Basic email validation
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            await api.post(`/workspaces/${workspaceId}/invite-staff`, {
                email: email.trim(),
            });

            setSuccess(true);
            setEmail("");
            
            // Refresh invitations list
            fetchInvitations();
            
            // Call success callback
            if (onSuccess) {
                onSuccess();
            }

            // Auto-close success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                "Failed to send invitation. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setError("");
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-surface-card p-6 shadow-2xl"
                >
                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h2 className="font-heading text-xl font-semibold text-foreground">
                                Invite Staff Member
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                to <span className="font-medium text-brand">{workspaceName}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-border/30 hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email Address
                            </Label>
                            <div className="relative mt-2">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="staff@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="pl-10"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                They'll receive an email with temporary login credentials
                            </p>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10"
                                >
                                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Success Message */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10"
                                >
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                                    <p className="text-sm text-green-800 dark:text-green-300">
                                        Invitation sent successfully!
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="btn-glow flex-1 bg-brand font-semibold text-white hover:bg-brand-hover"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Invitation"
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                        <div className="mt-6 border-t border-border/50 pt-6">
                            <h3 className="mb-3 text-sm font-semibold text-foreground">
                                Pending Invitations ({invitations.length})
                            </h3>
                            <div className="space-y-2">
                                {loadingInvitations ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    invitations.map((inv) => (
                                        <div
                                            key={inv.id}
                                            className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground">
                                                    {inv.email}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}