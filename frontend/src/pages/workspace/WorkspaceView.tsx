import { useEffect, useState } from "react";
import { 
  Calendar, MessageSquare, FileText, Package, AlertCircle, 
  TrendingUp, TrendingDown, Users, CheckCircle, XCircle, 
  Clock, ArrowUpRight, MoreHorizontal, Filter, RefreshCw,
  UserPlus, Settings, Sparkles
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import InviteStaffModal from "@/pages/workspace/InviteStaff";
import IntegrationsModal from "@/components/settings/Integration";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

interface DashboardData {
  today_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  no_show_bookings: number;
  cancelled_bookings: number;
  new_inquiries: number;
  ongoing_conversations: number;
  unread_messages: number;
  pending_forms: number;
  overdue_forms: number;
  completed_forms: number;
  low_stock_items: number;
  critical_stock_items: number;
  missed_messages: number;
  overdue_forms_count: number;
  unconfirmed_bookings: number;
  low_inventory_count: number;
  today_bookings_list: Array<{
    id: string;
    start_time: string;
    status: string;
    readiness_status: string;
    contact_name: string;
    booking_type_name: string;
  }>;
  upcoming_bookings_list: Array<{
    id: string;
    start_time: string;
    status: string;
    readiness_status: string;
    contact_name: string;
    booking_type_name: string;
  }>;
  low_stock_items_list: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
  }>;
  overdue_forms_list: Array<{
    id: string;
    form_name: string;
    contact_name: string;
    booking_time: string;
    pending_since: string;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    count: number;
    message: string;
    action_url: string;
  }>;
}

const COLORS = {
  primary: "#5046E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#0EA5E9",
  muted: "#78716C",
};

