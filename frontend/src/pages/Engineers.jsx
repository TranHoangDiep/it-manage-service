import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itsmService } from '../services/api';
import { ChevronRight, Award, Zap, Users } from 'lucide-react';

const Engineers = () => {
    const [engineers, setEngineers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        itsmService.getEngineers().then(data => {
            setEngineers(data);
            setLoading(false);
        });
    }, []);

    const filteredEngineers = engineers.filter(eng =>
        eng.engineer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Engineering Performance</h1>
                    <p className="text-slate-500 mt-2">Track team efficiency and workload balance.</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search engineer or team..."
                        className="bg-white border border-slate-200 rounded-2xl px-5 py-3 pl-12 text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEngineers.length > 0 ? filteredEngineers.map((eng) => (
                    <div key={eng.engineer_id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-2xl">
                                {eng.engineer_name.charAt(0)}
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${eng.level === 'L3' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                eng.level === 'L2' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                {eng.level} Specialist
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 mb-1">{eng.engineer_name}</h3>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-8">
                            <Zap size={14} className="text-amber-500" /> {eng.group} Team
                        </p>

                        <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-6 mb-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tickets</p>
                                <p className="text-xl font-black text-slate-800">{eng.total_tickets}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SLA</p>
                                <p className={`text-xl font-black ${eng.sla_percent >= 94 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {eng.sla_percent}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Users size={16} />
                                <span className="text-sm font-bold">{eng.customers_supported} Clients</span>
                            </div>
                            <Link
                                to={`/engineers/${eng.engineer_id}`}
                                className="bg-primary-600 text-white p-3 rounded-2xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
                            >
                                <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                        <p className="text-slate-400 font-medium">No engineers found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Engineers;
