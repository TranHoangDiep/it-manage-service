import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Clock, Users, Server, Activity,
    Bell, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw,
    Phone, Calendar, Shield
} from 'lucide-react';

// Mock real-time data
const generateAlarms = () => [
    { id: 1, severity: 'critical', host: 'DB-Server-01', message: 'High CPU Usage (95%)', customer: 'VIB', time: '2 min ago', status: 'active' },
    { id: 2, severity: 'warning', host: 'Web-Server-03', message: 'Disk Usage 85%', customer: 'HOSE', time: '5 min ago', status: 'active' },
    { id: 3, severity: 'critical', host: 'ESXi-Host-02', message: 'Memory Pressure Detected', customer: 'CMC TS', time: '8 min ago', status: 'ack' },
    { id: 4, severity: 'warning', host: 'Switch-Core-01', message: 'Interface Down - Gi0/24', customer: 'Marico', time: '12 min ago', status: 'active' },
    { id: 5, severity: 'info', host: 'Backup-Server', message: 'Backup Job Completed', customer: 'Unicons', time: '15 min ago', status: 'resolved' },
    { id: 6, severity: 'critical', host: 'FW-Edge-01', message: 'High Connection Count', customer: 'VIB', time: '18 min ago', status: 'active' },
];

const onDutyEngineers = [
    { name: 'Nguyễn Văn An', role: 'L2 Engineer', phone: '0912 345 678', status: 'available', shift: 'Day' },
    { name: 'Trần Thị Bình', role: 'L1 Engineer', phone: '0987 654 321', status: 'busy', shift: 'Day' },
    { name: 'Lê Hoàng Cường', role: 'Network Admin', phone: '0903 111 222', status: 'available', shift: 'Night' },
];

const recentTickets = [
    { id: 'TK-86901', title: 'High latency of Aggregation', customer: 'VIB', priority: 'High', status: 'New', assignee: 'Unassigned' },
    { id: 'TK-86900', title: 'Thu hồi tài nguyên STG', customer: 'BIS', priority: 'Medium', status: 'In Progress', assignee: 'NOC Teams' },
    { id: 'TK-86899', title: 'User không truy cập Pulse UI', customer: 'VIB', priority: 'Medium', status: 'New', assignee: 'Unassigned' },
    { id: 'TK-86898', title: 'Cấu hình chặn cuộc gọi Genesys', customer: 'VIB', priority: 'Low', status: 'Pending', assignee: 'L2 Team' },
];

const NOCDashboard = () => {
    const [alarms, setAlarms] = useState(generateAlarms());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const refreshData = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setAlarms(generateAlarms());
            setIsRefreshing(false);
        }, 1000);
    };

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-500 text-white';
            case 'warning': return 'bg-amber-500 text-white';
            case 'info': return 'bg-blue-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-red-100 text-red-700';
            case 'ack': return 'bg-amber-100 text-amber-700';
            case 'resolved': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const criticalCount = alarms.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const warningCount = alarms.filter(a => a.severity === 'warning' && a.status === 'active').length;
    const ackCount = alarms.filter(a => a.status === 'ack').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">NOC Overview</h1>
                        <p className="text-slate-500 font-medium">Real-time Network Operations Center</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-slate-800">
                            {currentTime.toLocaleTimeString('vi-VN')}
                        </p>
                        <p className="text-sm text-slate-500">
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button
                        onClick={refreshData}
                        className={`p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg shadow-red-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-200 font-medium text-sm">Critical</p>
                            <p className="text-4xl font-black">{criticalCount}</p>
                        </div>
                        <AlertTriangle size={40} className="text-red-300" />
                    </div>
                </div>
                <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg shadow-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-200 font-medium text-sm">Warning</p>
                            <p className="text-4xl font-black">{warningCount}</p>
                        </div>
                        <Bell size={40} className="text-amber-300" />
                    </div>
                </div>
                <div className="bg-blue-500 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 font-medium text-sm">Acknowledged</p>
                            <p className="text-4xl font-black">{ackCount}</p>
                        </div>
                        <CheckCircle size={40} className="text-blue-300" />
                    </div>
                </div>
                <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-200 font-medium text-sm">Systems OK</p>
                            <p className="text-4xl font-black">127</p>
                        </div>
                        <Server size={40} className="text-emerald-300" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Alarms */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Active Alarms
                        </h2>
                        <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                            {alarms.filter(a => a.status !== 'resolved').length} Active
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {alarms.map((alarm) => (
                            <div key={alarm.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${alarm.severity === 'critical' ? 'bg-red-500 animate-pulse' : alarm.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityStyle(alarm.severity)}`}>
                                            {alarm.severity}
                                        </span>
                                        <span className="font-bold text-slate-800 truncate">{alarm.host}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">{alarm.message}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusStyle(alarm.status)}`}>
                                        {alarm.status}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">{alarm.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* On-Duty Engineers */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-black text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            On-Duty Engineers
                        </h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {onDutyEngineers.map((eng, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${eng.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                        {eng.name.split(' ').slice(-1)[0].charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">{eng.name}</p>
                                        <p className="text-xs text-slate-500">{eng.role}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${eng.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {eng.status}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                    <Phone size={12} /> {eng.phone}
                                    <span className="ml-auto px-2 py-0.5 bg-slate-200 rounded text-slate-600">{eng.shift} Shift</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="font-black text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-violet-500" />
                        Recent Tickets
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Ticket</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Priority</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Assignee</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-sm text-blue-600">{ticket.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{ticket.title}</td>
                                    <td className="px-6 py-4 text-slate-600">{ticket.customer}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                                ticket.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{ticket.assignee}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NOCDashboard;
