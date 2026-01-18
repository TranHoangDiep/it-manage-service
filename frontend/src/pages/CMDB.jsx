import React, { useState } from 'react';
import {
    Server, Database, Monitor, Plus, Search, Edit2, Trash2, X, Check,
    Cpu, HardDrive, User, Phone, AlertCircle
} from 'lucide-react';

// Initial CMDB Assets Data
const INITIAL_ASSETS = [
    {
        id: "VC-001",
        type: "vCenter",
        name: "vCenter-DC01",
        ip: "10.0.1.10",
        os: "VMware vCenter 7.0",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "8 vCPU",
        ram: "32 GB",
        adminName: "Nguyễn Văn An",
        adminPhone: "0912 345 678",
        note: "Primary vCenter for Production"
    },
    {
        id: "HOST-001",
        type: "Host",
        name: "ESXi-Host-01",
        ip: "10.0.1.21",
        os: "VMware ESXi 7.0",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "64 Cores",
        ram: "512 GB",
        adminName: "Trần Văn Bình",
        adminPhone: "0987 654 321",
        note: "Production Host - Critical"
    },
    {
        id: "HOST-002",
        type: "Host",
        name: "ESXi-Host-02",
        ip: "10.0.1.22",
        os: "VMware ESXi 7.0",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "64 Cores",
        ram: "512 GB",
        adminName: "Trần Văn Bình",
        adminPhone: "0987 654 321",
        note: "Production Host - Backup"
    },
    {
        id: "VM-001",
        type: "VM",
        name: "DB-Server-01",
        ip: "192.168.1.10",
        os: "Ubuntu 22.04 LTS",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "16 vCPU",
        ram: "64 GB",
        adminName: "Lê Hoàng Cường",
        adminPhone: "0903 111 222",
        note: "MySQL Primary Database"
    },
    {
        id: "VM-002",
        type: "VM",
        name: "App-Server-01",
        ip: "192.168.1.15",
        os: "CentOS 8",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "8 vCPU",
        ram: "32 GB",
        adminName: "Phạm Minh Dũng",
        adminPhone: "0918 333 444",
        note: "Backend Application Server"
    },
    {
        id: "VM-003",
        type: "VM",
        name: "Web-Server-01",
        ip: "192.168.1.20",
        os: "Ubuntu 20.04 LTS",
        cluster: "DC01-Cluster",
        status: "Maintenance",
        cpu: "4 vCPU",
        ram: "16 GB",
        adminName: "Hoàng Thị Em",
        adminPhone: "0909 555 666",
        note: "Nginx Web Server - Đang upgrade"
    },
    {
        id: "VM-004",
        type: "VM",
        name: "Monitoring-01",
        ip: "192.168.1.30",
        os: "Ubuntu 22.04 LTS",
        cluster: "DC01-Cluster",
        status: "Running",
        cpu: "4 vCPU",
        ram: "8 GB",
        adminName: "Võ Thanh Hải",
        adminPhone: "0935 777 888",
        note: "Prometheus + Grafana Stack"
    },
];

const OS_OPTIONS = [
    "Ubuntu 22.04 LTS",
    "Ubuntu 20.04 LTS",
    "CentOS 8",
    "CentOS 7",
    "Windows Server 2022",
    "Windows Server 2019",
    "VMware ESXi 7.0",
    "VMware ESXi 8.0",
    "VMware vCenter 7.0",
    "VMware vCenter 8.0",
    "Red Hat Enterprise Linux 8",
    "Debian 11",
];

