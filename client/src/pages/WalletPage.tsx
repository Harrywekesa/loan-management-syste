import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function WalletPage() {
    const [wallet, setWallet] = useState<any>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchWallet = () => {
        api.get('/wallet').then(res => setWallet(res.data)).catch(console.error);
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleWithdraw = async () => {
        if (!withdrawAmount) return;
        setLoading(true);
        try {
            await api.post('/wallet/withdraw', { amount: Number(withdrawAmount) });
            fetchWallet();
            setWithdrawAmount('');
            alert('Withdrawal initiated');
        } catch (error) {
            alert('Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    if (!wallet) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">My Wallet</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm text-gray-500">Available Balance</h3>
                    <p className="text-4xl font-bold mt-2">KES {Number(wallet.balance).toFixed(2)}</p>

                    <div className="mt-6 flex gap-2">
                        <input
                            type="number"
                            placeholder="Amount to withdraw"
                            className="border p-2 rounded flex-1"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                        />
                        <button
                            onClick={handleWithdraw}
                            disabled={loading}
                            className="bg-green-600 text-white px-4 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            Withdraw to M-Pesa
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b"><h3 className="font-semibold">Recent Transactions</h3></div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wallet.transactions?.map((tx: any) => (
                            <tr key={tx.id} className="border-b">
                                <td className="px-6 py-3">{tx.type}</td>
                                <td className={`px-6 py-3 ${tx.type === 'DEPOSIT' || tx.type === 'DISBURSEMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {Number(tx.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-3">{tx.status}</td>
                                <td className="px-6 py-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {wallet.transactions?.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No transactions found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
