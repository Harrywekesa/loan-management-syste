import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function LoanProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any>(null); // null = list, {} = new, object = edit

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        minAmount: '',
        maxAmount: '',
        interestRate: '',
        processingFee: '',
        isFeeFixed: false,
        durationDays: '',
        penaltyRate: '',
        isActive: true
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEdit = (product: any) => {
        setEditing(product);
        setFormData({
            name: product.name,
            minAmount: product.minAmount,
            maxAmount: product.maxAmount,
            interestRate: product.interestRate,
            processingFee: product.processingFee,
            isFeeFixed: product.isFeeFixed,
            durationDays: product.durationDays,
            penaltyRate: product.penaltyRate,
            isActive: product.isActive
        });
    };

    const handleCreate = () => {
        setEditing({});
        setFormData({
            name: '',
            minAmount: '',
            maxAmount: '',
            interestRate: '',
            processingFee: '',
            isFeeFixed: false,
            durationDays: '',
            penaltyRate: '',
            isActive: true
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing.id) {
                await api.patch(`/admin/products/${editing.id}`, formData);
            } else {
                await api.post('/admin/products', formData);
            }
            setEditing(null);
            fetchProducts();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/products/${id}`, { isActive: !currentStatus });
            fetchProducts();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;

    if (editing) {
        return (
            <div className="max-w-2xl bg-card text-card-foreground rounded-lg shadow p-8 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{editing.id ? 'Edit Product' : 'New Product'}</h1>
                    <button onClick={() => setEditing(null)} className="text-gray-500">Cancel</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Product Name</label>
                        <input className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Min Amount</label>
                            <input type="number" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.minAmount} onChange={e => setFormData({ ...formData, minAmount: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Max Amount</label>
                            <input type="number" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.maxAmount} onChange={e => setFormData({ ...formData, maxAmount: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Interest Rate (%)</label>
                            <input type="number" step="0.1" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Duration (Days)</label>
                            <input type="number" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Processing Fee</label>
                            <input type="number" step="0.1" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.processingFee} onChange={e => setFormData({ ...formData, processingFee: e.target.value })} required />
                        </div>
                        <div className="flex items-center mt-6">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" checked={formData.isFeeFixed} onChange={e => setFormData({ ...formData, isFeeFixed: e.target.checked })} />
                                <span className="text-sm">Is Fee Fixed Amount?</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Penalty Rate (% daily)</label>
                        <input type="number" step="0.01" className="w-full border border-input bg-background text-foreground rounded p-2" value={formData.penaltyRate} onChange={e => setFormData({ ...formData, penaltyRate: e.target.value })} required />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                        <span className="text-sm font-medium">Active (Visible to Borrowers)</span>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Save Product</button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Loan Products</h1>
                <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded">Create Product</button>
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden border border-border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Interest</th>
                            <th className="px-6 py-3">Duration</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{p.name}</td>
                                <td className="px-6 py-4">{p.interestRate}%</td>
                                <td className="px-6 py-4">{p.durationDays} Days</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(p.id, p.isActive)}
                                        className={`px-2 py-1 rounded text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {p.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
