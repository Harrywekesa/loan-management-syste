import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import RepayLoanModal from '../components/RepayLoanModal';

export default function Dashboard() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [totalLoanBalance, setTotalLoanBalance] = useState(0);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const fetchLoans = () => {
        setError(null);
        api.get('/loans/my').then(res => {
            setLoans(res.data);
            const balance = res.data.reduce((acc: number, loan: any) => {
                // Only sum up Active, Defaulted, or Pending (if debt exists)
                // Exclude REJECTED and PAID
                if (loan.status === 'REJECTED' || loan.status === 'PAID') return acc;
                return acc + Number(loan.balance);
            }, 0);
            setTotalLoanBalance(balance);
        }).catch(err => {
            console.error(err);
            setError('Failed to load loans. Please try again later.');
        });
    };

    useEffect(() => {
        api.get('/wallet').then(res => setWallet(res.data)).catch(err => {
            console.error(err);
            // Not setting main error here to avoid blocking loan view, but could be added
        });
        fetchLoans();
    }, []);

    const handleRepayClick = (loan: any) => {
        setSelectedLoan(loan);
        setIsRepayModalOpen(true);
    };

    const handleRepaymentSuccess = () => {
        fetchLoans();
    };

    const getScoreColor = (score: number) => {
        if (score >= 700) return 'text-green-500';
        if (score >= 500) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.fullName || user?.email}</h1>
                <p className="text-gray-500 mt-2">Here is your financial overview</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl bg-card text-card-foreground p-6 shadow-sm border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">Active Loan Balance</h3>
                    <p className="mt-2 text-3xl font-bold">KES {totalLoanBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-card text-card-foreground p-6 shadow-sm border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">Wallet Balance</h3>
                    <p className="mt-2 text-3xl font-bold text-green-500">KES {Number(wallet?.balance || 0).toLocaleString()}</p>
                </div>

                {user?.role === 'BORROWER' && (
                    <div className="rounded-xl bg-card text-card-foreground p-6 shadow-sm border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">Credit Score</h3>
                        <p className={`mt-2 text-3xl font-bold ${getScoreColor(user?.creditScore || 50)}`}>{user?.creditScore || 50}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(user?.creditScore || 50) >= 700 ? 'Excellent' : (user?.creditScore || 50) >= 500 ? 'Good' : 'At Risk'}
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                    <p className="font-medium">Error loading data</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Repayment Schedule Section for Active Loans */}
            {loans.some(l => l.status === 'APPROVED' || l.status === 'active') && (
                <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm">
                    <h3 className="font-semibold text-muted-foreground mb-4">Upcoming Repayments</h3>
                    <div className="space-y-3">
                        {loans.filter(l => l.status === 'APPROVED' || l.status === 'active').map(loan => {
                            const daysLeft = loan.dueDate ? Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                                <div key={loan.id} className="flex justify-between items-center text-sm p-3 bg-muted/20 rounded-md">
                                    <span className="font-medium">{loan.product?.name}</span>
                                    <span className={daysLeft < 3 ? "text-red-500 font-bold" : "text-muted-foreground"}>
                                        Due in {daysLeft} days ({new Date(loan.dueDate).toLocaleDateString()})
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-card text-card-foreground shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h3 className="font-semibold">All Loans</h3>
                    <Link to="/dashboard/apply" className="text-xs font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded hover:opacity-90">New Application</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Principal</th>
                                <th className="px-6 py-3">Penalties</th>
                                <th className="px-6 py-3">Balance</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 font-medium">{loan.product?.name || 'Loan'}</td>
                                    <td className="px-6 py-4">KES {Number(loan.principal).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-600">KES {Number(loan.accruedPenalty).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">KES {Number(loan.balance).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium w-max
                          ${loan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        loan.status === 'DEFAULTED' ? 'bg-red-100 text-red-800' :
                                                            loan.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {loan.status}
                                            </span>
                                            {loan.status === 'REJECTED' && loan.rejectionReason && (
                                                <span className="text-xs text-red-600 mt-1 max-w-[150px]">{loan.rejectionReason}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        {loan.balance > 0 && !['PENDING', 'REJECTED', 'PAID'].includes(loan.status) && (
                                            <button onClick={() => handleRepayClick(loan)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Repay</button>
                                        )}
                                    </td>                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No active loans found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedLoan && (
                <RepayLoanModal
                    isOpen={isRepayModalOpen}
                    onClose={() => setIsRepayModalOpen(false)}
                    loan={selectedLoan}
                    onRepaymentSuccess={handleRepaymentSuccess}
                />
            )}
        </div>
    );
}
