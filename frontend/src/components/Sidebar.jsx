import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, HardHat, ShieldCheck, Home, Network, Server,
    FolderKanban, BookUser, AlertTriangle, Building2, Wrench, UserCircle,
    ChevronDown, ChevronRight, Phone, BarChart3, Activity, TrendingUp,
    Clock, Shield, Cloud, Database, Link2, MapPin, RefreshCw, Calendar
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    // Track open submenus
    const [openMenus, setOpenMenus] = useState({
        dashboards: location.pathname.startsWith('/dashboard'),
        customers: location.pathname.startsWith('/customers') || location.pathname.startsWith('/engineers'),
        services: location.pathname.startsWith('/services'),
        alarms: location.pathname.startsWith('/alarms'),
        cmdb: location.pathname.startsWith('/cmdb'),
        projects: location.pathname.startsWith('/projects'),
        people: location.pathname.startsWith('/people'),
        contacts: location.pathname.startsWith('/contacts'),
    });

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const MenuItem = ({ to, icon, label, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
            }
        >
            {icon}
            <span className="text-sm">{label}</span>
        </NavLink>
    );

    const SubMenuItem = ({ to, label, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-all ${isActive
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
            }
        >
            {label}
        </NavLink>
    );

    const MenuGroup = ({ title, icon, menuKey, children, isActive }) => (
        <div>
            <button
                onClick={() => toggleMenu(menuKey)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm">{title}</span>
                </div>
                {openMenus[menuKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {openMenus[menuKey] && (
                <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0">
            {/* Logo */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
                    <ShieldCheck size={22} />
                </div>
                <div>
                    <span className="font-black text-lg text-slate-800 tracking-tight block">CMC OpsCenter</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">IT Operations</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {/* Home */}
                <MenuItem to="/" icon={<Home size={18} />} label="Home" end />

                {/* Dashboards */}
                <MenuGroup
                    title="Dashboards"
                    icon={<LayoutDashboard size={18} />}
                    menuKey="dashboards"
                    isActive={location.pathname.startsWith('/dashboard')}
                >
                    <SubMenuItem to="/dashboard" label="Executive Overview" end />
                    <SubMenuItem to="/dashboard/noc" label="NOC Overview" />
                    <SubMenuItem to="/dashboard/sla" label="SLA & KPI" />
                    <SubMenuItem to="/dashboard/capacity" label="Capacity & Trend" />
                </MenuGroup>

                {/* Customers */}
                <MenuGroup
                    title="Customers"
                    icon={<Building2 size={18} />}
                    menuKey="customers"
                    isActive={location.pathname.startsWith('/customers') || location.pathname.startsWith('/engineers')}
                >
                    <SubMenuItem to="/customers" label="All Customers" end />
                    <SubMenuItem to="/engineers" label="Engineers" end />
                    <SubMenuItem to="/customers/services" label="Services" />
                    <SubMenuItem to="/customers/reports" label="Reports" />
                </MenuGroup>

                {/* Services */}
                <MenuGroup
                    title="Services"
                    icon={<Wrench size={18} />}
                    menuKey="services"
                    isActive={location.pathname.startsWith('/services')}
                >
                    <SubMenuItem to="/services/monitoring" label="Monitoring" />
                    <SubMenuItem to="/services/backup" label="Backup" />
                    <SubMenuItem to="/services/security" label="Security" />
                    <SubMenuItem to="/services/cloud" label="Cloud / Infra" />
                </MenuGroup>

                {/* Alarms */}
                <MenuGroup
                    title="Alarms"
                    icon={<AlertTriangle size={18} />}
                    menuKey="alarms"
                    isActive={location.pathname.startsWith('/alarms')}
                >
                    <SubMenuItem to="/alarms" label="Active Alarms" end />
                    <SubMenuItem to="/alarms/history" label="Alarm History" />
                    <SubMenuItem to="/alarms/correlation" label="Correlation" />
                    <SubMenuItem to="/alarms/rules" label="Auto-Ticket Rules" />
                </MenuGroup>

                {/* CMDB */}
                <MenuGroup
                    title="CMDB"
                    icon={<Database size={18} />}
                    menuKey="cmdb"
                    isActive={location.pathname.startsWith('/cmdb')}
                >
                    <SubMenuItem to="/cmdb" label="Assets" end />
                    <SubMenuItem to="/cmdb/network" label="Network" />
                    <SubMenuItem to="/cmdb/relationships" label="Relationships" />
                    <SubMenuItem to="/cmdb/locations" label="Locations" />
                    <SubMenuItem to="/cmdb/lifecycle" label="Lifecycle" />
                </MenuGroup>

                {/* Projects */}
                <MenuGroup
                    title="Projects"
                    icon={<FolderKanban size={18} />}
                    menuKey="projects"
                    isActive={location.pathname.startsWith('/projects')}
                >
                    <SubMenuItem to="/projects" label="Ongoing" end />
                    <SubMenuItem to="/projects/completed" label="Completed" />
                    <SubMenuItem to="/projects/changes" label="Change / Upgrade" />
                </MenuGroup>

                {/* People */}
                <MenuGroup
                    title="People"
                    icon={<UserCircle size={18} />}
                    menuKey="people"
                    isActive={location.pathname.startsWith('/people')}
                >
                    <SubMenuItem to="/people/schedule" label="On-duty Schedule" />
                    <SubMenuItem to="/people/skills" label="Skill Matrix" />
                </MenuGroup>

                {/* Contacts */}
                <MenuGroup
                    title="Contacts"
                    icon={<Phone size={18} />}
                    menuKey="contacts"
                    isActive={location.pathname.startsWith('/contacts')}
                >
                    <SubMenuItem to="/contacts/customers" label="Customer Contacts" />
                    <SubMenuItem to="/contacts/vendors" label="Vendors" />
                    <SubMenuItem to="/contacts/emergency" label="Emergency" />
                </MenuGroup>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-3 text-center">
                    <p className="text-xs text-slate-400 font-medium">CMC OpsCenter v2.0</p>
                    <p className="text-[10px] text-slate-300">© 2026 CMC Telecom</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
