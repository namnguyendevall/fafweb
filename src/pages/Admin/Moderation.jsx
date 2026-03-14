import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { useToast } from '../../contexts/ToastContext';
import managerApi from '../../api/manager.api';

const Moderation = () => {
    const toast = useToast();
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterReason, setFilterReason] = useState('All Reasons');
    const [sortBy, setSortBy] = useState('Newest First');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const [disputesRes, pendingJobsRes] = await Promise.all([
                    managerApi.listDisputes(),
                    managerApi.getPendingJobs()
                ]);
                
                const disputes = (disputesRes.data || []).filter(d => d.status === 'OPEN').map(d => ({
                    id: `dispute-${d.id}`,
                    realId: d.id,
                    type: 'DISPUTE',
                    status: 'FLAGGED',
                    time: new Date(d.created_at).toLocaleString(),
                    timestamp: new Date(d.created_at).getTime(),
                    jobTitle: d.job_title || 'Unknown Contract',
                    company: d.client_email ? `Client: ${d.client_email.split('@')[0]}` : 'Unknown Client',
                    location: d.worker_email ? `Worker: ${d.worker_email.split('@')[0]}` : 'No Worker',
                    reasonType: 'CONTRACT DISPUTE',
                    reasonText: d.reason || 'No description provided.',
                    reasonIcon: '⚖️'
                }));

                const pendingJobs = (pendingJobsRes.data || []).map(j => ({
                    id: `job-${j.id}`,
                    realId: j.id,
                    type: 'JOB',
                    status: 'PENDING',
                    time: new Date(j.created_at).toLocaleString(),
                    timestamp: new Date(j.created_at).getTime(),
                    jobTitle: j.title || 'Untitled Job',
                    company: j.client_email ? `Client: ${j.client_email.split('@')[0]}` : 'Unknown Client',
                    location: j.location || 'Remote',
                    reasonType: 'NEW PENDING JOB',
                    reasonText: j.description ? (j.description.substring(0, 100) + '...') : 'Needs review.',
                    reasonIcon: '📝'
                }));

                const allTasks = [...disputes, ...pendingJobs].sort((a, b) => b.timestamp - a.timestamp);
                setTasks(allTasks);
                setFilteredTasks(allTasks);
            } catch (error) {
                console.error("Failed to fetch moderation tasks", error);
                toast.error("Failed to load queues");
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    useEffect(() => {
        filterAndSortTasks();
    }, [activeTab, searchTerm, filterReason, sortBy, tasks]);

    const filterAndSortTasks = () => {
        let filtered = [...tasks];

        // Tab filter
        if (activeTab === 'Flagged Only') {
            filtered = filtered.filter(task => task.status === 'FLAGGED');
        } else if (activeTab === 'Pending Review') {
            filtered = filtered.filter(task => task.status === 'PENDING');
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.reasonText.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Reason filter
        if (filterReason !== 'All Reasons') {
            filtered = filtered.filter(task => task.reasonType === filterReason);
        }

        // Sort
        if (sortBy === 'Newest First') {
            // Mock: sort by time (in real app, use actual timestamps)
            filtered.sort((a, b) => {
                const timeA = parseInt(a.time);
                const timeB = parseInt(b.time);
                return timeA - timeB;
            });
        } else if (sortBy === 'Oldest First') {
            filtered.sort((a, b) => {
                const timeA = parseInt(a.time);
                const timeB = parseInt(b.time);
                return timeB - timeA;
            });
        }

        setFilteredTasks(filtered);
    };

    const navigate = useNavigate();

    const handleApprove = async (task) => {
        if (task.type === 'JOB') {
            try {
                await managerApi.approveJob(task.realId);
                setTasks(tasks.filter(t => t.id !== task.id));
                toast.success('Job approved successfully');
            } catch (error) {
                console.error("Failed to approve job:", error);
                toast.error("Failed to approve job");
            }
        } else if (task.type === 'DISPUTE') {
            // Navigate to dispute details or open a modal (assuming standard dispute link structure)
            navigate(`/disputes/${task.realId}`);
        }
    };

    const handleHide = async (task) => {
         if (task.type === 'JOB') {
            try {
                const reason = window.prompt("Enter rejection reason:");
                if (!reason) return;
                await managerApi.rejectJob(task.realId, reason);
                setTasks(tasks.filter(t => t.id !== task.id));
                toast.success('Job rejected successfully');
            } catch (error) {
                console.error("Failed to reject job:", error);
                toast.error("Failed to reject job");
            }
        } else {
             // Just hide from view for now for disputes
             setTasks(tasks.filter(t => t.id !== task.id));
             toast.success('Dispute hidden from view');
        }
    };

    const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
    const criticalCount = tasks.filter(t => t.status === 'FLAGGED').length;

    return (
        <div className="min-h-screen bg-[#02040a] flex font-mono text-slate-300 selection:bg-purple-500/30">
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>

                {/* Header */}
                <header className="bg-[#090e17]/80 backdrop-blur-md border-b border-[#1e293b] px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="hidden lg:flex flex-1 min-w-[320px] max-w-xl">
                        <div className="relative w-full group">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                className="w-full bg-[#02040a] border border-[#1e293b] rounded-lg pl-11 pr-4 py-2.5 text-sm transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-white placeholder-slate-600 outline-none font-mono"
                                placeholder="Search queues, rules, or system logs..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-purple-500/70 tracking-wider font-semibold border border-purple-500/20 px-3 py-1.5 rounded bg-purple-500/5">
                            SYS_TIME: <span className="text-purple-400">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto relative z-0">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-purple-500 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                                MODERATION_QUEUE
                            </h1>
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Status Badges */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-sm shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                        <span className="text-xs font-bold tracking-widest uppercase">{pendingCount} PENDING</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                        <span className="text-xs font-bold tracking-widest uppercase">{criticalCount} CRITICAL</span>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="SEARCH.RECORDS..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-[#02040a] border border-[#1e293b] rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-white placeholder-slate-600 outline-none text-xs font-mono uppercase tracking-widest w-64"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-400 ml-5 text-sm">Review flagged events, suspended nodes, and policy violations.</p>
                    </div>

                    {/* Filter and Sort Section */}
                    <div className="bg-[#090e17] rounded-lg p-4 border border-[#1e293b] mb-6 shadow-lg">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Filter by Reason */}
                            <div className="relative">
                                <select
                                    value={filterReason}
                                    onChange={(e) => setFilterReason(e.target.value)}
                                    className="appearance-none bg-[#02040a] border border-[#1e293b] rounded px-4 py-2 pr-8 text-xs font-bold tracking-widest uppercase text-slate-300 hover:border-purple-500/30 focus:border-purple-500 outline-none cursor-pointer"
                                >
                                    <option value="All Reasons">ALL_REASONS</option>
                                    <option value="REPORTED REASON">REPORTED</option>
                                    <option value="AUTO-FLAG REASON">AUTO-FLAGGED</option>
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-[#02040a] border border-[#1e293b] rounded px-4 py-2 pr-8 text-xs font-bold tracking-widest uppercase text-slate-300 hover:border-purple-500/30 focus:border-purple-500 outline-none cursor-pointer"
                                >
                                    <option value="Newest First">SORT: NEWEST</option>
                                    <option value="Oldest First">SORT: OLDEST</option>
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-2 ml-auto">
                                {['All', 'Flagged Only', 'Pending Review'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded text-xs font-bold tracking-widest uppercase transition-colors border ${activeTab === tab
                                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                            : 'bg-transparent text-slate-500 border-[#1e293b] hover:border-purple-500/30 hover:text-purple-300'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Task Cards Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                                <p className="text-purple-400 font-bold tracking-widest animate-pulse mt-4 text-xs uppercase">LOAD_QUEUES...</p>
                            </div>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-bold tracking-widest uppercase text-sm border border-dashed border-[#1e293b] rounded-lg">No records found matching query</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className="bg-[#090e17] rounded-xl border border-[#1e293b] shadow-lg overflow-hidden group hover:border-purple-500/50 transition-colors">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#02040a]/50">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-bold border ${task.status === 'FLAGGED'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                            }`}>
                                            {task.status}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{task.time}</span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-200 mb-1 group-hover:text-white transition-colors truncate">{task.jobTitle}</h3>
                                        <p className="text-xs text-slate-500 mb-4 font-mono tracking-wider uppercase">
                                            {task.company} • {task.location}
                                        </p>

                                        {/* Reason Section */}
                                        <div className="bg-[#02040a] border border-[#1e293b] rounded p-3 mb-5 group-hover:border-purple-500/30 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <span className="text-lg opacity-80 mt-1">{task.reasonIcon}</span>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                                                        {task.reasonType}
                                                    </p>
                                                    <p className="text-sm text-slate-300 leading-relaxed">{task.reasonText}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleApprove(task)}
                                                className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-purple-500/30 hover:border-purple-400 hover:text-white transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                                            >
                                                {task.type === 'JOB' ? '[APPROVE]' : '[RESOLVE]'}
                                            </button>
                                            <button
                                                onClick={() => handleHide(task)}
                                                className="flex-1 bg-transparent border border-[#1e293b] text-slate-400 px-4 py-2 rounded text-xs font-bold tracking-widest uppercase hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                {task.type === 'JOB' ? '[REJECT]' : '[HIDE]'}
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More Button */}
                    {filteredTasks.length > 0 && (
                        <div className="text-center mt-4">
                            <button className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-purple-500/5 border border-purple-500/30 rounded text-purple-400 text-xs font-bold tracking-widest uppercase hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                [FETCH_MORE]
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Moderation;
