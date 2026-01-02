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
        <div className="space-y-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">My Wallet</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card - Glassmorphism */}
                <div className="relative overflow-hidden rounded-2xl bg-card/30 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>

                    <div className="relative z-10">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance</h3>
                        <p className="text-5xl font-bold mt-4 text-white tracking-tight">KES {Number(wallet.balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>

                        <div className="mt-8 flex gap-3">
                            <input
                                type="number"
                                placeholder="Amount to withdraw"
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                            />
                            <button
                                onClick={handleWithdraw}
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            >
                                {loading ? 'Processing...' : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table - Glassmorphism */}
            <div className="rounded-2xl bg-card/30 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                    <h3 className="font-semibold text-lg text-white">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-muted-foreground bg-black/20 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-8 py-4">Type</th>
                                <th className="px-8 py-4">Amount</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {wallet.transactions?.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-4 font-medium text-white">{tx.type}</td>
                                    <td className={`px-8 py-4 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'DISBURSEMENT' || tx.type.includes('CREDIT') ? 'text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                                        {tx.type === 'DEPOSIT' || tx.type === 'DISBURSEMENT' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                            ${tx.status === 'COMPLETED' ? 'bg-primary/20 text-primary border border-primary/20' :
                                                tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' :
                                                    'bg-red-500/20 text-red-500 border border-red-500/20'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {wallet.transactions?.length === 0 && (
                                <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-500">No transactions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
