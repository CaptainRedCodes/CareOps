import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Settings, CheckCircle2, XCircle, Zap, Shield,
    Radio, Calendar, Clock, AlertTriangle, ExternalLink, Copy, QrCode, ArrowRight
} from 'lucide-react';
import QRCode from 'react-qr-code';
import api, { showSuccess, showError } from '@/api/client';
import { Button } from '@/components/ui/button';
import config from '@/config';

interface ActivationCheck {
    name: string;
    passed: boolean;
    detail: string;
}

interface ActivationStatus {
    is_activated: boolean;
    can_activate: boolean;
    checks: ActivationCheck[];
}

const WorkspaceSettings: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ActivationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadStatus();
    }, [workspaceId]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/workspaces/${workspaceId}/activation-status`);
            setStatus(res.data);
        } catch (err) {
            console.error('Failed to load activation status', err);
        } finally {
            setLoading(false);
        }
    };

const handleActivate = async () => {
        try {
            setActivating(true);
            await api.post(`/workspaces/${workspaceId}/activate`);
            await loadStatus();
            showSuccess('Workspace activated successfully!');
        } catch (err: any) {
            const message = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to activate workspace';
            showError(message);
        } finally {
            setActivating(false);
        }
    };

    const getCheckIcon = (check: ActivationCheck) => {
        if (check.name === 'Communication Channel') return Radio;
        if (check.name === 'Booking Types') return Calendar;
        if (check.name === 'Availability Defined') return Clock;
        return Shield;
    };

    const getCheckLink = (check: ActivationCheck): string | null => {
        if (check.name === 'Communication Channel') return `/workspace/${workspaceId}/communication`;
        if (check.name === 'Booking Types') return `/workspace/${workspaceId}/bookings`;
        if (check.name === 'Availability Defined') return `/workspace/${workspaceId}/working-hours`;
        return null;
    };

    const getCheckLabel = (check: ActivationCheck): string => {
        if (check.name === 'Communication Channel') return 'Set up Communication';
        if (check.name === 'Booking Types') return 'Configure Booking Types';
        if (check.name === 'Availability Defined') return 'Set Working Hours';
        return 'Go to Settings';
    };

    const copyBookingUrl = () => {
        const url = `${config.frontendUrl}/book/${workspaceId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const publicBookingUrl = `${config.frontendUrl}/book/${workspaceId}`;

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-medium text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure and activate your workspace.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : status && (
                    <>
                        {/* Activation Status Card */}
                        <div className={`rounded-2xl p-8 mb-8 border ${status.is_activated
                            ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30'
                            : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30'
                            }`}>
                            <div className="flex items-center gap-4 mb-4">
                                {status.is_activated ? (
                                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-heading font-medium">
                                        {status.is_activated ? 'Workspace Active' : 'Activate Workspace'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {status.is_activated
                                            ? 'Your workspace is live. Forms, bookings, and automations are running.'
                                            : 'Complete all requirements below to go live.'}
                                    </p>
                                </div>
                            </div>

{!status.is_activated && (
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleActivate}
                                        disabled={!status.can_activate || activating}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${status.can_activate
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 btn-glow shadow-lg shadow-primary/30'
                                            : 'bg-secondary text-muted-foreground cursor-not-allowed'
                                            }`}
                                    >
                                        <Zap className="w-5 h-5" />
                                        {activating ? 'Activating...' : status.can_activate ? 'Activate Now' : 'Complete Requirements First'}
                                    </button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/workspace/${workspaceId}/setup`)}
                                        className="flex items-center gap-2"
                                    >
                                        <span>Open Setup Wizard</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Checklist */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-heading font-medium text-lg">Activation Checklist</h3>
                                <p className="text-sm text-muted-foreground mt-1">All items must pass before activation.</p>
                            </div>
                            <div className="divide-y divide-border">
                                {status.checks.map((check, idx) => {
                                    const Icon = getCheckIcon(check);
                                    const link = getCheckLink(check);
                                    return (
                                        <div key={idx} className={`flex items-center gap-4 px-6 py-4 ${link && !check.passed ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                                            onClick={() => link && !check.passed && navigate(link)}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${check.passed ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                                                <Icon className={`w-5 h-5 ${check.passed ? 'text-green-500' : 'text-destructive'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-foreground">{check.name}</div>
                                                <div className="text-sm text-muted-foreground">{check.detail}</div>
                                            </div>
                                            {check.passed ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            ) : link ? (
                                                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                    <span>{getCheckLabel(check)}</span>
                                                    <ExternalLink className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <XCircle className="w-6 h-6 text-destructive/60" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Additional Settings */}
                        <div className="bg-card border border-border rounded-xl p-6 mt-6">
                            <h3 className="font-heading font-medium text-lg mb-4">Workspace Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground">Workspace ID</span>
                                    <code className="bg-secondary px-2 py-0.5 rounded text-xs font-mono">{workspaceId}</code>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.is_activated ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                        {status.is_activated ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="py-2 border-b border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-muted-foreground">Public Booking URL</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={copyBookingUrl}
                                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button
                                                onClick={() => setShowQR(!showQR)}
                                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                <QrCode className="w-3 h-3" />
                                                {showQR ? 'Hide QR' : 'QR Code'}
                                            </button>
                                        </div>
                                    </div>
                                    <code className="block bg-secondary px-2 py-1.5 rounded text-xs font-mono break-all">
                                        {publicBookingUrl}
                                    </code>
                                    {showQR && (
                                        <div className="mt-3 flex justify-center">
                                            <div className="bg-white p-3 rounded-lg">
                                                <QRCode value={publicBookingUrl} size={160} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default WorkspaceSettings;
