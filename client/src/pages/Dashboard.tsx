import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [totalLoanBalance, setTotalLoanBalance] = useState(0);

    useEffect(() => {
        // Fetch Wallet
        api.get('/wallet').then(res => setWallet(res.data)).catch(console.error);

        // Fetch My Loans
        api.get('/loans/my').then(res => {
            setLoans(res.data);
            const balance = res.data.reduce((acc: number, loan: any) => acc + Number(loan.balance), 0);
            setTotalLoanBalance(balance);
        }).catch(console.error);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.fullName || user?.email}</h1>
                <p className="text-gray-500 mt-2">Here is your financial overview</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Active Loan Balance</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">KES {totalLoanBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Wallet Balance</h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">KES {Number(wallet?.balance || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500">Credit Score</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">750</p>
                </div>
            </div>

            <div className="rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Active Loans</h3>
                    <Link to="/dashboard/apply" className="text-xs font-semibold text-white bg-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-700">New Application</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Principal</th>
                                <th className="px-6 py-3">Balance</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 font-medium">{loan.product?.name || 'Loan'}</td>
                                    <td className="px-6 py-4">KES {Number(loan.principal).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">KES {Number(loan.balance).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${loan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    loan.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active loans found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
