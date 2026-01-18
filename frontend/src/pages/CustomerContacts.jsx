import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Users, ChevronDown, Building2, Crown, MapPin, Globe, ArrowLeft } from 'lucide-react';

// Customer Contact Data Structure
const CUSTOMERS_DATA = [
    {
        id: 1,
        name: 'BIDV Metlife',
        industry: 'Bảo hiểm & Tài chính',
        address: 'Tầng 25, Keangnam Landmark, Phạm Hùng, Hà Nội',
        website: 'www.bidvmetlife.com.vn',
        status: 'Active',
        itHead: {
            name: 'Nguyễn Hoàng Nam',
            title: 'IT Director',
            phone: '0912 888 999',
            email: 'nam.nh@bidvmetlife.com.vn'
        },
        contacts: [
            { id: 1, name: 'Trần Văn Đức', title: 'IT Manager', department: 'Infrastructure', phone: '0987 111 222', email: 'duc.tv@bidvmetlife.com.vn' },
            { id: 2, name: 'Lê Thị Hương', title: 'System Admin', department: 'Operations', phone: '0903 333 444', email: 'huong.lt@bidvmetlife.com.vn' },
            { id: 3, name: 'Phạm Minh Tuấn', title: 'Network Engineer', department: 'Infrastructure', phone: '0918 555 666', email: 'tuan.pm@bidvmetlife.com.vn' },
        ]
    },
    {
        id: 2,
        name: 'FPT Software',
        industry: 'Công nghệ thông tin',
        address: 'Tòa nhà FPT, Duy Tân, Cầu Giấy, Hà Nội',
        website: 'www.fpt-software.com',
        status: 'Active',
        itHead: {
            name: 'Võ Thanh Hải',
            title: 'CTO',
            phone: '0935 777 888',
            email: 'hai.vt@fpt-software.com'
        },
        contacts: [
            { id: 4, name: 'Ngô Văn Khoa', title: 'DevOps Lead', department: 'Cloud Services', phone: '0922 111 333', email: 'khoa.nv@fpt-software.com' },
            { id: 5, name: 'Đỗ Thị Lan', title: 'Security Manager', department: 'Security', phone: '0944 222 444', email: 'lan.dt@fpt-software.com' },
        ]
    },
    {
        id: 3,
        name: 'Vietnam Airlines',
        industry: 'Hàng không',
        address: 'Sân bay Nội Bài, Hà Nội',
        website: 'www.vietnamairlines.com',
        status: 'Active',
        itHead: {
            name: 'Trương Văn Sơn',
            title: 'Head of IT',
            phone: '0977 888 999',
            email: 'son.tv@vietnamairlines.com'
        },
        contacts: [
            { id: 6, name: 'Lý Văn Phúc', title: 'Infrastructure Lead', department: 'Data Center', phone: '0988 444 666', email: 'phuc.lv@vietnamairlines.com' },
            { id: 7, name: 'Đinh Thị Quỳnh', title: 'Application Manager', department: 'Applications', phone: '0999 555 777', email: 'quynh.dt@vietnamairlines.com' },
            { id: 8, name: 'Bùi Văn Minh', title: 'Network Specialist', department: 'Network', phone: '0966 333 555', email: 'minh.bv@vietnamairlines.com' },
            { id: 9, name: 'Hoàng Thị Mai', title: 'Help Desk Lead', department: 'Support', phone: '0955 666 888', email: 'mai.ht@vietnamairlines.com' },
        ]
    },
    {
        id: 4,
        name: 'Viettel Telecom',
        industry: 'Viễn thông',
        address: 'Số 1 Giang Văn Minh, Ba Đình, Hà Nội',
        website: 'www.viettel.com.vn',
        status: 'Active',
        itHead: {
            name: 'Nguyễn Đức Thắng',
            title: 'VP of Technology',
            phone: '0912 123 456',
            email: 'thang.nd@viettel.com.vn'
        },
        contacts: [
            { id: 10, name: 'Trần Thị Bích', title: 'Cloud Architect', department: 'Cloud', phone: '0923 234 567', email: 'bich.tt@viettel.com.vn' },
            { id: 11, name: 'Lê Hoàng Long', title: 'Database Admin', department: 'Data', phone: '0934 345 678', email: 'long.lh@viettel.com.vn' },
        ]
    }
];

