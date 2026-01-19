import React, { useState } from 'react';
import {
    Network, Router, Wifi, Plus, Search, Edit2, Trash2, X, Check,
    Globe, Signal, User, Phone, AlertCircle
} from 'lucide-react';

// Initial Network Assets Data
const INITIAL_NETWORK_ASSETS = [
    {
        id: "SW-001",
        type: "Switch",
        name: "Core-Switch-01",
        ip: "10.0.0.1",
        model: "Cisco Nexus 9000",
        location: "DC01 - Rack A1",
        status: "Online",
        ports: "48 Ports",
        speed: "10 Gbps",
        adminName: "Nguyễn Văn An",
        adminPhone: "0912 345 678",
        note: "Core Switch chính cho Data Center"
    },
    {
        id: "SW-002",
        type: "Switch",
        name: "Access-Switch-01",
        ip: "10.0.0.10",
        model: "Cisco Catalyst 9300",
        location: "Floor 1 - Room 101",
        status: "Online",
        ports: "24 Ports",
        speed: "1 Gbps",
        adminName: "Trần Văn Bình",
        adminPhone: "0987 654 321",
        note: "Access Switch tầng 1"
    },
    {
        id: "RT-001",
        type: "Router",
        name: "Edge-Router-01",
        ip: "10.0.0.254",
        model: "Cisco ISR 4451",
        location: "DC01 - Rack B1",
        status: "Online",
        ports: "4 WAN Ports",
        speed: "1 Gbps",
        adminName: "Lê Hoàng Cường",
        adminPhone: "0903 111 222",
        note: "Router biên kết nối Internet"
    },
    {
        id: "FW-001",
        type: "Firewall",
        name: "Palo-FW-01",
        ip: "10.0.0.250",
        model: "Palo Alto PA-3260",
        location: "DC01 - Rack B2",
        status: "Online",
        ports: "12 Ports",
        speed: "10 Gbps",
        adminName: "Phạm Minh Dũng",
        adminPhone: "0918 333 444",
        note: "Firewall chính bảo vệ hạ tầng"
    },
    {
        id: "AP-001",
        type: "Access Point",
        name: "AP-Floor1-01",
        ip: "10.0.10.1",
        model: "Cisco Aironet 2800",
        location: "Floor 1 - Lobby",
        status: "Online",
        ports: "N/A",
        speed: "Wi-Fi 6",
        adminName: "Hoàng Thị Em",
        adminPhone: "0909 555 666",
        note: "Access Point khu vực sảnh tầng 1"
    },
    {
        id: "LB-001",
        type: "Load Balancer",
        name: "F5-LB-01",
        ip: "10.0.0.100",
        model: "F5 BIG-IP i5800",
        location: "DC01 - Rack C1",
        status: "Online",
        ports: "8 Ports",
        speed: "40 Gbps",
        adminName: "Võ Thanh Hải",
        adminPhone: "0935 777 888",
        note: "Load Balancer cho ứng dụng web"
    },
];

const MODEL_OPTIONS = [
    "Cisco Nexus 9000",
    "Cisco Catalyst 9300",
    "Cisco Catalyst 2960",
    "Cisco ISR 4451",
    "Cisco ASR 1001",
    "Palo Alto PA-3260",
    "Palo Alto PA-5260",
    "Fortinet FortiGate 200F",
    "Cisco Aironet 2800",
    "Aruba AP-515",
    "F5 BIG-IP i5800",
    "A10 Thunder 5430",
];

