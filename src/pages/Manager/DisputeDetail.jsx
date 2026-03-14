import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import managerApi from "../../api/manager.api";
import { useToast } from "../../contexts/ToastContext";
import { useChatContext } from "../../contexts/ChatContext";
import CyberModal from "../../components/CyberModal";

const DisputeDetail = () => {
    const toast = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const [dispute, setDispute] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [summary, setSummary] = useState("");
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [pendingResolution, setPendingResolution] = useState(null);
    const { socket } = useChatContext();

    useEffect(() => {
        fetchData();
        
        if (!socket) return;
        
        // Join the dispute room
        socket.emit('join_dispute', id);
        
        const handleNewMessage = (msg) => {
            setMessages(prev => {
                // Prevent duplicate messages
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };
        
        const handleResolved = (updatedDispute) => {
            setDispute(updatedDispute);
            toast.info("Tranh chấp đã được xử lý.");
        };

        socket.on('dispute_message', handleNewMessage);
        socket.on('dispute_resolved', handleResolved);
        
        return () => {
            socket.off('dispute_message', handleNewMessage);
            socket.off('dispute_resolved', handleResolved);
        };
    }, [id, socket]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const detailRes = await managerApi.getDisputeDetail(id);
            setDispute(detailRes.data);
            setMessages(detailRes.data?.messages || []);
            if (detailRes.data.resolution_summary) {
                setSummary(detailRes.data.resolution_summary);
            }
        } catch (error) {
            console.error("Failed to fetch dispute details:", error);
            toast.error("Hệ thống: Không thể tải chi tiết tranh chấp.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || resolving) return;
        try {
            const formData = new FormData();
            if (newMessage.trim()) formData.append('message', newMessage.trim());
            selectedFiles.forEach(file => formData.append('attachments', file));
            
            await managerApi.addDisputeMessage(id, formData);
            setNewMessage("");
            setSelectedFiles([]);
            fetchData();
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Hệ thống: Không thể gửi tin nhắn hòa giải.");
        }
    };

    const handleResolve = async () => {
        if (!summary.trim()) {
            toast.error("Hệ thống: Vui lòng nhập bản tóm tắt phán quyết (RESOLUTION_SUMMARY).");
            return;
        }

        try {
            setResolving(true);
            await managerApi.resolveDispute(id, pendingResolution, summary);
            toast.success("Tranh chấp đã được xử lý thành công.");
            setIsResolveModalOpen(false);
            navigate("/manager/disputes");
        } catch (error) {
            console.error("Failed to resolve dispute:", error);
            toast.error("Hệ thống: Lỗi khi xử lý tranh chấp.");
        } finally {
            setResolving(false);
        }
    };

    const confirmResolve = (resolution) => {
        if (!summary.trim()) {
            toast.error("Hệ thống: Vui lòng nhập bản tóm tắt phán quyết (RESOLUTION_SUMMARY).");
            return;
        }
        setPendingResolution(resolution);
        setIsResolveModalOpen(true);
    };

    if (loading) {
        return (
            <div className="p-8 text-center font-mono text-rose-500 animate-pulse py-40 uppercase tracking-[0.3em]">
                Deep_Scanning_Conflict_Node...
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="p-8 text-center font-mono py-40 flex flex-col items-center gap-6">
                <div className="text-rose-500 text-4xl">⚠</div>
                <p className="text-rose-500 uppercase tracking-[0.3em] text-sm">
                    Error: Conflict_Registry_Not_Found
                </p>
                <p className="text-slate-500 text-xs uppercase tracking-widest">
                    Tranh chấp không tồn tại hoặc bạn không có quyền truy cập.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={fetchData}
                        className="px-6 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10px] font-black font-mono tracking-widest uppercase hover:bg-rose-500/30 transition-all"
                    >
                        RETRY
                    </button>
                    <button
                        onClick={() => navigate("/manager/disputes")}
                        className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-[10px] font-black font-mono tracking-widest uppercase hover:border-slate-500 hover:text-white transition-all"
                    >
                        BACK_TO_LIST
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ${resolving ? 'opacity-50 pointer-events-none' : ''}`}>
            <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-2xl border border-rose-500/10 bg-transparent/40 backdrop-blur-md overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <button 
                            onClick={() => navigate("/manager/disputes")}
                            className="group flex items-center gap-2 text-rose-500/50 hover:text-rose-400 transition-colors text-[10px] font-black font-mono tracking-widest uppercase"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                            BACK_TO_CONFLICT_REGISTRY
                        </button>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                        Conflict <span className="text-rose-500">#{dispute.id}</span> Registry
                    </h1>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest max-w-xl">
                        Contract #{dispute.contract_id} {dispute.checkpoint_title ? `· Checkpoint: ${dispute.checkpoint_title} ($${dispute.escrow_amount})` : ''}
                    </p>
                </div>
                
                <div className="relative z-10 flex gap-4">
                    <span className={`px-4 py-2 rounded-xl border text-[10px] font-black font-mono tracking-widest uppercase flex items-center gap-2 ${dispute.status === 'PENDING' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dispute.status === 'PENDING' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></span>
                        {dispute.status}_PROTOCOL
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Core Evidence Section */}
                    <section className="bg-transparent/40 border border-rose-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-rose-500/5 bg-rose-500/[0.02]">
                            <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] font-mono">Conflict_Parameters</h2>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">Raiser_Entity</p>
                                    <p className="text-xl font-black text-white uppercase tracking-tight">{dispute.raiser_email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">Reason_Vector</p>
                                    <p className="text-xl font-black text-rose-400 uppercase tracking-tight">{dispute.reason}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">Evidence_Log</p>
                                <div className="p-6 rounded-xl bg-transparent/40 border border-rose-500/5 text-xs text-slate-400 font-mono leading-relaxed uppercase tracking-wider">
                                    {dispute.analysis || "PENDING_MANUAL_ANALYSIS"}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chat Log Section */}
                    <section className="bg-transparent/40 border border-rose-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-rose-500/5 bg-rose-500/[0.02] flex justify-between items-center">
                            <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] font-mono">Neutral_Observer_Log</h2>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Live_Feed_Enabled</span>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-4 custom-scrollbar">
                            {messages.length > 0 ? messages.map((m, idx) => {
                                const isManager = m.sender_role?.toLowerCase() === 'manager' || m.sender_role?.toLowerCase() === 'admin';
                                const isInitiator = m.sender_email === dispute.raiser_email;
                                
                                const roleLabel = isManager ? '🛡️ MANAGER_UNIT' : (isInitiator ? '⚖️ INITIATOR_REF' : '👤 RESPONDENT_NODE');
                                const roleColor = isManager ? 'text-emerald-400' : (isInitiator ? 'text-rose-400' : 'text-cyan-400');
                                const bgStyle = isManager ? 'bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-300' : (isInitiator ? 'bg-rose-500/[0.03] border-rose-500/10 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-300');
                                
                                return (
                                    <div key={idx} className={`flex flex-col gap-1 ${isInitiator && !isManager ? 'items-start' : 'items-end'}`}>
                                        <div className={`flex items-center gap-2 ${isInitiator && !isManager ? '' : 'flex-row-reverse'}`}>
                                            <span className={`text-[8px] font-mono font-black uppercase ${roleColor}`}>{roleLabel} &nbsp;·&nbsp; {m.sender_email}</span>
                                            <span className="text-[7px] font-mono text-slate-600 underline">[{new Date(m.created_at).toLocaleTimeString()}]</span>
                                        </div>
                                        {m.message && (
                                            <div className={`p-4 rounded-xl border text-[10px] font-mono uppercase leading-relaxed max-w-[90%] shadow-sm ${bgStyle}`}>
                                                {m.message}
                                            </div>
                                        )}
                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className={`flex flex-wrap gap-2 mt-1 max-w-[90%] ${isInitiator && !isManager ? 'justify-start' : 'justify-end'}`}>
                                                {m.attachments.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-colors">
                                                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-center py-10 text-[10px] font-mono text-slate-600 uppercase tracking-widest italic">No communication logs detected in this node</p>
                            )}
                        </div>

                        {/* Mediation Input */}
                        {dispute.status !== 'RESOLVED' ? (
                            <form onSubmit={handleSendMessage} className="p-4 bg-rose-500/[0.03] border-t border-rose-500/10 flex flex-col gap-3">
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-900 border border-rose-500/20 rounded-lg px-3 py-1.5 text-[9px] font-mono text-slate-300">
                                                <span className="truncate max-w-[150px]">{file.name}</span>
                                                <button type="button" onClick={() => setSelectedFiles(files => files.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <label className="shrink-0 flex items-center justify-center w-[46px] h-[46px] bg-slate-950/50 border border-rose-500/20 rounded-xl cursor-pointer hover:border-rose-500/50 transition-all">
                                        <input type="file" multiple className="hidden" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                                        <svg className="w-4 h-4 text-rose-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                                    </label>
                                    <input 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="ENTER_MEDIATION_COMMAND_OR_QUERY..."
                                        className="flex-1 bg-slate-950/50 border border-rose-500/20 rounded-xl px-4 py-3 text-[10px] font-mono text-rose-400 placeholder:text-rose-900 outline-none focus:border-rose-500/50 transition-all uppercase tracking-widest"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!newMessage.trim() && selectedFiles.length === 0}
                                        className="px-6 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10px] font-black font-mono tracking-widest uppercase hover:bg-rose-500/30 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] active:scale-95 disabled:opacity-50"
                                    >
                                        TRANSMIT
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">TRANSMISSION_CLOSED :: CONFLICT_RESOLVED</span>
                            </div>
                        )}
                    </section>
                </div>

                {/* Arbitration Actions */}
                <div className="space-y-8">
                    <section className="bg-transparent/40 border border-rose-500/10 rounded-2xl p-8 backdrop-blur-sm sticky top-8">
                        <div className="mb-8 p-6 rounded-xl bg-rose-500/[0.03] border border-rose-500/10">
                            <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest mb-4">Final_Arbitration</p>
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${dispute.status !== 'RESOLVED' ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse`}></span>
                                <span className={`text-lg font-black uppercase tracking-tighter ${dispute.status !== 'RESOLVED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {dispute.status !== 'RESOLVED' ? 'WAITING_FOR_DECISION' : 'PROTOCOL_RESOLVED'}
                                </span>
                            </div>
                        </div>

                        {dispute.status !== 'RESOLVED' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">Resolution_Summary (Required)</p>
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="PROVIDE_FORMAL_ARBITRATION_RATIONALE..."
                                        className="w-full min-h-[120px] bg-slate-950/50 border border-rose-500/20 rounded-xl p-4 text-[10px] font-mono text-slate-300 placeholder:text-rose-900 outline-none focus:border-rose-500/50 transition-all uppercase tracking-wider leading-relaxed"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => confirmResolve('CLIENT_WINS')}
                                        disabled={resolving}
                                        className="w-full py-4 rounded-xl border border-rose-500/50 text-rose-500 text-[10px] font-black font-mono tracking-[0.3em] uppercase hover:bg-rose-500/10 transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                                    >
                                        <span>{resolving ? 'ARBITRATING...' : 'CLIENT_WINS_PROTOCOL'}</span>
                                        <span className="text-[8px] font-normal tracking-normal text-rose-500/60 lowercase">(Client nhận lại tiền Checkpoint, Hợp đồng bị hủy)</span>
                                    </button>
                                    <button 
                                        onClick={() => confirmResolve('WORKER_WINS')}
                                        disabled={resolving}
                                        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#020617] text-[10px] font-black font-mono tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                                    >
                                        <span>{resolving ? 'ARBITRATING...' : 'WORKER_WINS_PROTOCOL'}</span>
                                        <span className="text-[8px] font-normal tracking-normal text-emerald-900/60 lowercase">(Worker nhận tiền Checkpoint, Hợp đồng tiếp tục)</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-[9px] font-mono font-black text-emerald-500 uppercase tracking-widest">Final_Ruling_Summary</p>
                                <div className="p-5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 text-[10px] font-mono text-slate-300 italic leading-relaxed uppercase">
                                    {summary || "NO_SUMMARY_DATA_RECORDED"}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 p-4 rounded-xl border border-rose-500/5 bg-rose-500/[0.01]">
                            <p className="text-[7px] font-mono text-slate-600 uppercase leading-relaxed tracking-wider">
                                CAUTION: Final arbitration will execute asset redistribution immediately. This action cannot be reverted through standard protocols.
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            <CyberModal 
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                onConfirm={handleResolve}
                title="FINAL_ARBITRATION_PROTOCOL"
                message={`Xác nhận thi hành phán quyết: ${pendingResolution === 'CLIENT_WINS' ? 'CHỦ DỰ ÁN THẮNG (Hoàn tiền)' : 'WORKER THẮNG (Thanh toán)'}. Hành động này sẽ thay đổi số dư ví của các bên ngay lập tức.`}
                type={pendingResolution === 'CLIENT_WINS' ? 'warning' : 'success'}
                confirmText="EXECUTE_RULING"
                processing={resolving}
            />
        </div>
    );
};

export default DisputeDetail;
