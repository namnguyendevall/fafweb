import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import managerApi from '../../api/manager.api';

const Finance = () => {
    const [financials, setFinancials] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const response = await managerApi.getFinancials();
                setFinancials(response.data);
            } catch (error) {
                console.error("Failed to fetch financials:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#02040a] flex items-center justify-center font-mono">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                <p className="text-emerald-400 font-bold tracking-widest animate-pulse">INIT_FINANCE_MODULE...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#02040a] flex font-mono text-slate-300 selection:bg-emerald-500/30">
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>

                {/* Header */}
                <header className="bg-[#090e17]/80 backdrop-blur-md border-b border-[#1e293b] px-6 py-4 sticky top-0 z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            SYS_FINANCE // ESCROW
                        </h1>
                        <p className="mt-1 text-sm text-slate-400 ml-5">
                            Track capital flow, token balances, and actively mediate transactional disputes.
                        </p>
                    </div>

                    <div className="inline-flex items-center rounded-lg bg-[#02040a] p-1 text-xs font-bold tracking-widest uppercase border border-[#1e293b] shadow-lg">
                        <button className="rounded bg-emerald-500/20 px-4 py-1.5 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            REAL_TIME
                        </button>
                        <button className="rounded px-4 py-1.5 text-slate-500 hover:text-cyan-400 transition-colors hover:bg-[#090e17]">
                            LAST_24H
                        </button>
                        <button className="rounded px-4 py-1.5 text-slate-500 hover:text-cyan-400 transition-colors hover:bg-[#090e17]">
                            7_DAYS
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto relative z-0">
                    {/* Top stats */}
                    <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Points in Circulation */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] group hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/70">
                                    TOKENS_CIRCULATING
                                </p>
                                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                    {Number(financials?.tokens_circulating || 0).toLocaleString()}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/30 font-bold">
                                        +5.2%
                                    </span>
                                    <span className="text-slate-500 tracking-widest uppercase">vs last cycle</span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/20 to-emerald-500"></div>
                        </div>

                        {/* Locked in Escrow */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] group hover:border-cyan-500/50 transition-colors relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/70">
                                    LOCKED_IN_ESCROW
                                </p>
                                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                    {Number(financials?.locked_in_escrow || 0).toLocaleString()}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-400 border border-cyan-500/30 font-bold">
                                        PTS
                                    </span>
                                    <span className="text-slate-500 tracking-widest uppercase">pending contracts</span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                <svg className="w-16 h-16 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400/20 to-cyan-500"></div>
                        </div>

                        {/* Active Disputes */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] group hover:border-amber-500/50 transition-colors relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-500/70">
                                    ACTIVE_DISPUTES
                                </p>
                                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                    {financials?.active_disputes || 0}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className={`inline-flex items-center rounded px-2 py-0.5 font-bold border ${financials?.active_disputes > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[#02040a] text-slate-500 border-[#1e293b]'}`}>
                                        {financials?.active_disputes > 0 ? 'ACTION_REQUIRED' : 'ALL_CLEAR'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/20 to-amber-500"></div>
                        </div>

                        {/* Avg Resolution Time */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] group hover:border-indigo-500/50 transition-colors relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/70">
                                    AVG_RESOLUTION_TIME
                                </p>
                                <p className="mt-1 text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">4.2h</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/30 font-bold">
                                        -15%
                                    </span>
                                    <span className="text-slate-500 tracking-widest uppercase">faster</span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                <svg className="w-16 h-16 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/20 to-indigo-500"></div>
                        </div>
                    </div>

                    {/* Middle section: Summary + Urgent attention */}
                    <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        {/* Points movement summary with chart */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                                        TOKEN_MOVEMENT
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500 tracking-widest font-mono uppercase">
                                        30-day aggregate inflow vs. outflow analysis
                                    </p>
                                </div>
                                <button className="text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-white transition-colors border border-transparent hover:border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-500/10">
                                    [FULL_REPORT]
                                </button>
                            </div>

                            {/* Line chart */}
                            <div className="mt-6 rounded-lg bg-[#02040a] px-4 pt-4 pb-3 border border-[#1e293b] shadow-inner">
                                <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>NET_FLOW</span>
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-1 w-5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                                            <span className="text-emerald-500/70">INFLOW</span>
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-1 w-5 rounded-full border border-rose-500 border-dashed" />
                                            <span className="text-rose-500/70">OUTFLOW</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="h-40">
                                    <svg viewBox="0 0 400 140" className="h-full w-full overflow-visible">
                                        {/* gradient fill */}
                                        <defs>
                                            <linearGradient id="pointsArea" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid lines */}
                                        {[20, 50, 80, 110].map((y, i) => (
                                            <line key={i} x1="0" y1={y} x2="400" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                                        ))}

                                        {/* area under main line */}
                                        <path
                                            d="M0 90 C 60 60, 110 70, 160 45 C 210 80, 260 70, 310 95 C 350 120, 380 70, 400 40 L 400 140 L 0 140 Z"
                                            fill="url(#pointsArea)"
                                        />

                                        {/* dashed comparison line */}
                                        <path
                                            d="M0 100 C 60 85, 110 88, 160 75 C 210 95, 260 90, 310 100 C 350 110, 380 95, 400 85"
                                            fill="none"
                                            stroke="#f43f5e"
                                            strokeWidth="2"
                                            strokeDasharray="6 6"
                                            strokeLinecap="round"
                                        />

                                        {/* main teal line */}
                                        <path
                                            d="M0 90 C 60 60, 110 70, 160 45 C 210 80, 260 70, 310 95 C 350 120, 380 70, 400 40"
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                                        />

                                        {/* vertical hover line + tooltip point (May 16) */}
                                        <g>
                                            {/* x ≈ 160 (giữa biểu đồ) */}
                                            <line
                                                x1="160"
                                                y1="20"
                                                x2="160"
                                                y2="130"
                                                stroke="#94a3b8"
                                                strokeWidth="1"
                                                strokeDasharray="2 2"
                                            />
                                            <circle cx="160" cy="45" r="5" fill="#10b981" stroke="#090e17" strokeWidth="2" />
                                            <circle cx="160" cy="45" r="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.5" className="animate-ping" style={{ transformOrigin: '160px 45px' }} />

                                            {/* tooltip box */}
                                            <g transform="translate(190,30)">
                                                <rect
                                                    x="-55"
                                                    y="-22"
                                                    width="110"
                                                    height="40"
                                                    rx="4"
                                                    fill="#090e17"
                                                    stroke="#1e293b"
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    x="0"
                                                    y="-8"
                                                    textAnchor="middle"
                                                    fontSize="9"
                                                    fontWeight="bold"
                                                    fill="#94a3b8"
                                                    className="uppercase tracking-widest font-mono"
                                                >
                                                    CYCLE: MAY_16
                                                </text>
                                                <text
                                                    x="0"
                                                    y="8"
                                                    textAnchor="middle"
                                                    fontSize="11"
                                                    fontWeight="bold"
                                                    fill="#10b981"
                                                    className="font-mono tracking-wider"
                                                >
                                                    +22,400 PTS
                                                </text>
                                            </g>
                                        </g>
                                    </svg>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div className="bg-[#02040a] p-3 rounded border border-[#1e293b]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">
                                        TOTAL_INFLOW
                                    </p>
                                    <p className="mt-1 text-lg font-black text-white">+320,500 <span className="text-[10px] text-slate-500">PTS</span></p>
                                    <p className="mt-1 text-[10px] font-bold text-emerald-400 tracking-widest uppercase">+18% vs LAST_30D</p>
                                </div>
                                <div className="bg-[#02040a] p-3 rounded border border-[#1e293b]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70">
                                        TOTAL_OUTFLOW
                                    </p>
                                    <p className="mt-1 text-lg font-black text-white">-298,400 <span className="text-[10px] text-slate-500">PTS</span></p>
                                    <p className="mt-1 text-[10px] font-bold text-amber-500 tracking-widest uppercase">+9% ALLOCATED</p>
                                </div>
                                <div className="bg-[#02040a] p-3 rounded border border-[#1e293b] border-l-2 border-l-cyan-500">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">
                                        NET_MOVEMENT
                                    </p>
                                    <p className="mt-1 text-lg font-black text-white">+22,100 <span className="text-[10px] text-slate-500">PTS</span></p>
                                    <p className="mt-1 text-[10px] font-bold text-slate-400 tracking-widest uppercase">STABLE // SAFE</p>
                                </div>
                            </div>
                        </div>

                        {/* Urgent attention */}
                        <div className="rounded-xl bg-[#090e17] p-6 shadow-lg border border-[#1e293b] flex flex-col">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                    SYS_ALERT
                                </h2>
                                <span className="inline-flex items-center rounded bg-red-500/10 border border-red-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                                    CRITICAL_PRIORITY
                                </span>
                            </div>

                            <div className="rounded border border-red-500/30 bg-[#02040a] p-5 relative overflow-hidden group hover:border-red-500/60 transition-colors">
                                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                                    <svg className="w-24 h-24 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                </div>
                                <div className="flex items-center justify-between relative z-10">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">#DTS-9921</p>
                                    <p className="text-[10px] tracking-widest uppercase text-slate-500 font-bold">2H_AGO</p>
                                </div>
                                <p className="mt-3 text-sm font-bold text-white relative z-10">
                                    Logo Design - Rebranding
                                </p>
                                <p className="mt-2 text-xs text-slate-400 font-mono leading-relaxed relative z-10 border-l-2 border-red-500/50 pl-3">
                                    Client IP dispute over AI generation usage. Artist denies claim. Contract #9921 funds frozen pending review.
                                </p>

                                <div className="mt-5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-emerald-400">
                                                C
                                            </div>
                                            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-cyan-400">
                                                A
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">TRUST_DEPT_ASSIGNED</p>
                                    </div>
                                </div>

                                <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/20 hover:text-white hover:border-red-500/50 transition-all relative z-10 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                    [REVIEW_EVIDENCE]
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dispute queue */}
                    <div className="rounded-xl bg-[#090e17] shadow-lg border border-[#1e293b] overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-[#1e293b] px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-[#02040a]/50">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
                                    DISPUTE_LOGS
                                </h2>
                                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-amber-500">
                                    12 ACTIVE
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest">
                                <button className="rounded border border-[#1e293b] bg-[#02040a] px-4 py-1.5 hover:border-amber-500/30 hover:text-amber-400 transition-colors">
                                    ALL_LOGS
                                </button>
                                <button className="rounded border border-[#1e293b] bg-[#02040a] px-4 py-1.5 hover:border-amber-500/30 hover:text-amber-400 transition-colors">
                                    ACTIVE_ONLY
                                </button>
                                <button className="rounded border border-[#1e293b] bg-[#02040a] px-4 py-1.5 hover:border-amber-500/30 hover:text-amber-400 transition-colors">
                                    AWAITING_ACTION
                                </button>
                            </div>
                        </div>

                        {/* Table header */}
                        <div className="hidden border-b border-[#1e293b] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-amber-500/70 md:grid md:grid-cols-[1.2fr_1.6fr_1fr_1.1fr_1fr] bg-[#02040a]">
                            <div>CONTRACT_ID</div>
                            <div>PARTICIPANTS</div>
                            <div>ESCROW_AMT</div>
                            <div>NODE_STATUS</div>
                            <div className="text-right">COMMAND_ACCESS</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-[#1e293b]">
                            {/* Row 1 */}
                            <div className="px-6 py-4 text-sm md:grid md:grid-cols-[1.2fr_1.6fr_1fr_1.1fr_1fr] md:items-center md:gap-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="mb-2 md:mb-0">
                                    <p className="font-bold text-white">#JOB-8842</p>
                                    <p className="text-[10px] text-slate-500 tracking-widest uppercase font-mono mt-1">Web Dev Sub-Routine</p>
                                </div>

                                <div className="mb-3 flex items-center gap-3 md:mb-0">
                                    <div className="flex -space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-emerald-400">
                                            C
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-cyan-400">
                                            A
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Client Node vs. Anna K.</p>
                                        <p className="text-[10px] text-slate-500 tracking-wider uppercase font-mono mt-1">Milestone 3 payload withheld</p>
                                    </div>
                                </div>

                                <div className="mb-3 md:mb-0">
                                    <p className="text-sm font-bold text-emerald-400">2,500 <span className="text-[10px] text-slate-500">PTS</span></p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">SECURE_ESCROW</p>
                                </div>

                                <div className="mb-3 flex items-center gap-3 md:mb-0">
                                    <span className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                                        DISPUTED
                                    </span>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors border-b border-dashed border-cyan-400/50 hover:border-white">
                                        VIEW_LOGS_4
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button className="rounded border border-[#1e293b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors">
                                        [REVOKE]
                                    </button>
                                    <button className="rounded border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/30 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        [UNLOCK]
                                    </button>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="px-6 py-4 text-sm md:grid md:grid-cols-[1.2fr_1.6fr_1fr_1.1fr_1fr] md:items-center md:gap-3 hover:bg-white/[0.02] transition-colors group">
                                <div className="mb-2 md:mb-0">
                                    <p className="font-bold text-white">#JOB-9921</p>
                                    <p className="text-[10px] text-slate-500 tracking-widest uppercase font-mono mt-1">Logo Design Protocol</p>
                                </div>

                                <div className="mb-3 flex items-center gap-3 md:mb-0">
                                    <div className="flex -space-x-2">
                                         <div className="flex h-8 w-8 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-emerald-400">
                                            C
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded border border-[#1e293b] bg-[#090e17] text-xs font-bold text-indigo-400">
                                            T
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">TechCorp_Host vs. Jay</p>
                                        <p className="text-[10px] text-slate-500 tracking-wider uppercase font-mono mt-1">IP scope violation logged</p>
                                    </div>
                                </div>

                                <div className="mb-3 md:mb-0">
                                    <p className="text-sm font-bold text-emerald-400">500 <span className="text-[10px] text-slate-500">PTS</span></p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">SECURE_ESCROW</p>
                                </div>

                                <div className="mb-3 flex items-center gap-3 md:mb-0">
                                    <span className="inline-flex items-center rounded bg-red-500/10 border border-red-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500 shadow-[0_0_5px_rgba(239,68,68,0.2)]">
                                        ESCALATED
                                    </span>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors border-b border-dashed border-cyan-400/50 hover:border-white">
                                        EVIDENCE_2
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button className="rounded border border-[#1e293b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors">
                                        [REVOKE]
                                    </button>
                                    <button className="rounded border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/30 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        [UNLOCK]
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Finance;
