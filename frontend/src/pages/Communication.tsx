
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    XCircle
} from 'lucide-react';

// Types (mock for now, will be replaced with API types)
interface Contact {
    id: string;
    name: string;
    email: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted';
    lastMessage: string;
    lastMessageTime: string;
    unreadCount?: number;
    avatar?: string;
}

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'contact';
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}

const Communication: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { user } = useAuth();
    const [activeContact, setActiveContact] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');

    // Mock Data
    const contacts: Contact[] = [
        {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            status: 'new',
            lastMessage: 'Hi, I would like to inquire about your services.',
            lastMessageTime: '10:30 AM',
            unreadCount: 2,
        },
        {
            id: '2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            status: 'contacted',
            lastMessage: 'Thanks for the quick reply!',
            lastMessageTime: 'Yesterday',
        },
        {
            id: '3',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            status: 'qualified',
            lastMessage: 'Can we schedule a call?',
            lastMessageTime: 'Mon',
        },
    ];

    const messages: Message[] = [
        {
            id: '1',
            content: 'Hi, I would like to inquire about your services.',
            sender: 'contact',
            timestamp: '10:30 AM',
            status: 'read',
        },
        {
            id: '2',
            content: 'Hello Alice! Thanks for reaching out. How can I help you today?',
            sender: 'user',
            timestamp: '10:32 AM',
            status: 'read',
        },
        {
            id: '3',
            content: 'I am interested in your premium package.',
            sender: 'contact',
            timestamp: '10:33 AM',
            status: 'read',
        },
    ];

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        // logic to send message
        console.log('Sending message:', messageInput);
        setMessageInput('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700';
            case 'contacted': return 'bg-yellow-100 text-yellow-700';
            case 'qualified': return 'bg-green-100 text-green-700';
            case 'converted': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Contacts List */}
                <div className="w-80 border-r border-border bg-card flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-heading font-semibold mb-4">Inbox</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                className="w-full pl-9 pr-4 py-2 bg-secondary/50 rounded-md border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none"
                            />
                        </div>

                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                            {['All', 'Unread', 'New', 'Qualified'].map((filter) => (
                                <button
                                    key={filter}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {contacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => setActiveContact(contact.id)}
                                className={`p-4 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${activeContact === contact.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium text-sm ${contact.unreadCount ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
                                        {contact.name}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                                </div>
                                <p className={`text-xs line-clamp-1 mb-2 ${contact.unreadCount ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {contact.lastMessage}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${getStatusColor(contact.status)}`}>
                                        {contact.status}
                                    </span>
                                    {contact.unreadCount && (
                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                            {contact.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content - Chat Area */}
                {activeContact ? (
                    <div className="flex-1 flex flex-col bg-background relative">
                        {/* Chat Header */}
                        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {contacts.find(c => c.id === activeContact)?.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {contacts.find(c => c.id === activeContact)?.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {contacts.find(c => c.id === activeContact)?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                                    <Video className="w-4 h-4" />
                                </button>
                                <div className="h-6 w-px bg-border mx-2"></div>
                                <button className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 dot-grid">
                            <div className="flex justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                    Today
                                </span>
                            </div>

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.sender === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-card text-foreground border border-border rounded-tl-none'
                                            }`}
                                    >
                                        <p>{message.content}</p>
                                        <div className={`text-[10px] mt-1 text-right ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {message.timestamp}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-card border-t border-border">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-secondary/30 p-2 rounded-xl border border-border/50 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10 transition-all input-glow">
                                <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[2.5rem] py-2 text-sm"
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors btn-glow"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
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

                {/* Right Sidebar - Contact Details (Optional, hidden on small screens) */}
                {activeContact && (
                    <div className="w-72 border-l border-border bg-card hidden xl:block p-6">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary text-2xl font-bold mb-3">
                                {contacts.find(c => c.id === activeContact)?.name.charAt(0)}
                            </div>
                            <h3 className="font-heading font-semibold text-lg">{contacts.find(c => c.id === activeContact)?.name}</h3>
                            <p className="text-sm text-muted-foreground">{contacts.find(c => c.id === activeContact)?.email}</p>
                            <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(contacts.find(c => c.id === activeContact)?.status || 'new')}`}>
                                {contacts.find(c => c.id === activeContact)?.status}
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
                                        <span>Local Time: 10:45 AM</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border"></div>

                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Actions</h4>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-secondary text-sm flex items-center gap-2 transition-colors">
                                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                        <span>Mark as Resolved</span>
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive text-sm flex items-center gap-2 transition-colors">
                                        <XCircle className="w-4 h-4" />
                                        <span>Block Contact</span>
                                    </button>
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
