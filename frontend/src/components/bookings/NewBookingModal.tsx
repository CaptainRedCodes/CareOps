import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import api from '@/api/client';

interface BookingType {
    id: string;
    name: string;
    duration_minutes: number;
}

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    bookingTypes: BookingType[];
    onSuccess: () => void;
}

export function NewBookingModal({
    isOpen,
    onClose,
    workspaceId,
    bookingTypes = [],
    onSuccess
}: NewBookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        booking_type_id: '',
        date: '',
        time: '',
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate at least one contact method is provided
        if (!formData.email.trim() && !formData.phone.trim()) {
            setError('Please provide either an email address or phone number');
            return;
        }

        setLoading(true);

        try {
            // Combine date and time to ISO string
            const startDateTime = new Date(`${formData.date}T${formData.time}`);

            const payload = {
                booking_type_id: formData.booking_type_id,
                start_time: startDateTime.toISOString(),
                customer_notes: formData.notes,
                contact_data: {
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null
                }
            };

            // Use public endpoint as it handles contact creation
            await api.post('/public/bookings/book', payload);

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                booking_type_id: '',
                date: '',
                time: '',
                name: '',
                email: '',
                phone: '',
                notes: ''
            });
        } catch (err: any) {
            console.error('Failed to create booking', err);
            const errorMsg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail))
                : 'Failed to create booking';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Booking</DialogTitle>
                    <DialogDescription>
                        Create a new appointment for a customer.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="service">Service Type</Label>
                        <select
                            id="service"
                            required
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.booking_type_id}
                            onChange={(e) => setFormData({ ...formData, booking_type_id: e.target.value })}
                        >
                            <option value="">Select a service...</option>
                            {bookingTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name} ({type.duration_minutes} min)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Customer Name</Label>
                        <Input
                            id="name"
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Contact Information <span className="text-red-500">*</span></Label>
                        <p className="text-xs text-muted-foreground">At least one is required</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email (john@example.com)"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Phone (+1 555-000-0000)"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                            id="notes"
                            placeholder="Optional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="btn-glow">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Booking
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
