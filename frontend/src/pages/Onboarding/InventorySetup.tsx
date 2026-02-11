import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Box, Check, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type InventoryItem = {
    id: string;
    name: string;
    qty: string;
    status: "in stock" | "low" | "out";
};

export default function InventorySetup() {
    const navigate = useNavigate();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [finishing, setFinishing] = useState(false);

    // New item form state
    const [newItem, setNewItem] = useState({ name: "", qty: "100" });

    const handleAddItem = () => {
        if (!newItem.name) return;

        const qtyNum = parseInt(newItem.qty);
        let status: "in stock" | "low" | "out" = "in stock";
        if (qtyNum <= 0) status = "out";
        else if (qtyNum < 10) status = "low";

        const item: InventoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: newItem.name,
            qty: newItem.qty,
            status
        };

        setItems([...items, item]);
        setNewItem({ name: "", qty: "100" });
        setIsDialogOpen(false);
    };

    const handleFinish = async () => {
        setFinishing(true);
        // Simulate finalizing setup
        setTimeout(() => {
            navigate("/dashboard");
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-heading font-medium tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Track resources consumed by your services.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full gap-2">
                            <Plus className="h-4 w-4" />
                            Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Inventory Item</DialogTitle>
                            <DialogDescription>
                                Track stock levels for products or resources.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Item Name</Label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="e.g. Shampoo Bottle"
                                        className="pl-9"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="qty">Starting Quantity</Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    value={newItem.qty}
                                    onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddItem} disabled={!newItem.name}>Add Item</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {items.length > 0 ? (
                <div className="border rounded-xl overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Item Name</TableHead>
                                <TableHead>In Stock</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.qty}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                item.status === "in stock" ? "default" :
                                                    item.status === "low" ? "secondary" : "destructive"
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                    <Box className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="font-medium text-muted-foreground">No inventory items</h3>
                    <p className="text-sm text-muted-foreground mt-1">You can skip this step if not needed.</p>
                </div>
            )}

            <div className="flex justify-between pt-8 border-t">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/onboarding/staff")}
                    className="text-muted-foreground"
                    disabled={finishing}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    size="lg"
                    className="px-8 rounded-full btn-glow bg-primary hover:bg-primary/90"
                    onClick={handleFinish}
                    disabled={finishing}
                >
                    {finishing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        <>
                            Complete Setup
                            <Check className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
