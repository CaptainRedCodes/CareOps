import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle2, Loader2, Send, FileText
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
                // Initialize form values
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

        // Extract standard fields
        const payload: Record<string, any> = {
            name: formValues.name || '',
            email: formValues.email || '',
            phone: formValues.phone || '',
            message: formValues.message || '',
            custom_fields: {},
        };

        // Everything not name/email/phone/message goes to custom_fields
        Object.entries(formValues).forEach(([key, val]) => {
            if (!['name', 'email', 'phone', 'message'].includes(key)) {
                payload.custom_fields[key] = val;
            }
        });

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/public/forms/${slug}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
        );
    }

    if (error || !formConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center text-white">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h1 className="text-xl font-bold mb-2">Form Not Found</h1>
                    <p className="text-gray-500">This form may be inactive or the URL is incorrect.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center text-white">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
                    <p className="text-gray-400">Your form has been submitted successfully. We'll be in touch soon.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
            <div className="max-w-lg mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-7 h-7 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold">{formConfig.name}</h1>
                    {formConfig.description && <p className="text-gray-400 mt-2">{formConfig.description}</p>}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formConfig.fields?.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                {field.label} {field.required && <span className="text-amber-400">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600 h-28 resize-none"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            ) : field.type === 'select' && field.options ? (
                                <select
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50"
                                >
                                    <option value="">Select...</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    value={formValues[field.name] || ''}
                                    onChange={e => setFormValues({ ...formValues, [field.name]: e.target.value })}
                                    required={field.required}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit</>}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-xs mt-6">Powered by CareOps</p>
            </div>
        </div>
    );
};

export default PublicContactForm;
