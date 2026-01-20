import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itsmService } from '../services/api';
import { ChevronRight, ExternalLink } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        setLoading(true);
        itsmService.getCustomers(period).then(data => {
            setCustomers(data);
            setLoading(false);
        });
    }, [period]);

    const filteredCustomers = customers.filter(c =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_id.toString().includes(searchTerm)
    );

    if (loading) return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customer Portfolio</h1>
                    <p className="text-slate-500 mt-2">Manage service levels across your client base.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* Period Selector */}
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        {['1d', '7d', '30d'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${period === p
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {p === '1d' ? '1 Day' : p === '7d' ? '7 Days' : '30 Days'}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search customer..."
                            className="bg-white border border-slate-200 rounded-2xl px-5 py-3 pl-12 text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Name</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tickets</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">SLA Compliance</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Avg Resolve (h)</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                            <tr key={customer.customer_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-800 text-lg">{customer.customer_name}</div>
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-tighter">ID: {customer.customer_id}</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="font-bold text-slate-700">{customer.total_tickets}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className={`text-sm font-black ${customer.sla_percent >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {customer.sla_percent}%
                                        </span>
                                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${customer.sla_percent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${customer.sla_percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="font-bold text-slate-700">{customer.avg_resolve_hours}h</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <Link
                                        to={`/customers/${customer.customer_id}`}
                                        className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl hover:bg-primary-600 hover:text-white transition-all duration-300"
                                    >
                                        Details <ChevronRight size={14} />
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium">
                                    No customers found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customers;
