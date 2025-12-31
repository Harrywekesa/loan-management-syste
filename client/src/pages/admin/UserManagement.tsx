import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Change status to ${newStatus}?`)) return;
        try {
            await api.patch(`/admin/users/${id}/status`, { status: newStatus });
            fetchUsers();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{user.fullName}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                        user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 space-x-2 flex items-center">
                                    <button onClick={() => setSelectedUserId(user.id)} className="text-indigo-600 hover:text-indigo-800 font-medium">View Details</button>
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    {user.status !== 'VERIFIED' && user.status !== 'SUSPENDED' && (
                                        <button onClick={() => updateStatus(user.id, 'VERIFIED')} className="text-green-600 hover:text-green-800 font-medium">Verify</button>
                                    )}
                                    {user.status !== 'SUSPENDED' && user.role !== 'SUPER_ADMIN' && (
                                        <button onClick={() => updateStatus(user.id, 'SUSPENDED')} className="text-red-600 hover:text-red-800 font-medium">Suspend</button>
                                    )}
                                    {user.status === 'SUSPENDED' && (
                                        <button onClick={() => updateStatus(user.id, 'VERIFIED')} className="text-blue-600 hover:text-blue-800 font-medium">Reactivate</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUserId && <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
        </div>
    );
}

function UserDetailsModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'documents' | 'loans'>('overview');

    useEffect(() => {
        api.get(`/admin/users/${userId}`).then(res => setUser(res.data)).finally(() => setLoading(false));
    }, [userId]);

    if (!user && !loading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading user details...</div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{user.status}</span>
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase">{user.role}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b">
                            <button onClick={() => setTab('overview')} className={`flex-1 py-3 text-sm font-medium ${tab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
                            <button onClick={() => setTab('documents')} className={`flex-1 py-3 text-sm font-medium ${tab === 'documents' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Documents ({user.documents.length})</button>
                            <button onClick={() => setTab('loans')} className={`flex-1 py-3 text-sm font-medium ${tab === 'loans' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Loans ({user.loans.length})</button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {tab === 'overview' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Phone Number</p>
                                        <p className="font-medium text-gray-900">{user.phoneNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ID Number</p>
                                        <p className="font-medium text-gray-900">{user.idNumber || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2 border-t pt-4">
                                        <p className="text-sm text-gray-500">Wallet Balance</p>
                                        <p className="text-2xl font-bold text-gray-900">KES {Number(user.wallet?.balance || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 border-t pt-4">
                                        <p className="text-sm text-gray-500">Credit Score</p>
                                        <p className="text-xl font-bold text-indigo-600">{user.creditScore}</p>
                                    </div>
                                </div>
                            )}

                            {tab === 'documents' && (
                                <div className="space-y-4">
                                    {user.documents.length === 0 ? <p className="text-gray-500 text-center py-4">No documents uploaded.</p> : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {user.documents.map((doc: any) => (
                                                <div key={doc.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                                    <p className="font-medium text-sm text-gray-900 mb-1 capitalize">{doc.type.replace('_', ' ')}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>{doc.status}</span>
                                                        <a href={`http://localhost:3000${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View</a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {tab === 'loans' && (
                                <div className="space-y-4">
                                    {user.loans.length === 0 ? <p className="text-gray-500 text-center py-4">No loan history.</p> : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead>
                                                    <tr className="text-gray-500 border-b">
                                                        <th className="py-2">Date</th>
                                                        <th className="py-2">Amount</th>
                                                        <th className="py-2">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {user.loans.map((loan: any) => (
                                                        <tr key={loan.id} className="border-b">
                                                            <td className="py-2">{new Date(loan.createdAt).toLocaleDateString()}</td>
                                                            <td className="py-2 font-medium">KES {Number(loan.amount).toLocaleString()}</td>
                                                            <td className="py-2"><span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{loan.status}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
