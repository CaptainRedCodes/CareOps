import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Video
} from 'lucide-react';
import api from "@/api/client";

interface Booking {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  is_remote: boolean;
  location: string | null;
}

interface DayBookings {
  date: string;
  bookings: Booking[];
}

export default function CalendarSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<DayBookings[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const response = await api.get(`/workspaces/${workspaceId}/bookings`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      
      const bookingsData = response.data;
      
      const grouped: DayBookings[] = [];
      bookingsData.forEach((booking: Booking) => {
        const date = booking.start_time.split('T')[0];
        const existing = grouped.find(g => g.date === date);
        if (existing) {
          existing.bookings.push(booking);
        } else {
          grouped.push({ date, bookings: [booking] });
        }
      });
      
      setBookings(grouped);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [workspaceId, year, month]);

  const getBookingsForDay = (day: number) => {
    const date = new Date(year, month, day).toISOString().split('T')[0];
    return bookings.find(b => b.date === date)?.bookings || [];
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-secondary/30"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = getBookingsForDay(day);
      days.push(
        <div 
          key={day} 
          className={`h-24 p-1 border border-border overflow-y-auto ${
            isToday(day) ? 'bg-brand/5' : 'bg-card hover:bg-secondary/50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday(day) ? 'text-brand' : 'text-muted-foreground'
          }`}>
            {day}
          </div>
          {dayBookings.slice(0, 2).map(booking => (
            <div 
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="text-xs truncate px-1 py-0.5 mb-0.5 bg-primary/10 rounded cursor-pointer hover:bg-primary/20"
            >
              {formatTime(booking.start_time)} - {booking.contact_name}
            </div>
          ))}
          {dayBookings.length > 2 && (
            <div className="text-xs text-muted-foreground px-1">
              +{dayBookings.length - 2} more
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-medium text-foreground">Bookings Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your bookings in one place.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {monthNames[month]} {year}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm hover:bg-secondary rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-secondary">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-green-100"></span>
                Confirmed
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-yellow-100"></span>
                Pending
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-100"></span>
                Cancelled
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-100"></span>
                Completed
              </div>
            </div>
          </>
        )}
      </main>

      {/* Booking Detail Sidebar */}
      {selectedBooking && (
        <div className="w-96 bg-card border-l border-border p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Booking Details</h3>
            <button
              onClick={() => setSelectedBooking(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                </p>
                <p className="text-xs">
                  {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{selectedBooking.contact_name}</span>
            </div>

            {selectedBooking.contact_email && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${selectedBooking.contact_email}`} className="text-brand hover:underline">
                  {selectedBooking.contact_email}
                </a>
              </div>
            )}

            {selectedBooking.contact_phone && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <a href={`tel:${selectedBooking.contact_phone}`} className="text-brand hover:underline">
                  {selectedBooking.contact_phone}
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{selectedBooking.service_name}</span>
            </div>

            {selectedBooking.is_remote && (
              <div className="flex items-center gap-3 text-brand">
                <Video className="w-4 h-4" />
                <span>Remote Appointment</span>
              </div>
            )}

            {selectedBooking.location && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{selectedBooking.location}</span>
              </div>
            )}

            {selectedBooking.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{selectedBooking.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
