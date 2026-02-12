import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Users, Search, Phone, Mail, MoreHorizontal,
    Filter, ChevronDown, MessageCircle
} from 'lucide-react';
import api from '@/api/client';

interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    message: string | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-600 border-blue-200',
    active: 'bg-green-500/10 text-green-600 border-green-200',
    completed: 'bg-gray-500/10 text-gray-600 border-gray-200',
    archived: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
};

const Contacts: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadContacts();
    }, [workspaceId, statusFilter]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/workspaces/${workspaceId}/contacts?${params}`);
            setContacts(res.data);
        } catch (err) {
            console.error('Failed to load contacts', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Contacts</h1>
                        <p className="text-muted-foreground mt-1">View and manage all your contacts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-primary/80 px-4 py-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                            <span className="text-sm font-medium">{contacts.length} Total</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
                    >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                {/* Contact List */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-xl">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No contacts found</h3>
                        <p className="text-muted-foreground text-sm">Contacts appear when customers submit forms or book services.</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-secondary/30">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Contact</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Phone</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map(contact => (
                                    <tr key={contact.id} className="hover:bg-secondary/10 transition-colors cursor-pointer">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-primary font-medium text-sm">
                                                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{contact.name}</div>
                                                    {contact.email && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="w-3 h-3" />
                                                            {contact.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {contact.phone ? (
                                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {contact.phone}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusColors[contact.status] || statusColors.new}`}>
                                                {contact.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Contacts;
