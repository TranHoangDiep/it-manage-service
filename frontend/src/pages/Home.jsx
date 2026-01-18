import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Globe, FolderKanban, Network, Server, UserCircle, Mail, X, Phone, AtSign } from 'lucide-react';

// Sample Member Data with Vietnamese phone format
const MEMBERS_DATA = [
    { id: 1, name: 'Nguyễn Văn An', phone: '0912 345 678', email: 'an.nguyen@cmcts.com.vn', role: 'Project Manager' },
    { id: 2, name: 'Trần Thị Bình', phone: '0987 654 321', email: 'binh.tran@cmcts.com.vn', role: 'Senior Developer' },
    { id: 3, name: 'Lê Hoàng Cường', phone: '0903 111 222', email: 'cuong.le@cmcts.com.vn', role: 'System Engineer' },
    { id: 4, name: 'Phạm Minh Dũng', phone: '0918 333 444', email: 'dung.pham@cmcts.com.vn', role: 'Network Admin' },
    { id: 5, name: 'Hoàng Thị Em', phone: '0909 555 666', email: 'em.hoang@cmcts.com.vn', role: 'Security Analyst' },
    { id: 6, name: 'Võ Thanh Hải', phone: '0935 777 888', email: 'hai.vo@cmcts.com.vn', role: 'DevOps Engineer' },
];

const Home = () => {
    const [showMemberModal, setShowMemberModal] = useState(false);

    const cards = [
        {
            title: 'Member',
            description: 'Quản lý thành viên và phân quyền hệ thống',
            icon: Users,
            borderColor: 'border-t-pink-500',
            bgColor: 'bg-pink-500',
            link: null,  // Special case - opens modal
            onClick: () => setShowMemberModal(true)
        },
        {
            title: 'Trang Website',
            description: 'Giám sát và quản lý các website của khách hàng',
            icon: Globe,
            borderColor: 'border-t-cyan-500',
            bgColor: 'bg-cyan-500',
            link: '/customers/contacts'
        },
        {
            title: 'Dự án',
            description: 'Theo dõi tiến độ các dự án đang triển khai',
            icon: FolderKanban,
            borderColor: 'border-t-emerald-500',
            bgColor: 'bg-emerald-500',
            link: '/projects'
        },
        {
            title: 'Network',
            description: 'Giám sát hạ tầng mạng và kết nối',
            icon: Network,
            borderColor: 'border-t-amber-500',
            bgColor: 'bg-amber-500',
            link: '/dashboard'
        },
        {
            title: 'System',
            description: 'Quản lý hệ thống máy chủ và dịch vụ',
            icon: Server,
            borderColor: 'border-t-violet-500',
            bgColor: 'bg-violet-500',
            link: '/cmdb'
        },
        {
            title: 'Account',
            description: 'Quản lý tài khoản và thông tin cá nhân',
            icon: UserCircle,
            borderColor: 'border-t-rose-400',
            bgColor: 'bg-rose-400',
            link: '/customers'
        },
    ];

    const CardWrapper = ({ card, children }) => {
        if (card.link) {
            return (
                <Link to={card.link} className={`
                    bg-white rounded-3xl p-8 border-t-4 ${card.borderColor}
                    shadow-lg hover:shadow-2xl
                    transform hover:-translate-y-2 transition-all duration-300
                    cursor-pointer group
                `}>
                    {children}
                </Link>
            );
        }
        return (
            <div onClick={card.onClick} className={`
                bg-white rounded-3xl p-8 border-t-4 ${card.borderColor}
                shadow-lg hover:shadow-2xl
                transform hover:-translate-y-2 transition-all duration-300
                cursor-pointer group
            `}>
                {children}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-12">
            {/* Header */}
            <header className="text-center mb-16">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                    IT Service Management
                </h1>
                <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                    Hệ thống quản lý và giám sát dịch vụ CNTT toàn diện cho doanh nghiệp
                </p>
            </header>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                {cards.map((card, index) => (
                    <CardWrapper key={index} card={card}>
                        {/* Icon */}
                        <div className={`
                            w-16 h-16 ${card.bgColor} rounded-full 
                            flex items-center justify-center mx-auto mb-6
                            shadow-lg group-hover:scale-110 transition-transform duration-300
                        `}>
                            <card.icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2 group-hover:text-slate-900">
                            {card.title}
                        </h3>
                        <p className="text-slate-500 text-center text-sm font-medium leading-relaxed">
                            {card.description}
                        </p>
                    </CardWrapper>
                ))}
            </div>

            {/* Contact Button */}
            <div className="text-center">
                <button className="
                    inline-flex items-center gap-3 
                    bg-pink-500 hover:bg-pink-600 
                    text-white font-bold text-lg
                    px-10 py-4 rounded-full
                    shadow-lg hover:shadow-xl shadow-pink-500/30
                    transform hover:-translate-y-1 transition-all duration-300
                ">
                    <Mail className="w-5 h-5" />
                    Contact Us
                </button>
            </div>

            {/* Footer */}
            <footer className="text-center mt-20 text-slate-400 text-sm font-medium">
                <p>© 2026 CMC Telecom Services. All rights reserved.</p>
            </footer>

            {/* Member Modal */}
            {showMemberModal && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowMemberModal(false)}
                >
                    <div
                        className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header - Pink themed */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-500 to-pink-600">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Team Members</h2>
                                    <p className="text-pink-100 text-sm font-medium">{MEMBERS_DATA.length} thành viên đang hoạt động</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="p-3 hover:bg-white/20 rounded-xl transition-colors text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Member List */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {MEMBERS_DATA.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-pink-50 hover:border-pink-200 border border-transparent transition-all group"
                                    >
                                        {/* Avatar & Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-pink-500/30">
                                                {member.name.split(' ').slice(-1)[0].charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                                                    {member.name}
                                                </h4>
                                                <span className="text-xs font-bold text-pink-500 bg-pink-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone size={16} className="text-pink-400" />
                                                <span className="font-medium font-mono">{member.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <AtSign size={16} className="text-pink-400" />
                                                <span className="font-medium">{member.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <Link
                                to="/members"
                                className="text-pink-600 font-bold hover:text-pink-700 transition-colors"
                                onClick={() => setShowMemberModal(false)}
                            >
                                Xem đầy đủ danh sách →
                            </Link>
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
