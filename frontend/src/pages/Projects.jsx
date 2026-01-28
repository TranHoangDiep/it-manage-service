import React, { useState, useEffect } from 'react';
import { projectService, memberService } from '../services/api';
import {
    Phone, Mail, Users, ChevronDown, Briefcase, Crown, Calendar, Target,
    Plus, Edit2, Trash2, X, Check, UserPlus
} from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Modals
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [availableMembers, setAvailableMembers] = useState([]);

    // Forms
    const [projectForm, setProjectForm] = useState({
        name: '', description: '', status: 'Active', startDate: '', logo: '',
        lead: { name: '', role: '', phone: '', email: '' }
    });

    const [memberForm, setMemberForm] = useState({
        name: '', role: '', phone: '', email: '', team: 'System'
    });

    useEffect(() => {
        loadProjects();
        loadMembers();
    }, []);

    useEffect(() => {
        if (projects.length > 0 && !activeProjectId) {
            setActiveProjectId(projects[0].id);
        }
    }, [projects]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getAll();
            setProjects(data);
            if (data.length > 0 && !activeProjectId) {
                setActiveProjectId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
        setLoading(false);
    };

    const loadMembers = async () => {
        try {
            const data = await memberService.getAll();
            setAvailableMembers(data);
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    };

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        return parts.length > 1
            ? parts[parts.length - 1].charAt(0).toUpperCase()
            : name.charAt(0).toUpperCase();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700';
            case 'Planning': return 'bg-amber-100 text-amber-700';
            case 'Completed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // --- Project Handlers ---

    const handleEditProject = () => {
        if (!activeProject) return;
        setEditingProject(activeProject);
        setProjectForm({
            name: activeProject.name,
            description: activeProject.description,
            status: activeProject.status,
            startDate: activeProject.startDate,
            lead: { ...activeProject.lead }
        });
        setShowProjectModal(true);
    };

    const handleAddProject = () => {
        setEditingProject(null);
        setProjectForm({
            name: '', description: '', status: 'Active', startDate: '',
            lead: { name: '', role: '', phone: '', email: '' }
        });
        setShowProjectModal(true);
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                const updated = await projectService.update(editingProject.id, projectForm);
                setProjects(projects.map(p => p.id === updated.id ? updated : p));
                setActiveProjectId(updated.id);
            } else {
                const created = await projectService.create(projectForm);
                setProjects([created, ...projects]);
                setActiveProjectId(created.id);
            }
            setShowProjectModal(false);
        } catch (error) {
            alert('Failed to save project');
        }
    };

    const handleDeleteProject = async () => {
        if (!activeProject) return;
        if (!window.confirm(`Are you sure you want to delete project "${activeProject.name}"?`)) return;

        try {
            await projectService.delete(activeProject.id);
            const remaining = projects.filter(p => p.id !== activeProject.id);
            setProjects(remaining);
            setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
        } catch (error) {
            alert('Failed to delete project');
        }
    };

    // --- Member Handlers ---

    const handleSelectExistingMember = (e) => {
        const memberId = e.target.value;
        if (!memberId) return;

        const member = availableMembers.find(m => m.id === parseInt(memberId));
        if (member) {
            setMemberForm({
                ...memberForm,
                name: member.full_name || member.name,
                email: member.email,
                phone: member.phone,
                role: member.role || '',
            });
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!activeProject) return;
        try {
            const newMember = await projectService.addMember(activeProject.id, memberForm);
            // Update local state
            const updatedProject = {
                ...activeProject,
                members: [...activeProject.members, newMember]
            };
            setProjects(projects.map(p => p.id === activeProject.id ? updatedProject : p));
            setShowMemberModal(false);
            setMemberForm({ name: '', role: '', phone: '', email: '' });
        } catch (error) {
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!activeProject) return;
        if (!window.confirm('Remove this member?')) return;
        try {
            await projectService.removeMember(activeProject.id, memberId);
            const updatedProject = {
                ...activeProject,
                members: activeProject.members.filter(m => m.id !== memberId)
            };
            setProjects(projects.map(p => p.id === activeProject.id ? updatedProject : p));
        } catch (error) {
            alert('Failed to remove member');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (projects.length === 0 && !showProjectModal) {
        return (
            <div className="text-center py-20">
                <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase size={40} className="text-violet-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Projects Found</h2>
                <p className="text-slate-500 mb-8">Start by creating your first project.</p>
                <button
                    onClick={handleAddProject}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 mx-auto"
                >
                    <Plus size={20} /> Create New Project
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header / Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative z-10">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-between min-w-[320px] px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-violet-300 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                <Briefcase size={20} className="text-violet-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Project</p>
                                <p className="font-bold text-slate-800 text-lg">{activeProject?.name}</p>
                            </div>
                        </div>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full md:w-[350px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                            {projects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => { setActiveProjectId(project.id); setDropdownOpen(false); }}
                                    className={`w-full px-5 py-4 text-left hover:bg-violet-50 transition-colors flex items-center justify-between ${activeProjectId === project.id ? 'bg-violet-50' : ''}`}
                                >
                                    <div>
                                        <p className="font-bold text-slate-800">{project.name}</p>
                                        <p className="text-xs text-slate-400">{project.members?.length || 0} members</p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </button>
                            ))}
                            <button
                                onClick={() => { setDropdownOpen(false); handleAddProject(); }}
                                className="w-full px-5 py-3 text-left bg-slate-50 hover:bg-slate-100 text-violet-600 font-bold text-sm flex items-center gap-2 border-t border-slate-100"
                            >
                                <Plus size={16} /> Create New Project
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleEditProject}
                        className="p-3 bg-white border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-600 rounded-xl transition-all shadow-sm"
                        title="Edit Project"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="p-3 bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-xl transition-all shadow-sm"
                        title="Delete Project"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            {activeProject && (
                <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-500/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Visual */}
                        <div className="relative h-64 lg:h-auto min-h-[300px] bg-gradient-to-br from-violet-500/30 to-transparent flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
                            <div className="relative text-center p-8">
                                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl p-2">
                                    {activeProject.logo ? (
                                        <img src={activeProject.logo} alt="Project Logo" className="w-full h-full object-contain rounded-[1.5rem]" />
                                    ) : (
                                        <Target size={64} className="text-white" />
                                    )}
                                </div>
                                <span className={`text-xs font-black px-4 py-2 rounded-full ${activeProject.status === 'Active' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'}`}>
                                    {activeProject.status}
                                </span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-10 lg:p-12 text-white flex flex-col justify-center">
                            <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                                {activeProject.name}
                            </h1>
                            <p className="text-lg text-violet-200 leading-relaxed mb-8">
                                {activeProject.description || "No description provided."}
                            </p>
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-violet-300" />
                                    <span className="font-medium text-violet-200">Start: {activeProject.startDate || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-violet-300" />
                                    <span className="font-medium text-violet-200">{activeProject.members?.length || 0} members</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead & Members */}
            {activeProject && (
                <>
                    {/* Project Lead */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Crown size={24} className="text-amber-500" />
                            <h2 className="text-xl font-black text-slate-800">Project Lead</h2>
                        </div>
                        {activeProject.lead?.name ? (
                            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-violet-500/30">
                                    {getInitials(activeProject.lead.name)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-slate-800">{activeProject.lead.name}</h3>
                                    <span className="inline-block mt-1 px-3 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                                        {activeProject.lead.role}
                                    </span>
                                    <div className="flex flex-wrap gap-6 mt-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-violet-400" />
                                            <span className="font-mono font-medium">{activeProject.lead.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} className="text-violet-400" />
                                            <span className="font-medium">{activeProject.lead.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-center py-8">No Project Lead assigned</div>
                        )}
                    </div>

                    {/* Team Sections */}
                    {/* Team Sections */}
                    {['Network', 'System', 'NOC Team'].map(teamName => {
                        const teamMembers = activeProject.members?.filter(m => (m.team === teamName) || (teamName === 'System' && (!m.team || m.team === 'Other'))) || [];
                        return (
                            <div key={teamName} className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8 mt-8">
                                {/* Team Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <Users size={24} className="text-violet-500" />
                                        <h2 className="text-xl font-black text-slate-800">{teamName}</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                                            {teamMembers.length} people
                                        </span>
                                        <button
                                            onClick={() => {
                                                setMemberForm(prev => ({ ...prev, team: teamName }));
                                                setShowMemberModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-sm rounded-xl transition-colors"
                                        >
                                            <Plus size={16} /> Add
                                        </button>
                                    </div>
                                </div>

                                {/* Members Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="group relative p-6 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-transparent hover:border-violet-200 transition-all hover:shadow-lg hover:shadow-violet-500/10"
                                        >
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>

                                            <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                                                {getInitials(member.name)}
                                            </div>

                                            <h4 className="text-lg font-bold text-slate-800 text-center mb-1 group-hover:text-violet-700 transition-colors">
                                                {member.name}
                                            </h4>
                                            <p className="text-xs font-bold text-violet-500 text-center bg-violet-100 rounded-lg py-1 px-3 mx-auto w-fit mb-4">
                                                {member.role || 'Member'}
                                            </p>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-slate-500 justify-center">
                                                    <Phone size={14} className="text-violet-400" />
                                                    <span className="font-mono">{member.phone || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 justify-center">
                                                    <Mail size={14} className="text-violet-400" />
                                                    <span className="text-xs truncate">{member.email || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {teamMembers.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-400 italic">
                                            No members in this team yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {/* --- Project Modal --- */}
            {
                showProjectModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectModal(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-2xl font-black text-slate-800">
                                    {editingProject ? 'Edit Project' : 'Create New Project'}
                                </h2>
                                <button onClick={() => setShowProjectModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveProject} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-violet-500 uppercase tracking-widest border-b border-slate-100 pb-2">Project Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Project Name</label>
                                            <input required type="text" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                            <textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 h-24" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Logo URL (Optional)</label>
                                            <input type="text" placeholder="https://..." value={projectForm.logo || ''} onChange={e => setProjectForm({ ...projectForm, logo: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                            <select value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500">
                                                <option value="Active">Active</option>
                                                <option value="Planning">Planning</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                                            <input type="text" placeholder="MM/YYYY" value={projectForm.startDate} onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-violet-500 uppercase tracking-widest border-b border-slate-100 pb-2">Project Lead</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Lead Name</label>
                                            <input type="text" value={projectForm.lead.name} onChange={e => setProjectForm({ ...projectForm, lead: { ...projectForm.lead, name: e.target.value } })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Role/Title</label>
                                            <input type="text" value={projectForm.lead.role} onChange={e => setProjectForm({ ...projectForm, lead: { ...projectForm.lead, role: e.target.value } })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                            <input type="text" value={projectForm.lead.phone} onChange={e => setProjectForm({ ...projectForm, lead: { ...projectForm.lead, phone: e.target.value } })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                            <input type="email" value={projectForm.lead.email} onChange={e => setProjectForm({ ...projectForm, lead: { ...projectForm.lead, email: e.target.value } })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-violet-500/20">
                                    <Check size={20} /> Save Project
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* --- Member Modal --- */}
            {
                showMemberModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMemberModal(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-black text-slate-800">Add Team Member</h2>
                                <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddMember} className="p-8 space-y-4">
                                {/* Member Selection Dropdown */}
                                <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 mb-4">
                                    <label className="block text-xs font-bold text-violet-700 mb-2">Select from Member List (Optional)</label>
                                    <select
                                        className="w-full px-4 py-2 bg-white border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm"
                                        onChange={handleSelectExistingMember}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Choose a member --</option>
                                        {availableMembers.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.full_name || m.name} {m.role ? `- ${m.role}` : ''} ({m.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                    <input required type="text" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Team</label>
                                    <select value={memberForm.team} onChange={e => setMemberForm({ ...memberForm, team: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500">
                                        <option value="System">System</option>
                                        <option value="Network">Network</option>
                                        <option value="NOC Team">NOC Team</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Role in Project</label>
                                    <input type="text" value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                    <input type="text" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                    <input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                                    <UserPlus size={20} /> Add Member
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Projects;

