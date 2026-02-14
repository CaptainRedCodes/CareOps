import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Webhook,
  FileText,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '@/api/client';
import config from '@/config';

interface ThirdPartyForm {
  id: string;
  name: string;
  source: string;
  webhook_url: string;
  is_active: boolean;
  submissions_count: number;
  last_submission: string | null;
  created_at: string;
}

const FORM_PROVIDERS = [
  { id: 'typeform', name: 'Typeform', logo: '📝', description: 'Create beautiful forms and surveys', coming_soon: true },
  { id: 'jotform', name: 'JotForm', logo: '📋', description: 'Build forms with a drag-and-drop builder', coming_soon: true },
  { id: 'google', name: 'Google Forms', logo: '📄', description: 'Simple forms integrated with Google', coming_soon: true },
  { id: 'hubspot', name: 'HubSpot Forms', logo: '🧡', description: 'Marketing automation forms', coming_soon: true },
  { id: 'calendly', name: 'Calendly', logo: '📅', description: 'Scheduling forms and meetings', coming_soon: true },
  { id: 'custom', name: 'Custom / Other', logo: '⚙️', description: 'Any other form provider', coming_soon: false },
];

export default function ThirdPartyForms() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [forms, setForms] = useState<ThirdPartyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const webhookBaseUrl = `${config.apiUrl}/public/webhooks/form/${workspaceId}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const getProviderInfo = (source: string) => {
    return FORM_PROVIDERS.find(p => p.id === source) || { 
      id: 'custom', 
      name: source, 
      logo: '📋', 
      description: 'Custom integration' 
    };
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-medium text-foreground">Third-Party Forms</h1>
          <p className="text-muted-foreground mt-1">
            Connect forms from Typeform, JotForm, Google Forms, and more to capture leads.
          </p>
        </div>

        {/* Webhook URL Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Your Webhook URL</h2>
              <p className="text-sm text-muted-foreground">Send form submissions to this URL</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
            <code className="flex-1 text-sm text-muted-foreground break-all">
              {webhookBaseUrl}
            </code>
            <button
              onClick={() => copyToClipboard(webhookBaseUrl, 'webhook-url')}
              className="p-2 hover:bg-secondary/80 rounded-lg transition-colors flex-shrink-0"
              title="Copy URL"
            >
              {showCopied === 'webhook-url' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Connect a Form Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORM_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => !provider.coming_soon && setSelectedProvider(provider.id)}
                disabled={provider.coming_soon}
                className={`p-4 border rounded-xl text-left transition-colors ${
                  provider.coming_soon 
                    ? 'border-border bg-secondary/30 opacity-60 cursor-not-allowed'
                    : selectedProvider === provider.id 
                      ? 'border-brand bg-brand/5' 
                      : 'border-border hover:border-brand/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">{provider.logo}</div>
                  {provider.coming_soon && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="font-medium">{provider.name}</h3>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Integration Guide */}
        {selectedProvider && !FORM_PROVIDERS.find(p => p.id === selectedProvider)?.coming_soon && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">
                Integration Guide: {getProviderInfo(selectedProvider).name}
              </h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium mb-1">Get your webhook URL</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copy your unique webhook URL above
                  </p>
                  <div className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                    <code className="text-sm flex-1 break-all">{webhookBaseUrl}</code>
                    <button
                      onClick={() => copyToClipboard(webhookBaseUrl, 'step1')}
                      className="p-1.5 hover:bg-secondary/80 rounded"
                    >
                      {showCopied === 'step1' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium mb-1">Configure your form provider</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to your form provider's settings and add a webhook. Map the fields to this format:
                  </p>
                </div>
              </div>

              {/* Payload Example */}
              <div className="bg-secondary rounded-lg p-4 ml-12">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Example Payload</span>
                  <button
                    onClick={() => copyToClipboard(EXAMPLE_PAYLOAD, 'payload')}
                    className="p-1 hover:bg-secondary/80 rounded"
                  >
                    {showCopied === 'payload' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {EXAMPLE_PAYLOAD}
                </pre>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium mb-1">Test your integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a test entry from your form. It should appear in your inbox as a new contact.
                  </p>
                </div>
              </div>

              {/* Provider-specific tips */}
              {selectedProvider === 'typeform' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 ml-12">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Typeform Tip</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    In Typeform, use Logic Jump to map fields to the webhook payload, or use their 
                    Webhook integration with a transformation rule.
                  </p>
                </div>
              )}

              {selectedProvider === 'jotform' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 ml-12">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">JotForm Tip</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    In JotForm, go to Settings → Webhooks and add your webhook URL. 
                    Use the "Map Fields" feature to send data in the correct format.
                  </p>
                </div>
              )}

              {selectedProvider === 'google' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 ml-12">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Google Forms Tip</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Google Forms doesn't have native webhooks. Use Zapier or Make (Integromat) 
                    to forward submissions to this webhook URL.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        {!selectedProvider && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Quick Reference</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  JSON Payload Format
                </h3>
                <div className="bg-secondary rounded-lg p-4">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
{`{
  "source": "your_provider",
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "form_data": {
    "any_field": "any_value"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Simple Form (Query Parameters)
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  For simple integrations, you can also use query parameters:
                </p>
                <code className="text-xs bg-secondary px-2 py-1 rounded">
                  POST {webhookBaseUrl}/simple?name=John&email=john@example.com
                </code>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Field Requirements
                </h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>contact.name</strong> - Required</li>
                  <li><strong>contact.email</strong> OR <strong>contact.phone</strong> - At least one required</li>
                  <li>All other fields in <strong>form_data</strong> are stored as custom fields</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const EXAMPLE_PAYLOAD = `{
  "source": "typeform",
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "form_data": {
    "service_interest": "Consultation",
    "budget": "$1000-5000",
    "message": "I'm interested in your services"
  }
}`;