const NetworkPage = () => {
    const [assets, setAssets] = useState(INITIAL_NETWORK_ASSETS);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        type: 'Switch', name: '', ip: '', model: 'Cisco Nexus 9000', location: '',
        status: 'Online', ports: '', speed: '', adminName: '', adminPhone: '', note: ''
    });

    const generateId = (type) => {
        const prefixMap = { 'Switch': 'SW', 'Router': 'RT', 'Firewall': 'FW', 'Access Point': 'AP', 'Load Balancer': 'LB' };
        const prefix = prefixMap[type] || 'NET';
        const count = assets.filter(a => a.type === type).length + 1;
        return `${prefix}-${String(count).padStart(3, '0')}`;
    };

    const validateIP = (ip) => {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        const parts = ip.split('.');
        return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Tên thiết bị không được để trống';
        if (!formData.ip.trim()) newErrors.ip = 'IP không được để trống';
        else if (!validateIP(formData.ip)) newErrors.ip = 'IP không hợp lệ';
        if (!formData.adminName.trim()) newErrors.adminName = 'Tên người phụ trách không được để trống';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (editingAsset) {
            setAssets(assets.map(a => a.id === editingAsset.id ? { ...formData, id: editingAsset.id } : a));
        } else {
            setAssets([{ ...formData, id: generateId(formData.type) }, ...assets]);
        }
        closeModal();
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setFormData({ ...asset });
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc muốn xóa thiết bị này?')) {
            setAssets(assets.filter(a => a.id !== id));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAsset(null);
        setErrors({});
        setFormData({
            type: 'Switch', name: '', ip: '', model: 'Cisco Nexus 9000', location: '',
            status: 'Online', ports: '', speed: '', adminName: '', adminPhone: '', note: ''
        });
    };

    const openAddModal = () => {
        setEditingAsset(null);
        setErrors({});
        setFormData({
            type: 'Switch', name: '', ip: '', model: 'Cisco Nexus 9000', location: '',
            status: 'Online', ports: '', speed: '', adminName: '', adminPhone: '', note: ''
        });
        setShowModal(true);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Switch': return <Network size={16} className="text-blue-500" />;
            case 'Router': return <Router size={16} className="text-emerald-500" />;
            case 'Firewall': return <Globe size={16} className="text-red-500" />;
            case 'Access Point': return <Wifi size={16} className="text-violet-500" />;
            case 'Load Balancer': return <Signal size={16} className="text-amber-500" />;
            default: return <Network size={16} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Online':
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg">Online</span>;
            case 'Offline':
                return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg">Offline</span>;
            case 'Maintenance':
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-lg">Maintenance</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">{status}</span>;
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.adminName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || asset.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const stats = {
        Switch: assets.filter(a => a.type === 'Switch').length,
        Router: assets.filter(a => a.type === 'Router').length,
        Firewall: assets.filter(a => a.type === 'Firewall').length,
        AP: assets.filter(a => a.type === 'Access Point').length,
        LB: assets.filter(a => a.type === 'Load Balancer').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                        <Network size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Network Assets</h1>
                        <p className="text-slate-500 font-medium mt-1">Quản lý thiết bị mạng</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                >
                    <Plus size={20} /> Add Device
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { type: 'Switch', icon: Network, color: 'blue', count: stats.Switch },
                    { type: 'Router', icon: Router, color: 'emerald', count: stats.Router },
                    { type: 'Firewall', icon: Globe, color: 'red', count: stats.Firewall },
                    { type: 'Access Point', icon: Wifi, color: 'violet', count: stats.AP },
                    { type: 'Load Balancer', icon: Signal, color: 'amber', count: stats.LB },
                ].map(item => (
                    <button
                        key={item.type}
                        onClick={() => setTypeFilter(typeFilter === item.type ? 'All' : item.type)}
                        className={`p-4 rounded-2xl border transition-all ${typeFilter === item.type
                            ? `bg-${item.color}-600 text-white border-${item.color}-600 shadow-xl`
                            : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} className={typeFilter === item.type ? 'text-white' : `text-${item.color}-500`} />
                            <div className="text-left">
                                <p className={`text-2xl font-black ${typeFilter === item.type ? 'text-white' : 'text-slate-800'}`}>{item.count}</p>
                                <p className={`text-xs font-bold ${typeFilter === item.type ? 'text-white/70' : 'text-slate-400'}`}>{item.type}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo Name, IP, hoặc Admin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
                />
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Device</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">IP</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Model</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Location</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Admin</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Không tìm thấy thiết bị
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-xl">
                                                    {getTypeIcon(asset.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{asset.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{asset.id} • {asset.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">{asset.ip}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm text-slate-600 font-medium">{asset.model}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm text-slate-600">{asset.location}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-xs">
                                                    {asset.adminName.split(' ').slice(-1)[0].charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{asset.adminName}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{asset.adminPhone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">{getStatusBadge(asset.status)}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(asset)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
                    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    {getTypeIcon(formData.type)}
                                </div>
                                <h2 className="text-2xl font-black text-white">
                                    {editingAsset ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Device Type *</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            disabled={!!editingAsset}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                                        >
                                            <option value="Switch">🔵 Switch</option>
                                            <option value="Router">🟢 Router</option>
                                            <option value="Firewall">🔴 Firewall</option>
                                            <option value="Access Point">🟣 Access Point</option>
                                            <option value="Load Balancer">🟡 Load Balancer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Core-Switch-01"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">IP Address *</label>
                                        <input
                                            type="text"
                                            value={formData.ip}
                                            onChange={e => setFormData({ ...formData, ip: e.target.value })}
                                            placeholder="e.g., 10.0.0.1"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono ${errors.ip ? 'border-red-300' : 'border-slate-200'}`}
                                        />
                                        {errors.ip && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.ip}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Model</label>
                                        <select
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        >
                                            {MODEL_OPTIONS.map(model => <option key={model} value={model}>{model}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., DC01 - Rack A1"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        >
                                            <option value="Online">🟢 Online</option>
                                            <option value="Offline">🔴 Offline</option>
                                            <option value="Maintenance">🟡 Maintenance</option>
                                        </select>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <User size={14} /> Admin Contact
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={formData.adminName}
                                                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                                    placeholder="Họ tên người phụ trách"
                                                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${errors.adminName ? 'border-red-300' : 'border-amber-200'}`}
                                                />
                                                {errors.adminName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.adminName}</p>}
                                            </div>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                                                <input
                                                    type="text"
                                                    value={formData.adminPhone}
                                                    onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                                                    placeholder="SĐT liên hệ"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Note</label>
                                <textarea
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Ghi chú về thiết bị..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">
                                    Hủy
                                </button>
                                <button type="submit" className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                                    <Check size={20} /> {editingAsset ? 'Cập nhật' : 'Thêm thiết bị'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkPage;
