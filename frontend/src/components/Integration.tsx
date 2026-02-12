import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/api/client";
import { Mail, MessageSquare, Trash2 } from "lucide-react";

interface Integration {
  id: string;
  channel: "email" | "sms";
  provider: string;
  is_active: boolean;
}

interface Props {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationsModal({ workspaceId, isOpen, onClose }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [provider, setProvider] = useState("gmail");

  const [config, setConfig] = useState<any>({
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    email: "",
    app_password: "",
    from_email: "Admin <no-reply@yourapp.com>",
  });

  const fetchIntegrations = async () => {
    setLoading(true);
    console.log("Fetching integrations for workspace:", workspaceId);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/integrations`);
      setIntegrations(res.data);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchIntegrations();
  }, [isOpen, workspaceId]);

  const handleAddIntegration = async () => {
    setAdding(true);
    try {
      await api.post(`/workspaces/${workspaceId}/integrations`, {
        channel,
        provider,
        config,
      });
      resetForm();
      fetchIntegrations();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add integration");
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setChannel("email");
    setProvider("gmail");
    setConfig({
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      email: "",
      app_password: "",
      from_email: "Admin <no-reply@yourapp.com>",
    });
  };

  const handleRemove = async (integrationId: string) => {
    if (!confirm("Remove this integration?")) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/integrations/${integrationId}`);
      fetchIntegrations();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Cannot remove integration");
    }
  };

  const renderConfigFields = () => {
    if (channel === "email") {
      return (
        <div className="space-y-2">
          <Input
            placeholder="SMTP Host"
            value={config.smtp_host}
            onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
          />
          <Input
            placeholder="SMTP Port"
            type="number"
            value={config.smtp_port}
            onChange={(e) =>
              setConfig({ ...config, smtp_port: Number(e.target.value) })
            }
          />
          <Input
            placeholder="Gmail address"
            value={config.email}
            onChange={(e) => setConfig({ ...config, email: e.target.value })}
          />
          <Input
            placeholder="Gmail App Password"
            type="password"
            value={config.app_password}
            onChange={(e) => setConfig({ ...config, app_password: e.target.value })}
          />
          <Input
            placeholder="From name (optional, e.g., Admin <no-reply@yourapp.com>)"
            value={config.from_email}
            onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
          />
        </div>
      );
    }

    if (channel === "sms") {
      return (
        <div className="space-y-2">
          <Input
            placeholder="Twilio Account SID"
            value={config.account_sid || ""}
            onChange={(e) =>
              setConfig({ ...config, account_sid: e.target.value })
            }
          />
          <Input
            placeholder="Twilio Auth Token"
            type="password"
            value={config.auth_token || ""}
            onChange={(e) =>
              setConfig({ ...config, auth_token: e.target.value })
            }
          />
          <Input
            placeholder="Twilio From Number (e.g., +1415XXXXXXX)"
            value={config.from_number || ""}
            onChange={(e) =>
              setConfig({ ...config, from_number: e.target.value })
            }
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Communication Integrations</DialogTitle>
        </DialogHeader>

        {/* Existing Integrations */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading integrations…</p>
        ) : integrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No integrations yet. Add at least one to activate Inbox.
          </p>
        ) : (
          <div className="space-y-3">
            {integrations.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {i.channel === "email" ? (
                    <Mail className="h-5 w-5 text-brand" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-brand" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{i.channel}</p>
                    <p className="text-xs text-muted-foreground">{i.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={i.is_active ? "default" : "secondary"}>
                    {i.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(i.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Integration */}
        <div className="mt-6 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add Integration</p>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={channel}
              onChange={(e) => {
                const value = e.target.value as "email" | "sms";
                setChannel(value);
                if (value === "email") {
                  setProvider("gmail");
                  setConfig({
                    smtp_host: "smtp.gmail.com",
                    smtp_port: 587,
                    email: "",
                    app_password: "",
                    from_email: "Admin <no-reply@yourapp.com>",
                  });
                } else {
                  setProvider("twilio");
                  setConfig({
                    account_sid: "",
                    auth_token: "",
                    from_number: "",
                  });
                }
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {channel === "email" && <option value="gmail">Gmail (SMTP)</option>}
              {channel === "sms" && <option value="twilio">Twilio</option>}
            </select>
          </div>

          {renderConfigFields()}

          <Button
            onClick={handleAddIntegration}
            disabled={adding}
            className="w-full bg-brand text-white hover:bg-brand-hover"
          >
            {adding ? "Connecting…" : "Connect Channel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}