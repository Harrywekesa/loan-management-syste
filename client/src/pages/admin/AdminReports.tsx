import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function AdminReports() {
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);

    useEffect(() => {
        api.get('/admin/reports/summary').then(res => setSummary(res.data)).catch(console.error);
        api.get('/admin/reports/trends').then(res => setTrends(res.data)).catch(console.error);
    }, []);

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Loans Issued\n"
            + trends.map(e => `${e.date},${e.count}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "loan_trends.csv");
        document.body.appendChild(link);
        link.click();
    };

    if (!summary) return <div>Loading Reports...</div>;

    const maxTrend = Math.max(...trends.map(t => t.count), 1);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
            </div>

            {/* Financial Summary */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">Total Disbursed</h3>
                    <p className="text-2xl font-bold">KES {summary.financials.disbursed.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">Interest Earned</h3>
                    <p className="text-2xl font-bold text-green-600">KES {summary.financials.interestEarned.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">Penalties Collected</h3>
                    <p className="text-2xl font-bold text-red-600">KES {summary.financials.penaltiesAccrued.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-gray-500 text-sm">Default Rate</h3>
                    <p className="text-2xl font-bold text-gray-700">
                        {((summary.counts.defaulted / (summary.counts.total || 1)) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Trends Chart (CSS Only) */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="font-bold mb-6">Loans Issued (Last 7 Days)</h3>
                <div className="flex items-end space-x-4 h-64">
                    {trends.map((t, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                            <div
                                className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all"
                                style={{ height: `${(t.count / maxTrend) * 100}%` }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-500 transform -rotate-45 origin-top-left">{t.date}</div>
                            <div className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                                {t.count} Loans
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
