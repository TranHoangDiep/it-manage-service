import React, { useState } from 'react';
import { Phone, Mail, Users, ChevronDown, Briefcase, Crown, Calendar, Target } from 'lucide-react';

// Project Data Structure
const PROJECTS_DATA = [
    {
        id: 1,
        name: 'Hệ thống ITSM',
        description: 'Xây dựng hệ thống quản lý dịch vụ CNTT cho doanh nghiệp lớn với tích hợp ManageEngine và Prometheus monitoring.',
        status: 'Active',
        startDate: '01/2026',
        lead: {
            name: 'Nguyễn Văn An',
            role: 'Project Manager',
            phone: '0912 345 678',
            email: 'an.nguyen@cmcts.com.vn'
        },
        members: [
            { id: 1, name: 'Trần Văn Bình', role: 'System Engineer', phone: '0987 654 321', email: 'binh.tran@cmcts.com.vn' },
            { id: 2, name: 'Lê Hoàng Cường', role: 'Backend Developer', phone: '0903 111 222', email: 'cuong.le@cmcts.com.vn' },
            { id: 3, name: 'Phạm Minh Dũng', role: 'Frontend Developer', phone: '0918 333 444', email: 'dung.pham@cmcts.com.vn' },
            { id: 4, name: 'Hoàng Thị Em', role: 'QA Engineer', phone: '0909 555 666', email: 'em.hoang@cmcts.com.vn' },
        ]
    },
    {
        id: 2,
        name: 'VMware Monitoring',
        description: 'Triển khai giám sát toàn diện hạ tầng VMware với Prometheus Exporter và Grafana Dashboard.',
        status: 'Active',
        startDate: '12/2025',
        lead: {
            name: 'Võ Thanh Hải',
            role: 'Tech Lead',
            phone: '0935 777 888',
            email: 'hai.vo@cmcts.com.vn'
        },
        members: [
            { id: 5, name: 'Ngô Văn Khoa', role: 'DevOps Engineer', phone: '0922 111 333', email: 'khoa.ngo@cmcts.com.vn' },
            { id: 6, name: 'Đỗ Thị Lan', role: 'System Admin', phone: '0944 222 444', email: 'lan.do@cmcts.com.vn' },
            { id: 7, name: 'Bùi Văn Minh', role: 'Network Engineer', phone: '0966 333 555', email: 'minh.bui@cmcts.com.vn' },
        ]
    },
    {
        id: 3,
        name: 'Network Automation',
        description: 'Tự động hóa quy trình quản lý và cấu hình mạng sử dụng Ansible và Python scripting.',
        status: 'Planning',
        startDate: '02/2026',
        lead: {
            name: 'Trương Văn Nam',
            role: 'Network Architect',
            phone: '0977 888 999',
            email: 'nam.truong@cmcts.com.vn'
        },
        members: [
            { id: 8, name: 'Lý Văn Phúc', role: 'Network Engineer', phone: '0988 444 666', email: 'phuc.ly@cmcts.com.vn' },
            { id: 9, name: 'Đinh Thị Quỳnh', role: 'Automation Engineer', phone: '0999 555 777', email: 'quynh.dinh@cmcts.com.vn' },
        ]
    }
];

const Projects = () => {
    const [activeProjectId, setActiveProjectId] = useState(PROJECTS_DATA[0].id);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const activeProject = PROJECTS_DATA.find(p => p.id === activeProjectId);

    const getInitials = (name) => {
        return name.split(' ').slice(-1)[0].charAt(0).toUpperCase();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700';
            case 'Planning': return 'bg-amber-100 text-amber-700';
            case 'Completed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-10">
            {/* Project Selector Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between w-full md:w-auto min-w-[300px] px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-violet-300 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Briefcase size={20} className="text-violet-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự án</p>
                            <p className="font-bold text-slate-800">{activeProject?.name}</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full md:w-[350px] bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                        {PROJECTS_DATA.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => { setActiveProjectId(project.id); setDropdownOpen(false); }}
                                className={`w-full px-5 py-4 text-left hover:bg-violet-50 transition-colors flex items-center justify-between ${activeProjectId === project.id ? 'bg-violet-50' : ''}`}
                            >
                                <div>
                                    <p className="font-bold text-slate-800">{project.name}</p>
                                    <p className="text-xs text-slate-400">{project.members.length + 1} thành viên</p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-500/20">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left - Project Image/Visual */}
                    <div className="relative h-64 lg:h-auto min-h-[300px] bg-gradient-to-br from-violet-500/30 to-transparent flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
                        <div className="relative text-center p-8">
                            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Target size={64} className="text-white" />
                            </div>
                            <span className={`text-xs font-black px-4 py-2 rounded-full ${activeProject?.status === 'Active' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'}`}>
                                {activeProject?.status}
                            </span>
                        </div>
                    </div>

                    {/* Right - Project Info */}
                    <div className="p-10 lg:p-12 text-white flex flex-col justify-center">
                        <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                            {activeProject?.name}
                        </h1>
                        <p className="text-lg text-violet-200 leading-relaxed mb-8">
                            {activeProject?.description}
                        </p>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-violet-300" />
                                <span className="font-medium text-violet-200">Bắt đầu: {activeProject?.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-violet-300" />
                                <span className="font-medium text-violet-200">{(activeProject?.members.length || 0) + 1} thành viên</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Lead Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Crown size={24} className="text-amber-500" />
                    <h2 className="text-xl font-black text-slate-800">Project Lead</h2>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-violet-500/30">
                        {getInitials(activeProject?.lead.name || '')}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-800">{activeProject?.lead.name}</h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                            {activeProject?.lead.role}
                        </span>
                        <div className="flex flex-wrap gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={16} className="text-violet-400" />
                                <span className="font-mono font-medium">{activeProject?.lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail size={16} className="text-violet-400" />
                                <span className="font-medium">{activeProject?.lead.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members Grid */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-violet-500" />
                        <h2 className="text-xl font-black text-slate-800">Team Members</h2>
                    </div>
                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                        {activeProject?.members.length} người
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeProject?.members.map((member) => (
                        <div
                            key={member.id}
                            className="group p-6 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-transparent hover:border-violet-200 transition-all hover:shadow-lg hover:shadow-violet-500/10"
                        >
                            {/* Avatar */}
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                                {getInitials(member.name)}
                            </div>

                            {/* Name & Role */}
                            <h4 className="text-lg font-bold text-slate-800 text-center mb-1 group-hover:text-violet-700 transition-colors">
                                {member.name}
                            </h4>
                            <p className="text-xs font-bold text-violet-500 text-center bg-violet-100 rounded-lg py-1 px-3 mx-auto w-fit mb-4">
                                {member.role}
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 justify-center">
                                    <Phone size={14} className="text-violet-400" />
                                    <span className="font-mono">{member.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 justify-center">
                                    <Mail size={14} className="text-violet-400" />
                                    <span className="text-xs truncate">{member.email}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Projects;
