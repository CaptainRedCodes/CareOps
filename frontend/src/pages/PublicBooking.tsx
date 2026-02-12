import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, ChevronLeft, ChevronRight,
    CheckCircle2, User, ArrowRight, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ServiceType {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    location_type: string;
    location_details: string | null;
    price: string | null;
}

interface TimeSlot {
    start_time: string;
    end_time: string;
    display: string;
}

type Step = 'services' | 'datetime' | 'details' | 'confirmation';

const PublicBooking: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [step, setStep] = useState<Step>('services');
    const [services, setServices] = useState<ServiceType[]>([]);
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });

    // Load services on mount
    useEffect(() => {
        fetch(`${API_URL}/public/booking/${workspaceId}/services`)
            .then(r => r.json())
            .then(data => { setServices(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [workspaceId]);

    // Load slots when date selected
    useEffect(() => {
        if (!selectedService || !selectedDate) return;
        setSlotsLoading(true);
        fetch(`${API_URL}/public/booking/${workspaceId}/services/${selectedService.id}/slots?date=${selectedDate}`)
            .then(r => r.json())
            .then(data => { setSlots(data); setSlotsLoading(false); })
            .catch(() => setSlotsLoading(false));
    }, [selectedService, selectedDate]);

    const handleSubmit = async () => {
        if (!selectedService || !selectedSlot) return;
        setSubmitting(true);
        try {
            await fetch(`${API_URL}/public/booking/${workspaceId}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_type_id: selectedService.id,
                    start_time: selectedSlot.start_time,
                    customer_name: form.name,
                    customer_email: form.email,
                    customer_phone: form.phone || null,
                    notes: form.notes || null,
                })
            });
            setBookingComplete(true);
            setStep('confirmation');
        } catch (err) {
            alert('Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Generate next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold tracking-tight">Book an Appointment</h1>
                    <p className="text-gray-400 mt-1">Choose a service and pick a time that works for you.</p>
                </div>
            </div>

            {/* Progress */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-center gap-2 mb-8">
                    {(['services', 'datetime', 'details', 'confirmation'] as Step[]).map((s, idx) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 text-sm font-medium ${step === s ? 'text-amber-400' : idx < ['services', 'datetime', 'details', 'confirmation'].indexOf(step) ? 'text-green-400' : 'text-gray-600'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === s ? 'border-amber-400 bg-amber-400/10' : idx < ['services', 'datetime', 'details', 'confirmation'].indexOf(step) ? 'border-green-400 bg-green-400/10' : 'border-gray-700 bg-gray-900'}`}>
                                    {idx < ['services', 'datetime', 'details', 'confirmation'].indexOf(step) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className="hidden sm:inline capitalize">{s === 'datetime' ? 'Date & Time' : s}</span>
                            </div>
                            {idx < 3 && <div className={`flex-1 h-px ${idx < ['services', 'datetime', 'details', 'confirmation'].indexOf(step) ? 'bg-green-400/50' : 'bg-gray-800'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step: Services */}
                {step === 'services' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
                        {services.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">No services available at this time.</div>
                        ) : (
                            <div className="grid gap-4">
                                {services.map(svc => (
                                    <button
                                        key={svc.id}
                                        onClick={() => { setSelectedService(svc); setStep('datetime'); }}
                                        className="bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:border-amber-400/50 hover:bg-amber-400/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">{svc.name}</h3>
                                                {svc.description && <p className="text-gray-400 text-sm mt-1">{svc.description}</p>}
                                                <div className="flex gap-4 mt-3">
                                                    <span className="flex items-center gap-1 text-sm text-gray-500"><Clock className="w-4 h-4" />{svc.duration_minutes} min</span>
                                                    <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-4 h-4" />{svc.location_type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            {svc.price && <span className="text-amber-400 font-semibold">{svc.price}</span>}
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Date & Time */}
                {step === 'datetime' && (
                    <div>
                        <button onClick={() => setStep('services')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back to services
                        </button>
                        <h2 className="text-xl font-semibold mb-2">Pick a Date & Time</h2>
                        <p className="text-gray-400 text-sm mb-6">{selectedService?.name} · {selectedService?.duration_minutes} min</p>

                        {/* Date Picker */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Date</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {dates.slice(0, 14).map(d => {
                                    const dt = new Date(d + 'T00:00:00');
                                    const isSelected = selectedDate === d;
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                                            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border transition-all ${isSelected ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                        >
                                            <span className="text-xs">{dt.toLocaleDateString('en', { weekday: 'short' })}</span>
                                            <span className="text-lg font-bold">{dt.getDate()}</span>
                                            <span className="text-xs">{dt.toLocaleDateString('en', { month: 'short' })}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Available Times</label>
                                {slotsLoading ? (
                                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
                                ) : slots.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4">No available slots for this date.</p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.start_time}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedSlot?.start_time === slot.start_time ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}
                                            >
                                                {slot.display}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedSlot && (
                            <button
                                onClick={() => setStep('details')}
                                className="mt-6 w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 transition-colors"
                            >
                                Continue
                            </button>
                        )}
                    </div>
                )}

                {/* Step: Contact Details */}
                {step === 'details' && (
                    <div>
                        <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-xl font-semibold mb-6">Your Details</h2>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600" placeholder="Your full name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600" placeholder="+1 (555) 123-4567" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 placeholder-gray-600 h-24 resize-none" placeholder="Anything we should know?" />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
                            <h3 className="font-medium text-white mb-2">Booking Summary</h3>
                            <div className="text-sm text-gray-400 space-y-1">
                                <div className="flex justify-between"><span>Service</span><span className="text-white">{selectedService?.name}</span></div>
                                <div className="flex justify-between"><span>Date</span><span className="text-white">{selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span>Time</span><span className="text-white">{selectedSlot?.display}</span></div>
                                <div className="flex justify-between"><span>Duration</span><span className="text-white">{selectedService?.duration_minutes} min</span></div>
                                {selectedService?.price && <div className="flex justify-between border-t border-white/10 pt-1 mt-1"><span>Price</span><span className="text-amber-400 font-medium">{selectedService.price}</span></div>}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!form.name || !form.email || submitting}
                            className="mt-6 w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</> : 'Confirm Booking'}
                        </button>
                    </div>
                )}

                {/* Step: Confirmation */}
                {step === 'confirmation' && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
                        <p className="text-gray-400 mb-6">You'll receive a confirmation email shortly.</p>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 max-w-sm mx-auto text-left">
                            <div className="text-sm text-gray-400 space-y-2">
                                <div className="flex justify-between"><span>Service</span><span className="text-white">{selectedService?.name}</span></div>
                                <div className="flex justify-between"><span>Date</span><span className="text-white">{selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span>Time</span><span className="text-white">{selectedSlot?.display}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicBooking;
