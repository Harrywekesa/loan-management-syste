import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wallet, Settings, LogOut, FileText, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const borrowerLinks = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Wallet', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Apply for Loan', href: '/dashboard/apply', icon: FileText },
    ];

    const adminLinks = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Loan Requests', href: '/admin/loans', icon: FileText },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    const links = user?.role === 'BORROWER' ? borrowerLinks : adminLinks;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md dark:bg-gray-800 hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600">LoanSys</h1>
                    <p className="text-xs text-gray-500 mt-1">Logged in as {user?.role}</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                to={link.href}
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
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-10"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow dark:bg-gray-800 md:hidden">
                    <div className="px-4 py-4 flex justify-between items-center">
                        <span className="font-bold text-lg">LoanSys</span>
                        <button onClick={logout}><LogOut className="h-5 w-5" /></button>
                    </div>
                </header>
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
