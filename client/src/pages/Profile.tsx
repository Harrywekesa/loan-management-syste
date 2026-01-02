import { useState, useEffect } from 'react';
import api, { serverURL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, CreditCard, Save } from 'lucide-react';

export default function Profile() {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        password: '', // Placeholder for future password change
        confirmPassword: ''
    });

    useEffect(() => {
        api.get('/auth/me').then(res => {
            setUser(res.data);
            setFormData(prev => ({
                ...prev,
                fullName: res.data.fullName,
                phoneNumber: res.data.phoneNumber || ''
            }));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await api.patch('/auth/me', {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
            });
            alert('Profile updated successfully');
            // Optimistic update or refresh
            setUser({ ...user, fullName: formData.fullName, phoneNumber: formData.phoneNumber });
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    if (loading || !user) return <div className="p-8 text-center">Loading Profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-6 bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border">
                <div className="relative h-24 w-24">
                    {user.profilePicture ? (
                        <img src={`${serverURL}${user.profilePicture}`} alt="Profile" className="h-24 w-24 rounded-full object-cover shadow-inner" />
                    ) : (
                        <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-inner">
                            {user.fullName.charAt(0)}
                        </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow cursor-pointer border hover:bg-gray-50 text-indigo-600">
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                                const formData = new FormData();
                                formData.append('profilePicture', e.target.files[0]);
                                try {
                                    await api.patch('/auth/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                    window.location.reload();
                                } catch (err) { alert('Failed to upload picture'); }
                            }
                        }} />
                        <User className="w-4 h-4" />
                    </label>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{user.fullName}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex gap-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium uppercase">{user.role}</span>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium uppercase ${user.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {user.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Personal Information Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                        <h2 className="text-lg font-bold mb-6 flex items-center">
                            <User className="w-5 h-5 mr-2 text-primary" />
                            Personal Information
                        </h2>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                    <User className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="254..."
                                    />
                                    <Phone className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center justify-center w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Details Sidebar */}
                <div className="space-y-6">
                    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Account Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground">Email Address</label>
                                <div className="flex items-center text-sm font-medium mt-1">
                                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {user.email}
                                </div>
                            </div>
                            <div className="border-t border-border pt-4">
                                <label className="text-xs text-muted-foreground">ID Number</label>
                                <div className="flex items-center text-sm font-medium mt-1">
                                    <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {user.idNumber || 'Not Set'}
                                </div>
                            </div>
                            {user.role === 'BORROWER' && (
                                <div className="border-t border-border pt-4">
                                    <label className="text-xs text-muted-foreground">Credit Score</label>
                                    <div className={`flex items-center text-lg font-bold mt-1 ${user.creditScore >= 70 ? 'text-green-500' : 'text-yellow-500'
                                        }`}>
                                        {user.creditScore}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Need Help?</h2>
                        <p className="text-sm text-indigo-700 mb-4">Contact support if you need to update your Email or ID Number.</p>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline">Contact Support</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
