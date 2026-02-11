import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data
const bookings = [
    { id: 1, customer: "Liam Johnson", service: "Standard Consultation", date: "Today", time: "09:00 AM", status: "confirmed", duration: "60 min", price: "$120" },
    { id: 2, customer: "Emma Wilson", service: "Follow-up", date: "Today", time: "10:30 AM", status: "pending", duration: "30 min", price: "$60" },
    { id: 3, customer: "Noah Brown", service: "Standard Consultation", date: "Today", time: "01:00 PM", status: "completed", duration: "60 min", price: "$120" },
    { id: 4, customer: "Olivia Davis", service: "Premium Package", date: "Tomorrow", time: "09:00 AM", status: "confirmed", duration: "90 min", price: "$200" },
    { id: 5, customer: "William Miller", service: "Standard Consultation", date: "Tomorrow", time: "11:00 AM", status: "cancelled", duration: "60 min", price: "$120" },
];

export default function Bookings() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-heading font-medium tracking-tight">Bookings</h2>
                    <p className="text-muted-foreground">Manage your schedule and appointments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Calendar View
                    </Button>
                    <Button className="gap-2 rounded-full">
                        <Plus className="h-4 w-4" />
                        New Booking
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0 pb-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search bookings..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                <tr>
                                    <th className="py-3 px-4 pl-6">Customer</th>
                                    <th className="py-3 px-4">Service</th>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Duration</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{booking.customer.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{booking.customer}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">{booking.service}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{booking.date}</span>
                                                <span className="text-xs text-muted-foreground">{booking.time}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {booking.duration}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={
                                                booking.status === "confirmed" ? "default" :
                                                    booking.status === "pending" ? "secondary" :
                                                        booking.status === "completed" ? "outline" :
                                                            "destructive"
                                            } className="capitalize">
                                                {booking.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 pr-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">Cancel Booking</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
