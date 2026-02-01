import React, { useState, useEffect, useRef } from 'react';
import { itsmService } from '../services/api';
import {
    FileText,
    Calendar,
    ChevronRight,
    Download,
    Filter,
    BarChart3,
    Clock,
    AlertCircle,
    Search,
    CheckCircle2,
    XCircle,
    ExternalLink,
    TrendingUp,
    LineChart as LineChartIcon
} from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

const CustomerReports = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState(1);
    const [reportData, setReportData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    const years = [2026, 2025, 2024];
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await itsmService.getCustomers('all');
                setCustomers(data);
                if (data.length > 0 && !selectedCustomerId) {
                    // Try to find MetLife or first one
                    const metlife = data.find(c => c.customer_id === '44766');
                    setSelectedCustomerId(metlife ? metlife.customer_id : data[0].customer_id);
                }
            } catch (err) {
                console.error('Error fetching customers:', err);
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCustomer = customers.find(c => c.customer_id === selectedCustomerId);

    const handleGenerateReport = async () => {
        if (!selectedCustomerId) return;
        setLoading(true);
        setError(null);
        try {
            const [report, forecast] = await Promise.all([
                itsmService.getMonthlyReport(selectedCustomerId, selectedYear, selectedMonth),
                itsmService.getForecast(selectedCustomerId, selectedYear, selectedMonth)
            ]);
            setReportData(report);
            setForecastData(forecast);
        } catch (err) {
            console.error('Error generating report:', err);
            setError('Failed to fetch report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSlaColor = (percentage) => {
        if (percentage >= 98) return 'text-emerald-500';
        if (percentage >= 95) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getSlaBg = (percentage) => {
        if (percentage >= 98) return 'bg-emerald-50';
        if (percentage >= 95) return 'bg-amber-50';
        return 'bg-rose-50';
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl shadow-sm">
                            <FileText size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monthly ITSM Report</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Generate weekly performance breakdown and SLA tracking</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Export PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 p-8">
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Report Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="space-y-2 col-span-1 md:col-span-5">
                        <label className="text-sm font-bold text-slate-600 ml-1">Select Customer</label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 ${isDropdownOpen ? 'border-pink-500 bg-white ring-4 ring-pink-50' : 'border-transparent'} rounded-2xl font-bold text-slate-700 cursor-pointer transition-all duration-300`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="min-w-[32px] h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-black">
                                        {selectedCustomer ? selectedCustomer.customer_id.slice(-2) : '?'}
                                    </div>
                                    <span className="truncate">
                                        {selectedCustomer ? selectedCustomer.customer_name : 'Choose a customer...'}
                                    </span>
                                </div>
                                <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute z-[100] top-full mt-3 w-full bg-white rounded-[1.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search customers..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-2">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map(c => (
                                                <div
                                                    key={c.customer_id}
                                                    onClick={() => {
                                                        setSelectedCustomerId(c.customer_id);
                                                        setIsDropdownOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedCustomerId === c.customer_id
                                                        ? 'bg-pink-50 text-pink-700'
                                                        : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className={`min-w-[32px] h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${selectedCustomerId === c.customer_id
                                                        ? 'bg-pink-200 text-pink-700'
                                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                        }`}>
                                                        {c.customer_id.slice(-2)}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`text-sm font-bold truncate ${selectedCustomerId === c.customer_id ? 'text-pink-900' : 'text-slate-700'}`}>
                                                            {c.customer_name}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400">ID: {c.customer_id}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 font-medium">
                                                No customers found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Year</label>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 appearance-none transition-all"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={18} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Month</label>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 appearance-none transition-all"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={18} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-3">
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading || !selectedCustomerId}
                            className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${loading || !selectedCustomerId
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-rose-200'
                                }`}
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Processing Operational Data...</p>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600">
                    <AlertCircle />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {reportData && !loading && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Summary Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 transition-all rounded-full group-hover:scale-150 duration-700 opaticy-50"></div>
                            <div className="relative">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Tickets</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-3xl font-black text-slate-900">
                                        {reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.total_tickets, 0)}
                                    </h3>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black rounded-lg">PERIOD TOTAL</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 transition-all rounded-full group-hover:scale-150 duration-700 opaticy-50"></div>
                            <div className="relative">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg SLA</p>
                                <div className="flex items-center gap-3">
                                    <h3 className={`text-3xl font-black ${getSlaColor(
                                        reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.sla.percentage, 0) / reportData.weekly_breakdown.length
                                    )}`}>
                                        {(reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.sla.percentage, 0) / reportData.weekly_breakdown.length).toFixed(1)}%
                                    </h3>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-lg">TARGET 98%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 transition-all rounded-full group-hover:scale-150 duration-700 opaticy-50"></div>
                            <div className="relative">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Workload</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-3xl font-black text-slate-900">
                                        {(reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.avg_resolve_time_hours, 0) / reportData.weekly_breakdown.length).toFixed(1)}h
                                    </h3>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black rounded-lg">HOURS</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 transition-all rounded-full group-hover:scale-150 duration-700 opaticy-50"></div>
                            <div className="relative">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">SLA Breached</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-3xl font-black text-rose-600">
                                        {reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.sla.breached, 0)}
                                    </h3>
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded-lg">URGENT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Monthly Comparison & Forecast Section */}
                    {forecastData && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Monthly Comparison & Forecast</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth & Stability Analytics</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Actual</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-indigo-300 rounded-full border-2 border-dashed border-indigo-500"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Forecast</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={forecastData.chart_data.volume}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="label"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            />
                                            <Bar dataKey="actual" barSize={40} radius={[8, 8, 0, 0]}>
                                                {forecastData.chart_data.volume.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 1 ? '#6366f1' : '#e2e8f0'} />
                                                ))}
                                            </Bar>
                                            <Line
                                                type="monotone"
                                                dataKey="forecast"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                strokeDasharray="5 5"
                                                dot={{ r: 6, fill: '#fff', strokeWidth: 3 }}
                                                activeDot={{ r: 8 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 text-white/10 pointer-events-none">
                                    <LineChartIcon size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                            <TrendingUp size={20} />
                                        </div>
                                        <h3 className="font-black uppercase tracking-widest text-sm">Strategic Insights</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">Trend Analysis</p>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${forecastData.trend === 'increasing' ? 'bg-rose-400' :
                                                    forecastData.trend === 'decreasing' ? 'bg-emerald-400' : 'bg-blue-400'
                                                    }`}>
                                                    {forecastData.trend} volume
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-lg font-bold leading-relaxed text-indigo-50">
                                            "{forecastData.insight_summary}"
                                        </p>

                                        <div className="pt-6 border-t border-white/10">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-indigo-200 text-[10px] font-black uppercase mb-1">Forecast SLA</p>
                                                    <p className="text-2xl font-black">{forecastData.chart_data.sla[2].forecast}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-indigo-200 text-[10px] font-black uppercase mb-1">Target</p>
                                                    <p className="text-2xl font-black">98.0%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Detailed Weekly Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Weekly Breakdown</h2>
                                <p className="text-slate-400 text-sm font-medium">Detailed metrics per operational week</p>
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                {months.find(m => m.value === reportData.month)?.label} {reportData.year}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Week</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Range</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Incidents</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Requests</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Changes</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Others</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SLA Compliance</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Avg Reso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.weekly_breakdown.map((week) => (
                                        <tr key={week.week_number} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 text-slate-700 flex items-center justify-center rounded-xl font-black text-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        W{week.week_number}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 leading-tight">Week {week.week_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-slate-600">{week.from_date}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 italic">to {week.to_date}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="font-black text-slate-700">{week.summary.incidents}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="font-black text-slate-700">{week.summary.service_requests}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="font-black text-slate-700">{week.summary.changes}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="font-black text-slate-700">{week.summary.others}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-700 text-sm">
                                                    {week.summary.total_tickets}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={`px-4 py-1.5 rounded-full font-black text-xs ${getSlaBg(week.summary.sla.percentage)} ${getSlaColor(week.summary.sla.percentage)}`}>
                                                        {week.summary.sla.percentage.toFixed(1)}%
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${week.summary.sla.percentage >= 98 ? 'bg-emerald-500' :
                                                                week.summary.sla.percentage >= 95 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${week.summary.sla.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1 font-black text-slate-700">
                                                    <Clock size={14} className="text-slate-400" />
                                                    {week.summary.avg_resolve_time_hours.toFixed(1)}h
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-slate-900">Operational Insights</h3>
                                <BarChart3 size={20} className="text-slate-400" />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-slate-700">Highest Volume</p>
                                        <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md uppercase">Critical Load</span>
                                    </div>
                                    {(() => {
                                        const topWeek = [...reportData.weekly_breakdown].sort((a, b) => b.summary.total_tickets - a.summary.total_tickets)[0];
                                        return (
                                            <p className="text-xs text-slate-500 font-medium italic">
                                                Week {topWeek.week_number} recorded the highest ticket volume with {topWeek.summary.total_tickets} requests, requiring most attention.
                                            </p>
                                        );
                                    })()}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-slate-700">SLA Performance</p>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Quality Check</span>
                                    </div>
                                    {(() => {
                                        const avgSla = reportData.weekly_breakdown.reduce((sum, w) => sum + w.summary.sla.percentage, 0) / reportData.weekly_breakdown.length;
                                        return (
                                            <p className="text-xs text-slate-500 font-medium italic">
                                                Monthly average SLA compliance is {avgSla.toFixed(1)}%. {avgSla >= 98 ? 'All targets met.' : 'Needs optimization for next period.'}
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                                <FileText size={160} />
                            </div>
                            <h3 className="font-black text-white text-xl mb-4 relative z-10">Generate Full PDF Report</h3>
                            <p className="text-slate-400 text-sm font-medium mb-8 relative z-10 max-w-sm">
                                Create a professional summary report including charts, detailed incident lists, and SLA verification for client delivery.
                            </p>
                            <button className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-pink-500/20 relative z-10">
                                <Download size={20} />
                                Download Complete Package
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!reportData && !loading && (
                <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 group hover:rotate-0 transition-all duration-500">
                        <Search size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No Report Loaded</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto">
                        Select a customer and timeframe above to generate the operational performance report.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CustomerReports;
