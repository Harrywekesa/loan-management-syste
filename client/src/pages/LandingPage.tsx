import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Shield, Clock, Banknote } from 'lucide-react';
import { serverURL } from '../lib/api';

export default function LandingPage() {
    const { siteName, themeColor, logoUrl } = useSettings();
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navbar */}
            <nav className="border-b border-gray-100 py-4">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {logoUrl && (
                            <img src={logoUrl.startsWith('http') ? logoUrl : `${serverURL}${logoUrl}`} alt={siteName} className="h-10 w-auto object-contain" />
                        )}
                        <h1 className="text-2xl font-bold" style={{ color: themeColor }}>{siteName}</h1>
                    </div>
                    <div className="space-x-4">
                        {user ? (
                            <Link to="/dashboard" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">Login</Link>
                                <Link to="/register" className="px-4 py-2 text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: themeColor }}>
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-8 py-20">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                        Financial Decisions <br />
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #9333ea)` }}>
                            Made Simple.
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Get instant loans with flexible repayment plans. No hidden fees, just transparent financial growth.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/register" className="px-8 py-3 text-lg font-bold text-white rounded-xl shadow-xl hover:translate-y-[-2px] transition-transform flex items-center" style={{ backgroundColor: themeColor }}>
                            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <Link to="/login" className="px-8 py-3 text-lg font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                            Login
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Instant Approval</h3>
                        <p className="text-gray-600">Our automated systems review your application in seconds.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 text-green-600">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Flexible Repayment</h3>
                        <p className="text-gray-600">Choose a plan that works for you. Early repayment discounts available.</p>
                    </div>
                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
                        <p className="text-gray-600">Your data is encrypted and protected with bank-grade security.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
