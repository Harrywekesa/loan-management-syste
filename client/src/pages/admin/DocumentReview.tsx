import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';

export default function DocumentReview() {
    const [documents, setDocuments] = useState<any[]>([]);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const fetchDocs = useCallback(async () => {
        try {
            const res = await api.get('/documents/pending');
            console.log('Docs response:', JSON.stringify(res.data));
            if (Array.isArray(res.data)) {
                setDocuments(res.data);
            } else {
                console.error('Unexpected response format:', res.data);
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching docs:', error);
        }
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Mark document as ${status}?`)) return;
        try {
            await api.patch(`/documents/${id}/review`, { status });
            fetchDocs();
        } catch (error) {
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Document Verification</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Document</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium">{doc.user?.fullName}</div>
                                    <div className="text-xs text-gray-500">{doc.user?.idNumber}</div>
                                </td>
                                <td className="px-6 py-4">{doc.title}</td>
                                <td className="px-6 py-4">
                                    <a href={`${apiUrl.replace('/api', '')}/${doc.url.replace(/\\/g, '/')}`} target="_blank" className="text-blue-600 underline">View</a>
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleReview(doc.id, 'APPROVED')} className="text-green-600 hover:text-green-800 font-medium">Approve</button>
                                    <button onClick={() => handleReview(doc.id, 'REJECTED')} className="text-red-600 hover:text-red-800 font-medium">Reject</button>
                                </td>
                            </tr>
                        ))}
                        {documents.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No pending documents.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