const CMDB = () => {
    const [assets, setAssets] = useState(INITIAL_ASSETS);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        type: 'VM', name: '', ip: '', os: 'Ubuntu 22.04 LTS', cluster: 'DC01-Cluster',
        status: 'Running', cpu: '', ram: '', adminName: '', adminPhone: '', note: ''
    });

    const generateId = (type) => {
        const prefix = type === 'vCenter' ? 'VC' : type === 'Host' ? 'HOST' : 'VM';
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
        if (!formData.name.trim()) newErrors.name = 'Tên asset không được để trống';
        if (!formData.ip.trim()) newErrors.ip = 'IP không được để trống';
        else if (!validateIP(formData.ip)) newErrors.ip = 'IP không hợp lệ (ví dụ: 192.168.1.1)';
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
        if (window.confirm('Bạn có chắc muốn xóa asset này khỏi CMDB?')) {
            setAssets(assets.filter(a => a.id !== id));
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAsset(null);
        setErrors({});
        setFormData({
            type: 'VM', name: '', ip: '', os: 'Ubuntu 22.04 LTS', cluster: 'DC01-Cluster',
            status: 'Running', cpu: '', ram: '', adminName: '', adminPhone: '', note: ''
        });
    };

    const openAddModal = () => {
        setEditingAsset(null);
        setErrors({});
        setFormData({
            type: 'VM', name: '', ip: '', os: 'Ubuntu 22.04 LTS', cluster: 'DC01-Cluster',
            status: 'Running', cpu: '', ram: '', adminName: '', adminPhone: '', note: ''
        });
        setShowModal(true);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'vCenter': return <Database size={16} className="text-violet-500" />;
            case 'Host': return <Server size={16} className="text-blue-500" />;
            case 'VM': return <Monitor size={16} className="text-emerald-500" />;
            default: return <Server size={16} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Running':
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg">Running</span>;
            case 'Stopped':
                return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg">Stopped</span>;
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
        vCenter: assets.filter(a => a.type === 'vCenter').length,
        Host: assets.filter(a => a.type === 'Host').length,
        VM: assets.filter(a => a.type === 'VM').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-violet-100 text-violet-600 rounded-2xl">
                        <Database size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mini CMDB</h1>
                        <p className="text-slate-500 font-medium mt-1">Quản lý tài sản hạ tầng ảo hóa</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus size={20} /> Add New Asset
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => setTypeFilter(typeFilter === 'vCenter' ? 'All' : 'vCenter')}
                    className={`p-6 rounded-[2rem] border transition-all ${typeFilter === 'vCenter' ? 'bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-500/20' : 'bg-white border-slate-200 hover:border-violet-300'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${typeFilter === 'vCenter' ? 'bg-white/20' : 'bg-violet-100'}`}>
                            <Database size={24} className={typeFilter === 'vCenter' ? 'text-white' : 'text-violet-600'} />
                        </div>
                        <div className="text-left">
                            <p className={`text-3xl font-black ${typeFilter === 'vCenter' ? 'text-white' : 'text-slate-800'}`}>{stats.vCenter}</p>
                            <p className={`text-sm font-bold ${typeFilter === 'vCenter' ? 'text-violet-200' : 'text-slate-400'}`}>vCenters</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setTypeFilter(typeFilter === 'Host' ? 'All' : 'Host')}
                    className={`p-6 rounded-[2rem] border transition-all ${typeFilter === 'Host' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${typeFilter === 'Host' ? 'bg-white/20' : 'bg-blue-100'}`}>
                            <Server size={24} className={typeFilter === 'Host' ? 'text-white' : 'text-blue-600'} />
                        </div>
                        <div className="text-left">
                            <p className={`text-3xl font-black ${typeFilter === 'Host' ? 'text-white' : 'text-slate-800'}`}>{stats.Host}</p>
                            <p className={`text-sm font-bold ${typeFilter === 'Host' ? 'text-blue-200' : 'text-slate-400'}`}>ESXi Hosts</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setTypeFilter(typeFilter === 'VM' ? 'All' : 'VM')}
                    className={`p-6 rounded-[2rem] border transition-all ${typeFilter === 'VM' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/20' : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${typeFilter === 'VM' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                            <Monitor size={24} className={typeFilter === 'VM' ? 'text-white' : 'text-emerald-600'} />
                        </div>
                        <div className="text-left">
                            <p className={`text-3xl font-black ${typeFilter === 'VM' ? 'text-white' : 'text-slate-800'}`}>{stats.VM}</p>
                            <p className={`text-sm font-bold ${typeFilter === 'VM' ? 'text-emerald-200' : 'text-slate-400'}`}>Virtual Machines</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo Name, IP, hoặc Admin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                />
                {typeFilter !== 'All' && (
                    <button
                        onClick={() => setTypeFilter('All')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Asset</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">IP</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">OS / Type</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Specs</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Admin Contact</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        {searchTerm || typeFilter !== 'All' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có asset nào trong CMDB'}
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
                                            <p className="text-sm text-slate-600 font-medium">{asset.os}</p>
                                            <p className="text-[10px] text-slate-400">{asset.cluster}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Cpu size={12} /> {asset.cpu}</span>
                                                <span className="flex items-center gap-1"><HardDrive size={12} /> {asset.ram}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xs">
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
                                                <button
                                                    onClick={() => handleEdit(asset)}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
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

            {/* Add/Edit Modal - 2-Column Layout */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-600 to-indigo-600">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    {getTypeIcon(formData.type)}
                                </div>
                                <h2 className="text-2xl font-black text-white">
                                    {editingAsset ? 'Chỉnh sửa Asset' : 'Thêm Asset mới'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* 2-Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Asset Type *</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            disabled={!!editingAsset}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 disabled:opacity-50"
                                        >
                                            <option value="vCenter">🟣 vCenter</option>
                                            <option value="Host">🔵 ESXi Host</option>
                                            <option value="VM">🟢 Virtual Machine</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., DB-Server-01"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">IP Address *</label>
                                        <input
                                            type="text"
                                            value={formData.ip}
                                            onChange={e => setFormData({ ...formData, ip: e.target.value })}
                                            placeholder="e.g., 192.168.1.10"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono ${errors.ip ? 'border-red-300' : 'border-slate-200'}`}
                                        />
                                        {errors.ip && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.ip}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">OS Type</label>
                                        <select
                                            value={formData.os}
                                            onChange={e => setFormData({ ...formData, os: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                                        >
                                            {OS_OPTIONS.map(os => <option key={os} value={os}>{os}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">CPU</label>
                                            <input
                                                type="text"
                                                value={formData.cpu}
                                                onChange={e => setFormData({ ...formData, cpu: e.target.value })}
                                                placeholder="e.g., 8 vCPU"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">RAM</label>
                                            <input
                                                type="text"
                                                value={formData.ram}
                                                onChange={e => setFormData({ ...formData, ram: e.target.value })}
                                                placeholder="e.g., 32 GB"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                                        >
                                            <option value="Running">🟢 Running</option>
                                            <option value="Stopped">🔴 Stopped</option>
                                            <option value="Maintenance">🟡 Maintenance</option>
                                        </select>
                                    </div>

                                    {/* Admin Contact Section */}
                                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                                        <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <User size={14} /> Admin Contact
                                        </p>
                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={formData.adminName}
                                                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                                    placeholder="Họ tên người phụ trách"
                                                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${errors.adminName ? 'border-red-300' : 'border-violet-200'}`}
                                                />
                                                {errors.adminName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.adminName}</p>}
                                            </div>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                                                <input
                                                    type="text"
                                                    value={formData.adminPhone}
                                                    onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                                                    placeholder="SĐT liên hệ (09xx xxx xxx)"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Note - Full Width */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Note</label>
                                <textarea
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Ghi chú về asset (mục đích sử dụng, thông tin quan trọng...)"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                                />
                            </div>

                            {/* Actions */}
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
                                    className="flex-1 py-4 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                                >
                                    <Check size={20} /> {editingAsset ? 'Cập nhật' : 'Thêm Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CMDB;
