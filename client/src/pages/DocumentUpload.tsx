import { useState } from 'react';
import api from '../lib/api';

export default function DocumentUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('ID_FRONT');
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);

        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Document uploaded successfully!');
            setFile(null);
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Upload KYC Documents</h2>
            <div className="space-y-4">
                <select className="border p-2 w-full rounded" value={type} onChange={e => setType(e.target.value)}>
                    <option value="ID_FRONT">National ID (Front)</option>
                    <option value="ID_BACK">National ID (Back)</option>
                    <option value="PASSPORT_PHOTO">Passport Photo</option>
                </select>

                <input
                    type="file"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                />

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
                >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
            </div>
        </div>
    );
}
