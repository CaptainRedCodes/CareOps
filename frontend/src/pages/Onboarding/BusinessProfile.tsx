import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Building2, Globe, MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BusinessProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Mock form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: Save to backend
        setTimeout(() => {
            setLoading(false);
            navigate("/onboarding/services");
        }, 800);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-heading font-medium tracking-tight">Business Profile</h2>
                <p className="text-muted-foreground">Tell us about your business to customize your workspace.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Side */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="businessName"
                                        placeholder="Acme Clinic"
                                        className="pl-9 h-11"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Industry / Type</Label>
                                    <Select>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="clinic">Medical Clinic</SelectItem>
                                            <SelectItem value="salon">Salon & Spa</SelectItem>
                                            <SelectItem value="consulting">Consulting</SelectItem>
                                            <SelectItem value="education">Education / Tutoring</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Timezone</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Select defaultValue="utc">
                                            <SelectTrigger className="pl-9 h-11">
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="utc">UTC (Universal Coordinated Time)</SelectItem>
                                                <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                                                <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                                                <SelectItem value="ist">IST (India Standard Time)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address (Optional)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        placeholder="123 Main St, City, Country"
                                        className="pl-9 h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="hours">Standard Operating Hours</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="hours"
                                        placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM"
                                        className="pl-9 h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                className="px-8 rounded-full btn-glow min-w-[140px]"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Preview Side */}
                <div className="hidden lg:block space-y-6">
                    <Card className="bg-muted/30 border-dashed border-2 shadow-none">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="h-24 w-24 rounded-full bg-secondary mx-auto flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                <span className="text-xs text-muted-foreground">Logo Preview</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-secondary rounded mx-auto" />
                                <div className="h-3 w-48 bg-secondary/50 rounded mx-auto" />
                            </div>
                            <div className="pt-4">
                                <p className="text-xs text-muted-foreground">
                                    This information will appear on your public booking page and invoices.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
