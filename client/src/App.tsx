import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplyLoan from './pages/ApplyLoan';
import WalletPage from './pages/WalletPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-background text-foreground">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="apply" element={<ApplyLoan />} />
                        <Route path="wallet" element={<WalletPage />} />
                    </Route>

                    <Route path="/admin" element={<DashboardLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="loans" element={<AdminDashboard />} />
                        <Route path="users" element={<div>User Management Placeholder</div>} />
                    </Route>
                </Routes>
            </div>
        </AuthProvider>
    )
}

export default App
