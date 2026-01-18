import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itsmService } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Ticket, AlertCircle, CheckCircle2, Target } from 'lucide-react';

const TicketModal = ({ ticket, onClose }) => {
    const [detail, setDetail] = useState(ticket);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ticket && (!ticket.description || ticket.description === "No description provided.")) {
            setLoading(true);
            itsmService.getTicketDetail(ticket.ticket_id).then(data => {
                setDetail(data);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setDetail(ticket);
        }
    }, [ticket]);

    if (!ticket) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border mb-3 inline-block ${ticket.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                            ticket.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {ticket.priority} Priority
                        </span>
                        <h2 className="text-2xl font-black text-slate-800 leading-tight">#{ticket.ticket_id}: {ticket.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                        <AlertCircle size={24} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Ticket Content</h4>
                        <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed font-medium min-h-[100px] flex items-center justify-center">
                            {loading ? (
                                <div className="animate-pulse flex items-center gap-2 text-primary-600">
                                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    <span className="text-sm font-bold">Fetching from SDP...</span>
                                </div>
                            ) : (
                                <div
                                    className="prose prose-slate max-w-none w-full break-words"
                                    dangerouslySetInnerHTML={{ __html: detail?.description || "No content provided for this ticket." }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Technician</p>
                            <p className="font-bold text-slate-800">{ticket.engineer_name}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Status</p>
                            <span className={`font-black uppercase text-xs ${ticket.sla_status === 'Breached' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {ticket.sla_status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
                        Close Detail
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomerDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        Promise.all([
            itsmService.getCustomerDetail(id),
            itsmService.getCustomerTickets(id)
        ]).then(([detail, ticketList]) => {
            setData(detail);
            setTickets(ticketList);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;

    const COLORS = ['#10b981', '#ef4444'];
    const pieData = [
        { name: 'Met', value: data.sla_breakdown.met },
        { name: 'Breached', value: data.sla_breakdown.breached },
    ];

    return (
        <div className="space-y-10">
            <header>
                <Link to="/customers" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-sm transition-colors mb-4 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Portfolio
                </Link>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer Detail Report</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                    <div className="w-24 h-24 bg-primary-100 rounded-[2rem] flex items-center justify-center text-primary-600 mb-6 shadow-inner">
                        <span className="text-4xl font-black">{data.summary.name?.charAt(0) || 'C'}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 text-center leading-tight px-4">{data.summary.name}</h2>
                    <p className="text-slate-400 font-bold text-xs mt-2 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-2">
                        <Target size={12} className="text-primary-500" /> ID: {id}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                            <p className="text-2xl font-black text-slate-800">{data.summary.total}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Impact</p>
                            <p className="text-2xl font-black text-slate-800">High</p>
                        </div>
                    </div>
                </div>

                {/* SLA Donut */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-xl text-slate-800 mb-6">SLA Performance</h3>
                    <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} cornerRadius={5} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                            <span className="text-2xl font-black text-slate-800">{data.summary.sla_percent}%</span>
                        </div>
                    </div>
                    <div className="flex justify-around mt-6">
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">Met</p>
                            <p className="text-lg font-bold text-emerald-600">{data.sla_breakdown.met}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">Breached</p>
                            <p className="text-lg font-bold text-red-600">{data.sla_breakdown.breached}</p>
                        </div>
                    </div>
                </div>

                {/* Tech Table Summary */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="font-bold text-xl text-slate-800 mb-6">Support Team</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {data.technicians.map((tech, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <div>
                                    <p className="font-bold text-slate-800">{tech.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{tech.handled} Tickets</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${tech.sla_breached > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {tech.sla_breached} Breaches
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ticket List Table */}
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Ticket className="text-primary-600" /> Recent Tickets
                </h3>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Title</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Priority</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">SLA Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Technician</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tickets.slice(0, 50).map((ticket) => (
                                <tr
                                    key={ticket.ticket_id}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{ticket.ticket_id}</div>
                                        <div className="text-slate-500 truncate max-w-xs">{ticket.title}</div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ticket.priority === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                                            ticket.priority === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex justify-center">
                                            {ticket.sla_status === 'Breached' ?
                                                <AlertCircle className="text-red-500" size={20} /> :
                                                <CheckCircle2 className="text-emerald-500" size={20} />
                                            }
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-slate-700 font-bold">
                                        {ticket.engineer_name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        </div>
    );
};

export default CustomerDetail;
