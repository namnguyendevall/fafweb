import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { matchingApi } from '../../api/matching.api';
import { proposalsApi } from '../../api/proposals.api';
import { contractsApi } from '../../api/contracts.api';
import { reviewsApi } from '../../api/reviews.api';
import { useAuth } from '../../auth/AuthContext';
import warehouseImg from '../../assets/istockphoto-1947499362-612x612.jpg';
import StatCard from './components/StatCard';
import JobTable from './components/JobTable';
import ReviewsList from './components/ReviewsList';
import { useTranslation } from 'react-i18next';

const SectionLabel = ({ children }) => (
    <p className="text-[9px] font-black tracking-widest text-cyan-500 uppercase font-mono mb-3 flex items-center gap-1.5 border-b border-cyan-500/20 pb-2">
        <span className="text-cyan-400">//</span> {children}
    </p>
);

const AILaserRecommendJob = ({ job, navigate }) => {
    const [aiData, setAiData] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);

    const handleScan = async (e) => {
        e.stopPropagation();
        if (scanned || scanning) return;
        setScanning(true);
        try {
            const res = await matchingApi.getAIRecommendations(job.id);
            if (res.data) setAiData(res.data);
        } catch (err) {
            console.error("AI Scan failed", err);
        } finally {
            setScanning(false);
            setScanned(true);
        }
    };

    return (
        <div 
            className="p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 bg-slate-800/30 transition-all cursor-pointer relative overflow-hidden group/ai"
            onClick={() => navigate(`/work/${job.id}`)}
        >
            {/* Laser scanning animation */}
            {scanning && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-xl">
                    <div className="w-full h-full bg-cyan-500/10 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_1.5s_ease-in-out_infinite]" />
                </div>
            )}

            <div className="flex justify-between items-start mb-1 relative z-20">
                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider truncate pr-2">{job.title}</h4>
                <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono shrink-0">{job.badge}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-2 relative z-20">{job.company} · {job.price}</div>
            
            <div className="relative z-20 mt-2 border-t border-slate-700/50 pt-2">
                {!scanned && !scanning ? (
                    <button 
                        onClick={handleScan}
                        className="w-full flex items-center justify-center gap-2 py-1.5 text-[9px] font-black font-mono tracking-widest uppercase text-purple-400 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400 rounded transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)] group-hover/ai:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                        <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        SYS.AI_SCAN_MATCH
                    </button>
                ) : scanning ? (
                    <div className="w-full text-center py-1.5 text-[9px] font-black font-mono tracking-widest uppercase text-cyan-400 animate-pulse">
                        <span className="inline-block animate-[bounce_1s_infinite]">.</span>
                        <span className="inline-block animate-[bounce_1s_infinite_100ms]">.</span>
                        <span className="inline-block animate-[bounce_1s_infinite_200ms]">.</span> PROCESSING_NEURAL_NET ...
                    </div>
                ) : (
                    <div className="w-full bg-[#02040a]/50 border border-emerald-500/30 rounded p-2 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black font-mono tracking-widest text-emerald-500 uppercase flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                AI_TARGET_LOCK
                            </span>
                            <span className="text-[12px] font-black font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">{aiData?.match_score}%</span>
                        </div>
                        <p className="text-[10px] text-emerald-100/70 font-mono leading-tight border-l-2 border-emerald-500/50 pl-2">{aiData?.reason}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const WorkerDashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user: authUser } = useAuth();
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [myProposals, setMyProposals] = useState([]);
    const [allContracts, setAllContracts] = useState([]);
    const [activeContract, setActiveContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [proposalsLoading, setProposalsLoading] = useState(true);
    const [contractLoading, setContractLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [reviewsData, setReviewsData] = useState({ reviews: [], summary: null });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const { t } = useTranslation();

    const todayGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.status_bar.morning');
        if (hour < 18) return t('home.status_bar.afternoon');
        return t('home.status_bar.evening');
    }, [t]);

    const calculateProgress = (checkpoints = []) => {
        if (!checkpoints || checkpoints.length === 0) return 0;
        const approved = checkpoints.filter(cp => cp.status === 'APPROVED').length;
        return Math.round((approved / checkpoints.length) * 100);
    };

    const progressPercent = useMemo(() => calculateProgress(activeContract?.checkpoints), [activeContract]);

    // Get user name from AuthContext (full_name is the field from backend)
    const userName = authUser?.full_name || authUser?.email || t('dashboard.you');
    const userObj = authUser || {};

    // Dynamic Activity Log Events
    const logEvents = useMemo(() => {
        const now = new Date();
        const formatTime = (minusMinutes) => {
            const time = new Date(now.getTime() - minusMinutes * 60000);
            return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        };
        return [
            { time: formatTime(2), text: 'ENCRYPTED_CHANNEL_ESTABLISHED', color: 'text-cyan-500/70' },
            { time: formatTime(8), text: 'AUTH_VERIFIED::TOKEN_G2X_39', color: 'text-slate-500' },
            { time: formatTime(15), text: 'GRID_SCAN_COMPLETE::0_MIS_FOUND', color: 'text-slate-500' },
            { time: formatTime(32), text: 'DATALINK_STABLE::UP_99.9%', color: 'text-emerald-500/70' }
        ];
    }, []);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const res = await matchingApi.getRecommendedJobs({ limit: 15 }); // Fetch more to allow for filtering
                const seenTitles = new Set();
                const mappedJobs = [];
                
                (res?.data ?? []).forEach(job => {
                    const title = job.title || '';
                    // Simple deduplication logic
                    if (seenTitles.has(title)) return;
                    seenTitles.add(title);
                    
                    if (mappedJobs.length >= 5) return; // Keep only top 5 unique

                    mappedJobs.push({
                        id: job.id,
                        title: title,
                        company: job.category_name || t('dashboard.other'),
                        price: `$${Number(job.budget).toLocaleString()}`,
                        meta: [
                            { icon: 'calendar', text: new Date(job.created_at).toLocaleDateString() },
                            { icon: 'spark', text: `${job.job_type === 'SHORT_TERM' ? t('dashboard.short_term') : t('dashboard.long_term')}` }
                        ],
                        badge: `${job.match_score}${t('dashboard.match_percent')}`,
                        extra: `${job.matching_skills_count} ${t('dashboard.matching_skills')}`,
                        img: warehouseImg
                    });
                });
                setRecommendedJobs(mappedJobs);
            } catch (error) {
                console.error("Error fetching recommendations:", error);
            } finally { setLoading(false); }
        };

        const fetchMyProposals = async () => {
            try {
                setProposalsLoading(true);
                const res = await proposalsApi.getMyProposals();
                // Filter out ACCEPTED proposals from "Pending" and deduplicate titles
                const seenProposalTitles = new Set();
                const filtered = (res.data || []).filter(p => {
                    if (p.status !== 'PENDING') return false;
                    if (seenProposalTitles.has(p.job_title)) return false;
                    seenProposalTitles.add(p.job_title);
                    return true;
                });
                setMyProposals(filtered);
            } catch (error) { console.error("Error fetching proposals:", error); } 
            finally { setProposalsLoading(false); }
        };

        const fetchContracts = async () => {
            try {
                setContractLoading(true);
                const [activeRes, allRes] = await Promise.all([
                    contractsApi.getMyActiveContract(),
                    contractsApi.getMyContracts()
                ]);
                setActiveContract(activeRes.data ?? null);
                setAllContracts(allRes.data || []);
            } catch (error) { console.error("Error fetching contracts:", error); } 
            finally { setContractLoading(false); }
        };
        
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                if (userObj.id) {
                    const res = await reviewsApi.getUserReviews(userObj.id);
                    setReviewsData({ reviews: res.data || [], summary: res.summary || null });
                }
            } catch (error) { console.error("Error fetching reviews:", error); } 
            finally { setReviewsLoading(false); }
        };

        fetchRecommendations();
        fetchMyProposals();
        fetchContracts();
        fetchReviews();
    }, [userObj.id]);

    return (
        <div className="w-full min-h-screen bg-transparent text-slate-300 relative">

            <div className="mx-auto max-w-7xl px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* ── LEFT SIDEBAR ── */}
                    <aside className="lg:col-span-3">
                        <div className="rounded-2xl border p-5 relative overflow-hidden group/sidebar" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none" />
                            
                            <div className="mb-6 min-w-0 relative z-10">
                                <div className="flex flex-col gap-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        <p className="truncate text-[9px] font-mono tracking-widest text-emerald-400 uppercase">SYS_LOGGED_IN</p>
                                    </div>
                                    <h2 className="truncate text-xl font-black text-white uppercase tracking-wider group-hover/sidebar:text-cyan-400 transition-colors">{userName}</h2>
                                </div>
                                {userObj.tier && (
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-widest transition-all ${
                                            userObj.tier === 'EXPERT' ? 'bg-purple-900/40 text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 
                                            userObj.tier === 'PRO' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {t('dashboard.tier')} {userObj.tier}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">LVL_42</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="rounded-xl border p-4 group/card transition-all hover:bg-slate-800/40" style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-[10px] font-black text-slate-300 font-mono tracking-widest uppercase">{t('dashboard.active_contracts')}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1 h-1 rounded-full ${activeContract && activeContract.id ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                                                    {activeContract && activeContract.id ? 'LIVE_DATALINK' : 'NODE_STANDBY'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className={`absolute inset-0 blur-[8px] rounded-full ${activeContract && activeContract.id ? 'bg-cyan-500/40' : 'bg-slate-500/10'}`} />
                                            <span className={`relative rounded px-2 py-1 text-[10px] font-black font-mono border transition-all ${
                                                activeContract && activeContract.id 
                                                    ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/40' 
                                                    : 'bg-slate-900/30 text-slate-500 border-slate-700/50'
                                            }`}>
                                                {activeContract && activeContract.id ? '01' : '00'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-700/50">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">GRID_STATUS</p>
                                            <p className={`text-[8px] font-mono font-black uppercase ${activeContract && activeContract.id ? 'text-emerald-500' : 'text-slate-600'}`}>
                                                {activeContract && activeContract.id ? '[ ONLINE ]' : '[ OFFLINE ]'}
                                            </p>
                                        </div>
                                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${activeContract && activeContract.id ? 'w-full bg-emerald-500/50' : 'w-0'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Status Card */}
                                <div className="rounded-xl border p-4 transition-all hover:bg-slate-800/40 relative overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                    <div className="absolute top-0 right-0 p-1 opacity-10 pointer-events-none">
                                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 font-mono tracking-widest uppercase mb-3 flex items-center justify-between">
                                        <span>WALLET_STATUS</span>
                                        <span className="text-[8px] text-emerald-500">ENCRYPTED</span>
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase mb-0.5">
                                                <span>AVAILABLE_BALANCE</span>
                                                <span className="text-emerald-400">READY</span>
                                            </div>
                                            <p className="text-lg font-black text-white font-mono leading-none">
                                                ${Number(userObj.balance_points || 0).toLocaleString()} <span className="text-[9px] text-slate-500">PTS</span>
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase mb-0.5">
                                                <span>ESCROW_LOCKED</span>
                                                <span className="text-amber-400">SECURE</span>
                                            </div>
                                            <p className="text-md font-black text-slate-300 font-mono leading-none">
                                                ${Number(userObj.locked_points || 0).toLocaleString()} <span className="text-[9px] text-slate-500">PTS</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* System Activity Log */}
                                <div className="rounded-xl border p-4 transition-all hover:bg-slate-800/40 relative overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(34,211,238,0.2)' }}>
                                    <p className="text-[10px] font-black text-slate-300 font-mono tracking-widest uppercase mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        SYS_ACTIVITY_LOG
                                    </p>
                                    <div className="space-y-2 font-mono text-[8px] uppercase tracking-tighter">
                                        {logEvents.map((evt, idx) => (
                                            <div key={idx} className={`flex gap-2 ${evt.color} border-l border-cyan-500/30 pl-2`}>
                                                <span className="shrink-0 opacity-50">[{evt.time}]</span>
                                                <span className="truncate">{evt.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[7px] font-mono text-slate-600 uppercase tracking-widest">
                                        <span>NETWORK: GLOBAL_HUB_01</span>
                                        <span>LATENCY: 14MS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <section className="lg:col-span-9 space-y-6">
                        {/* Header Panel */}
                        <div className="rounded-2xl border p-6 lg:p-8 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at bottom right, rgba(6,182,212,0.1) 0%, transparent 60%), linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
                            <div className="flex flex-col gap-2">
                                <p className="text-cyan-500 font-mono text-[10px] tracking-widest uppercase">{t('dashboard.status_online')}</p>
                                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                                    {todayGreeting}, <span className="text-cyan-400">{userName}</span>
                                </h1>
                                <p className="text-xs text-slate-400 font-mono">{t('dashboard.ready_to_work')}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-slate-700/50">
                            <nav className="-mb-px flex space-x-1 overflow-x-auto no-scrollbar scroll-smooth">
                                {[
                                    { id: 'overview', label: t('dashboard.overview') },
                                    { id: 'jobs', label: t('dashboard.active_jobs') },
                                    { id: 'reviews', label: t('dashboard.performance_reviews') }
                                ].map((tabDef) => (
                                    <button key={tabDef.id} onClick={() => setActiveTab(tabDef.id)}
                                        className={`whitespace-nowrap px-6 py-3 border-b-2 font-black text-[11px] tracking-widest uppercase font-mono transition-all ${
                                            activeTab === tabDef.id
                                            ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                        }`}>
                                        {tabDef.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="pt-2">
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-[fadeIn_.3s_ease-out]">
                                    {/* Active Mission */}
                                    {activeContract && activeContract.id && activeContract.job_title ? (
                                        <div className="rounded-2xl border p-6 mb-8 relative overflow-hidden group/mission" style={{ background: 'linear-gradient(165deg,#061226 0%,#020617 100%)', borderColor: 'rgba(34,211,238,0.3)' }}>
                                            {/* Technical background elements */}
                                            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                                <svg className="w-64 h-64 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                            </div>
                                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <SectionLabel>{t('dashboard.current_job')}</SectionLabel>
                                                    <div className="flex gap-2">
                                                        <span className="hidden sm:inline-block px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5 text-[8px] font-mono text-cyan-400 uppercase tracking-widest">
                                                            {`ID: #${String(activeContract.id).padStart(6, '0')}`}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-[8px] font-mono text-emerald-400 uppercase tracking-widest">
                                                            SECURE_ESCROW_ENCRYPTED
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all group-hover/mission:translate-x-1">
                                                    <div className="flex-1">
                                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                                            {activeContract.job_title || 'UNTITLED_MISSION'}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[11px] font-mono text-cyan-400 uppercase tracking-[0.2em]">{activeContract.client_name || t('dashboard.anonymous_client')}</p>
                                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">v0.8.2_SYNCED</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                                                        <div className="flex flex-col items-start md:items-end">
                                                            <span className={`px-3 py-1 rounded text-[10px] font-black font-mono tracking-[0.15em] uppercase border ring-1 blur-[0.2px] transition-all ${
                                                                (activeContract.status === 'PENDING' || !activeContract.signature_worker)
                                                                    ? 'bg-amber-900/30 text-amber-400 border-amber-500/40 ring-amber-400/10' 
                                                                    : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/40 ring-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                                            }`}>
                                                                {(activeContract.status === 'PENDING' || !activeContract.signature_worker) ? 'AWAITING_INITIALIZATION' : t('dashboard.in_progress')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">VAL:</span>
                                                            <p className="text-2xl font-black text-white font-mono leading-none">
                                                                ${Number(activeContract.total_amount || 0).toLocaleString()}
                                                                <span className="text-[10px] ml-1 text-emerald-500">PTS</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Section */}
                                                <div className="mt-8 mb-6">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="animate-pulse">●</span> COMPLETION_STATUS
                                                        </p>
                                                        <p className="text-[11px] font-black font-mono text-cyan-400">{progressPercent}%</p>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 relative">
                                                        <div 
                                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                        {/* Scanning glare over progress */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-32 -skew-x-12 animate-[shimmer_2s_infinite]" />
                                                    </div>
                                                    <div className="mt-2 flex justify-between">
                                                        <div className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
                                                            {activeContract.checkpoints?.filter(cp => cp.status === 'APPROVED').length || 0} / {activeContract.checkpoints?.length || 0} NODES_VERIFIED
                                                        </div>
                                                        <div className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
                                                            INTEGRITY_CHECK_PASS
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-700/30">
                                                    {!activeContract.signature_worker ? (
                                                        <button 
                                                            onClick={() => navigate(`/contract/${activeContract.id}/sign`)} 
                                                            className="flex items-center justify-center gap-3 px-8 py-3 text-[11px] font-black font-mono tracking-[0.2em] uppercase bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all rounded shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-95"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            INITIALIZE_SIGNATURE
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-3 w-full">
                                                            <button 
                                                                onClick={() => navigate(`/contract/${activeContract.id}/view`)} 
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3 text-[11px] font-black font-mono tracking-[0.2em] uppercase bg-cyan-500 hover:bg-cyan-400 text-[#020617] transition-all rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                {t('dashboard.view_details')}
                                                            </button>
                                                            <div className="flex-1 sm:flex-none flex items-center px-4 py-2 border border-slate-700/50 bg-slate-900/50 rounded pointer-events-none">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex gap-1">
                                                                        {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-cyan-500/20" />)}
                                                                        <div className="w-1 h-3 bg-cyan-400 animate-pulse" />
                                                                    </div>
                                                                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">DATA_STREAM_ACTIVE</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Enhanced Empty State */
                                        <div className="rounded-2xl border border-dashed p-12 text-center relative overflow-hidden group" style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                            {/* Laser scanning effect */}
                                            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-20">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_4s_ease-in-out_infinite]" />
                                            </div>
                                            
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mb-6 bg-slate-800/50 group-hover:border-cyan-500/50 transition-colors">
                                                    <svg className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 group-hover:animate-pulse transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{t('dashboard.no_active_contract')}</h3>
                                                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest max-w-[280px]">
                                                    {t('dashboard.ready_to_work')} · GRID_SCAN_FOR_MISSIONS_INITIALIZED...
                                                </p>
                                                <button 
                                                    onClick={() => navigate('/find-work')}
                                                    className="mt-8 px-6 py-2 text-[9px] font-black font-mono tracking-widest uppercase border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10 transition-all rounded"
                                                >
                                                    INITIALIZE_GRID_SCAN
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    {!contractLoading && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(145deg,#082f49,#0f172a)', borderColor: 'rgba(56,189,248,0.2)' }}>
                                                <div className="text-[10px] font-mono tracking-widest text-sky-400 uppercase mb-2">{t('dashboard.total_earnings')}</div>
                                                <div className="text-3xl font-black text-white mb-1 font-mono">${allContracts.filter(c => c.status === 'COMPLETED').reduce((s, c) => s + Number(c.total_amount || 0), 0).toLocaleString()}</div>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t('dashboard.accumulated_earnings')}</div>
                                            </div>
                                            <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(145deg,#4c1d95,#0f172a)', borderColor: 'rgba(167,139,250,0.2)' }}>
                                                <div className="text-[10px] font-mono tracking-widest text-purple-400 uppercase mb-2">{t('dashboard.completed_jobs')}</div>
                                                <div className="text-3xl font-black text-white mb-1 font-mono">{allContracts.filter(c => c.status === 'COMPLETED').length}</div>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t('dashboard.approved_jobs')}</div>
                                            </div>
                                            <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(145deg,#047857,#0f172a)', borderColor: 'rgba(52,211,153,0.2)' }}>
                                                <div className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase mb-2">{t('dashboard.success_rate')}</div>
                                                <div className="text-3xl font-black text-white mb-1 font-mono">
                                                    {(allContracts.length > 0 
                                                        ? ((allContracts.filter(c => c.status === 'COMPLETED').length / allContracts.length) * 100).toFixed(0) 
                                                        : 100)}%
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t('dashboard.work_efficiency')}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sub-Grids */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <SectionLabel>{t('dashboard.pending_applications')}</SectionLabel>
                                                <button onClick={() => setActiveTab('jobs')} className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono hover:text-cyan-300">{t('dashboard.view_all')}</button>
                                            </div>
                                            {proposalsLoading ? (
                                                <div className="text-center py-6 text-[10px] font-mono tracking-widest text-cyan-500 uppercase animate-pulse">{t('dashboard.fetching_data')}</div>
                                            ) : myProposals.length > 0 ? (
                                                <div className="space-y-3">
                                                    {myProposals.slice(0,3).map(p => (
                                                        <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 bg-slate-800/30 transition-all cursor-pointer" onClick={() => navigate(`/work/${p.job_id}`)}>
                                                            <div className="min-w-0 flex-1 pr-4">
                                                                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider truncate mb-1">{p.job_title}</h4>
                                                                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{t('dashboard.proposed_price')}{p.proposed_price?.toLocaleString()}</div>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black font-mono tracking-widest uppercase ${
                                                                    p.status === 'PENDING' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' : 
                                                                    p.status === 'ACCEPTED' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 
                                                                    'bg-red-900/30 text-red-400 border border-red-500/30'
                                                                }`}>{p.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 italic font-mono uppercase tracking-widest">{t('dashboard.no_pending_applications')}</p>
                                            )}
                                        </div>

                                        <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <SectionLabel>{t('dashboard.recommended_jobs')}</SectionLabel>
                                                <button onClick={() => navigate('/find-work')} className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono hover:text-cyan-300">{t('dashboard.view_all')}</button>
                                            </div>
                                            {loading ? (
                                                <div className="text-center py-6 text-[10px] font-mono tracking-widest text-cyan-500 uppercase animate-pulse">{t('dashboard.loading_recommendations')}</div>
                                            ) : recommendedJobs.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recommendedJobs.slice(0,3).map(j => (
                                                        <AILaserRecommendJob key={j.id} job={j} navigate={navigate} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 italic font-mono uppercase tracking-widest">{t('dashboard.no_recommendations')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'jobs' && (
                                <div className="space-y-6 animate-[fadeIn_.3s_ease-out]">
                                    <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                        <SectionLabel>LỊCH SỬ {'&'} HỢP ĐỒNG</SectionLabel>
                                        
                                        {/* Pass them to JobTable component */}
                                        <div className="mt-4 cyberpunk-datatable-wrapper">
                                            {contractLoading ? (
                                                <div className="py-10 text-center text-cyan-500 font-mono text-[10px] tracking-widest uppercase animate-pulse">Đang tải hợp đồng...</div>
                                            ) : (
                                                <JobTable contracts={allContracts} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6 animate-[fadeIn_.3s_ease-out]">
                                    <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                                        <SectionLabel>{t('dashboard.your_reviews')}</SectionLabel>
                                        {reviewsLoading ? (
                                            <div className="py-10 text-center text-cyan-500 font-mono text-[10px] tracking-widest uppercase animate-pulse">{t('dashboard.loading_reviews')}</div>
                                        ) : (
                                            <ReviewsList data={reviewsData} type="worker" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;