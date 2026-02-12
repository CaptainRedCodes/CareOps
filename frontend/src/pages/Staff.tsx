import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Users, Shield, Mail, UserPlus, MoreHorizontal,
    Check, X, Inbox, Calendar, FileText, Package
} from 'lucide-react';
import api from '@/api/client';

interface StaffMember {
    id: string;
    user_id: string;
    workspace_id: string;
    role: string;
    permissions: {
        inbox: boolean;
        bookings: boolean;
        forms: boolean;
        inventory: boolean;
    };
    created_at: string;
    user_email: string;
    user_name: string;
}

const permissionConfig = [
    { key: 'inbox', label: 'Inbox', icon: Inbox, description: 'View and reply to conversations' },
    { key: 'bookings', label: 'Bookings', icon: Calendar, description: 'Manage appointments' },
    { key: 'forms', label: 'Forms', icon: FileText, description: 'View form submissions' },
    { key: 'inventory', label: 'Inventory', icon: Package, description: 'Manage stock & resources' },
];

const Staff: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStaff, setEditingStaff] = useState<string | null>(null);

    useEffect(() => {
        loadStaff();
    }, [workspaceId]);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/workspaces/${workspaceId}/staff`);
            setStaff(res.data);
        } catch (err) {
            console.error('Failed to load staff', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = async (staffId: string, permKey: string) => {
        const member = staff.find(s => s.id === staffId);
        if (!member) return;

        const updated = {
            ...member.permissions,
            [permKey]: !member.permissions[permKey as keyof typeof member.permissions]
        };

        try {
            await api.put(`/workspaces/${workspaceId}/staff/${staffId}/permissions`, {
                permissions: updated
            });
            setStaff(prev => prev.map(s =>
                s.id === staffId ? { ...s, permissions: updated } : s
            ));
        } catch (err) {
            console.error('Failed to update permissions', err);
        }
    };

    const removeStaff = async (staffId: string) => {
        if (!confirm('Remove this staff member? They will lose access to this workspace.')) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/staff/${staffId}`);
            setStaff(prev => prev.filter(s => s.id !== staffId));
        } catch (err) {
            console.error('Failed to remove staff', err);
        }
    };

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Staff</h1>
                        <p className="text-muted-foreground mt-1">Manage team members and permissions.</p>
                    </div>
                    <Link
                        to={`/workspace/${workspaceId}/invite`}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite Staff</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-xl">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No staff members</h3>
                        <p className="text-muted-foreground text-sm mb-4">Invite team members to help manage your workspace.</p>
                        <Link
                            to={`/workspace/${workspaceId}/invite`}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            Invite Staff
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {staff.map(member => (
                            <div key={member.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary font-heading font-medium text-lg">
                                                {member.user_name?.charAt(0)?.toUpperCase() || 'S'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground text-lg">{member.user_name || 'Staff Member'}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>{member.user_email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full font-medium capitalize">
                                            {member.role}
                                        </span>
                                        <button
                                            onClick={() => setEditingStaff(editingStaff === member.id ? null : member.id)}
                                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeStaff(member.id)}
                                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Permissions */}
                                {editingStaff === member.id && (
                                    <div className="border-t border-border pt-4 mt-4">
                                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Permissions</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {permissionConfig.map(perm => {
                                                const isEnabled = member.permissions[perm.key as keyof typeof member.permissions];
                                                return (
                                                    <button
                                                        key={perm.key}
                                                        onClick={() => togglePermission(member.id, perm.key)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isEnabled
                                                            ? 'border-primary/30 bg-primary/5 text-foreground'
                                                            : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                                                            }`}
                                                    >
                                                        <perm.icon className="w-4 h-4" />
                                                        <div className="text-left flex-1">
                                                            <div className="text-sm font-medium">{perm.label}</div>
                                                            <div className="text-xs opacity-70">{perm.description}</div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                                            {isEnabled && <Check className="w-3 h-3 text-primary-foreground" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Quick permission badges */}
                                {editingStaff !== member.id && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {permissionConfig.filter(p => member.permissions[p.key as keyof typeof member.permissions]).map(p => (
                                            <span key={p.key} className="inline-flex items-center gap-1 bg-secondary/50 text-muted-foreground text-xs px-2 py-1 rounded">
                                                <p.icon className="w-3 h-3" />
                                                {p.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Staff;
