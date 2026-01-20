import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itsmService } from '../services/api';
import { ChevronRight, Award, Zap, Users } from 'lucide-react';

const Engineers = () => {
    const [engineers, setEngineers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [performanceData, setPerformanceData] = useState({});

    useEffect(() => {
        setLoading(true);
        itsmService.getEngineers().then(async (data) => {
            setEngineers(data);

            // Fetch performance for each engineer
            const perfPromises = data.map(eng =>
                itsmService.getEngineerPerformance(eng.engineer_id, period)
                    .then(perf => ({ id: eng.engineer_id, data: perf }))
                    .catch(() => ({ id: eng.engineer_id, data: null }))
            );

            const perfResults = await Promise.all(perfPromises);
            const perfMap = {};
            perfResults.forEach(({ id, data }) => {
                perfMap[id] = data;
            });

            setPerformanceData(perfMap);
            setLoading(false);
        });
    }, [period]);

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
                <div className="flex gap-3 items-center">
                    {/* Period Selector */}
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setPeriod('1d')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === '1d' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            24h
                        </button>
                        <button
                            onClick={() => setPeriod('7d')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === '7d' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            7d
                        </button>
                        <button
                            onClick={() => setPeriod('30d')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === '30d' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            30d
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search engineer..."
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

                        <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-6 mb-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tickets ({period})</p>
                                <p className="text-xl font-black text-slate-800">
                                    {performanceData[eng.engineer_id]?.metrics?.total_tickets ?? eng.total_tickets}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SLA</p>
                                <p className={`text-xl font-black ${(performanceData[eng.engineer_id]?.metrics?.sla_percent ?? eng.sla_percent) >= 94 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {performanceData[eng.engineer_id]?.metrics?.sla_percent ?? eng.sla_percent}%
                                </p>
                            </div>
                        </div>

                        {/* Performance Breakdown */}
                        {performanceData[eng.engineer_id] && (
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Met</p>
                                    <p className="text-lg font-black text-emerald-900">{performanceData[eng.engineer_id].metrics.sla_met}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Breached</p>
                                    <p className="text-lg font-black text-red-900">{performanceData[eng.engineer_id].metrics.sla_breached}</p>
                                </div>
                            </div>
                        )}

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
