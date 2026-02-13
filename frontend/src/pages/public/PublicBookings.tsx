import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface BookingType {
  id: string;
  name: string;
  duration_minutes: number;
  location_type: string;
  location_details?: string;
  description?: string;
  price?: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  display: string;
}

const PublicBookings: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'success'>('service');
  const [services, setServices] = useState<BookingType[]>([]);
  const [selectedService, setSelectedService] = useState<BookingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [workspaceId]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/public/bookings/services?workspace_id=${workspaceId}`);
      if (!response.ok) throw new Error('Failed to load services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError('Unable to load booking services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;

    try {
      setLoading(true);
      setSelectedTime(null);
      setError(null);
      
      const date = new Date(selectedDate);
      const dateStr = date.toISOString().split('T')[0];
      
      const response = await fetch(
        `${API_URL}/public/bookings/services/${selectedService.id}/available-slots?date=${dateStr}`
      );
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to load available times');
      }
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (err: any) {
      console.error('Available slots error:', err);
      setError(err.message || 'Unable to load available times. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: BookingType) => {
    setSelectedService(service);
    setStep('datetime');
    setSelectedDate('');
    setSelectedTime(null);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTime(slot);
  };

  const handleDetailsSubmit = async () => {
    if (!selectedService || !selectedTime || !selectedDate) return;
    if (!formData.name || !formData.email) {
      setError('Please fill in your name and email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.start_time.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);

      const response = await fetch(`${API_URL}/public/bookings/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type_id: selectedService.id,
          start_time: bookingDate.toISOString(),
          contact_data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          customer_notes: formData.notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create booking');
      }

      setBookingSuccess(true);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array(firstDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocationLabel = (type: string) => {
    switch (type) {
      case 'in_person': return 'In Person';
      case 'phone': return 'Phone Call';
      case 'video': return 'Video Call';
      case 'custom': return 'Custom Location';
      default: return type;
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5046E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#1C1917]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#DEDCFB] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-[#5046E5]" />
          </div>
          <h1 className="text-2xl font-bold">Book an Appointment</h1>
          <p className="text-[#78716C] mt-2">Select a service and time that works for you</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 'service' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Select a Service</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#E7E5E4]">
                <p className="text-[#78716C]">No booking services available at this time.</p>
              </div>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full bg-white hover:bg-[#F5F4F0] border border-[#E7E5E4] rounded-xl p-5 text-left transition-all hover:border-[#5046E5]/30 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-[#1C1917]">{service.name}</h3>
                      {service.description && (
                        <p className="text-[#78716C] text-sm mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-[#78716C]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes} minutes
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getLocationLabel(service.location_type)}
                        </span>
                      </div>
                    </div>
                    {service.price && (
                      <span className="text-[#5046E5] font-semibold">{service.price}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 'datetime' && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setStep('service')}
                className="p-2 hover:bg-[#F5F4F0] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold">{selectedService.name}</h2>
                <p className="text-sm text-[#78716C]">{selectedService.duration_minutes} minutes</p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-[#F5F4F0] rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-[#F5F4F0] rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-[#78716C] py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <button
                        onClick={() => {
                          const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
                          handleDateSelect(dateStr);
                        }}
                        disabled={isDateDisabled(day)}
                        className={`w-full h-full rounded-lg text-sm transition-colors ${
                          selectedDate === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0]
                            ? 'bg-[#5046E5] text-white'
                            : isDateDisabled(day)
                            ? 'text-[#D6D3D1] cursor-not-allowed'
                            : 'hover:bg-[#F5F4F0]'
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="text-sm font-medium text-[#78716C] mb-3">
                  Available times for {formatDate(selectedDate)}
                </h3>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#5046E5] animate-spin" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-[#E7E5E4]">
                    <p className="text-[#78716C]">No available times for this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSelect(slot)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedTime === slot
                            ? 'bg-[#5046E5] text-white'
                            : 'bg-white border border-[#E7E5E4] hover:border-[#5046E5]/30 hover:bg-[#F5F4F0]'
                        }`}
                      >
                        {slot.display || slot.start_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Continue Button */}
            {selectedTime && (
              <button
                onClick={() => setStep('details')}
                className="w-full bg-[#5046E5] hover:bg-[#3F37C9] text-white py-3 rounded-xl font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 'details' && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setStep('datetime')}
                className="p-2 hover:bg-[#F5F4F0] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold">Your Details</h2>
                <p className="text-sm text-[#78716C]">{selectedService.name} - {selectedTime?.display}</p>
              </div>
            </div>

            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4F0] border border-[#D6D3D1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5046E5]/20 focus:border-[#5046E5]"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4F0] border border-[#D6D3D1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5046E5]/20 focus:border-[#5046E5]"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4F0] border border-[#D6D3D1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5046E5]/20 focus:border-[#5046E5]"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1">Notes</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-[#78716C]" />
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F4F0] border border-[#D6D3D1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5046E5]/20 focus:border-[#5046E5] resize-none"
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleDetailsSubmit}
              disabled={loading || !formData.name || !formData.email}
              className="w-full bg-[#5046E5] hover:bg-[#3F37C9] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-[#78716C] mb-6">
              We've sent a confirmation to {formData.email}
            </p>
            <button
              onClick={() => {
                setStep('service');
                setSelectedService(null);
                setSelectedDate('');
                setSelectedTime(null);
                setFormData({ name: '', email: '', phone: '', notes: '' });
                setBookingSuccess(false);
              }}
              className="text-[#5046E5] hover:underline font-medium"
            >
              Book Another Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBookings;
