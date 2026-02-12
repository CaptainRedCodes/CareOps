
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    MapPin,
    DollarSign,
    MoreHorizontal,
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Types
interface Booking {
    id: string;
    customerName: string;
    service: string;
    date: string;
    time: string;
    duration: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    price: string;
    location: string;
}

const Bookings: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [currentDate, setCurrentDate] = useState(new Date());

    const bookings: Booking[] = [
        
    ];

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Bookings</h1>
                        <p className="text-muted-foreground mt-1">Manage appointments and service types.</p>
                    </div>

                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm">
                            Manage Services
                        </button>
                        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md">
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
                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                                </button>
                                <span className="font-heading font-medium px-2">February 2026</span>
                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
                                <button className="px-3 py-1 bg-card shadow-sm rounded-md text-sm font-medium text-foreground">List</button>
                                <button className="px-3 py-1 hover:bg-card/50 rounded-md text-sm font-medium text-muted-foreground transition-colors">Day</button>
                                <button className="px-3 py-1 hover:bg-card/50 rounded-md text-sm font-medium text-muted-foreground transition-colors">Week</button>
                                <button className="px-3 py-1 hover:bg-card/50 rounded-md text-sm font-medium text-muted-foreground transition-colors">Month</button>
                            </div>
                        </div>

                        {/* Bookings */}
                        <div className="space-y-4">
                            {['Today', 'Tomorrow'].map((day) => (
                                <div key={day}>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">{day}</h3>
                                    <div className="space-y-3">
                                        {bookings.filter(b => b.date === day).map((booking) => (
                                            <div key={booking.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow group">
                                                {/* Time Column */}
                                                <div className="min-w-[100px] flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 sm:border-r border-border sm:pr-4">
                                                    <span className="text-lg font-heading font-medium text-foreground">{booking.time}</span>
                                                    <span className="text-xs text-muted-foreground">{booking.duration}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-foreground text-lg">{booking.service}</h4>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                <User className="w-4 h-4" />
                                                                <span>{booking.customerName}</span>
                                                            </div>
                                                        </div>
                                                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground">
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                                            <MapPin className="w-3 h-3" />
                                                            {booking.location}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                                            <DollarSign className="w-3 h-3" />
                                                            {booking.price}
                                                        </div>
                                                        <div className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                'bg-gray-50 text-gray-700 border-gray-200'
                                                            }`}>
                                                            {booking.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar - Upcoming / Quick Stats */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
                            <h3 className="font-heading text-xl mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Today's Bookings</span>
                                    <span className="font-medium text-lg">4</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Revenue Est.</span>
                                    <span className="font-medium text-lg">$350</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary-foreground/80 text-sm">Next Opening</span>
                                    <span className="font-medium text-lg">4:00 PM</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-heading font-medium text-lg mb-4">Availability</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Mon - Fri</span>
                                    <span className="font-medium">9:00 AM - 5:00 PM</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Saturday</span>
                                    <span className="font-medium">10:00 AM - 2:00 PM</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sunday</span>
                                    <span className="text-muted-foreground italic">Closed</span>
                                </div>
                                <button className="w-full mt-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                                    Edit Hours
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Bookings;
