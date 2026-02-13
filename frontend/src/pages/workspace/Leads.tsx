import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Filter,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from "@/api/client";

interface Lead {
  id: string;
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  submitted_at: string;
  estimated_value: string | null;
  assigned_to: {
    full_name: string;
  } | null;
}

interface LeadStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
  conversion_rate: number;
}

export default function Leads() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', '20');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const [leadsRes, statsRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/leads?${params}`),
        api.get(`/workspaces/${workspaceId}/leads/stats`)
      ]);
      
      setLeads(leadsRes.data.leads);
      setTotalPages(Math.ceil(leadsRes.data.total / 20));
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [workspaceId, page, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-purple-100 text-purple-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && leads.length === 0) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-medium text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage potential customers from form submissions.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{stats.total_leads}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">New</span>
                <AlertCircle className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.new_leads}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Contacted</span>
                <Phone className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.contacted_leads}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Qualified</span>
                <UserCheck className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.qualified_leads}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Converted</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.converted_leads}</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Rate</span>
                <TrendingUp className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl font-bold">{stats.conversion_rate}%</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLeads()}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Submitted</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Value</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Assigned</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No leads found</p>
                    <p className="text-sm mt-1">Form submissions will appear here</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{lead.contact.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {lead.contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lead.contact.email}
                            </span>
                          )}
                          {lead.contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm capitalize">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lead.submitted_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {lead.estimated_value || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {lead.assigned_to?.full_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-secondary rounded">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
