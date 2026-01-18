import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, HardHat, ShieldCheck, Home, UserCircle,
    FolderKanban, BookUser, AlertTriangle, Database, LogOut, Crown
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout, isLeader } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Base nav items for everyone
    const navItems = [
        { to: '/', icon: <Home size={20} />, label: 'Home' },
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/alarms', icon: <AlertTriangle size={20} />, label: 'Alarms' },
        { to: '/cmdb', icon: <Database size={20} />, label: 'CMDB', leaderOnly: true },
        { to: '/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
        { to: '/members', icon: <UserCircle size={20} />, label: 'Members', leaderOnly: true },
        { to: '/customers/contacts', icon: <BookUser size={20} />, label: 'Contacts' },
        { to: '/customers', icon: <Users size={20} />, label: 'Customers' },
        { to: '/engineers', icon: <HardHat size={20} />, label: 'Engineers' },
    ];

    // Filter items based on role
    const filteredNavItems = navItems.filter(item => !item.leaderOnly || isLeader);

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-primary-600 p-2 rounded-lg text-white">
                    <ShieldCheck size={24} />
                </div>
                <span className="font-bold text-xl text-slate-800 tracking-tight">ITSM Report</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-100/50 shadow-sm shadow-primary-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-100 space-y-3">
                {/* User Info */}
                <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${isLeader ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`}>
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{user?.full_name}</p>
                            <div className="flex items-center gap-1">
                                {isLeader && <Crown size={12} className="text-amber-500" />}
                                <p className={`text-xs font-bold uppercase tracking-wider ${isLeader ? 'text-violet-600' : 'text-cyan-600'}`}>
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
                >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
