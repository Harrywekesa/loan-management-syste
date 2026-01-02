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
    const [error, setError] = useState<string | null>(null); // To hold a potential error message

    useEffect(() => {
        api.get('/loans/products').then(res => setProducts(res.data)).catch(err => {
            // Check if 403 (Maintenance/Disabled)
            if (err.response && err.response.status === 403) {
                setError(err.response.data.message);
                setLoading(true); // Disable form
            }
        });
    }, []);

    useEffect(() => {
        if (selectedProduct && amount) {
            const delay = setTimeout(() => {
                setError(null); // Reset error on new calculation
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
        setError(null); // Reset error before applying
        try {
            await api.post('/loans/apply', { productId: selectedProduct, amount: Number(amount) });
            alert('Application submitted successfully!');
            navigate('/dashboard');
        } catch (err: any) {
            // Display the specific error message from the backend
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Apply for a Loan</h1>

            <div className="space-y-4 bg-card text-card-foreground p-6 rounded-lg shadow border border-border">
                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Application Failed: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Global Disable Overlay or Message if specific error from products fetch says "disabled" */}

                {/* Global Disable Overlay or Message if specific error from products fetch says "disabled" */}
                {/* Logic above sets error. If error is present, we often just want to show that. */}

                <div>
                    <label className="block text-sm font-medium mb-1">Select Product</label>
                    <select
                        className="w-full border border-input bg-background text-foreground rounded p-2"
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">-- Select a Loan Product --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id} disabled={!p.isActive}>
                                {p.name} (Up to {p.maxAmount.toLocaleString()}) {!p.isActive && '[Inactive]'}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Amount to Borrow</label>
                    <input
                        type="number"
                        className="w-full border border-input bg-background text-foreground rounded p-2"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="e.g., 5000"
                        disabled={loading}
                    />
                </div>

                {calculation && (
                    <div className="bg-muted/50 p-4 rounded text-sm space-y-2 border border-border">
                        <h3 className="font-semibold">Loan Breakdown</h3>
                        <div className="flex justify-between"><span>Principal:</span> <span className="font-medium">{calculation.principal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Interest:</span> <span className="font-medium">{calculation.interest.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Processing Fee:</span> <span className="font-medium">{calculation.processingFee.toLocaleString()}</span></div>
                        <div className="flex justify-between text-green-600 font-bold"><span>Amount to be Credited to Wallet:</span> <span>{calculation.walletCredit.toLocaleString()}</span></div>
                        <div className="flex justify-between border-t border-border mt-2 pt-2 font-bold"><span>Total Repayable Amount:</span> <span>{calculation.totalRepayable.toLocaleString()}</span></div>
                        <div className="text-xs text-center text-muted-foreground mt-2">Due in {calculation.durationDays} days</div>
                    </div>
                )}

                <button
                    onClick={handleApply}
                    disabled={!calculation || loading}
                    className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {loading ? 'Submitting Application...' : 'Submit Application'}
                </button>
            </div>
        </div>
    );
}
