import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Copy,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import api from '@/api/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Types
interface ContactForm {
    id: string;
    name: string;
    slug: string;
    description?: string;
    fields: any[];
    status: 'active' | 'draft' | 'archived';
    submissions: number;
    conversion_rate: string;
    last_active: string;
    created_at: string;
    updated_at: string;
}

const ContactForms: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [forms, setForms] = useState<ContactForm[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingForm, setCreatingForm] = useState(false);

    const [newForm, setNewForm] = useState({
        name: '',
        description: '',
        status: 'draft' as 'draft' | 'active' | 'archived'
    });

    useEffect(() => {
        if (workspaceId) {
            fetchForms();
        }
    }, [workspaceId]);

    const handleCreateForm = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newForm.name.trim()) {
            toast.error('Please enter a form name'); // Use sonner instead of alert!
            return;
        }

        try {
            setCreatingForm(true);
            const response = await api.post(`/workspaces/${workspaceId}/forms`,
                 {
                name: newForm.name,
                description: newForm.description || null,
                fields: [
                    { name: 'full_name', type: 'text', required: true, label: 'Full Name' },
                    {
                        name: 'email',
                        type: 'email',
                        required: false,
                        label: 'Email Address',
                        placeholder: 'email@example.com'
                    },
                    {
                        name: 'phone',
                        type: 'tel',
                        required: false,
                        label: 'Phone Number',
                        placeholder: '+1...'
                    },
                    { name: 'message', type: 'textarea', required: false, label: 'How can we help?' }
                ],
                // Custom metadata to tell our UI to validate at least one of these
                validation_rules: {
                    require_one_of: ['email', 'phone']
                },
                status: newForm.status
            });

            setForms([response.data, ...forms]);
            setShowCreateModal(false);
            setNewForm({ name: '', description: '', status: 'draft' });
            toast.success('Lead form created successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create form');
        } finally {
            setCreatingForm(false);
        }
    };

    const fetchForms = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/workspaces/${workspaceId}/forms`);
            setForms(response.data);
        } catch (error) {
            toast.error('Error fetching forms');
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteForm = async (formId: string) => {
        if (!confirm('Are you sure you want to delete this form?')) return;

        try {
            await api.delete(`/workspaces/${workspaceId}/forms/${formId}`);
            setForms(forms.filter(f => f.id !== formId));
        } catch (error) {
            toast.error('Error deleting form:');
            console.log(error);
            alert('Failed to delete form');
        }
    };

    const handleUpdateStatus = async (formId: string, newStatus: string) => {
        try {
            await api.put(`/workspaces/${workspaceId}/forms/${formId}`, {
                status: newStatus
            });
            setForms(forms.map(f =>
                f.id === formId ? { ...f, status: newStatus as any } : f
            ));
        } catch (error) {
            console.error('Error updating form status:', error);
            alert('Failed to update form status');
        }
    };

    const copyFormLink = (slug: string) => {
        const link = `${window.location.origin}/public/forms/${slug}`;
        navigator.clipboard.writeText(link);
        alert('Form link copied to clipboard!');
    };

    const openFormLink = (slug: string) => {
        window.open(`/public/forms/${slug}`, '_blank');
    };

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalSubmissions: forms.reduce((sum, f) => sum + f.submissions, 0),
        avgConversionRate: forms.length > 0
            ? (forms.reduce((sum, f) => sum + parseFloat(f.conversion_rate), 0) / forms.length).toFixed(1) + '%'
            : '0%',
        activeForms: forms.filter(f => f.status === 'active').length,
        draftForms: forms.filter(f => f.status === 'draft').length
    };

    return (
        <> {/* Added Fragment to allow multiple top-level elements */}
            <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-heading font-medium text-foreground">Contact Forms</h1>
                            <p className="text-muted-foreground mt-1">Manage your lead capture forms and surveys.</p>
                        </div>

                        {/* Button opens the modal */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Form</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm card-shimmer relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-3xl font-heading font-semibold text-foreground">
                                        {stats.totalSubmissions}
                                    </h3>
                                </div>
                                <p className="text-xs text-primary mt-2">Across all forms</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm card-shimmer relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-muted-foreground">Avg. Conversion Rate</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-3xl font-heading font-semibold text-foreground">
                                        {stats.avgConversionRate}
                                    </h3>
                                </div>
                                <p className="text-xs text-green-600 mt-2">Performance metric</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm card-shimmer relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-muted-foreground">Active Forms</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-3xl font-heading font-semibold text-foreground">
                                        {stats.activeForms}
                                    </h3>
                                </div>
                                <p className="text-xs text-primary mt-2">Currently live</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm card-shimmer relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-muted-foreground">Draft Forms</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-3xl font-heading font-semibold text-foreground">
                                        {stats.draftForms}
                                    </h3>
                                </div>
                                <p className="text-xs text-yellow-600 mt-2">Pending activation</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search forms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Forms List Container */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-heading font-medium mb-1">No forms found</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Create your first contact form to start collecting leads.'
                                    }
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow"
                                    >
                                        Create First Form
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-secondary/50 border-b border-border">
                                            <th className="px-6 py-4 font-medium text-muted-foreground">Form Name</th>
                                            <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
                                            <th className="px-6 py-4 font-medium text-muted-foreground">Submissions</th>
                                            <th className="px-6 py-4 font-medium text-muted-foreground">Last Active</th>
                                            <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredForms.map((form) => (
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
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className="capitalize">{form.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-foreground/80">
                                                    {form.submissions}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {form.last_active}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {/* Actions go here */}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal Logic (Now inside the fragment but outside the main container) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-heading font-semibold">Create New Form</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewForm({ name: '', description: '', status: 'draft' });
                                }}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateForm} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Form Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                    placeholder="e.g., Contact Us"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                                <textarea
                                    value={newForm.description}
                                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                    rows={2}
                                />
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Auto-Generated Fields</p>
                                <ul className="space-y-1.5">
                                    <li className="flex items-center text-xs text-slate-600">
                                        <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" /> <strong>Full Name:</strong> Required
                                    </li>
                                    <li className="flex items-center text-xs text-slate-600">
                                        <CheckCircle2 className="w-3 h-3 mr-2 text-blue-500" /> <strong>Email or Phone:</strong> Mandatory
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-secondary rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingForm}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm shadow-sm"
                                >
                                    {creatingForm ? 'Creating...' : 'Create Form'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ContactForms;