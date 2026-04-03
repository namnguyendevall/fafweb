import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { jobsApi } from '../../api/jobs.api';
import { contractsApi } from '../../api/contracts.api';
import { useToast } from '../../contexts/ToastContext';
import { useChatContext } from '../../contexts/ChatContext';
import { proposalsApi } from '../../api/proposals.api';

const SectionLabel = ({ children }) => (
    <p className="text-[9px] font-black tracking-widest text-cyan-500 uppercase font-mono mb-3 flex items-center gap-1.5">
        <span className="text-cyan-400">//</span> {children}
    </p>
);

const WorkDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { openChat } = useChatContext();
    
    const [job, setJob] = useState(null);
    const [contractDetail, setContractDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasActiveContract, setHasActiveContract] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [myProposal, setMyProposal] = useState(null);
    const [isZipping, setIsZipping] = useState(false);

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);
                const res = await jobsApi.getJobDetail(id);
                setJob(res.data);
                
                if (res.data.contract?.id) {
                    try {
                        const contractRes = await contractsApi.getContractById(res.data.contract.id);
                        setContractDetail(contractRes.data);
                    } catch {
                        setContractDetail(res.data.contract);
                    }
                }
            } catch (err) {
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };
        fetchJobDetails();

        // Check if worker already has an active or pending contract
        contractsApi.getMyActiveContract()
            .then(res => {
                if (res.data && ['ACTIVE', 'IN_PROGRESS', 'PENDING'].includes(res.data.status)) {
                    setHasActiveContract(true);
                }
            })
            .catch(() => {
                // No active contract or error — allow apply
                setHasActiveContract(false);
            });

        // Check if already applied
        proposalsApi.getMyProposals()
            .then(res => {
                const existing = (res.data || []).find(p => p.job_id === Number(id));
                if (existing) {
                    setHasApplied(true);
                    setMyProposal(existing);
                }
            })
            .catch(err => console.error("Error checking proposal status:", err));
    }, [id]);

    const handleContactEmployer = async () => {
        if (!job?.client_id) return toast.error('Employer information not found');
        try {
            await openChat(job.client_id);
        } catch {
            toast.error('Failed to open chat with employer');
        }
    };

    const getAttachmentUrl = (url, name) => {
        if (!url || typeof url !== 'string') return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        // Use our backend proxy to avoid CORS and 401 issues with Cloudinary
        return `${baseUrl}/uploads/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "")}`;
    };

    const getFileNameFromUrl = (resource, blob, index) => {
        const url = typeof resource === 'string' ? resource : resource.url;
        const name = typeof resource === 'object' ? resource.name : null;
        
        if (name) return name;

        // Try to extract filename from URL
        let filename = url.split('/').pop().split('?')[0];
        
        // If it looks like a hash (Cloudinary public ID) or is missing extension
        if (!filename || filename.length < 5 || !filename.includes('.')) {
            const mimeToExt = {
                'application/zip': 'zip',
                'application/x-zip-compressed': 'zip',
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'video/mp4': 'mp4',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'application/msword': 'doc',
                'application/x-rar-compressed': 'rar',
                'application/octet-stream': 'zip'
            };
            
            const ext = mimeToExt[blob.type] || blob.type.split('/')[1] || 'bin';
            filename = `resource_${index + 1}.${ext}`;
        }
        return filename;
    };

    const handleIndividualDownload = async (resource, index) => {
        const url = typeof resource === 'string' ? resource : resource.url;
        const name = typeof resource === 'object' ? resource.name : null;
        
        try {
            toast.info("Đang kết nối server...");
            
            // First attempt: fetch to control filename
            const response = await fetch(getAttachmentUrl(url, name), {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) throw new Error("Fetch failed");
            
            const blob = await response.blob();
            if (blob.size === 0) throw new Error("Empty blob received");

            const filename = name || getFileNameFromUrl(resource, blob, index);
            
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.warn("Standard download blocked by CORS/Browser, falling back to direct link:", err);
            // Fallback: Open in new window with fl_attachment which forces download via server
            window.open(getAttachmentUrl(url, name), '_blank');
        }
    };

    const handleDownloadAll = async () => {
        if (!job?.resource_urls || job.resource_urls.length === 0) return;
        
        try {
            setIsZipping(true);
            toast.info(`Đang nén ${job.resource_urls.length} tệp...`);
            
            const zip = new JSZip();
            
            const downloadPromises = job.resource_urls.map(async (resource, index) => {
                const url = typeof resource === 'string' ? resource : resource.url;
                const name = typeof resource === 'object' ? resource.name : null;
                try {
                    // Use our backend proxy to avoid CORS and 401 issues with Cloudinary
                    const fetchUrl = getAttachmentUrl(url, name);
                    const response = await fetch(fetchUrl, { mode: 'cors' });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.size > 0) {
                            const filename = getFileNameFromUrl(resource, blob, index);
                            zip.file(filename, blob);
                        }
                    }
                } catch (err) {
                    console.error(`Failed to fetch ${url} for ZIP:`, err);
                }
            });

            await Promise.all(downloadPromises);
            
            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);
            
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `Project_Resources_${id}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(zipUrl);
            
            toast.success("Đã tải xuống tệp ZIP thành công!");
        } catch (err) {
            console.error("ZIP creation failed:", err);
            toast.error("Không thể tạo tệp ZIP. Vui lòng thử lại sau.");
        } finally {
            setIsZipping(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">Scanning Data...</span>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
                <div className="max-w-md w-full rounded-2xl border p-8 text-center" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest font-mono mb-2">SIGNAL LOST</h2>
                    <p className="text-[12px] text-slate-400 font-mono mb-6">{error || 'Job data could not be retrieved.'}</p>
                    <button onClick={() => navigate('/find-work')}
                        className="px-6 py-2.5 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-slate-300">

            <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="mb-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    <Link to="/find-work" className="hover:text-cyan-400 transition-colors">FIND WORK</Link>
                    <span className="text-slate-700">›</span>
                    <span className="text-cyan-500">{job.category_name || 'JOB DETAILS'}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    {/* ── MAIN CONTENT ── */}
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="rounded-2xl border p-8 relative overflow-hidden group" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.2)' }}>
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mb-4 leading-tight group-hover:text-cyan-300 transition-colors">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                                            Posted by: <span className="text-slate-200">{job.client?.full_name || job.client?.email?.split('@')[0] || 'Employer'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span>
                                            Type: <span className="text-slate-200">{job.job_type === 'SHORT_TERM' ? 'Short-term' : 'Long-term'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
                                            Duration: <span className="text-slate-200">{job.start_date ? new Date(job.start_date).toLocaleDateString() : 'ASAP'} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Open'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-600/50 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all font-mono text-[11px] uppercase tracking-widest text-slate-300">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.15)' }}>
                            <SectionLabel>JOB DESCRIPTION</SectionLabel>
                            <p className="text-[13px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{job.description}</p>
                        </div>

                        {/* Skills */}
                        {job.skills?.length > 0 && (
                            <div className="rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <SectionLabel>REQUIRED SKILLS</SectionLabel>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {job.skills.map((skill, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black font-mono tracking-wide border bg-cyan-900/20 border-cyan-500/30 text-cyan-400">
                                            {typeof skill === 'string' ? skill : skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Project Resources (NEW) */}
                        {job.resource_urls && job.resource_urls.length > 0 && (
                            <div className="rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <SectionLabel>PROJECT RESOURCES</SectionLabel>
                                    <button 
                                        onClick={handleDownloadAll}
                                        disabled={isZipping}
                                        className={`mb-3 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-[9px] font-black font-mono tracking-widest text-cyan-400 uppercase hover:bg-cyan-500/20 transition-all flex items-center gap-2 group ${isZipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isZipping ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                                ĐANG NÉN...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                TẢI ZIP
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    {(job.resource_urls || []).map((resource, idx) => {
                                        const isObj = typeof resource === 'object' && resource !== null;
                                        const url = isObj ? resource.url : resource;
                                        const name = isObj ? resource.name : (url?.split('/').pop().split('?')[0] || `Resource ${idx + 1}`);
                                        const size = isObj && resource.size ? (resource.size / 1024).toFixed(1) + ' KB' : null;
                                        
                                        const lowName = name?.toLowerCase() || "";
                                        const isZip = lowName.endsWith('.zip') || lowName.endsWith('.rar');
                                        const isPdf = lowName.endsWith('.pdf');
                                        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(lowName);
                                        const isVid = /\.(mp4|webm|ogg)$/i.test(lowName);

                                        return (
                                            <div 
                                                key={idx} 
                                                className="group relative flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isZip ? 'bg-amber-500/10 text-amber-500' : isPdf ? 'bg-rose-500/10 text-rose-500' : isImg ? 'bg-emerald-500/10 text-emerald-500' : isVid ? 'bg-indigo-500/10 text-indigo-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                                                        {isZip ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                                        ) : isPdf ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                        ) : isImg ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        ) : isVid ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <button 
                                                            onClick={() => handleIndividualDownload(resource, idx)}
                                                            className="text-[13px] font-black text-white uppercase tracking-wider truncate hover:text-cyan-400 transition-colors text-left"
                                                        >
                                                            {name}
                                                        </button>
                                                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                                            <span>{isZip ? 'Archive' : isPdf ? 'Document' : isImg ? 'Image' : isVid ? 'Video' : 'Asset'}</span>
                                                            {size && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                                    <span className="text-cyan-500/70">{size}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleIndividualDownload(resource, idx)}
                                                    className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500/20"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Milestones */}
                        {job.checkpoints?.length > 0 && (
                            <div className="rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <SectionLabel>TIẾN ĐỘ DỰ ÁN</SectionLabel>
                                <div className="space-y-4 mt-4">
                                    {job.checkpoints.map((cp, idx) => (
                                        <div key={cp.id || idx} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-cyan-500/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black font-mono text-cyan-500 uppercase tracking-widest">GIAI ĐOẠN 0{idx + 1}</span>
                                                        <span className={`px-2 py-0.5 rounded border text-[9px] font-black font-mono tracking-widest uppercase ${
                                                            cp.status === 'COMPLETED' || cp.status === 'APPROVED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                                            cp.status === 'SUBMITTED' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                                                            cp.status === 'IN_PROGRESS' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' :
                                                            'bg-slate-800 text-slate-400 border-slate-600'
                                                        }`}>{cp.status === 'SUBMITTED' ? 'ĐANG CHỜ DUYỆT' : (cp.status || 'PENDING')}</span>
                                                    </div>
                                                    <h3 className="text-sm font-black text-white tracking-wide uppercase">{cp.name || `Giai đoạn ${idx+1}`}</h3>
                                                    {cp.description && <p className="text-[12px] text-slate-400 font-mono mt-2">{cp.description}</p>}
                                                </div>
                                                {cp.amount && (
                                                    <div className="text-right shrink-0">
                                                        <div className="text-lg font-black text-cyan-400 font-mono">${Number(cp.amount).toLocaleString()}</div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Submission Details */}
                                            {cp.submission_url && (
                                                <div className="mt-4 pt-4 border-t border-slate-700/50 bg-slate-900/30 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                        <span className="text-[10px] font-black tracking-widest text-cyan-500 uppercase font-mono">BÀI NỘP CỦA BẠN</span>
                                                    </div>
                                                    <div className="bg-[#02040a] border border-cyan-500/20 p-2.5 rounded text-[11px] font-mono mb-3 break-all">
                                                        <a href={cp.submission_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
                                                            {cp.submission_url}
                                                        </a>
                                                    </div>
                                                    {cp.submission_notes && (
                                                        <div className="mb-3 border-l-2 border-slate-600 pl-3">
                                                            <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase block mb-1">GHI CHÚ:</span>
                                                            <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{cp.submission_notes}</p>
                                                        </div>
                                                    )}
                                                    {cp.submitted_at && (
                                                        <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mt-2 border-t border-slate-700/50 pt-2 flex items-center gap-1.5">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            THỜI GIAN NỘP: {new Date(cp.submitted_at).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Review details */}
                                            {cp.review_notes && (
                                                <div className={`mt-3 border-l-[3px] p-3 rounded-r-lg ${cp.status === 'APPROVED' ? 'border-emerald-500 bg-emerald-900/10' : 'border-rose-500 bg-rose-900/10'}`}>
                                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase font-mono block mb-1">ĐÁNH GIÁ TỪ KHÁCH HÀNG:</span>
                                                    <p className="text-sm text-slate-300 font-mono">{cp.review_notes}</p>
                                                    {cp.reviewed_at && (
                                                        <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
                                                            THỜI GIAN DUYỆT: {new Date(cp.reviewed_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contract Document Preview if exists */}
                        {contractDetail && (
                            <div className="rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(168,85,247,0.2)' }}>
                                <div className="flex items-center justify-between mb-6">
                                    <SectionLabel><span className="text-purple-400">TÀI LIỆU HỢP ĐỒNG</span></SectionLabel>
                                    <span className="px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-[9px] font-black text-purple-400 tracking-widest font-mono">
                                        {contractDetail.status || 'DRAFT'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">TỔNG GIÁ TRỊ</div>
                                        <div className="text-xl font-black text-white font-mono">${Number(contractDetail.total_amount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">MÃ HỢP ĐỒNG</div>
                                        <div className="text-sm font-bold text-slate-300 font-mono">#{contractDetail.id}</div>
                                    </div>
                                </div>

                                {(contractDetail.contract_content || contractDetail.terms) && (
                                    <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-[#090e17]">
                                        <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
                                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <span className="text-[11px] font-black tracking-widest font-mono text-slate-300 uppercase">THỎA THUẬN TIÊU CHUẨN FAF</span>
                                        </div>
                                        <div className="p-6 prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-headings:text-slate-200" dangerouslySetInnerHTML={{ __html: contractDetail.contract_content || contractDetail.terms }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── SIDEBAR ── */}
                    <aside className="space-y-6">
                        {/* Budget Card */}
                        <div className="rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.3)' }}>
                            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono mb-2">NGÂN SÁCH DỰ ÁN</div>
                            <div className="text-4xl font-black text-white font-mono mb-1 tracking-tight">
                                ${Number(job.budget || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-500/70">BẢO ĐẢM BỞI FAF ESCROW</div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {hasActiveContract ? (
                                <div className="w-full py-4 rounded-xl font-black text-[12px] tracking-widest uppercase font-mono bg-red-900/20 text-red-400 border border-red-500/30 text-center cursor-not-allowed flex flex-col items-center gap-1">
                                    <span>🚫 Đang Có Việc Làm</span>
                                    <span className="text-[9px] font-mono text-red-500/60 tracking-widest normal-case">Hoàn thành hoặc thoát hợp đồng hiện tại để ứng tuyển.</span>
                                </div>
                            ) : hasApplied ? (
                                <div className="w-full py-4 rounded-xl font-black text-[12px] tracking-widest uppercase font-mono bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 text-center flex flex-col items-center gap-1">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Đã Ứng Tuyển
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-500/60 tracking-widest uppercase">Trạng thái: {myProposal?.status}</span>
                                    <button onClick={() => navigate('/dashboard')} className="mt-2 text-[9px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2">XEM TRONG BẢNG ĐIỀU KHIỂN</button>
                                </div>
                            ) : (
                                <button onClick={() => navigate(`/apply/${id}`)}
                                    className="w-full py-4 rounded-xl font-black text-[13px] tracking-widest uppercase font-mono bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/50 transition-all hover:scale-[1.02]">
                                    Ứng Tuyển Ngay
                                </button>
                            )}
                            <button onClick={handleContactEmployer}
                                className="w-full py-3.5 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                Nhắn Tin Cho Khách Hàng
                            </button>
                        </div>

                        {/* About Client */}
                        {job.client && (
                            <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.15)' }}>
                                <SectionLabel>THÔNG TIN KHÁCH HÀNG</SectionLabel>
                                <div className="flex items-center gap-4 mb-5 mt-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-slate-300">
                                        {(job.client.full_name || job.client.email)?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-[14px] text-white truncate">{job.client.full_name || job.client.email?.split('@')[0]}</div>
                                        <div className="text-[11px] text-slate-500 font-mono truncate">{job.client.email}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-center">
                                        <div className="text-[9px] font-mono text-slate-500 tracking-widest mb-1">POSTS</div>
                                        <div className="text-lg font-black text-white">{job.client.total_jobs || 1}</div>
                                    </div>
                                    <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-center">
                                        <div className="text-[9px] font-mono text-slate-500 tracking-widest mb-1">JOINED</div>
                                        <div className="text-sm font-black text-white mt-1">{job.client.created_at ? new Date(job.client.created_at).getFullYear() : '2024'}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default WorkDetail;
