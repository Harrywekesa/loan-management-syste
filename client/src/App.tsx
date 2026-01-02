import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext'; // Import
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplyLoan from './pages/ApplyLoan';
import WalletPage from './pages/WalletPage';
import DocumentUpload from './pages/DocumentUpload';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import DocumentReview from './pages/admin/DocumentReview';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/AdminSettings';
import LoanProducts from './pages/admin/LoanProducts';
import AdminReports from './pages/admin/AdminReports'; // Import
import Profile from './pages/Profile'; // Import

import LandingPage from './pages/LandingPage'; // Import

function App() {
    return (
        <SettingsProvider>
            <AuthProvider>
                <div className="min-h-screen bg-background text-foreground">
                    <Routes>
                        <Route path="/" element={<LandingPage />} /> {/* Landing Page */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="apply" element={<ApplyLoan />} />
                            <Route path="wallet" element={<WalletPage />} />
                            <Route path="upload" element={<DocumentUpload />} />
                            <Route path="profile" element={<Profile />} /> {/* New */}
                        </Route>

                        <Route path="/admin" element={<DashboardLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="reports" element={<AdminReports />} /> {/* Reports Route */}
                            <Route path="loans" element={<AdminDashboard />} />
                            <Route path="products" element={<LoanProducts />} />
                            <Route path="documents" element={<DocumentReview />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="profile" element={<Profile />} /> {/* New */}
                        </Route>
                    </Routes>
                </div>
            </AuthProvider>
        </SettingsProvider>
    )
}

export default App
