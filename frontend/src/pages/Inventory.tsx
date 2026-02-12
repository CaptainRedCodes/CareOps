import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Package, Plus, Search, AlertTriangle, TrendingDown,
    MoreHorizontal, Edit, Trash2, BarChart3, X
} from 'lucide-react';
import api from '@/api/client';

interface InventoryItem {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    quantity: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_low_stock: boolean;
    created_at: string;
}

interface LowStockAlert {
    item_id: string;
    item_name: string;
    current_quantity: number;
    threshold: number;
    unit: string;
}

const Inventory: React.FC = () => {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({
        name: '', description: '', unit: 'units', quantity: 0, low_stock_threshold: 5
    });

    useEffect(() => {
        loadData();
    }, [workspaceId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsRes, alertsRes] = await Promise.all([
                api.get(`/workspaces/${workspaceId}/inventory/items?active_only=false`),
                api.get(`/workspaces/${workspaceId}/inventory/alerts`)
            ]);
            setItems(itemsRes.data);
            setAlerts(alertsRes.data);
        } catch (err) {
            console.error('Failed to load inventory', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingItem) {
                await api.put(`/workspaces/${workspaceId}/inventory/items/${editingItem.id}`, formData);
            } else {
                await api.post(`/workspaces/${workspaceId}/inventory/items`, formData);
            }
            setShowAddModal(false);
            setEditingItem(null);
            setFormData({ name: '', description: '', unit: 'units', quantity: 0, low_stock_threshold: 5 });
            loadData();
        } catch (err) {
            console.error('Failed to save item', err);
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/inventory/items/${itemId}`);
            loadData();
        } catch (err) {
            console.error('Failed to delete item', err);
        }
    };

    const openEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            unit: item.unit,
            quantity: item.quantity,
            low_stock_threshold: item.low_stock_threshold
        });
        setShowAddModal(true);
    };

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full bg-background text-foreground overflow-y-auto">
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 stagger-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-medium text-foreground">Inventory</h1>
                        <p className="text-muted-foreground mt-1">Track resources, supplies, and stock levels.</p>
                    </div>
                    <button
                        onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', unit: 'units', quantity: 0, low_stock_threshold: 5 }); setShowAddModal(true); }}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors btn-glow shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                    </button>
                </div>

                {/* Alerts Banner */}
                {alerts.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <span className="font-medium text-destructive">Low Stock Alerts ({alerts.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {alerts.map(a => (
                                <span key={a.item_id} className="bg-destructive/20 text-destructive text-xs px-3 py-1 rounded-full font-medium">
                                    {a.item_name}: {a.current_quantity} {a.unit} left
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Items Table */}
                    <div className="flex-1">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 bg-card border border-border rounded-xl">
                                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-foreground mb-1">No inventory items</h3>
                                <p className="text-muted-foreground text-sm">Add items to start tracking your resources.</p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-secondary/30">
                                        <tr>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Item</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Stock</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Threshold</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filtered.map(item => (
                                            <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{item.name}</div>
                                                    {item.description && <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{item.quantity}</span>
                                                    <span className="text-muted-foreground ml-1 text-sm">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-sm">{item.low_stock_threshold} {item.unit}</td>
                                                <td className="px-4 py-3">
                                                    {item.quantity <= item.low_stock_threshold ? (
                                                        <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full font-medium">
                                                            <TrendingDown className="w-3 h-3" /> Low
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                                                            In Stock
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Stats */}
                    <div className="w-full lg:w-72 space-y-6">
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
                            <h3 className="font-heading text-xl mb-4">Overview</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Total Items</span>
                                    <span className="font-medium text-lg">{items.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-primary-foreground/80 text-sm">Low Stock</span>
                                    <span className="font-medium text-lg">{alerts.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary-foreground/80 text-sm">Active</span>
                                    <span className="font-medium text-lg">{items.filter(i => i.is_active).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h2 className="text-lg font-heading font-medium">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Item name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Optional description" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
                                        <input type="number" min="0" step="0.1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                                        <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                            <option value="units">Units</option>
                                            <option value="pcs">Pieces</option>
                                            <option value="ml">ml</option>
                                            <option value="kg">kg</option>
                                            <option value="liters">Liters</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Low Stock Threshold</label>
                                    <input type="number" min="0" step="0.1" value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-6 border-t border-border">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={!formData.name}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Inventory;
