import React, { useEffect, useState } from 'react';
import { memberService } from '../services/api';
import {
    UserPlus, Upload, Search, Edit2, Trash2, X, Check, AlertCircle, Download
} from 'lucide-react';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        email: '', full_name: '', birth_year: '', cccd: '', phone: '', project: ''
    });
    const [importData, setImportData] = useState('');
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const data = await memberService.getAll();
            setMembers(data);
        } catch (error) {
            console.error('Failed to load members:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMember) {
                await memberService.update(editingMember.id, formData);
            } else {
                await memberService.create(formData);
            }
            setShowAddModal(false);
            setEditingMember(null);
            setFormData({ email: '', full_name: '', birth_year: '', cccd: '', phone: '', project: '' });
            loadMembers();
        } catch (error) {
            alert(error.response?.data?.error || 'Error saving member');
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            email: member.email || '',
            full_name: member.full_name || '',
            birth_year: member.birth_year || '',
            cccd: member.cccd || '',
            phone: member.phone || '',
            project: member.project || ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa thành viên này?')) {
            try {
                await memberService.delete(id);
                loadMembers();
            } catch (error) {
                alert('Error deleting member');
            }
        }
    };

    const handleImport = async () => {
        try {
            const data = JSON.parse(importData);
            const result = await memberService.import(data);
            setImportResult(result);
            loadMembers();
        } catch (error) {
            if (error instanceof SyntaxError) {
                alert('Invalid JSON format. Please check your data.');
            } else {
                alert(error.response?.data?.error || 'Import failed');
            }
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                email: "example@company.com",
                full_name: "Nguyễn Văn A",
                birth_year: 1990,
                cccd: "012345678901",
                phone: "0901234567",
                project: "Project Alpha"
            }
        ];
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_template.json';
        a.click();
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.project?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Member Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Quản lý danh sách thành viên dự án</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Upload size={18} /> Import
                    </button>
                    <button
                        onClick={() => { setEditingMember(null); setFormData({ email: '', full_name: '', birth_year: '', cccd: '', phone: '', project: '' }); setShowAddModal(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email hoặc dự án..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Thông tin</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Năm sinh</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">CCCD</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">SĐT</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Dự án</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thành viên nào. Hãy thêm mới hoặc import!'}
                                </td>
                            </tr>
                        ) : (
                            filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                                                {member.full_name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{member.full_name}</p>
                                                <p className="text-sm text-slate-400">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-600 font-medium">{member.birth_year || '—'}</td>
                                    <td className="px-6 py-5 text-slate-600 font-medium font-mono text-sm">{member.cccd || '—'}</td>
                                    <td className="px-6 py-5 text-slate-600 font-medium">{member.phone || '—'}</td>
                                    <td className="px-6 py-5">
                                        {member.project ? (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg">
                                                {member.project}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800">
                                {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Email *</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Họ và tên *</label>
                                <input type="text" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Năm sinh</label>
                                    <input type="number" value={formData.birth_year} onChange={e => setFormData({ ...formData, birth_year: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">CCCD</label>
                                    <input type="text" value={formData.cccd} onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Số điện thoại</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Dự án</label>
                                    <input type="text" value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                                <Check size={20} /> {editingMember ? 'Cập nhật' : 'Thêm thành viên'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowImportModal(false); setImportResult(null); setImportData(''); }}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800">Import danh sách thành viên</h2>
                            <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportData(''); }} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                                <p className="text-sm text-slate-600 font-medium">Tải file mẫu JSON để import</p>
                                <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-primary-500">
                                    <Download size={16} /> Download Template
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Paste JSON data</label>
                                <textarea
                                    value={importData}
                                    onChange={e => setImportData(e.target.value)}
                                    placeholder='[{"email": "...", "full_name": "...", ...}]'
                                    className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            {importResult && (
                                <div className={`p-4 rounded-2xl flex items-start gap-3 ${importResult.errors?.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                    <AlertCircle size={20} className={importResult.errors?.length > 0 ? 'text-amber-600' : 'text-emerald-600'} />
                                    <div>
                                        <p className="font-bold text-slate-800">{importResult.message}</p>
                                        {importResult.errors?.length > 0 && (
                                            <ul className="text-sm text-slate-600 mt-2">
                                                {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                            <button onClick={handleImport} disabled={!importData.trim()} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                                <Upload size={20} /> Import Members
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;
