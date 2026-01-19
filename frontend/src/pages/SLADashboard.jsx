import React from 'react';
import {
    TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle,
    Users, Building2, BarChart3, PieChart, Activity
} from 'lucide-react';

// Mock SLA data
const slaMetrics = {
    overall: 94.2,
    responseTime: { current: 12, target: 15, unit: 'min' },
    resolutionTime: { current: 4.2, target: 8, unit: 'hrs' },
    uptime: { current: 99.95, target: 99.9, unit: '%' },
    firstContact: { current: 78, target: 70, unit: '%' },
};

const customerSLA = [
    { name: 'VIB', sla: 96.5, trend: 'up', tickets: 45, breaches: 2 },
    { name: 'HOSE', sla: 98.2, trend: 'up', tickets: 23, breaches: 0 },
    { name: 'Marico', sla: 91.8, trend: 'down', tickets: 18, breaches: 3 },
    { name: 'Unicons', sla: 95.0, trend: 'stable', tickets: 12, breaches: 1 },
    { name: 'CMC TS', sla: 97.8, trend: 'up', tickets: 67, breaches: 1 },
];

const kpiData = [
    { name: 'MTTR', value: '2.5h', target: '4h', status: 'good', description: 'Mean Time To Resolve' },
    { name: 'MTTA', value: '8m', target: '15m', status: 'good', description: 'Mean Time To Acknowledge' },
    { name: 'FCR', value: '72%', target: '70%', status: 'good', description: 'First Contact Resolution' },
    { name: 'CSAT', value: '4.2/5', target: '4.0/5', status: 'good', description: 'Customer Satisfaction' },
];

const recentBreaches = [
    { ticket: 'TK-86845', customer: 'Marico', type: 'Response Time', exceeded: '5 min', time: '2 hours ago' },
    { ticket: 'TK-86823', customer: 'Marico', type: 'Resolution', exceeded: '2 hours', time: '1 day ago' },
    { ticket: 'TK-86801', customer: 'VIB', type: 'Response Time', exceeded: '3 min', time: '2 days ago' },
];

const SLADashboard = () => {
    const getSLAColor = (sla) => {
        if (sla >= 95) return 'text-emerald-600';
        if (sla >= 90) return 'text-amber-600';
        return 'text-red-600';
    };

    const getSLABg = (sla) => {
        if (sla >= 95) return 'bg-emerald-500';
        if (sla >= 90) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <Target size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">SLA & KPI Dashboard</h1>
                    <p className="text-slate-500 font-medium">Service Level Agreement tracking and Key Performance Indicators</p>
                </div>
            </div>

            {/* Overall SLA Score */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 font-medium mb-1">Overall SLA Compliance</p>
                            <p className="text-6xl font-black">{slaMetrics.overall}%</p>
                            <div className="flex items-center gap-2 mt-2 text-emerald-200">
                                <TrendingUp size={16} />
                                <span className="text-sm font-medium">+2.3% from last month</span>
                            </div>
                        </div>
                        <div className="w-24 h-24 rounded-full border-8 border-white/30 flex items-center justify-center">
                            <CheckCircle size={40} />
                        </div>
                    </div>
                </div>

                {/* Quick Metrics */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Clock size={16} />
                        <span className="text-xs font-bold uppercase">Avg Response</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{slaMetrics.responseTime.current}<span className="text-lg text-slate-400"> min</span></p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Target: {slaMetrics.responseTime.target} min ✓</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Activity size={16} />
                        <span className="text-xs font-bold uppercase">Avg Resolution</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{slaMetrics.resolutionTime.current}<span className="text-lg text-slate-400"> hrs</span></p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Target: {slaMetrics.resolutionTime.target} hrs ✓</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Target size={16} />
                        <span className="text-xs font-bold uppercase">Uptime</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{slaMetrics.uptime.current}<span className="text-lg text-slate-400">%</span></p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Target: {slaMetrics.uptime.target}% ✓</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiData.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{kpi.name}</p>
                        <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                            <CheckCircle size={12} className="text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">Target: {kpi.target}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer SLA Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <Building2 size={18} className="text-blue-500" />
                            SLA by Customer
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {customerSLA.map((customer, idx) => (
                            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                                    {customer.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{customer.name}</p>
                                    <p className="text-xs text-slate-500">{customer.tickets} tickets • {customer.breaches} breaches</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {customer.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                                    {customer.trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
                                    <span className={`text-xl font-black ${getSLAColor(customer.sla)}`}>{customer.sla}%</span>
                                </div>
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${getSLABg(customer.sla)} rounded-full`} style={{ width: `${customer.sla}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent SLA Breaches */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Recent SLA Breaches
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentBreaches.map((breach, idx) => (
                            <div key={idx} className="p-4 hover:bg-red-50/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-sm text-red-600 font-bold">{breach.ticket}</span>
                                    <span className="text-xs text-slate-400">{breach.time}</span>
                                </div>
                                <p className="font-medium text-slate-800">{breach.customer}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">{breach.type}</span>
                                    <span className="text-xs text-slate-500">Exceeded by {breach.exceeded}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-center text-sm text-slate-500">
                            Total: <span className="font-bold text-red-600">7 breaches</span> this month
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SLADashboard;
