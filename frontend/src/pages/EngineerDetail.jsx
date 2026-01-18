import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itsmService } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ArrowLeft, Brain, Target, AlertTriangle, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

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
                        <AlertTriangle size={24} />
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                            <p className="font-bold text-slate-800">{ticket.customer_name}</p>
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

const EngineerDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        Promise.all([
            itsmService.getEngineerDetail(id),
            itsmService.getEngineerTickets(id)
        ]).then(([detail, ticketList]) => {
            setData(detail);
            setTickets(ticketList);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;

    const PRIORITY_COLORS = {
        'Critical': '#ef4444',
        'High': '#f59e0b',
        'Medium': '#0ea5e9',
        'Low': '#64748b'
    };

    return (
        <div className="space-y-10">
            <header>
                <Link to="/engineers" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-sm transition-colors mb-4 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Team
                </Link>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance Analytics: {data.summary.name}</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* KPI Cards */}
                {[
                    { label: 'SLA Rating', value: `${data.summary.sla_percent}%`, icon: <Target className="text-emerald-600" />, color: 'bg-emerald-50' },
                    { label: 'Daily Tickets', value: data.workload.tickets_per_day, icon: <TrendingUp className="text-blue-600" />, color: 'bg-blue-50' },
                    { label: 'Status', value: data.workload.overload ? 'Overloaded' : 'Healthy', icon: <Brain className={data.workload.overload ? 'text-red-600' : 'text-primary-600'} />, color: data.workload.overload ? 'bg-red-50' : 'bg-primary-50' },
                    { label: 'Client Base', value: data.customers.length, icon: <Users className="text-purple-600" />, color: 'bg-purple-50' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className={`w-12 h-12 rounded-2xl ${kpi.color} flex items-center justify-center mb-4`}>
                            {kpi.icon}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Priority Distro */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-xl text-slate-800 mb-8 tracking-tight">Workload Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.priority_distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {data.priority_distribution.map((entry, index) => (
                                        <Cell key={index} fill={PRIORITY_COLORS[entry.priority] || '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Customer Breakdown */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-xl text-slate-800 mb-8 tracking-tight">Client Portfolio Support</h3>
                    <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                        {data.customers.map((cust, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <div>
                                    <p className="font-bold text-slate-800">{cust.customer_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{cust.handled} Tickets Handled</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-xs font-black ${cust.sla_breached > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {cust.sla_breached} Breaches
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Personal Ticket Ledger */}
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Personal Ticket Ledger</h3>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer / ID</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Priority</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">SLA Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tickets.slice(0, 50).map((ticket) => (
                                <tr key={ticket.ticket_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td
                                        className="px-8 py-5 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{ticket.customer_name}</div>
                                        <div className="text-sm text-slate-400 font-medium">#{ticket.ticket_id}</div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ticket.priority === 'Critical' ? 'bg-red-50 text-red-600' :
                                            ticket.priority === 'High' ? 'bg-orange-50 text-orange-600' :
                                                'bg-blue-50 text-blue-600'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {ticket.sla_status === 'Breached' ?
                                            <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-xs uppercase">
                                                <AlertTriangle size={16} /> Breach
                                            </div> :
                                            <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-xs uppercase">
                                                <CheckCircle2 size={16} /> Met
                                            </div>
                                        }
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

export default EngineerDetail;
