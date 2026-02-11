import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Trash2, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Define Service type locally for now
type Service = {
    id: string;
    name: string;
    duration: string;
    price: string;
};

export default function ServicesSetup() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New service form state
    const [newService, setNewService] = useState({ name: "", duration: "60", price: "0" });

    const handleAddService = () => {
        if (!newService.name) return;

        const service: Service = {
            id: Math.random().toString(36).substr(2, 9),
            name: newService.name,
            duration: newService.duration,
            price: newService.price
        };

        setServices([...services, service]);
        setNewService({ name: "", duration: "60", price: "0" });
        setIsDialogOpen(false);
    };

    const handleRemoveService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-heading font-medium tracking-tight">Services</h2>
                    <p className="text-muted-foreground">Define the services your customers can book.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full gap-2">
                            <Plus className="h-4 w-4" />
                            Add Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Service</DialogTitle>
                            <DialogDescription>
                                Create a service that customers can book.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Initial Consultation"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (min)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="duration"
                                            type="number"
                                            className="pl-9"
                                            value={newService.duration}
                                            onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            className="pl-9"
                                            value={newService.price}
                                            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddService} disabled={!newService.name}>Add Service</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Services API List */}
            <div className="space-y-4">
                {services.length === 0 ? (
                    <Card className="border-dashed bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                                <Plus className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">No services added yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    Add at least one service to continue setting up your booking page.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                Add your first service
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                            <Card key={service.id} className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm">
                                <CardContent className="p-5 flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-lg">{service.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" /> {service.duration} mins
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-3.5 w-3.5" /> {service.price}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveService(service.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-8 border-t">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/onboarding/business")}
                    className="text-muted-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    size="lg"
                    className="px-8 rounded-full btn-glow"
                    onClick={() => navigate("/onboarding/staff")}
                    disabled={services.length === 0}
                >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
