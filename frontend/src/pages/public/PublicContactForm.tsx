import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle2, Loader2, Send, FileText, ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface FormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}

interface ContactFormData {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    fields: FormField[];
    workspace_id: string;
    submit_button_text?: string;
    success_message?: string;
}

const PublicContactForm: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [formConfig, setFormConfig] = useState<ContactFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch(`${API_URL}/public/forms/${slug}`)
            .then(r => {
                if (!r.ok) throw new Error('Form not found');
                return r.json();
            })
            .then(data => {
                setFormConfig(data);
                const initial: Record<string, string> = {};
                if (data.fields) {
                    data.fields.forEach((f: FormField) => { initial[f.name] = ''; });
                }
                setFormValues(initial);
                setLoading(false);
            })
            .catch(err => {
                setError('Form not found or unavailable.');
                setLoading(false);
            });
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formConfig) return;

        const payload: Record<string, any> = {
            name: formValues.name || '',
            email: formValues.email || '',
            phone: formValues.phone || '',
            message: formValues.message || '',
            custom_fields: {},
        };

        Object.entries(formValues).forEach(([key, val]) => {
            if (!['name', 'email', 'phone', 'message'].includes(key)) {
                payload.custom_fields[key] = val;
            }
        });

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/public/forms/${slug}/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Submission failed');
            setSubmitted(true);
        } catch {
            alert('Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
        );
    }

    if (error || !formConfig) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-xl font-semibold text-foreground mb-2">Form Not Found</h1>
                    <p className="text-muted-foreground">This form may be inactive or the URL is incorrect.</p>
                    <a 
                        href="/" 
                        className="inline-flex items-center gap-2 text-brand mt-4 hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Homepage
                    </a>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Thank You!</h1>
                    <p className="text-muted-foreground">
                        {formConfig.success_message || "Your form has been submitted successfully. We'll be in touch soon."}
                    </p>
                    <a 
                        href="/" 
                        className="inline-flex items-center gap-2 text-brand mt-6 hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Website
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-lg mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-7 h-7 text-brand" />
                    </div>
                    <h1 className="text-2xl font-bold">{formConfig.name}</h1>
                    {formConfig.description && <p className="text-muted-foreground mt-2">{formConfig.description}</p>}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formConfig.fields?.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium mb-1.5">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground h-28 resize-none"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            ) : field.type === 'select' && field.options ? (
                                <select
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                                >
                                    <option value="">Select...</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> {formConfig.submit_button_text || 'Submit'}</>}
                    </button>
                </form>

                <p className="text-center text-muted-foreground text-xs mt-6">Powered by CareOps</p>
            </div>
        </div>
    );
};

export default PublicContactForm;
