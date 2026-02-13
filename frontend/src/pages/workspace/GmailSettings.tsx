import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Loader2,
  Send,
  Inbox
} from 'lucide-react';
import api from "@/api/client";

interface GmailStatus {
  connected: boolean;
  email: string | null;
  sync_enabled: boolean;
  last_sync: string | null;
}

export default function GmailSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/gmail/status`);
      setStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load Gmail status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [workspaceId]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === workspaceId) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [workspaceId]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await api.get(`/workspaces/${workspaceId}/gmail/auth-url`);
      // Redirect to Google OAuth
      window.location.href = response.data.auth_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initiate connection');
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setConnecting(true);
      await api.post(`/workspaces/${workspaceId}/gmail/connect?code=${code}`);
      await fetchStatus();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect Gmail');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/workspaces/${workspaceId}/gmail/disconnect`);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disconnect Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await api.post(`/workspaces/${workspaceId}/gmail/sync`);
      alert(response.data.message);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateSettings = async (syncEnabled: boolean) => {
    try {
      await api.patch(`/workspaces/${workspaceId}/gmail/settings`, {
        sync_enabled: syncEnabled
      });
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update settings');
    }
  };

  if (loading && !status) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-medium text-foreground">Email Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Gmail account to receive and send emails directly from the platform.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status?.connected 
                  ? 'bg-green-500/10' 
                  : 'bg-gray-500/10'
              }`}>
                <Mail className={`w-6 h-6 ${
                  status?.connected ? 'text-green-500' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {status?.connected ? 'Gmail Connected' : 'Gmail Not Connected'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {status?.connected 
                    ? `Receiving emails at: ${status.email}`
                    : 'Connect your Gmail to receive customer emails in the inbox'
                  }
                </p>
              </div>
            </div>

            {status?.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Connect Gmail
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Settings */}
        {status?.connected && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-6">Email Settings</h3>
            
            <div className="space-y-4">
              {/* Sync Setting */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Auto-Sync Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically check for new emails and add them to conversations
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateSettings(!status.sync_enabled)}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    status.sync_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                    status.sync_enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Manual Sync */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Manual Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Last synced: {status.last_sync 
                      ? new Date(status.last_sync).toLocaleString() 
                      : 'Never'}
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">How Email Integration Works</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Customer emails sent to your Gmail address appear in your Inbox</li>
                <li>• New contacts are automatically created from email addresses</li>
                <li>• Email threads are tracked as conversations</li>
                <li>• All emails are sent FROM your connected Gmail address</li>
                <li>• Welcome messages are sent automatically to new contacts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Inbox className="w-5 h-5 text-brand" />
              <h3 className="font-medium">Receive Emails</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              All incoming emails to your Gmail address are automatically imported and organized by contact.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Send className="w-5 h-5 text-brand" />
              <h3 className="font-medium">Send Emails</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Reply to customers directly from the platform. All emails are sent FROM your Gmail address.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
