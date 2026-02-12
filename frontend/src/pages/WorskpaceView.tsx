
import { LayoutDashboard, Users, Calendar, MessageSquare, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const stats = [
    { label: "Total Revenue", value: "$12,450", change: "+12%", icon: ArrowUpRight },
    { label: "Active Bookings", value: "24", change: "+4", icon: Calendar },
    { label: "New Leads", value: "18", change: "+8", icon: Users },
    { label: "Unread Messages", value: "5", change: "-2", icon: MessageSquare },
  ];

  return (
    <div className="p-8 stagger-in">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-medium text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your workspace activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-heading font-semibold text-foreground mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Placeholder */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-80">
          <h3 className="text-lg font-heading font-medium mb-4">Recent Activity</h3>
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Activity feed coming soon...
          </div>
        </div>

        {/* Upcoming Bookings Placeholder */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-heading font-medium">Upcoming Bookings</h3>
            <Link to={`/workspace/${workspaceId}/bookings`} className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer">
              <div className="w-12 h-12 bg-secondary rounded-lg flex flex-col items-center justify-center text-xs font-medium border border-border">
                <span className="text-muted-foreground">FEB</span>
                <span className="text-foreground text-lg">14</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Sarah Williams</h4>
                <p className="text-xs text-muted-foreground">Initial Consultation • 10:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer">
              <div className="w-12 h-12 bg-secondary rounded-lg flex flex-col items-center justify-center text-xs font-medium border border-border">
                <span className="text-muted-foreground">FEB</span>
                <span className="text-foreground text-lg">14</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Michael Brown</h4>
                <p className="text-xs text-muted-foreground">Full Assessment • 2:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
