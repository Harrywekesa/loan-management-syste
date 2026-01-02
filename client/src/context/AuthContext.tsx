import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    role: 'BORROWER' | 'ADMIN' | 'SUPER_ADMIN';
    phoneNumber?: string;
    profilePicture?: string;
    creditScore?: number;
    wallet?: {
        balance: number;
    };
    fullName?: string;
    status?: string;
    documents?: any[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        setUser(user);
        navigate(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
