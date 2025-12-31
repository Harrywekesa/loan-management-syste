import { useState } from 'react';
import api, { serverURL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { File, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function DocumentUpload() {
    const { user, login } = useAuth(); // We might need to refresh the user after upload
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('ID_FRONT');
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('document', file);
        // This maps the frontend type to the backend expected title
        const titleMap: { [key: string]: string } = {
            ID_FRONT: 'National ID (Front)',
            ID_BACK: 'National ID (Back)',
            PASSPORT_PHOTO: 'Passport Photo',
        };
        formData.append('title', titleMap[type]);

        try {
            const res = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh user documents in context
            const meRes = await api.get('/auth/me');
            const token = localStorage.getItem('token');
            if (token) {
                login(token, meRes.data);
            }

            alert('Document uploaded successfully!');
            setFile(null);
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="text-green-500" />;
            case 'PENDING': return <Clock className="text-yellow-500" />;
            case 'REJECTED': return <XCircle className="text-red-500" />;
            default: return <File className="text-gray-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6">Upload KYC Documents</h2>
                <div className="space-y-6">
                    <select className="border p-3 w-full rounded-lg bg-gray-50" value={type} onChange={e => setType(e.target.value)}>
                        <option value="ID_FRONT">National ID (Front)</option>
                        <option value="ID_BACK">National ID (Back)</option>
                        <option value="PASSPORT_PHOTO">Passport Photo</option>
                    </select>

                    <input
                        type="file"
                        className="block w-full text-md text-gray-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                    />

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg disabled:opacity-50 font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold mb-6">My Uploaded Documents</h3>
                <div className="space-y-4">
                    {user?.documents && user.documents.length > 0 ? (
                        user.documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                                <div className="flex items-center">
                                    {getStatusIcon(doc.status)}
                                    <span className="ml-4 font-medium">{doc.title}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500 font-medium">{doc.status}</span>
                                    <a href={`${serverURL}${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        View
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">No documents uploaded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
