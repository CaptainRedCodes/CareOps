
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    FileText,
    Eye,
    Edit,
    Trash2,
    Calendar,
    CheckCircle,
    ExternalLink,
    Copy
} from 'lucide-react';

// Types
interface Form {
    id: string;
    name: string;
    slug: string;
    submissions: number;
    conversionRate: string;
    lastActive: string;
    status: 'active' | 'draft' | 'archived';
}

const ContactForms: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [view, setView] = useState<'list' | 'builder' | 'submissions'>('list');

    const forms: Form[] = [
        {
            id: '1',
            name: 'General Inquiry',
            slug: 'general-inquiry',
            submissions: 124,
            conversionRate: '12%',
            lastActive: '2 days ago',
            status: 'active',
        },
        {
            id: '2',
            name: 'Booking Request',
            slug: 'booking-request',
            submissions: 45,
            conversionRate: '28%',
            lastActive: '5 hours ago',
            status: 'active',
        },
        {
            id: '3',
            name: 'Feedback Survey',
            slug: 'feedback-survey',
            submissions: 12,
            conversionRate: '5%',
            lastActive: '1 week ago',
            status: 'draft',
        },
    ];

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Contact Forms</h1>
                        <p className="text-muted-foreground mt-1">Manage your lead capture forms and surveys.</p>
                    </div>

                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md">
                        <Plus className="w-4 h-4" />
                        <span>Create New Form</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Total Submissions', value: '181', change: '+12% this month' },
                        { label: 'Avg. Conversion Rate', value: '15.4%', change: '+2.1% from last month' },
                        { label: 'Active Forms', value: '2', change: '1 draft pending' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm card-shimmer relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-3xl font-heading font-semibold text-foreground">{stat.value}</h3>
                                </div>
                                <p className="text-xs text-primary mt-2">{stat.change}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search forms..."
                            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Draft</option>
                            <option>Archived</option>
                        </select>
                    </div>
                </div>

                {/* Forms List */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-secondary/50 border-b border-border">
                                    <th className="px-6 py-4 font-medium text-muted-foreground w-[40%]">Form Name</th>
                                    <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 font-medium text-muted-foreground">Submissions</th>
                                    <th className="px-6 py-4 font-medium text-muted-foreground">Last Active</th>
                                    <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {forms.map((form) => (
                                    <tr key={form.id} className="hover:bg-secondary/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground">{form.name}</h3>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <span className="truncate max-w-[150px]">/{form.slug}</span>
                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-secondary rounded">
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-secondary rounded">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${form.status === 'active'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : form.status === 'draft'
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {form.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-foreground/80">
                                            {form.submissions} <span className="text-muted-foreground text-xs ml-1">({form.conversionRate})</span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {form.lastActive}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors hover:text-primary" title="View Submissions">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors hover:text-primary" title="Edit Form">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State (if needed) */}
                    {forms.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-heading font-medium mb-1">No forms created yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Create your first contact form to start collecting leads and inquiries from your customers.
                            </p>
                            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow">
                                Create First Form
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ContactForms;
