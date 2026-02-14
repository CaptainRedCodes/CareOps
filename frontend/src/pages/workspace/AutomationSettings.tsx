import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  GripVertical
} from 'lucide-react';
import api from '@/api/client';

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  event_type: string;
  is_active: boolean;
  priority: number;
  action_type: string;
  action_config: Record<string, any>;
  stop_on_reply: boolean;
}

const EVENT_OPTIONS = [
  { value: 'contact.created', label: 'New Contact', description: 'When a new contact is added' },
  { value: 'booking.created', label: 'Booking Created', description: 'When a booking is made' },
  { value: 'form.completed', label: 'Form Completed', description: 'When a form is completed' },
  { value: 'inventory.updated', label: 'Inventory Updated', description: 'When inventory is updated' },
  { value: 'inventory.low', label: 'Inventory Low', description: 'When stock falls below threshold' },
  { value: 'staff.replied', label: 'Staff Replied', description: 'When staff replies to a contact' },
];

const ACTION_OPTIONS = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
];

const AutomationSettings: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'contact.created',
    action_type: 'send_email',
    subject: '',
    message: '',
    stop_on_reply: false,
  });

  useEffect(() => {
    loadRules();
  }, [workspaceId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workspaces/${workspaceId}/automation/rules`);
      setRules(response.data);
    } catch (err) {
      console.error('Failed to load automation rules', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        event_type: formData.event_type,
        action_type: formData.action_type,
        action_config: {
          subject: formData.subject,
          message: formData.message,
        },
        stop_on_reply: formData.stop_on_reply,
        priority: 0,
      };

      if (editingRule) {
        await api.put(`/workspaces/${workspaceId}/automation/rules/${editingRule.id}`, payload);
      } else {
        await api.post(`/workspaces/${workspaceId}/automation/rules`, payload);
      }

      setShowModal(false);
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        event_type: 'contact.created',
        action_type: 'send_email',
        subject: '',
        message: '',
        stop_on_reply: false,
      });
      loadRules();
    } catch (err) {
      console.error('Failed to save rule', err);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/automation/rules/${ruleId}`);
      loadRules();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await api.put(`/workspaces/${workspaceId}/automation/rules/${rule.id}`, {
        is_active: !rule.is_active,
      });
      loadRules();
    } catch (err) {
      console.error('Failed to toggle rule', err);
    }
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      event_type: rule.event_type,
      action_type: rule.action_type,
      subject: rule.action_config?.subject || '',
      message: rule.action_config?.message || '',
      stop_on_reply: rule.stop_on_reply,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      event_type: 'contact.created',
      action_type: 'send_email',
      subject: '',
      message: '',
      stop_on_reply: false,
    });
    setShowModal(true);
  };

  const getEventLabel = (eventType: string) => {
    return EVENT_OPTIONS.find(e => e.value === eventType)?.label || eventType;
  };

  const getActionLabel = (actionType: string) => {
    return ACTION_OPTIONS.find(a => a.value === actionType)?.label || actionType;
  };

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-medium text-foreground">Automation</h1>
            <p className="text-muted-foreground mt-1">
              Configure automated messages for events in your workspace.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300">Event-Based Automation</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Automation rules are triggered by events. When an event occurs (like a new contact or booking), 
                the system automatically sends configured messages. Staff replies pause automation for that contact.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No automation rules</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first automation rule to send automatic messages.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`bg-card border rounded-xl p-6 transition-all ${
                  rule.is_active ? 'border-border' : 'border-muted opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rule.is_active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Zap className={`w-5 h-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{rule.name}</h3>
                        {rule.is_active ? (
                          <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs px-2 py-0.5 rounded-full">
                            <Play className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                            <Pause className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          <span className="font-medium">Trigger:</span> {getEventLabel(rule.event_type)}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="font-medium">Action:</span> {getActionLabel(rule.action_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.is_active
                          ? 'hover:bg-yellow-500/10 text-yellow-600'
                          : 'hover:bg-green-500/10 text-green-600'
                      }`}
                      title={rule.is_active ? 'Disable' : 'Enable'}
                    >
                      {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-heading font-medium">
                  {editingRule ? 'Edit Automation Rule' : 'New Automation Rule'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Rule Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g., Welcome New Contacts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">When this happens (Trigger) *</label>
                  <select
                    value={formData.event_type}
                    onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {EVENT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {EVENT_OPTIONS.find(e => e.value === formData.event_type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Do this (Action) *</label>
                  <select
                    value={formData.action_type}
                    onChange={e => setFormData({ ...formData, action_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ACTION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.action_type === 'send_email' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="e.g., Welcome to our business!"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Enter the message to send..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{service}}'}, {'{{date}}'}, {'{{time}}'} as placeholders
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stop_on_reply"
                    checked={formData.stop_on_reply}
                    onChange={e => setFormData({ ...formData, stop_on_reply: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="stop_on_reply" className="text-sm text-foreground">
                    Pause automation when staff replies
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.message}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AutomationSettings;
