import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import {
    Clock, Users, FolderOpen, RefreshCw, TrendingUp,
    ChevronDown, Search, Filter, Download, Layers
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TimeSpent = () => {
    const [stats, setStats] = useState(null);
    const [summary, setSummary] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [groupData, setGroupData] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, summaryRes, categoryRes, groupRes, recordsRes] = await Promise.all([
                fetch(`${API_BASE}/api/time-spent/stats`).then(r => r.json()),
                fetch(`${API_BASE}/api/time-spent/summary`).then(r => r.json()),
                fetch(`${API_BASE}/api/time-spent/by-category`).then(r => r.json()),
                fetch(`${API_BASE}/api/time-spent/by-group`).then(r => r.json()),
                fetch(`${API_BASE}/api/time-spent?per_page=100`).then(r => r.json())
            ]);

            if (statsRes.success) setStats(statsRes.stats);
            if (summaryRes.success) setSummary(summaryRes.data);
            if (categoryRes.success) setCategoryData(categoryRes.data);
            if (groupRes.success) setGroupData(groupRes.data);
            if (recordsRes.success) {
                setRecords(recordsRes.data);
                setPagination(recordsRes.pagination);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE}/api/time-spent/sync`, { method: 'POST' });
            await fetchData();
        } catch (error) {
            console.error('Sync error:', error);
        }
        setSyncing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredRecords = records.filter(r =>
        r.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.technician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.request_id?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600/20 border-t-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading Time Spent Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Time Spent Analytics</h1>
                    <p className="text-slate-500 mt-1">Track and analyze technician work hours from ITSM system</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync from ITSM'}
                </button>
            </header>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            label: 'Total Hours',
                            value: stats.formatted || '0:00',
                            subtext: `${stats.total_hours?.toLocaleString() || 0} hours`,
                            icon: <Clock className="text-indigo-600" size={24} />,
                            color: 'from-indigo-500/10 to-purple-500/10',
                            border: 'border-indigo-100'
                        },
                        {
                            label: 'Total Tickets',
                            value: stats.total_tickets?.toLocaleString() || 0,
                            subtext: 'Tickets with time logged',
                            icon: <FolderOpen className="text-emerald-600" size={24} />,
                            color: 'from-emerald-500/10 to-teal-500/10',
                            border: 'border-emerald-100'
                        },
                        {
                            label: 'Technicians',
                            value: stats.total_technicians || 0,
                            subtext: 'Active engineers',
                            icon: <Users className="text-blue-600" size={24} />,
                            color: 'from-blue-500/10 to-cyan-500/10',
                            border: 'border-blue-100'
                        },
                        {
                            label: 'Time Entries',
                            value: stats.total_records?.toLocaleString() || 0,
                            subtext: 'Individual work logs',
                            icon: <Layers className="text-amber-600" size={24} />,
                            color: 'from-amber-500/10 to-orange-500/10',
                            border: 'border-amber-100'
                        }
                    ].map((kpi, i) => (
                        <div key={i} className={`bg-gradient-to-br ${kpi.color} p-6 rounded-3xl border ${kpi.border} shadow-sm hover:shadow-md transition-all`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    {kpi.icon}
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className="text-3xl font-black text-slate-900">{kpi.value}</p>
                            <p className="text-xs text-slate-500 mt-1">{kpi.subtext}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {['overview', 'by-group', 'by-category', 'details'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all capitalize ${activeTab === tab
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Technicians Chart */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" size={20} />
                            Top Technicians by Hours
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summary.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="technician"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 12 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value} hours`, 'Time Spent']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
                                    />
                                    <Bar dataKey="total_hours" radius={[0, 8, 8, 0]}>
                                        {summary.slice(0, 8).map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution Pie */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FolderOpen className="text-purple-600" size={20} />
                            Time by Category
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData.slice(0, 6)}
                                        dataKey="total_hours"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {categoryData.slice(0, 6).map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value} hours`, 'Time Spent']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* By Group Tab */}
            {activeTab === 'by-group' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800">Time Spent by Group/Queue</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Technicians</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Tickets</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groupData.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {item.group_name?.charAt(0) || 'G'}
                                                </div>
                                                <span className="font-bold text-slate-800">{item.group_name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">
                                                {item.technician_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-slate-600">{item.ticket_count?.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div>
                                                <span className="text-lg font-black text-slate-900">{item.formatted}</span>
                                                <span className="text-sm text-slate-400 ml-2">({item.total_hours}h)</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* By Category Tab */}
            {activeTab === 'by-category' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800">Time Spent by Category</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Tickets</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Distribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categoryData.map((item, i) => {
                                    const maxHours = Math.max(...categoryData.map(c => c.total_hours || 0));
                                    const percentage = maxHours > 0 ? ((item.total_hours || 0) / maxHours) * 100 : 0;
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                    ></div>
                                                    <span className="font-bold text-slate-800">{item.category || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-medium text-slate-600">{item.ticket_count?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-slate-900">{item.formatted}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-32 ml-auto">
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: COLORS[i % COLORS.length]
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-slate-800">Time Log Details</h3>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by ticket, technician..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white">
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Request ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Technician</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Time Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                                                #{item.request_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800 line-clamp-1 max-w-xs">
                                                {item.subject || 'No subject'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                                    {item.technician?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-medium text-slate-700">{item.technician || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500">{item.category || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-slate-900">{item.time_spent_formatted}</span>
                                            <span className="text-sm text-slate-400 ml-1">({item.time_spent_hours}h)</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredRecords.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Clock size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No time records found</p>
                            <p className="text-sm">Try syncing data from ITSM or adjust your search</p>
                        </div>
                    )}
                </div>
            )}

            {/* Last Sync Info */}
            {stats?.last_sync && (
                <div className="text-center text-sm text-slate-400">
                    Last synced: {new Date(stats.last_sync).toLocaleString('vi-VN')}
                </div>
            )}
        </div>
    );
};

export default TimeSpent;
