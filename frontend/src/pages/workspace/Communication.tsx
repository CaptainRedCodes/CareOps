import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    MessageSquare,
    Search,
    MoreVertical,
    Phone,
    Video,
    Send,
    Paperclip,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    Mail,
    MessageCircle
} from 'lucide-react';
import api from '@/api/client';

// Updated Types based on backend schemas
interface Contact {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    workspace_id: string;
    created_at: string;
}

interface Conversation {
    conversation_id: string;
    contact_id: string;
    workspace_id?: string;
    status: 'active' | 'closed' | 'waiting';
    automation_paused: boolean;
    last_message_at: string;
    created_at?: string;
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    last_message_from?: string;
    last_message_preview?: string;
    unread_count?: number;
}

interface Message {
    id: string;
    conversation_id: string;
    channel: 'email' | 'sms';
    direction: 'inbound' | 'outbound';
    body: string;
    subject?: string;
    sender?: string;
    recipient?: string;
    created_at: string;
    sent_by_staff: boolean;
    automated: boolean;
}

const Communication: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { user } = useAuth();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms'>('email');
    const [emailSubject, setEmailSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch inbox (all conversations)
    useEffect(() => {
        if (workspaceId) {
            fetchInbox();
        }
    }, [workspaceId, statusFilter]);

    // Fetch messages when conversation is selected
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.conversation_id);
            // Auto-detect channel based on contact info
            if (activeConversation.contact_email) {
                setSelectedChannel('email');
            } else if (activeConversation.contact_phone) {
                setSelectedChannel('sms');
            }
        }
    }, [activeConversation]);

    const fetchInbox = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { status: statusFilter } : {};
            const response = await api.get(`/workspaces/${workspaceId}/conversations/inbox`, { params });
            setConversations(response.data);
        } catch (error) {
            console.error('Error fetching inbox:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await api.get(`/workspaces/${workspaceId}/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConversation) return;

        try {
        const payload = {
                body: messageInput,
                channel: selectedChannel,
                ...(selectedChannel === 'email' && emailSubject ? { subject: emailSubject } : {})
            };

            const response = await api.post(
                `/workspaces/${workspaceId}/conversations/${activeConversation.conversation_id}/reply`,
                payload
            );

            // Add new message to the list
            setMessages([...messages, response.data]);
            setMessageInput('');
            setEmailSubject('');
            
            // Refresh inbox to update last message time
            fetchInbox();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleCloseConversation = async () => {
        if (!activeConversation) return;

        try {
            await api.patch(`/workspaces/${workspaceId}/conversations/${activeConversation.conversation_id}/close`);
            setActiveConversation({ ...activeConversation, status: 'closed' });
            fetchInbox();
        } catch (error) {
            console.error('Error closing conversation:', error);
        }
    };

    const handleReopenConversation = async () => {
        if (!activeConversation) return;

        try {
            await api.patch(`/workspaces/${workspaceId}/conversations/${activeConversation.conversation_id}/reopen`);
            setActiveConversation({ ...activeConversation, status: 'active' });
            fetchInbox();
        } catch (error) {
            console.error('Error reopening conversation:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'waiting': return 'bg-yellow-100 text-yellow-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
            conv.contact_name?.toLowerCase().includes(searchLower) ||
            conv.contact_email?.toLowerCase().includes(searchLower) ||
            conv.contact_phone?.includes(searchQuery)
        );
    });

    const canSendEmail = activeConversation?.contact_email;
    const canSendSMS = activeConversation?.contact_phone;

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Conversations List */}
                <div className="w-80 border-r border-border bg-card flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-heading font-semibold mb-4">Inbox</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-secondary/50 rounded-md border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none"
                            />
                        </div>

                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                            {['All', 'Active', 'Waiting', 'Closed'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setStatusFilter(filter === 'All' ? null : filter.toLowerCase())}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                        (filter === 'All' && !statusFilter) || statusFilter === filter.toLowerCase()
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.conversation_id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`p-4 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${
                                        activeConversation?.id === conv.id
                                            ? 'bg-primary/5 border-l-4 border-l-primary'
                                            : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium text-sm ${
                                            conv.unread_count ? 'text-foreground font-semibold' : 'text-foreground/80'
                                        }`}>
                                            {conv.contact_name || 'Unknown Contact'}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTime(conv.last_message_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                        {conv.contact_email || conv.contact_phone || 'No contact info'}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${getStatusColor(conv.status)}`}>
                                            {conv.status}
                                        </span>
                                        {conv.automation_paused && (
                                            <span className="text-[10px] text-orange-600 font-medium">Manual</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content - Chat Area */}
                {activeConversation ? (
                    <div className="flex-1 flex flex-col bg-background relative">
                        {/* Chat Header */}
                        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {activeConversation.contact_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {activeConversation.contact_name || 'Unknown'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {activeConversation.contact_email || activeConversation.contact_phone || 'No contact info'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Channel Selector */}
                                <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
                                    {canSendEmail && (
                                        <button
                                            onClick={() => setSelectedChannel('email')}
                                            className={`p-2 rounded transition-colors ${
                                                selectedChannel === 'email'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                            title="Send via Email"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canSendSMS && (
                                        <button
                                            onClick={() => setSelectedChannel('sms')}
                                            className={`p-2 rounded transition-colors ${
                                                selectedChannel === 'sms'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                            title="Send via SMS"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="h-6 w-px bg-border mx-2"></div>
                                <button className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 dot-grid">
                            {messages.map((message, index) => {
                                const showDate = index === 0 || 
                                    new Date(messages[index - 1].created_at).toDateString() !== 
                                    new Date(message.created_at).toDateString();

                                return (
                                    <React.Fragment key={message.id}>
                                        {showDate && (
                                            <div className="flex justify-center my-4">
                                                <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                                    {new Date(message.created_at).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                                message.direction === 'outbound'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-card text-foreground border border-border rounded-tl-none'
                                            }`}>
                                                {message.subject && (
                                                    <p className="font-semibold mb-1 text-xs opacity-80">
                                                        {message.subject}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap">{message.body}</p>
                                                <div className={`text-[10px] mt-1 flex items-center gap-2 justify-end ${
                                                    message.direction === 'outbound'
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                }`}>
                                                    <span>
                                                        {new Date(message.created_at).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {message.channel === 'email' ? (
                                                        <Mail className="w-3 h-3" />
                                                    ) : (
                                                        <MessageCircle className="w-3 h-3" />
                                                    )}
                                                    {message.automated && (
                                                        <span className="text-[9px]">(auto)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-card border-t border-border">
                            {selectedChannel === 'email' && (
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Email subject..."
                                    className="w-full mb-2 px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all text-sm outline-none"
                                />
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-secondary/30 p-2 rounded-xl border border-border/50 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10 transition-all input-glow">
                                <textarea
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Type ${selectedChannel === 'email' ? 'email' : 'SMS'} message...`}
                                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[2.5rem] py-2 text-sm outline-none"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || (!canSendEmail && !canSendSMS)}
                                    className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors btn-glow"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-xs text-muted-foreground mt-2">
                                Sending via {selectedChannel === 'email' ? 'Email' : 'SMS'}
                                {activeConversation.automation_paused && (
                                    <span className="text-orange-600 ml-2">• Automation paused</span>
                                )}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-background/50 dot-grid">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-heading font-medium text-foreground mb-2">Select a conversation</h3>
                        <p className="text-muted-foreground max-w-xs text-center text-sm">
                            Choose a contact from the list to view their messages and history.
                        </p>
                    </div>
                )}

                {/* Right Sidebar - Contact Details */}
                {activeConversation && (
                    <div className="w-72 border-l border-border bg-card hidden xl:block p-6">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary text-2xl font-bold mb-3">
                                {activeConversation.contact_name?.charAt(0) || '?'}
                            </div>
                            <h3 className="font-heading font-semibold text-lg">{activeConversation.contact_name || 'Unknown'}</h3>
                            {activeConversation.contact_email && (
                                <p className="text-sm text-muted-foreground">{activeConversation.contact_email}</p>
                            )}
                            {activeConversation.contact_phone && (
                                <p className="text-sm text-muted-foreground">{activeConversation.contact_phone}</p>
                            )}
                            <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(activeConversation.status)}`}>
                                {activeConversation.status}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Contact Info</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span>Customer</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>Created: {new Date(activeConversation.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {activeConversation.automation_paused && (
                                        <div className="flex items-center gap-3 text-orange-600">
                                            <span className="text-xs font-medium">⚠️ Automation Paused</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-border"></div>

                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Actions</h4>
                                <div className="space-y-2">
                                    {activeConversation.status !== 'closed' ? (
                                        <button
                                            onClick={handleCloseConversation}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                            <span>Close Conversation</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleReopenConversation}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                            <span>Reopen Conversation</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Communication;