import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    FileText,
    Trash2,
    Copy,
    QrCode,
    Eye,
    Code,
    Settings,
    X,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
    GripVertical,
    Globe
} from 'lucide-react';
import api from '@/api/client';
import config from '@/config';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FormField {
    id: string;
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
}

interface ContactForm {
    id: string;
    name: string;
    slug: string;
    description: string;
    fields: FormField[];
    status: string;
    is_active: boolean;
    welcome_message_enabled: boolean;
    welcome_message: string;
    welcome_channel: string;
    submit_button_text: string;
    success_message: string;
    submissions: number;
    conversion_rate: string;
    last_active: string;
}

const ContactForms: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    
    const [forms, setForms] = useState<ContactForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Edit modal state
    const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showQR, setShowQR] = useState<string | null>(null);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingForm, setCreatingForm] = useState(false);
    const [newForm, setNewForm] = useState({
        name: '',
        description: '',
        status: 'draft'
    });

    const fetchForms = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/workspaces/${workspaceId}/forms`);
            let formsData = response.data;
            
            // Ensure each field has a unique ID
            formsData = formsData.map((form: any) => ({
                ...form,
                fields: (form.fields || []).map((field: any, index: number) => ({
                    ...field,
                    id: field.id || `field_${index}_${Date.now()}`
                }))
            }));
            
            setForms(formsData);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load forms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [workspaceId]);

    const handleCreateForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newForm.name.trim()) {
            toast.error('Please enter a form name');
            return;
        }

        try {
            setCreatingForm(true);
            
            const uniqueId = Math.random().toString(36).substring(2, 10);
            const baseSlug = newForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            const response = await api.post(`/workspaces/${workspaceId}/forms`, {
                name: newForm.name,
                description: newForm.description || null,
                slug: `${baseSlug}-${uniqueId}`,
                fields: [
                    { id: '1', name: 'name', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
                    { id: '2', name: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
                    { id: '3', name: 'message', type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: false }
                ],
                status: newForm.status || 'draft',
                welcome_message_enabled: true,
                welcome_message: 'Thank you for contacting us! We will be in touch shortly.',
                welcome_channel: 'email',
                submit_button_text: 'Send Message',
                success_message: 'Thank you! Your message has been received.'
            });
            
            await fetchForms();
            setShowCreateModal(false);
            setNewForm({ name: '', description: '', status: 'draft' });
            toast.success('Form created successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create form');
        } finally {
            setCreatingForm(false);
        }
    };

    const handleSaveForm = async () => {
        if (!selectedForm) return;

        try {
            setSaving(true);
            
            if (selectedForm.id === 'new') {
                await api.post(`/workspaces/${workspaceId}/forms`, selectedForm);
            } else {
                await api.put(`/workspaces/${workspaceId}/forms/${selectedForm.id}`, selectedForm);
            }
            
            await fetchForms();
            setIsEditing(false);
            setSelectedForm(null);
            toast.success('Form saved successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteForm = async (formId: string) => {
        if (!confirm('Are you sure you want to delete this form?')) return;

        try {
            await api.delete(`/workspaces/${workspaceId}/forms/${formId}`);
            await fetchForms();
            toast.success('Form deleted');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete form');
        }
    };

    const addField = () => {
        if (!selectedForm) return;
        
        const newField: FormField = {
            id: Date.now().toString(),
            name: 'field_' + Date.now().toString(),
            type: 'text',
            label: 'New Field',
            placeholder: '',
            required: false
        };
        
        setSelectedForm({
            ...selectedForm,
            fields: [...selectedForm.fields, newField]
        });
    };

    const updateField = (fieldId: string, updates: Partial<FormField>) => {
        if (!selectedForm) return;
        
        setSelectedForm({
            ...selectedForm,
            fields: selectedForm.fields.map(f => 
                f.id === fieldId ? { ...f, ...updates } : f
            )
        });
    };

    const removeField = (fieldId: string) => {
        if (!selectedForm) return;
        
        setSelectedForm({
            ...selectedForm,
            fields: selectedForm.fields.filter(f => f.id !== fieldId)
        });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (!selectedForm) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= selectedForm.fields.length) return;
        
        const newFields = [...selectedForm.fields];
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        
        setSelectedForm({
            ...selectedForm,
            fields: newFields
        });
    };

    const generateUniqueSlug = (name: string) => {
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const uniqueId = Math.random().toString(36).substring(2, 10);
        return `${base}-${uniqueId}`;
    };

    const copyFormUrl = (slug: string) => {
        const url = `${config.frontendUrl}/form/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Form URL copied to clipboard!');
    };

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalSubmissions: forms.reduce((sum, f) => sum + (f.submissions || 0), 0),
        activeForms: forms.filter(f => f.status === 'active').length,
        draftForms: forms.filter(f => f.status === 'draft').length
    };

    if (loading && forms.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Forms</h1>
                        <p className="text-muted-foreground mt-1">
                            Create contact forms or connect third-party forms to capture leads.
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <a
                            href={`/workspace/${workspaceId}/third-party-forms`}
                            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            Third-Party
                        </a>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Form
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                        <h3 className="text-3xl font-heading font-semibold text-foreground mt-2">{stats.totalSubmissions}</h3>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">Active Forms</p>
                        <h3 className="text-3xl font-heading font-semibold text-foreground mt-2">{stats.activeForms}</h3>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                        <p className="text-sm font-medium text-muted-foreground">Draft Forms</p>
                        <h3 className="text-3xl font-heading font-semibold text-foreground mt-2">{stats.draftForms}</h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-card border border-border rounded-lg px-4 py-2 text-sm outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                {/* Forms Grid */}
                {filteredForms.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No forms found</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first contact form to start capturing leads
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
                        >
                            Create First Form
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredForms.map((form) => (
                            <div
                                key={form.id}
                                className="bg-card border border-border rounded-xl p-6 hover:border-brand/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{form.name}</h3>
                                            <Badge className="capitalize text-xs">{form.status}</Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {form.description || 'No description'}
                                </p>
                                
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                    <span>{form.fields?.length || 0} fields</span>
                                    <span>•</span>
                                    <span>{form.submissions || 0} submissions</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copyFormUrl(form.slug)}
                                        className="p-2 hover:bg-secondary rounded-lg"
                                        title="Copy URL"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <a
                                        href={`${config.frontendUrl}/form/${form.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-secondary rounded-lg"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => {
                                            setSelectedForm({
                                                ...form,
                                                fields: (form.fields || []).map((f: any, idx: number) => ({
                                                    ...f,
                                                    id: f.id || `field_${idx}_${Date.now()}`
                                                }))
                                            });
                                            setIsEditing(true);
                                        }}
                                        className="p-2 hover:bg-secondary rounded-lg"
                                        title="Edit"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForm(form.id)}
                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <h4 className="font-medium text-blue-800 mb-2">Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Active</strong> forms are live and accessible via their URL</li>
                        <li>• Click the <strong>Edit (Code)</strong> icon to customize fields, messages, and settings</li>
                        <li>• Use <strong>Third-Party</strong> to connect Typeform, JotForm, Google Forms, etc.</li>
                    </ul>
                </div>
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-heading font-semibold">Create New Form</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-secondary rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateForm} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Form Name <span className="text-red-500">*</span>
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
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={newForm.description}
                                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                    rows={2}
                                />
                            </div>

                            <div className="bg-secondary/50 rounded-lg p-4">
                                <p className="text-sm font-medium mb-2">Auto-generated fields:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>✓ Full Name (required)</li>
                                    <li>✓ Email (required)</li>
                                    <li>✓ Message (optional)</li>
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
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                                >
                                    {creatingForm ? 'Creating...' : 'Create Form'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && selectedForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                            <h2 className="text-xl font-heading font-semibold">Edit Form</h2>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedForm(null);
                                }}
                                className="p-2 hover:bg-secondary rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Form Settings */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Form Settings</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Form Name</label>
                                        <input
                                            type="text"
                                            value={selectedForm.name}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">URL Slug</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={selectedForm.slug}
                                                onChange={(e) => setSelectedForm({ ...selectedForm, slug: e.target.value })}
                                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSelectedForm({ ...selectedForm, slug: generateUniqueSlug(selectedForm.name) })}
                                                className="px-3 py-2 bg-secondary border border-border rounded-lg"
                                                title="Generate new"
                                            >
                                                🔄
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        value={selectedForm.description}
                                        onChange={(e) => setSelectedForm({ ...selectedForm, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Status</label>
                                        <select
                                            value={selectedForm.status || 'draft'}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, status: e.target.value, is_active: e.target.value === 'active' })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        >
                                            <option value="draft">Draft - Not visible</option>
                                            <option value="active">Active - Live</option>
                                            <option value="archived">Archived - Hidden</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Submit Button</label>
                                        <input
                                            type="text"
                                            value={selectedForm.submit_button_text}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, submit_button_text: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Success Message</label>
                                        <input
                                            type="text"
                                            value={selectedForm.success_message}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, success_message: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Welcome Message</label>
                                        <input
                                            type="text"
                                            value={selectedForm.welcome_message}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, welcome_message: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedForm.welcome_message_enabled}
                                            onChange={(e) => setSelectedForm({ ...selectedForm, welcome_message_enabled: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Send Welcome Message</span>
                                    </label>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Form Fields</h3>
                                    <button
                                        onClick={addField}
                                        className="flex items-center gap-1 text-sm text-brand hover:underline"
                                    >
                                        <Plus className="w-4 h-4" /> Add Field
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {selectedForm.fields.map((field, index) => (
                                        <div key={field.id} className="bg-secondary/50 border border-border rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => moveField(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 hover:bg-secondary rounded disabled:opacity-30 text-xs"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => moveField(index, 'down')}
                                                        disabled={index === selectedForm.fields.length - 1}
                                                        className="p-1 hover:bg-secondary rounded disabled:opacity-30 text-xs"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>

                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={field.name}
                                                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                                                        placeholder="Field name"
                                                        className="px-2 py-1 bg-background border border-border rounded text-sm"
                                                    />
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                                        className="px-2 py-1 bg-background border border-border rounded text-sm"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="email">Email</option>
                                                        <option value="phone">Phone</option>
                                                        <option value="textarea">Text Area</option>
                                                        <option value="select">Dropdown</option>
                                                        <option value="checkbox">Checkbox</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                        placeholder="Label"
                                                        className="px-2 py-1 bg-background border border-border rounded text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={field.placeholder}
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                        placeholder="Placeholder"
                                                        className="px-2 py-1 bg-background border border-border rounded text-sm"
                                                    />
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                            className="rounded"
                                                        />
                                                        Required
                                                    </label>
                                                </div>

                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSelectedForm(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-secondary rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveForm}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Form
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactForms;
