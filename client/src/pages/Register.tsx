import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        idNumber: '',
        phoneNumber: '',
        termsAccepted: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', {
                ...formData,
                termsVersion: '1.0'
            });
            login(res.data.token, res.data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                <div><h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">Create an account</h2></div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <input className="block w-full rounded-md border py-2 px-3" placeholder="Full Name" required
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    <input className="block w-full rounded-md border py-2 px-3" placeholder="Email" type="email" required
                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    <input className="block w-full rounded-md border py-2 px-3" placeholder="ID Number" required
                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })} />
                    <input className="block w-full rounded-md border py-2 px-3" placeholder="Phone Number" required
                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                    <input className="block w-full rounded-md border py-2 px-3" placeholder="Password" type="password" required
                        onChange={e => setFormData({ ...formData, password: e.target.value })} />

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="rounded border-gray-300"
                            checked={formData.termsAccepted}
                            onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600">
                            I accept the <span className="text-indigo-600 underline cursor-pointer">Terms & Conditions</span>
                        </label>
                    </div>

                    <button type="submit" disabled={loading || !formData.termsAccepted} className="w-full rounded-md bg-indigo-600 py-2 text-white disabled:opacity-50">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="text-center text-sm"><Link to="/login" className="text-indigo-600">Already have an account? Sign in</Link></div>
            </div>
        </div>
    );
}
