import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface Booking {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    booking_type: { name: string };
    contact: { name: string };
}

interface CalendarViewProps {
    currentDate: Date;
    bookings: Booking[];
    onDateClick: (date: Date) => void;
}

export function CalendarView({ currentDate, bookings, onDateClick }: CalendarViewProps) {
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Create array of days padding the start
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
    };

    const getBookingsForDate = (date: Date) => {
        return bookings.filter(b => {
            const bDate = new Date(b.start_time);
            return bDate.getDate() === date.getDate() &&
                bDate.getMonth() === date.getMonth() &&
                bDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr bg-card">
                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="p-2 border-b border-r border-border/50 min-h-[120px] bg-secondary/5" />;

                    const dayBookings = getBookingsForDate(date);

                    return (
                        <div
                            key={idx}
                            onClick={() => onDateClick(date)}
                            className={`p-2 border-b border-r border-border/50 min-h-[120px] transition-colors hover:bg-secondary/20 cursor-pointer ${isSelected(date) ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''
                                } ${isToday(date) ? 'bg-secondary/10' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday(date)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground'
                                    }`}>
                                    {date.getDate()}
                                </span>
                                {dayBookings.length > 0 && (
                                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                                        {dayBookings.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                {dayBookings.slice(0, 3).map(b => (
                                    <div key={b.id} className="text-[10px] p-1 rounded bg-secondary/50 border border-border/50 truncate flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-500' :
                                                b.status === 'scheduled' ? 'bg-yellow-500' :
                                                    'bg-gray-400'
                                            }`} />
                                        <span className="truncate">{b.booking_type.name}</span>
                                    </div>
                                ))}
                                {dayBookings.length > 3 && (
                                    <div className="text-[10px] text-muted-foreground pl-1">
                                        + {dayBookings.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
