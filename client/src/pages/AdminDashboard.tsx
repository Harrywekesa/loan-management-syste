import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, loans: 0, walletBalance: 0 });
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);

            const loansRes = await api.get('/admin/loans');
            setLoans(loansRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        let reason = undefined;
        if (status === 'REJECTED') {
            const input = prompt('Please provide a reason for rejection:');
            if (input === null) return; // Cancelled
            if (!input.trim()) return alert('Reason is required for rejection');
            reason = input;
        } else {
            if (!confirm(`Are you sure you want to ${status} this loan?`)) return;
        }

        setLoading(true);
        try {
            await api.patch(`/admin/loans/${id}`, { status, rejectionReason: reason });
            fetchData(); // Refresh
        } catch (error) {
            alert('Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-500">System overview and management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold mt-2">{stats.users}</p>
                </div>
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium">Pending Loans</h3>
                    <p className="text-3xl font-bold mt-2">{stats.loans}</p>
                </div>
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-muted-foreground text-sm font-medium">System Liquidity (Mock)</h3>
                    <p className="text-3xl font-bold mt-2 text-green-500">KES {Number(stats.walletBalance).toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-semibold">Recent Loan Requests</h3>
                    <button onClick={fetchData} className="text-xs text-primary font-medium hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3">Borrower</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Total Payback</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{loan.user?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{loan.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold">KES {Number(loan.principal).toLocaleString()}</td>
                                    <td className="px-6 py-4">KES {Number(loan.totalPayable).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${loan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    loan.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(loan.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {loan.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(loan.id, 'APPROVED')}
                                                    disabled={loading}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(loan.id, 'REJECTED')}
                                                    disabled={loading}
                                                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No loan requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
