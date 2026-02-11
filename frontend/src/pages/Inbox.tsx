import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/api/client";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Mail,
    Clock,
    CheckCheck,
    Loader2,
    MessageSquare,
    User
} from "lucide-react";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
}

interface Conversation {
    id: string;
    contact_id: string;
    subject: string;
    status: "open" | "closed";
    updated_at: string;
    contact: Contact;
}

interface Message {
    id: string;
    direction: "inbound" | "outbound";
    channel: "email" | "sms" | "system";
    body: string;
    sent_at: string;
}

export default function Inbox() {
    const { user } = useAuth();
    const { workspaceId } = useParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Reply state (future implementation)
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        if (workspaceId) fetchConversations();
    }, [workspaceId]);

    useEffect(() => {
        if (selectedConvId && workspaceId) fetchMessages(selectedConvId);
    }, [selectedConvId]);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/conversations`);
            setConversations(data);
            if (data.length > 0 && !selectedConvId) {
                // Auto-select first conversation
                setSelectedConvId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setLoadingConvs(false);
        }
    };

    const fetchMessages = async (convId: string) => {
        setLoadingMessages(true);
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/conversations/${convId}/messages`);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    // Placeholder reply handler
    const handleSendReply = () => {
        if (!replyText.trim()) return;
        // Logic to send reply would go here
        setReplyText("");
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                {/* ── Sidebar: Conversation List ───────────────────────── */}
                <div className="flex w-full max-w-xs flex-col border-r border-border bg-surface-card sm:w-80">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-9 bg-surface-elevated/50" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {loadingConvs ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
                                <p className="text-sm">No conversations yet</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConvId(conv.id)}
                                        className={`flex items-start gap-3 border-b border-border/30 p-4 text-left transition-colors hover:bg-surface-elevated/50 ${selectedConvId === conv.id ? "bg-brand/5 border-l-2 border-l-brand" : "border-l-2 border-l-transparent"
                                            }`}
                                    >
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarFallback className="bg-surface-elevated text-brand font-medium">
                                                {conv.contact?.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <span className="truncate font-medium text-foreground">
                                                    {conv.contact?.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {conv.subject}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* ── Main: Message Thread ─────────────────────────────── */}
                <div className="flex flex-1 flex-col bg-surface-elevated/30">
                    {selectedConv ? (
                        <>
                            {/* Header */}
                            <header className="flex h-16 items-center justify-between border-b border-border bg-surface-card px-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarFallback className="bg-brand/10 text-brand">
                                            {selectedConv.contact.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="font-semibold text-foreground leading-none">
                                            {selectedConv.contact.name}
                                        </h2>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            {selectedConv.contact.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {selectedConv.contact.email}
                                                </span>
                                            )}
                                            {selectedConv.contact.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {selectedConv.contact.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </header>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-6">
                                {loadingMessages ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {messages.map((msg) => {
                                            const isOutbound = msg.direction === "outbound";
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex w-full ${isOutbound ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className={`flex max-w-[70%] flex-col ${isOutbound ? "items-end" : "items-start"}`}>
                                                        <div
                                                            className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isOutbound
                                                                    ? "bg-brand text-white rounded-tr-none"
                                                                    : "bg-surface-card border border-border rounded-tl-none text-foreground"
                                                                }`}
                                                        >
                                                            {msg.body}
                                                        </div>
                                                        <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            {msg.channel === "email" ? <Mail className="h-2.5 w-2.5" /> : null}
                                                            {formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}
                                                            {isOutbound && <CheckCheck className="h-3 w-3 text-brand" />}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Reply Box (Placeholder) */}
                            <div className="p-4 border-t border-border bg-surface-card">
                                <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-elevated/50 p-2 focus-within:ring-1 focus-within:ring-brand">
                                    <textarea
                                        className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                                        placeholder="Type a reply..."
                                        rows={1}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        disabled // Disabled until future implementation
                                    />
                                    <Button size="icon" className="h-8 w-8 shrink-0 bg-brand text-white hover:bg-brand-hover" disabled>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    Replying is coming soon.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="mb-4 h-12 w-12 opacity-10" />
                            <p>Select a conversation to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
