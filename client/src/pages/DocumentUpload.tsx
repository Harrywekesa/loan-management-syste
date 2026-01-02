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
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">KYC Verification</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Upload Section - Glassmorphism */}
                <div className="rounded-2xl bg-card/30 backdrop-blur-xl border border-white/10 p-8 shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                    <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                        <File className="w-5 h-5 text-primary" /> Upload Documents
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Document Type</label>
                            <select
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="ID_FRONT" className="bg-gray-900 text-white">National ID (Front)</option>
                                <option value="ID_BACK" className="bg-gray-900 text-white">National ID (Back)</option>
                                <option value="PASSPORT_PHOTO" className="bg-gray-900 text-white">Passport Photo</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Select File</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    className="block w-full text-sm text-gray-400
                                    file:mr-4 file:py-3 file:px-6
                                    file:rounded-xl file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary/10 file:text-primary
                                    hover:file:bg-primary/20
                                    cursor-pointer bg-black/20 border border-white/10 rounded-xl"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl disabled:opacity-50 font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-all transform"
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </div>

                {/* List Section - Glassmorphism */}
                <div className="rounded-2xl bg-card/30 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                    <h3 className="text-xl font-bold mb-6 text-white">My Uploads</h3>
                    <div className="space-y-4">
                        {user?.documents && user.documents.length > 0 ? (
                            user.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center">
                                        {getStatusIcon(doc.status)}
                                        <div className="ml-4">
                                            <p className="font-medium text-white">{doc.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border 
                                            ${doc.status === 'APPROVED' ? 'border-green-500/30 text-green-500 bg-green-500/10' :
                                                doc.status === 'REJECTED' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                                    'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>
                                            {doc.status}
                                        </span>
                                        <a href={`${serverURL}${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            View
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                                <File className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500">No documents uploaded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
