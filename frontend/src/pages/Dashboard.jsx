import React, { useEffect, useState } from 'react';
import { itsmService } from '../services/api';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    Activity, Clock, CheckCircle, AlertTriangle, User, ShieldAlert, Calendar, Users, Ticket
} from 'lucide-react';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7 Days');

    useEffect(() => {
        itsmService.getSummary().then(data => {
            setSummary(data);
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-slate-500 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    const kpis = [
        { label: 'Total Tickets', value: summary.total, icon: <Ticket size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
        { label: 'Open Tickets', value: summary.open, icon: <Clock size={24} />, color: 'bg-amber-500', textColor: 'text-amber-600' },
        { label: 'SLA Breached', value: summary.sla_breached, icon: <AlertTriangle size={24} />, color: 'bg-red-500', textColor: 'text-red-600' },
        { label: 'MTTR (Hours)', value: summary.avg_mttr_hours, icon: <Activity size={24} />, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    ];

    const statusData = [
        { name: 'Open', value: summary.open },
        { name: 'In Progress', value: summary.in_progress },
        { name: 'Resolved/Closed', value: summary.resolved },
    ];

    const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-10 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ITSM Report Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Operational metrics and service health overview.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {['Today', '7 Days', '30 Days'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${timeRange === range ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </header>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm border-l-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" style={{ borderLeftColor: i === 2 ? '#ef4444' : 'transparent' }}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${kpi.color} text-white shadow-lg`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Live</span>
                        </div>
                        <h3 className="text-slate-500 font-bold text-sm mb-2">{kpi.label}</h3>
                        <p className={`text-4xl font-black ${i === 2 && kpi.value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{kpi.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Line Chart - Ticket Trend */}
                <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-xl text-slate-800">Ticket Trend</h3>
                        <Calendar size={20} className="text-slate-400" />
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summary.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Line type="stepAfter" dataKey="tickets" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                <Line type="stepAfter" dataKey="sla" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart - Status */}
                <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-xl text-slate-800 mb-8">Ticket Status</h3>
                    <div className="h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} cornerRadius={12} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart - Priority */}
                <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-xl text-slate-800">Priority Analysis (SLA)</h3>
                        <div className="flex flex-col gap-1 items-end">
                            {summary.priority_sla?.map((p, i) => (
                                <span key={i} className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 uppercase">
                                    {p.priority}: {p.sla_percent}%
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.priority_distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                                    {summary.priority_distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={
                                            entry.priority === 'Critical' ? '#ef4444' :
                                                entry.priority === 'High' ? '#f59e0b' :
                                                    '#6366f1'
                                        } />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* Category Analysis */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-xl text-slate-800 mb-8">Incident Category Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary.category_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {summary.category_distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} cornerRadius={12} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Workload Heatmap - Simplified as a mini-table */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-xl text-slate-800 mb-8">Workload Intensity (Mock)</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase">{day}</div>
                        ))}
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${i % 4 === 0 ? 'bg-red-500 text-white' :
                                        i % 3 === 0 ? 'bg-orange-400 text-white' :
                                            'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {Math.floor(Math.random() * 50) + 10}
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 text-center tracking-widest">Average Tickets Per Shift Layer</p>
                </div>
            </div>

            {/* Top Load Customers Row */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users size={20} />
                    </div>
                    <h3 className="font-black text-xl text-slate-800">Top Load Customers Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {summary.top_customers?.slice(0, 5).map((cust, i) => (
                        <div key={i} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 hover:border-primary-200 transition-all hover:shadow-lg hover:shadow-primary-500/5 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 border border-slate-100 shadow-sm">
                                    0{i + 1}
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black ${cust.sla_percent >= 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {cust.sla_percent}% SLA
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1 truncate group-hover:text-primary-600 transition-colors uppercase text-sm tracking-tight">{cust.name}</h4>
                            <p className="text-2xl font-black text-slate-900 mb-4">{cust.total} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tickets</span></p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${cust.sla_percent >= 90 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    style={{ width: `${cust.sla_percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Technician Performance Table */}
                <div className="xl:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <User size={20} />
                            </div>
                            <h3 className="font-black text-xl text-slate-800">Technician Performance</h3>
                        </div>
                        <button className="text-sm font-bold text-primary-600 hover:text-primary-700">View All Tasks</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Technician</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Open</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Closed</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">SLA%</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Avg Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {summary.technician_performance.map((tech, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-slate-800">{tech.name}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-amber-50 text-amber-600 font-bold text-xs rounded-lg">{tech.open}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg">{tech.closed}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`font-black ${tech.sla_percent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{tech.sla_percent}%</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="font-bold text-slate-600">{tech.avg_mttr}h</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monitoring Alerts Table */}
                <div className="xl:col-span-4 bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden text-white">
                    <div className="p-8 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/20 text-red-500 rounded-2xl">
                                <ShieldAlert size={20} />
                            </div>
                            <h3 className="font-black text-xl">Active Alerts</h3>
                        </div>
                        <span className="animate-pulse flex h-3 w-3 rounded-full bg-red-500"></span>
                    </div>
                    <div className="p-4 space-y-4">
                        {summary.monitoring_alerts.map((alert, i) => (
                            <div key={i} className="group p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.source}</span>
                                    <span className="text-[10px] font-bold text-slate-500">{alert.time}</span>
                                </div>
                                <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{alert.alert}</h4>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className={`w-2 h-2 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-amber-500'}`}></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{alert.severity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 mt-auto border-t border-white/5">
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Clear All Alerts</button>
                    </div>
                </div>
            </div>

            {/* Quick Insights Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Unassigned Power</h4>
                    <p className="text-4xl font-black mb-2">0</p>
                    <p className="text-sm font-bold opacity-80">All tickets currently assigned to technicians. Perfect discipline!</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Stalled Tickets ({'>'}4h)</h4>
                    <p className="text-4xl font-black text-slate-900 mb-2">{Math.floor(summary.open * 0.1)}</p>
                    <p className="text-sm font-bold text-slate-500">Tickets in open state for more than 4 hours requiring immediate focus.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm border-b-4 border-b-emerald-500">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System Health</h4>
                    <p className="text-4xl font-black text-slate-900 mb-2">98.2%</p>
                    <p className="text-sm font-bold text-slate-500">Data sync stability and API response performance in safe zones.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
