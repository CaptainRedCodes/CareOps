import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  QrCode,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  Code
} from 'lucide-react';
import api from "@/api/client";

interface FormField {
  id: string;
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
  is_active: boolean;
  welcome_message: string;
  success_message: string;
  submit_button_text: string;
}

export default function FormBuilder() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/forms`);
      setForms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [workspaceId]);

  const handleCreateForm = () => {
    const newForm: ContactForm = {
      id: 'new',
      name: 'New Contact Form',
      slug: '',
      description: '',
      fields: [
        { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
        { id: '3', type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: false }
      ],
      is_active: true,
      welcome_message: 'Thank you for contacting us! We will be in touch shortly.',
      success_message: 'Thank you! Your message has been received.',
      submit_button_text: 'Send Message'
    };
    setSelectedForm(newForm);
    setIsEditing(true);
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;

    try {
      setLoading(true);
      
      if (selectedForm.id === 'new') {
        await api.post(`/workspaces/${workspaceId}/forms`, selectedForm);
      } else {
        await api.put(`/workspaces/${workspaceId}/forms/${selectedForm.id}`, selectedForm);
      }
      
      await fetchForms();
      setIsEditing(false);
      setSelectedForm(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/forms/${formId}`);
      await fetchForms();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete form');
    }
  };

  const addField = () => {
    if (!selectedForm) return;
    
    const newField: FormField = {
      id: Date.now().toString(),
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

  const copyFormUrl = (slug: string) => {
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Form URL copied to clipboard!');
  };

  if (loading && forms.length === 0 && !isEditing) {
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
            <h1 className="text-3xl font-heading font-medium text-foreground">Form Builder</h1>
            <p className="text-muted-foreground mt-1">
              Create custom forms to capture leads from your website or share via link.
            </p>
          </div>
          
          {!isEditing && (
            <button
              onClick={handleCreateForm}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isEditing && selectedForm ? (
          /* Form Editor */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedForm(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Forms
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveForm}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Form
                </button>
              </div>
            </div>

            {/* Form Settings */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">Form Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Form Name</label>
                  <input
                    type="text"
                    value={selectedForm.name}
                    onChange={(e) => setSelectedForm({ ...selectedForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">URL Slug</label>
                  <input
                    type="text"
                    value={selectedForm.slug}
                    onChange={(e) => setSelectedForm({ ...selectedForm, slug: e.target.value })}
                    placeholder="contact-form"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={selectedForm.description}
                  onChange={(e) => setSelectedForm({ ...selectedForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Submit Button Text</label>
                  <input
                    type="text"
                    value={selectedForm.submit_button_text}
                    onChange={(e) => setSelectedForm({ ...selectedForm, submit_button_text: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Success Message</label>
                  <input
                    type="text"
                    value={selectedForm.success_message}
                    onChange={(e) => setSelectedForm({ ...selectedForm, success_message: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Form Fields</h3>
                <button
                  onClick={addField}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
              </div>

              <div className="space-y-4">
                {selectedForm.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-secondary/50 border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(index, 'down')}
                          disabled={index === selectedForm.fields.length - 1}
                          className="p-1 hover:bg-secondary rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Field Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="textarea">Text Area</option>
                            <option value="select">Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded border-border"
                            />
                            <span className="text-sm">Required</span>
                          </label>
                        </div>

                        {field.type === 'select' && (
                          <div className="col-span-2">
                            <label className="block text-xs text-muted-foreground mb-1">Options (comma-separated)</label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                              placeholder="Option 1, Option 2, Option 3"
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeField(field.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Forms List */
          <div className="grid gap-4">
            {forms.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No forms yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first contact form to start capturing leads
                </p>
                <button
                  onClick={handleCreateForm}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Form
                </button>
              </div>
            ) : (
              forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-card border border-border rounded-xl p-6 hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{form.name}</h3>
                        {form.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4">
                        {form.description || 'No description'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {form.fields.length} fields
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <code className="bg-secondary px-2 py-0.5 rounded text-xs">
                          /form/{form.slug}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyFormUrl(form.slug)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      <button
                        onClick={() => setShowQR(showQR === form.id ? null : form.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      <a
                        href={`/form/${form.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </a>
                      
                      <button
                        onClick={() => {
                          setSelectedForm(form);
                          setIsEditing(true);
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Code className="w-4 h-4 text-muted-foreground" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {showQR === form.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          {/* Placeholder for QR code - would use a QR library */}
                          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-gray-400" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">QR Code</p>
                          <p className="text-sm text-muted-foreground mb-3">
                            Scan to open the form on mobile devices
                          </p>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/form/${form.slug}`;
                              // Would download QR code image
                              alert(`QR Code URL: ${url}`);
                            }}
                            className="text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            Download QR Code
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
