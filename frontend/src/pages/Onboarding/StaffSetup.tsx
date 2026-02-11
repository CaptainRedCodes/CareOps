import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Mail, ArrowLeft, User, Shield } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Staff = {
    id: string;
    name: string;
    email: string;
    role: "admin" | "manager" | "staff";
    status: "active" | "invited" | "pending";
};

export default function StaffSetup() {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState<Staff[]>([
        { id: "1", name: "You (Admin)", email: "admin@careops.com", role: "admin", status: "active" }
    ]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New staff form state
    const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "staff" });

    const handleInvite = () => {
        if (!newStaff.email) return;

        const staff: Staff = {
            id: Math.random().toString(36).substr(2, 9),
            name: newStaff.name || "Pending...",
            email: newStaff.email,
            role: newStaff.role as "staff",
            status: "invited"
        };

        setStaffList([...staffList, staff]);
        setNewStaff({ name: "", email: "", role: "staff" });
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-heading font-medium tracking-tight">Staff & Team</h2>
                    <p className="text-muted-foreground">Invite your team to collaborate.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full gap-2">
                            <Plus className="h-4 w-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                They will receive an email to join your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="pl-9"
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="pl-9"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={newStaff.role}
                                        onValueChange={(val) => setNewStaff({ ...newStaff, role: val })}
                                    >
                                        <SelectTrigger className="pl-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                            <SelectItem value="manager">Manager (Manage Staff & Bookings)</SelectItem>
                                            <SelectItem value="staff">Staff (View Schedule)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={!newStaff.email}>Send Invite</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffList.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell className="capitalize">{member.role}</TableCell>
                                <TableCell>
                                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                                        {member.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-between pt-8 border-t">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/onboarding/services")}
                    className="text-muted-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    size="lg"
                    className="px-8 rounded-full btn-glow"
                    onClick={() => navigate("/onboarding/inventory")}
                >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
