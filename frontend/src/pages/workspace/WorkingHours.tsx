import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, AlertCircle, Save, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/api/client';

// Types
interface WorkingHourSlot {
    start_time: string;
    end_time: string;
}

interface DaySchedule {
    is_open: boolean;
    slots: WorkingHourSlot[];
}

interface WorkingHoursData {
    [key: string]: DaySchedule;
}

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_SLOT: WorkingHourSlot = { start_time: '09:00', end_time: '17:00' };

const DEFAULT_SCHEDULE: WorkingHoursData = {
    monday: { is_open: true, slots: [{ ...DEFAULT_SLOT }] },
    tuesday: { is_open: true, slots: [{ ...DEFAULT_SLOT }] },
    wednesday: { is_open: true, slots: [{ ...DEFAULT_SLOT }] },
    thursday: { is_open: true, slots: [{ ...DEFAULT_SLOT }] },
    friday: { is_open: true, slots: [{ ...DEFAULT_SLOT }] },
    saturday: { is_open: false, slots: [] },
    sunday: { is_open: false, slots: [] },
};

const WorkingHours: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [schedule, setSchedule] = useState<WorkingHoursData>(DEFAULT_SCHEDULE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        loadWorkingHours();
    }, [workspaceId]);

    const loadWorkingHours = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/workspaces/${workspaceId}/working-hours`);
            if (response.data && response.data.schedule) {
                setSchedule(response.data.schedule);
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                // No working hours yet - use default
                setSchedule(DEFAULT_SCHEDULE);
            } else {
                setError('Failed to load working hours');
            }
        } finally {
            setLoading(false);
        }
    };

    const validateSchedule = (): boolean => {
        const errors: { [key: string]: string } = {};

        DAYS_OF_WEEK.forEach(({ key }) => {
            const day = schedule[key];
            if (day.is_open && day.slots.length > 0) {
                day.slots.forEach((slot, index) => {
                    if (slot.start_time >= slot.end_time) {
                        errors[`${key}-${index}`] = 'End time must be after start time';
                    }
                });

                // Check for overlapping slots
                for (let i = 0; i < day.slots.length; i++) {
                    for (let j = i + 1; j < day.slots.length; j++) {
                        const slot1 = day.slots[i];
                        const slot2 = day.slots[j];
                        if (
                            slot1.start_time < slot2.end_time &&
                            slot2.start_time < slot1.end_time
                        ) {
                            errors[`${key}-overlap`] = 'Time slots cannot overlap';
                        }
                    }
                }
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateSchedule()) {
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            await api.put(`/workspaces/${workspaceId}/working-hours`, { schedule });
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'object') {
                setError('Validation error. Please check your input.');
            } else {
                setError(detail || 'Failed to save working hours');
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (dayKey: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                is_open: !prev[dayKey].is_open,
                slots: !prev[dayKey].is_open && prev[dayKey].slots.length === 0
                    ? [{ ...DEFAULT_SLOT }]
                    : prev[dayKey].slots
            }
        }));
        setValidationErrors({});
    };

    const updateSlot = (dayKey: string, slotIndex: number, field: keyof WorkingHourSlot, value: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: prev[dayKey].slots.map((slot, idx) =>
                    idx === slotIndex ? { ...slot, [field]: value } : slot
                )
            }
        }));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`${dayKey}-${slotIndex}`];
            delete newErrors[`${dayKey}-overlap`];
            return newErrors;
        });
    };

    const addSlot = (dayKey: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: [...prev[dayKey].slots, { start_time: '09:00', end_time: '17:00' }]
            }
        }));
    };

    const removeSlot = (dayKey: string, slotIndex: number) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                slots: prev[dayKey].slots.filter((_, idx) => idx !== slotIndex)
            }
        }));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`${dayKey}-${slotIndex}`];
            delete newErrors[`${dayKey}-overlap`];
            return newErrors;
        });
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasNoSchedule = !loading && Object.values(schedule).every(day => !day.is_open);

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Working Hours</h1>
                        <p className="text-muted-foreground mt-1">
                            Define when your workspace is available for bookings.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-600">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>Working hours saved successfully!</span>
                    </div>
                )}

                {/* Empty State */}
                {hasNoSchedule && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3 text-yellow-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>No working hours defined yet. Configure your schedule below.</span>
                    </div>
                )}

                {/* Working Hours Editor */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <h3 className="font-heading font-medium text-lg">Weekly Schedule</h3>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {DAYS_OF_WEEK.map(({ key, label }) => {
                            const day = schedule[key];
                            const hasOverlapError = validationErrors[`${key}-overlap`];

                            return (
                                <div key={key} className="p-6 hover:bg-muted/20 transition-colors">
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                        {/* Day Header */}
                                        <div className="flex items-center justify-between lg:w-48 flex-shrink-0">
                                            <span className="font-medium text-foreground">{label}</span>
                                            <button
                                                onClick={() => toggleDay(key)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                                    day.is_open ? 'bg-primary' : 'bg-muted-foreground/30'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        day.is_open ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Time Slots */}
                                        <div className="flex-1">
                                            {day.is_open ? (
                                                <div className="space-y-3">
                                                    {day.slots.map((slot, index) => (
                                                        <div key={index} className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="time"
                                                                    value={slot.start_time}
                                                                    onChange={(e) => updateSlot(key, index, 'start_time', e.target.value)}
                                                                    className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                                <span className="text-muted-foreground">to</span>
                                                                <input
                                                                    type="time"
                                                                    value={slot.end_time}
                                                                    onChange={(e) => updateSlot(key, index, 'end_time', e.target.value)}
                                                                    className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                            </div>

                                                            {day.slots.length > 1 && (
                                                                <button
                                                                    onClick={() => removeSlot(key, index)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                                    title="Remove time slot"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {validationErrors[`${key}-${index}`] && (
                                                                <span className="text-sm text-destructive">
                                                                    {validationErrors[`${key}-${index}`]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {hasOverlapError && (
                                                        <span className="text-sm text-destructive block">
                                                            {hasOverlapError}
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => addSlot(key)}
                                                        className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Add another time slot
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">Closed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                    <h4 className="font-medium text-sm text-foreground mb-2">Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Set your regular business hours for each day</li>
                        <li>Add multiple time slots if you have breaks (e.g., lunch)</li>
                        <li>Toggle days off when you&apos;re closed</li>
                        <li>Changes will apply to all future bookings</li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default WorkingHours;
