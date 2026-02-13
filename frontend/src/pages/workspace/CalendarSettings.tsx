import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from "@/api/client";

interface CalendarStatus {
  connected: boolean;
  calendar_id: string | null;
  sync_enabled: boolean;
  check_conflicts: boolean;
}

export default function CalendarSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/calendar/status`);
      setStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load calendar status');
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
      const response = await api.get(`/workspaces/${workspaceId}/calendar/auth-url`);
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
      await api.post(`/workspaces/${workspaceId}/calendar/connect?code=${code}`);
      await fetchStatus();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect calendar');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/workspaces/${workspaceId}/calendar/disconnect`);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disconnect calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<CalendarStatus>) => {
    try {
      await api.patch(`/workspaces/${workspaceId}/calendar/settings`, updates);
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
          <h1 className="text-3xl font-heading font-medium text-foreground">Calendar Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Google Calendar to sync bookings and check availability.
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
                <Calendar className={`w-6 h-6 ${
                  status?.connected ? 'text-green-500' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {status?.connected ? 'Google Calendar Connected' : 'Google Calendar Not Connected'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {status?.connected 
                    ? `Connected to: ${status.calendar_id || 'Primary Calendar'}`
                    : 'Connect your calendar to sync bookings and prevent double-booking'
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
                    Connect Google Calendar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Settings */}
        {status?.connected && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Calendar Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Sync Bookings */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Sync Bookings to Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically create events in your Google Calendar when bookings are made
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ sync_enabled: !status.sync_enabled })}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    status.sync_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                    status.sync_enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Check Conflicts */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Check Calendar Conflicts</p>
                  <p className="text-sm text-muted-foreground">
                    Prevent customers from booking times that conflict with existing calendar events
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ check_conflicts: !status.check_conflicts })}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    status.check_conflicts ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                    status.check_conflicts ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">How it works</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Customers can only book times that are free on your Google Calendar</li>
                <li>• New bookings automatically appear in your Google Calendar</li>
                <li>• Booking details include customer name, contact info, and notes</li>
                <li>• Location details are included based on the service type</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
