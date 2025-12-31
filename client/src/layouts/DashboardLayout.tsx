import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wallet, Settings, LogOut, FileText, Users, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { serverURL } from '../lib/api';

import { useSettings } from '../context/SettingsContext';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { siteName, themeColor } = useSettings();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const passportPhoto = user?.documents?.find(doc => doc.title === 'Passport Photo');

    const borrowerLinks = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Wallet', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Apply for Loan', href: '/dashboard/apply', icon: FileText },
        { name: 'KYC Documents', href: '/dashboard/upload', icon: FileText },
        { name: 'My Profile', href: '/dashboard/profile', icon: Users },
    ];

    const adminLinks = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Loan Requests', href: '/admin/loans', icon: FileText },
        { name: 'Products', href: '/admin/products', icon: Settings },
        { name: 'Document Review', href: '/admin/documents', icon: FileText },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'My Profile', href: '/admin/profile', icon: Users },
    ];

    const links = user?.role === 'BORROWER' ? borrowerLinks : adminLinks;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
                {passportPhoto ? (
                    <img
                        src={`${serverURL}${passportPhoto.url}`}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover mb-3"
                    />
                ) : (
                    <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-2xl mb-3" style={{ color: themeColor, backgroundColor: `${themeColor}20` }}>
                        {user?.fullName ? user.fullName.charAt(0) : user?.email?.charAt(0).toUpperCase()}
                    </div>
                )}
                <h2 className="text-sm font-bold text-gray-900 truncate w-full" title={user?.fullName}>
                    {user?.fullName || user?.email}
                </h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">{user?.role}</span>
            </div>
            <div className="mt-4 text-center pb-4 border-b border-gray-50">
                <h1 className="text-xl font-bold" style={{ color: themeColor }}>{siteName}</h1>
            </div>
            <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            to={link.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                location.pathname === link.href
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            )}
                        >
                            <Icon className="mr-3 h-5 w-5" />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Static Sidebar for Desktop */}
            <div className="w-64 bg-white shadow-md dark:bg-gray-800 hidden md:block">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <div className={cn("fixed inset-0 z-40 md:hidden", { "block": isSidebarOpen, "hidden": !isSidebarOpen })}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
                {/* Sidebar */}
                <div className="relative w-64 bg-white shadow-md dark:bg-gray-800 h-full">
                    <SidebarContent />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto flex flex-col">
                <header className="bg-white shadow dark:bg-gray-800 md:hidden">
                    <div className="px-4 py-4 flex justify-between items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-bold text-lg" style={{ color: themeColor }}>{siteName}</span>
                        <button onClick={logout}><LogOut className="h-5 w-5 text-gray-600" /></button>
                    </div>
                </header>
                <main className="p-8 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
