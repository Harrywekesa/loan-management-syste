import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface SettingsContextType {
    siteName: string;
    themeColor: string;
    logoUrl: string;
    contactEmail: string;
    refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
    siteName: 'LoanSys',
    themeColor: '#4f46e5', // Default Indigo
    logoUrl: '',
    contactEmail: '',
    refreshSettings: () => { }
});

export const useSettings = () => useContext(SettingsContext);

// Helper to convert hex to HSL string for CSS variables
const hexToHsl = (hex: string): string => {
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return '243 80% 60%'; // Default HSL for indigo
    }

    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const num = parseInt(c.join(''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    const r_norm = r / 255;
    const g_norm = g / 255;
    const b_norm = b / 255;

    const max = Math.max(r_norm, g_norm, b_norm);
    const min = Math.min(r_norm, g_norm, b_norm);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r_norm: h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0); break;
            case g_norm: h = (b_norm - r_norm) / d + 2; break;
            case b_norm: h = (r_norm - g_norm) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState({
        siteName: 'LoanSys',
        themeColor: '#4f46e5',
        logoUrl: '',
        contactEmail: ''
    });

    const fetchSettings = async () => {
        try {
            const res = await api.get('/auth/settings');
            if (res.data) {
                const mappedSettings = {
                    siteName: res.data.site_name || 'LoanSys',
                    themeColor: res.data.theme_color || '#4f46e5',
                    logoUrl: res.data.logo_url || '',
                    contactEmail: res.data.contact_email || ''
                };
                setSettings(mappedSettings);
                applyTheme(mappedSettings.themeColor, mappedSettings.siteName);
            }
        } catch (error) {
            console.error('Failed to load settings, using defaults.', error);
            applyTheme(settings.themeColor, settings.siteName);
        }
    };

    const applyTheme = (color: string, name: string) => {
        if (color) {
            const hslColor = hexToHsl(color);
            document.documentElement.style.setProperty('--primary', hslColor);
        }
        if (name) {
            document.title = name;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ ...settings, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
