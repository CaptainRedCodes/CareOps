import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    MapPin,
    MoreHorizontal,
    User,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle
} from 'lucide-react';
import api from "@/api/client";
import { NewBookingModal } from "@/components/bookings/NewBookingModal";
import { ManageServicesModal } from "@/components/bookings/ManageServicesModal";
import { CalendarView } from "@/components/bookings/CalendarView";

// Types
interface Booking {
    id: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
    readiness_status: 'pending_forms' | 'ready';
    customer_notes: string | null;
    staff_notes: string | null;
    contact: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    };
    booking_type: {
        id: string;
        name: string;
        duration_minutes: number;
        location_type: string;
    };
}

interface BookingType {
    id: string;
    name: string;
    duration_minutes: number;
    location_type: string;
}

export default function Bookings() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'list' | 'calendar'>('list');

    // Modal states
    const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
    const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch bookings
            const bookingsRes = await api.get(`/workspaces/${workspaceId}/bookings`);
            setBookings(bookingsRes.data);

            // Fetch booking types (services)
            const typesRes = await api.get(`/workspaces/${workspaceId}/bookings/services`);
            setBookingTypes(typesRes.data);
        } catch (err: any) {
            console.error("Failed to fetch bookings", err);
            setError(err.response?.data?.detail || "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            fetchData();
        }
    }, [workspaceId]);

    const formatTime = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const minutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        return `${minutes} min`;
    };

    const getLocationLabel = (locationType: string) => {
        switch (locationType) {
            case 'in_person': return 'In Person';
            case 'phone': return 'Phone Call';
            case 'video': return 'Video Call';
            case 'custom': return 'Custom Location';
            default: return locationType;
        }
    };

    // Navigation Handlers
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'calendar') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'calendar') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Filter bookings
    const filteredBookings = bookings.filter(b => {
        if (view === 'list') {
            return new Date(b.start_time).toDateString() === currentDate.toDateString();
        }
        return true;
    });

    const upcomingBookings = bookings.filter(b =>
        new Date(b.start_time) > new Date() &&
        new Date(b.start_time).toDateString() !== currentDate.toDateString()
    );

    // Calculate stats
    const todayCount = filteredBookings.length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.status === 'scheduled').length;

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <h3 className="text-lg font-medium text-red-800">Error loading bookings</h3>
                    <p className="text-red-600 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Bookings</h1>
                        <p className="text-muted-foreground mt-1">Manage appointments and service types.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsManageServicesOpen(true)}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
                        >
                            Manage Services ({bookingTypes.length})
                        </button>
                        <button
                            onClick={() => setIsNewBookingOpen(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Booking</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Booking List */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 bg-card p-2 rounded-xl border border-border">
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrev} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <span className="font-heading font-medium px-2 min-w-[200px] text-center">
                                    {currentDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        year: 'numeric',
                                        day: view === 'list' ? 'numeric' : undefined
                                    })}
                                </span>
                                <button onClick={handleNext} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setView('list')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'list'
                                        ? 'bg-card shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:bg-card/50'
                                        }`}
                                >
                                    List
                                </button>
                                <button
                                    onClick={() => setView('calendar')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'calendar'
                                        ? 'bg-card shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:bg-card/50'
                                        }`}
                                >
                                    Month
                                </button>
                                <button
                                    onClick={handleToday}
                                    className="px-3 py-1 hover:bg-card/50 rounded-md text-sm font-medium text-muted-foreground transition-colors ml-2"
                                >
                                    Today
                                </button>
                            </div>
                        </div>

                        {/* Bookings Content */}
                        <div className="space-y-6">
                            {view === 'calendar' ? (
                                <CalendarView
                                    currentDate={currentDate}
                                    bookings={bookings}
                                    onDateClick={(date) => {
                                        setCurrentDate(date);
                                        setView('list'); // Switch to list view on click?
                                    }}
                                />
                            ) : (
                                <>
                                    {/* List View */}
                                    {filteredBookings.length > 0 ? (
                                        <div>
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                                                {currentDate.toLocaleDateString()} ({filteredBookings.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {filteredBookings.map((booking) => (
                                                    <BookingCard
                                                        key={booking.id}
                                                        booking={booking}
                                                        formatTime={formatTime}
                                                        formatDate={formatDate}
                                                        getDuration={getDuration}
                                                        getLocationLabel={getLocationLabel}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-card border border-border/50 rounded-xl">
                                            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                                            <h3 className="text-lg font-medium text-foreground">No bookings for this date</h3>
                                            <p className="text-muted-foreground mt-2">Select another date or create a new booking.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Quick Stats */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
                            <h3 className="font-heading text-xl mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Selected Date</span>
                                    <span className="font-medium text-lg">{todayCount}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Confirmed</span>
                                    <span className="font-medium text-lg">{confirmedCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary-foreground/80 text-sm">Pending</span>
                                    <span className="font-medium text-lg">{pendingCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-heading font-medium text-lg mb-4">Service Types</h3>
                            <div className="space-y-3">
                                {bookingTypes.length > 0 ? (
                                    bookingTypes.map((type) => (
                                        <div key={type.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{type.name}</span>
                                            <span className="font-medium">{type.duration_minutes} min</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No service types configured</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsManageServicesOpen(true)}
                                className="w-full mt-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                Manage Services
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <NewBookingModal
                isOpen={isNewBookingOpen}
                onClose={() => setIsNewBookingOpen(false)}
                workspaceId={workspaceId!}
                bookingTypes={bookingTypes}
                onSuccess={fetchData}
            />

            <ManageServicesModal
                isOpen={isManageServicesOpen}
                onClose={() => setIsManageServicesOpen(false)}
                workspaceId={workspaceId!}
                bookingTypes={bookingTypes}
                onSuccess={fetchData}
            />
        </div>
    );
}

// Booking Card Component
interface BookingCardProps {
    booking: Booking;
    formatTime: (iso: string) => string;
    formatDate: (iso: string) => string;
    getDuration: (start: string, end: string) => string;
    getLocationLabel: (type: string) => string;
}

function BookingCard({ booking, formatTime, formatDate, getDuration, getLocationLabel }: BookingCardProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow group">
            {/* Time Column */}
            <div className="min-w-[100px] flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 sm:border-r border-border sm:pr-4">
                <span className="text-lg font-heading font-medium text-foreground">
                    {formatTime(booking.start_time)}
                </span>
                <span className="text-xs text-muted-foreground">
                    {getDuration(booking.start_time, booking.end_time)}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-medium text-foreground text-lg">{booking.booking_type.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="w-4 h-4" />
                            <span>{booking.contact.name}</span>
                            {booking.contact.email && (
                                <span className="text-xs">({booking.contact.email})</span>
                            )}
                        </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                        <MapPin className="w-3 h-3" />
                        {getLocationLabel(booking.booking_type.location_type)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.start_time)}
                    </div>
                    {booking.readiness_status === 'pending_forms' && (
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Forms Pending
                        </div>
                    )}
                    <div className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                        booking.status === 'scheduled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                        {booking.status}
                    </div>
                </div>
            </div>
        </div>
    );
}