const PIE_COLORS = ["#5046E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];

export default function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days">("7days");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isActivated, setIsActivated] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardRes, workspaceRes, activationRes] = await Promise.all([
          api.get(`/workspaces/${workspaceId}/dashboard/summary`),
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/workspaces/${workspaceId}/activation-status`)
        ]);
        setDashboard(dashboardRes.data);
        setWorkspaceName(workspaceRes.data.business_name);
        setIsActivated(activationRes.data.is_activated);
      } catch (err: any) {
        console.error("Failed to fetch dashboard", err);
        setError(err.response?.data?.detail || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchDashboard();
    }
  }, [workspaceId]);

  const refreshData = () => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get(`/workspaces/${workspaceId}/dashboard/summary`);
        setDashboard(res.data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard", err);
      }
    };
    fetchDashboard();
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return { day: "", month: "" };
    const date = new Date(isoString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    };
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const bookingStatusData = dashboard ? [
    { name: "Completed", value: dashboard.completed_bookings },
    { name: "Scheduled", value: dashboard.upcoming_bookings },
    { name: "No-Show", value: dashboard.no_show_bookings },
    { name: "Cancelled", value: dashboard.cancelled_bookings },
  ] : [];

  const formStatusData = dashboard ? [
    { name: "Completed", value: dashboard.completed_forms },
    { name: "Pending", value: dashboard.pending_forms },
    { name: "Overdue", value: dashboard.overdue_forms },
  ] : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h3 className="text-lg font-medium text-destructive">Error loading dashboard</h3>
          <p className="text-destructive/80 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const alerts = dashboard?.alerts || [];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Activation Banner */}
      {!loading && !isActivated && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Complete your workspace setup</h3>
                <p className="text-sm text-muted-foreground">Finish the setup wizard to start receiving bookings</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/workspace/${workspaceId}/setup`)}>
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your business performance</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(true)}
                className="h-9 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Staff
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIntegrationsOpen(true)}
                className="h-9 gap-2"
              >
                <Settings className="h-4 w-4" />
                Integrations
              </Button>
            </>
          )}
          <div className="flex bg-card rounded-lg border border-border p-1">
            {(["today", "7days", "30days"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {range === "today" ? "Today" : range === "7days" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
          <button 
            onClick={refreshData}
            className="p-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Key Alerts ({alerts.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                to={alert.action_url}
                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                  alert.severity === "high" 
                    ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" 
                    : "bg-amber-50 border-amber-200 hover:border-amber-300"
                }`}
              >
                <p className={`text-sm font-medium ${alert.severity === "high" ? "text-destructive" : "text-amber-700"}`}>
                  {alert.message}
                </p>
                <span className={`text-xs mt-1 block ${alert.severity === "high" ? "text-destructive/70" : "text-amber-600"}`}>
                  Click to view →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Today's Bookings"
          value={dashboard?.today_bookings || 0}
          icon={Calendar}
          color={COLORS.primary}
          trend={12}
        />
        <KPICard
          title="Upcoming"
          value={dashboard?.upcoming_bookings || 0}
          icon={ArrowUpRight}
          color={COLORS.info}
          trend={8}
        />
        <KPICard
          title="Completed"
          value={dashboard?.completed_bookings || 0}
          icon={CheckCircle}
          color={COLORS.success}
          trend={15}
        />
        <KPICard
          title="No-Shows"
          value={dashboard?.no_show_bookings || 0}
          icon={XCircle}
          color={COLORS.danger}
          trend={-5}
        />
        <KPICard
          title="Pending Forms"
          value={dashboard?.pending_forms || 0}
          icon={FileText}
          color={COLORS.warning}
        />
        <KPICard
          title="Unread Messages"
          value={dashboard?.unread_messages || 0}
          icon={MessageSquare}
          color={COLORS.muted}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Status Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Booking Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #E7E5E4",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {bookingStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forms Status Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Forms Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {formStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #E7E5E4",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {formStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations & Inventory Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversations */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leads & Conversations</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <Users className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{dashboard?.new_inquiries || 0}</p>
              <p className="text-xs text-muted-foreground">New Inquiries</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{dashboard?.ongoing_conversations || 0}</p>
              <p className="text-xs text-muted-foreground">Ongoing</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{dashboard?.missed_messages || 0}</p>
              <p className="text-xs text-muted-foreground">Needs Reply</p>
            </div>
          </div>
          <Link 
            to={`/workspace/${workspaceId}/communication`}
            className="mt-4 block text-center text-sm text-primary hover:text-primary/80"
          >
            View Inbox →
          </Link>
        </div>

        {/* Inventory */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Inventory Alerts</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <Package className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{dashboard?.low_stock_items || 0}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
            <div className="text-center p-4 bg-destructive/5 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{dashboard?.critical_stock_items || 0}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </div>
          {dashboard?.low_stock_items_list && dashboard.low_stock_items_list.length > 0 ? (
            <div className="space-y-2">
              {dashboard.low_stock_items_list.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className={`text-sm font-medium ${item.quantity === 0 ? "text-destructive" : "text-amber-600"}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">All stock levels OK</p>
          )}
          <Link 
            to={`/workspace/${workspaceId}/inventory`}
            className="mt-4 block text-center text-sm text-primary hover:text-primary/80"
          >
            View Inventory →
          </Link>
        </div>
      </div>

      {/* Today's Bookings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Today's Bookings</h3>
          <Link 
            to={`/workspace/${workspaceId}/bookings`}
            className="text-sm text-primary hover:text-primary/80"
          >
            View All →
          </Link>
        </div>
        {dashboard?.today_bookings_list && dashboard.today_bookings_list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dashboard.today_bookings_list.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">
                      {formatTime(booking.start_time)}
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">{booking.contact_name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{booking.booking_type_name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No bookings scheduled for today
          </div>
        )}
      </div>

      {/* Overdue Forms */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Overdue Forms</h3>
          <Link 
            to={`/workspace/${workspaceId}/forms`}
            className="text-sm text-primary hover:text-primary/80"
          >
            View All →
          </Link>
        </div>
        {dashboard?.overdue_forms_list && dashboard.overdue_forms_list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Form</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pending Since</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dashboard.overdue_forms_list.slice(0, 5).map((form) => (
                  <tr key={form.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">{form.form_name}</td>
                    <td className="px-5 py-3 text-sm text-foreground">{form.contact_name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {formatDateTime(form.pending_since)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        Overdue
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No overdue forms
          </div>
        )}
      </div>

      {/* Invite Staff Modal */}
      {workspaceId && (
        <InviteStaffModal
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            console.log("Staff invitation sent successfully");
          }}
        />
      )}

      {/* Integrations Modal */}
      {workspaceId && (
        <IntegrationsModal
          workspaceId={workspaceId}
          isOpen={integrationsOpen}
          onClose={() => setIntegrationsOpen(false)}
        />
      )}
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  trend 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
  trend?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    no_show: "bg-red-100 text-red-700 border-red-200",
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.cancelled}`}>
      {status}
    </span>
  );
}
