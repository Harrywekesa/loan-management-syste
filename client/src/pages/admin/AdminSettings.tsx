import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function AdminSettings() {
    const [settings, setSettings] = useState<any>({
        site_name: 'Loan App',
        maintenance_mode: 'false',
        allow_registration: 'true',
        allow_loans: 'true',
        theme_color: '#4F46E5',
        contact_email: '',
        privacy_policy: '',
        terms_conditions: ''
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchLogs();
    }, []);

    const fetchSettings = () => api.get('/admin/settings').then(res => setSettings((prev: any) => ({ ...prev, ...res.data })));
    const fetchLogs = () => api.get('/admin/audit-logs').then(res => setLogs(res.data));

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/admin/settings', settings);
            alert('Settings saved!');
            fetchLogs(); // Refresh logs
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">System Configuration</h1>

            <div className="flex border-b">
                <button className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-indigo-600 font-bold' : ''}`} onClick={() => setActiveTab('general')}>General & Branding</button>
                <button className={`px-4 py-2 ${activeTab === 'features' ? 'border-b-2 border-indigo-600 font-bold' : ''}`} onClick={() => setActiveTab('features')}>Features & Maintenance</button>
                <button className={`px-4 py-2 ${activeTab === 'content' ? 'border-b-2 border-indigo-600 font-bold' : ''}`} onClick={() => setActiveTab('content')}>Legal & Content</button>
                <button className={`px-4 py-2 ${activeTab === 'audits' ? 'border-b-2 border-indigo-600 font-bold' : ''}`} onClick={() => setActiveTab('audits')}>Audit Logs</button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Site Name</label>
                            <input type="text" className="w-full border p-2 rounded" value={settings.site_name} onChange={e => setSettings({ ...settings, site_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Theme Color</label>
                            <input type="color" className="w-full h-10 p-1 border rounded" value={settings.theme_color} onChange={e => setSettings({ ...settings, theme_color: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Logo URL</label>
                            <input type="text" className="w-full border p-2 rounded" value={settings.logo_url || ''} onChange={e => setSettings({ ...settings, logo_url: e.target.value })} />
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border p-4 rounded">
                            <span>Maintenance Mode</span>
                            <input type="checkbox" className="h-5 w-5" checked={settings.maintenance_mode === 'true'} onChange={e => setSettings({ ...settings, maintenance_mode: String(e.target.checked) })} />
                        </div>
                        <div className="flex items-center justify-between border p-4 rounded">
                            <span>Allow Registration</span>
                            <input type="checkbox" className="h-5 w-5" checked={settings.allow_registration === 'true'} onChange={e => setSettings({ ...settings, allow_registration: String(e.target.checked) })} />
                        </div>
                        <div className="flex items-center justify-between border p-4 rounded">
                            <span>Allow Loan Applications</span>
                            <input type="checkbox" className="h-5 w-5" checked={settings.allow_loans === 'true'} onChange={e => setSettings({ ...settings, allow_loans: String(e.target.checked) })} />
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Contact Email</label>
                            <input type="email" className="w-full border p-2 rounded" value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Terms & Conditions</label>
                            <textarea className="w-full border p-2 rounded h-32" value={settings.terms_conditions} onChange={e => setSettings({ ...settings, terms_conditions: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Privacy Policy</label>
                            <textarea className="w-full border p-2 rounded h-32" value={settings.privacy_policy} onChange={e => setSettings({ ...settings, privacy_policy: e.target.value })} />
                        </div>
                    </div>
                )}

                {activeTab === 'audits' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Admin</th>
                                    <th className="px-4 py-2">Action</th>
                                    <th className="px-4 py-2">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="border-b">
                                        <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="px-4 py-2">{log.actor?.fullName}</td>
                                        <td className="px-4 py-2 font-semibold">{log.action}</td>
                                        <td className="px-4 py-2 text-gray-600 truncate max-w-xs">{log.details}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan={4} className="text-center py-4">No logs found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab !== 'audits' && (
                    <div className="mt-6">
                        <button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
