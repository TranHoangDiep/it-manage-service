import React, { useState } from 'react';
import {
    AlertTriangle, Search, Plus, Edit2, Trash2, X, Check, Server,
    Clock, Ticket, FileText, AlertCircle, CheckCircle2
} from 'lucide-react';

// Initial Alarm Notes Data
const INITIAL_ALARMS = [
    {
        id: "ALM-001",
        alarmName: "High Disk Usage (>90%)",
        severity: "Critical",
        target: "192.168.1.10 (Database Server)",
        status: "In Progress",
        ticketId: "INC-2024-005",
        note: "Đã mở ticket, đang chờ team System mở rộng dung lượng ổ đĩa.",
        updatedAt: "2026-01-18 10:30"
    },
    {
        id: "ALM-002",
        alarmName: "High CPU Load (>85%)",
        severity: "Warning",
        target: "192.168.1.15 (App Server 01)",
        status: "Open",
        ticketId: "",
        note: "Cần kiểm tra process nào đang chiếm CPU cao",
        updatedAt: "2026-01-18 09:45"
    },
    {
        id: "ALM-003",
        alarmName: "Memory Usage Critical",
        severity: "Critical",
        target: "192.168.1.20 (Web Server)",
        status: "Resolved",
        ticketId: "INC-2024-004",
        note: "Đã restart service và memory đã ổn định. Cần monitor thêm 24h.",
        updatedAt: "2026-01-17 23:15"
    },
    {
        id: "ALM-004",
        alarmName: "Network Latency High",
        severity: "Warning",
        target: "10.0.0.1 (Core Switch)",
        status: "In Progress",
        ticketId: "INC-2024-006",
        note: "Đang phân tích traffic, nghi ngờ có DDoS nhẹ từ ngoài.",
        updatedAt: "2026-01-18 11:00"
    },
    {
        id: "ALM-005",
        alarmName: "Service Down - MySQL",
        severity: "Critical",
        target: "192.168.1.25 (DB Slave)",
        status: "Open",
        ticketId: "",
        note: "",
        updatedAt: "2026-01-18 11:25"
    },
];

const AlarmNotes = () => {
    const [alarms, setAlarms] = useState(INITIAL_ALARMS);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingAlarm, setEditingAlarm] = useState(null);
    const [formData, setFormData] = useState({
        alarmName: '', severity: 'Warning', target: '', status: 'Open', ticketId: '', note: ''
    });

    const generateId = () => `ALM-${String(alarms.length + 1).padStart(3, '0')}`;
    const getCurrentTime = () => {
        const now = new Date();
        return now.toISOString().slice(0, 16).replace('T', ' ');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAlarm) {
            setAlarms(alarms.map(a => a.id === editingAlarm.id ? { ...formData, id: editingAlarm.id, updatedAt: getCurrentTime() } : a));
        } else {
            setAlarms([{ ...formData, id: generateId(), updatedAt: getCurrentTime() }, ...alarms]);
        }
        closeModal();
    };

    const handleEdit = (alarm) => {
        setEditingAlarm(alarm);
        setFormData({ ...alarm });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc muốn xóa alarm note này?')) {
            setAlarms(alarms.filter(a => a.id !== id));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAlarm(null);
        setFormData({ alarmName: '', severity: 'Warning', target: '', status: 'Open', ticketId: '', note: '' });
    };

    const openAddModal = () => {
        setEditingAlarm(null);
        setFormData({ alarmName: '', severity: 'Warning', target: '', status: 'Open', ticketId: '', note: '' });
        setShowModal(true);
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'Critical':
                return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg flex items-center gap-1"><AlertCircle size={12} /> Critical</span>;
            case 'Warning':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-lg flex items-center gap-1"><AlertTriangle size={12} /> Warning</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">{severity}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open':
                return <span className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded-lg border border-red-200">Open</span>;
            case 'In Progress':
                return <span className="px-3 py-1 bg-amber-50 text-amber-600 font-bold text-xs rounded-lg border border-amber-200">In Progress</span>;
            case 'Resolved':
                return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={12} /> Resolved</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">{status}</span>;
        }
    };

    const filteredAlarms = alarms.filter(alarm => {
        const matchesSearch = alarm.alarmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alarm.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alarm.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || alarm.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        All: alarms.length,
        Open: alarms.filter(a => a.status === 'Open').length,
        'In Progress': alarms.filter(a => a.status === 'In Progress').length,
        Resolved: alarms.filter(a => a.status === 'Resolved').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Infrastructure Alarm Notes</h1>
                        <p className="text-slate-500 font-medium mt-1">Ghi chú và theo dõi các cảnh báo hạ tầng</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20"
                >
                    <Plus size={20} /> Add New Note
                </button>
            </header>

            {/* Stats & Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`p-4 rounded-2xl border transition-all ${statusFilter === status
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <p className={`text-2xl font-black ${statusFilter === status ? 'text-white' : 'text-slate-800'}`}>{count}</p>
                        <p className={`text-xs font-bold uppercase tracking-wider ${statusFilter === status ? 'text-slate-300' : 'text-slate-400'}`}>{status}</p>
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo Alarm Name, Server/IP, hoặc Ticket ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                />
            </div>

            {/* Alarm Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Alarm</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Target</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Severity</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ticket</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Note</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Updated</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAlarms.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        {searchTerm || statusFilter !== 'All' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có alarm note nào'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAlarms.map((alarm) => (
                                    <tr
                                        key={alarm.id}
                                        className={`hover:bg-slate-50/50 transition-colors ${alarm.ticketId ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${alarm.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{alarm.alarmName}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{alarm.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Server size={14} className="text-slate-400" />
                                                <span className="font-mono text-sm">{alarm.target}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">{getSeverityBadge(alarm.severity)}</td>
                                        <td className="px-6 py-5">{getStatusBadge(alarm.status)}</td>
                                        <td className="px-6 py-5">
                                            {alarm.ticketId ? (
                                                <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg">
                                                    <Ticket size={12} /> {alarm.ticketId}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 max-w-[200px]">
                                            {alarm.note ? (
                                                <p className="text-sm text-slate-600 truncate" title={alarm.note}>
                                                    {alarm.note}
                                                </p>
                                            ) : (
                                                <span className="text-slate-300 text-sm italic">Chưa có ghi chú</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                <Clock size={12} />
                                                <span className="font-mono">{alarm.updatedAt}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(alarm)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(alarm.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-red-500 to-orange-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FileText size={24} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white">
                                    {editingAlarm ? 'Chỉnh sửa Alarm Note' : 'Thêm Alarm Note mới'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Alarm Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.alarmName}
                                        onChange={e => setFormData({ ...formData, alarmName: e.target.value })}
                                        placeholder="e.g., High Disk Usage"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Target (Server/IP) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.target}
                                        onChange={e => setFormData({ ...formData, target: e.target.value })}
                                        placeholder="e.g., 192.168.1.10 (DB Server)"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Severity</label>
                                    <select
                                        value={formData.severity}
                                        onChange={e => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                                    >
                                        <option value="Critical">🔴 Critical</option>
                                        <option value="Warning">🟡 Warning</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Ticket ID</label>
                                    <input
                                        type="text"
                                        value={formData.ticketId}
                                        onChange={e => setFormData({ ...formData, ticketId: e.target.value })}
                                        placeholder="e.g., INC-2024-001"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Note / Solution</label>
                                <textarea
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Ghi chú xử lý, nguyên nhân, giải pháp..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 resize-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    <Check size={20} /> {editingAlarm ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlarmNotes;
