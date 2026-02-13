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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/api/client';

interface BookingType {
    id: string;
    name: string;
    duration_minutes: number;
    location_type: string;
}

interface ManageServicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    bookingTypes: BookingType[];
    onSuccess: () => void;
}

export function ManageServicesModal({
    isOpen,
    onClose,
    workspaceId,
    bookingTypes = [],
    onSuccess
}: ManageServicesModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        duration_minutes: 60,
        description: '',
        location_type: 'in_person',
        price: 0
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = {
                ...formData,
                price: formData.price.toString(),
                availability_rules: [] // Required by schema
            };
            await api.post(`/workspaces/${workspaceId}/bookings/booking-types`, payload);
            onSuccess();
            setIsCreating(false);
            setFormData({
                name: '',
                duration_minutes: 60,
                description: '',
                location_type: 'in_person',
                price: 0
            });
        } catch (err: any) {
            console.error('Failed to create service', err);
            const errorMsg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : JSON.stringify(err.response.data.detail))
                : 'Failed to create service';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            // Note: Use the admin endpoint for deleting booking types if available, 
            // otherwise this might fail if not implemented.
            // checking routers... it seems there is no delete endpoint in the snippets I saw!
            // Wait, looking at Step 238... NO DELETE ENDPOINT!
            // So I cannot implement delete. I will hide the delete button.
            alert("Deletion not supported yet.");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Services</DialogTitle>
                    <DialogDescription>
                        Configure the services you offer.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* List Existing */}
                    {!isCreating && (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {bookingTypes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No services found. Create one below.
                                </p>
                            ) : (
                                bookingTypes.map(type => (
                                    <div key={type.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
                                        <div>
                                            <div className="font-medium">{type.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {type.duration_minutes} min • {type.location_type}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <Button
                                className="w-full mt-2"
                                variant="outline"
                                onClick={() => setIsCreating(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Service
                            </Button>
                        </div>
                    )}

                    {/* Create New Form */}
                    {isCreating && (
                        <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-2 rounded break-all">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Initial Consultation"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.duration_minutes}
                                        onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location Type</Label>
                                    <select
                                        id="location"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.location_type}
                                        onChange={e => setFormData({ ...formData, location_type: e.target.value })}
                                    >
                                        <option value="in_person">In Person</option>
                                        <option value="video">Video Call</option>
                                        <option value="phone">Phone Call</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input
                                    id="desc"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Service
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <DialogFooter>
                    {!isCreating && (
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
