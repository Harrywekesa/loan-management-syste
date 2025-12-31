import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ApplyLoan() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [amount, setAmount] = useState('');
    const [calculation, setCalculation] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/loans/products').then(res => setProducts(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedProduct && amount) {
            const delay = setTimeout(() => {
                api.post('/loans/calculate', { productId: selectedProduct, amount: Number(amount) })
                    .then(res => setCalculation(res.data))
                    .catch(() => setCalculation(null));
            }, 500);
            return () => clearTimeout(delay);
        }
    }, [selectedProduct, amount]);

    const handleApply = async () => {
        if (!calculation) return;
        setLoading(true);
        try {
            await api.post('/loans/apply', { productId: selectedProduct, amount: Number(amount) });
            navigate('/dashboard');
        } catch (error) {
            alert('Application failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Apply for a Loan</h1>

            <div className="space-y-4 bg-white p-6 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium mb-1">Select Product</label>
                    <select className="w-full border rounded p-2" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">-- Select --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Max: {p.maxAmount})</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input type="number" className="w-full border rounded p-2" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>

                {calculation && (
                    <div className="bg-gray-50 p-4 rounded text-sm space-y-2 border">
                        <h3 className="font-semibold">Calculation Breakdown</h3>
                        <div className="flex justify-between"><span>Principal:</span> <span>{calculation.principal}</span></div>
                        <div className="flex justify-between"><span>Interest:</span> <span>{calculation.interest}</span></div>
                        <div className="flex justify-between"><span>Processing Fee:</span> <span>{calculation.processingFee}</span></div>
                        <div className="flex justify-between text-green-600 font-bold"><span>Wallet Credit:</span> <span>{calculation.walletCredit}</span></div>
                        <div className="flex justify-between border-t mt-2 pt-2 font-bold"><span>Total Repayable:</span> <span>{calculation.totalRepayable}</span></div>
                        <div className="text-xs text-gray-500 mt-2">Due in {calculation.durationDays} days</div>
                    </div>
                )}

                <button
                    onClick={handleApply}
                    disabled={!calculation || loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                </button>
            </div>
        </div>
    );
}