const CustomerContacts = () => {
    const [activeCustomerId, setActiveCustomerId] = useState(CUSTOMERS_DATA[0].id);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const activeCustomer = CUSTOMERS_DATA.find(c => c.id === activeCustomerId);

    const getInitials = (name) => {
        const parts = name.split(' ');
        return parts.length > 1 ? parts[parts.length - 1].charAt(0) : name.charAt(0);
    };

    return (
        <div className="space-y-10">
            {/* Back Link */}
            <Link to="/customers" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-colors">
                <ArrowLeft size={18} />
                Quay lại danh sách Customers
            </Link>

            {/* Customer Selector Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between w-full md:w-auto min-w-[350px] px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-cyan-300 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-cyan-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</p>
                            <p className="font-bold text-slate-800">{activeCustomer?.name}</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full md:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden max-h-[400px] overflow-y-auto">
                        {CUSTOMERS_DATA.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => { setActiveCustomerId(customer.id); setDropdownOpen(false); }}
                                className={`w-full px-5 py-4 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between ${activeCustomerId === customer.id ? 'bg-cyan-50' : ''}`}
                            >
                                <div>
                                    <p className="font-bold text-slate-800">{customer.name}</p>
                                    <p className="text-xs text-slate-400">{customer.industry} • {customer.contacts.length + 1} contacts</p>
                                </div>
                                <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                                    {customer.status}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hero Section - Customer Info */}
            <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-cyan-500/20">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left - Company Visual */}
                    <div className="relative h-64 lg:h-auto min-h-[280px] bg-gradient-to-br from-cyan-500/30 to-transparent flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
                        <div className="relative text-center p-8">
                            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <Building2 size={64} className="text-white" />
                            </div>
                            <span className="text-xs font-black px-4 py-2 rounded-full bg-emerald-400 text-emerald-900">
                                {activeCustomer?.status}
                            </span>
                        </div>
                    </div>

                    {/* Right - Company Info */}
                    <div className="p-10 lg:p-12 text-white flex flex-col justify-center">
                        <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                            {activeCustomer?.name}
                        </h1>
                        <p className="text-lg text-cyan-200 leading-relaxed mb-6">
                            {activeCustomer?.industry}
                        </p>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-cyan-300" />
                                <span className="font-medium text-cyan-100">{activeCustomer?.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-cyan-300" />
                                <span className="font-medium text-cyan-100">{activeCustomer?.website}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-cyan-300" />
                                <span className="font-medium text-cyan-100">{(activeCustomer?.contacts.length || 0) + 1} liên hệ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* IT Head Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Crown size={24} className="text-amber-500" />
                    <h2 className="text-xl font-black text-slate-800">IT Head / Primary Contact</h2>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-cyan-500/30">
                        {getInitials(activeCustomer?.itHead.name || '')}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-800">{activeCustomer?.itHead.name}</h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-cyan-100 text-cyan-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                            {activeCustomer?.itHead.title}
                        </span>
                        <div className="flex flex-wrap gap-6 mt-4 text-sm">
                            <a href={`tel:${activeCustomer?.itHead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors">
                                <Phone size={16} className="text-cyan-400" />
                                <span className="font-mono font-medium">{activeCustomer?.itHead.phone}</span>
                            </a>
                            <a href={`mailto:${activeCustomer?.itHead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors">
                                <Mail size={16} className="text-cyan-400" />
                                <span className="font-medium">{activeCustomer?.itHead.email}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Contacts Grid */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-cyan-500" />
                        <h2 className="text-xl font-black text-slate-800">Danh bạ liên hệ</h2>
                    </div>
                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                        {activeCustomer?.contacts.length} người
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCustomer?.contacts.map((contact) => (
                        <div
                            key={contact.id}
                            className="group p-6 bg-slate-50 hover:bg-cyan-50 rounded-2xl border border-transparent hover:border-cyan-200 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                        >
                            {/* Avatar */}
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                                {getInitials(contact.name)}
                            </div>

                            {/* Name & Title */}
                            <h4 className="text-lg font-bold text-slate-800 text-center mb-1 group-hover:text-cyan-700 transition-colors">
                                {contact.name}
                            </h4>
                            <p className="text-xs font-bold text-cyan-600 text-center bg-cyan-100 rounded-lg py-1 px-3 mx-auto w-fit mb-2">
                                {contact.title}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
                                {contact.department}
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-slate-500 justify-center hover:text-cyan-600 transition-colors">
                                    <Phone size={14} className="text-cyan-400" />
                                    <span className="font-mono">{contact.phone}</span>
                                </a>
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-slate-500 justify-center hover:text-cyan-600 transition-colors">
                                    <Mail size={14} className="text-cyan-400" />
                                    <span className="text-xs truncate">{contact.email}</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerContacts;
