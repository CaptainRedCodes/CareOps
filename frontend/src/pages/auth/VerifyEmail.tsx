import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/client";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(() => {
                setStatus("success");
                setMessage("Your email has been verified successfully!");
            })
            .catch((err) => {
                setStatus("error");
                setMessage(
                    err.response?.data?.detail || "Verification failed. The link may have expired."
                );
            });
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto w-full max-w-sm px-6 text-center"
            >
                {status === "loading" && (
                    <>
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand" />
                        <h2 className="font-heading text-xl text-foreground">
                            Verifying your email...
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Please wait a moment.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                            <CheckCircle2 className="h-8 w-8 text-brand" />
                        </div>
                        <h2 className="editorial-heading text-3xl text-foreground">
                            Email verified!
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
                        <Link to="/login">
                            <Button className="btn-glow mt-8 h-11 w-full bg-brand font-semibold text-white hover:bg-brand-hover">
                                Sign In
                            </Button>
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="editorial-heading text-3xl text-foreground">
                            Verification failed
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
                        <Link to="/login">
                            <Button
                                variant="outline"
                                className="mt-8 h-11 w-full border-border/50 text-foreground hover:bg-surface-elevated"
                            >
                                Go to Sign In
                            </Button>
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    );
}
