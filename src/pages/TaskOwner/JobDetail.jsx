import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { jobsApi } from "../../api/jobs.api";
import { matchingApi } from "../../api/matching.api";
import { contractsApi } from "../../api/contracts.api";
import { chatApi } from "../../api/chat.api";
import ReviewModal from "../../components/Reviews/ReviewModal";
import CyberModal from "../../components/CyberModal";
import { reviewsApi } from "../../api/reviews.api";
import { useAuth } from "../../auth/AuthContext";
const ProposalItem = ({
  proposal,
  handleStartChat,
  handleAcceptProposal,
  handleRejectProposal,
  t,
  navigate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxChars = 200;
  const showReadMore = proposal.cover_letter?.length > maxChars;
  const coverLetter = isExpanded ? proposal.cover_letter : proposal.cover_letter?.slice(0, maxChars);
  return <div className="group relative rounded-2xl border border-white/5 bg-slate-900/40 p-6 transition-all hover:bg-slate-900/60 hover:border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-2">
            <div onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="relative group/avatar cursor-pointer">
                <div className="absolute -inset-1 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite] border-dashed group-hover/avatar:border-cyan-400/40 transition-colors"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0f172a] via-cyan-950 to-blue-900 flex items-center justify-center text-cyan-400 text-xl font-black shadow-[0_0_20px_rgba(6,182,212,0.2)] relative border border-cyan-500/30">
                    {proposal.worker_avatar ? <img src={proposal.worker_avatar} alt={proposal.worker_name} className="w-full h-full rounded-full object-cover" /> : <span>{(proposal.worker_name || proposal.worker_email || 'W').charAt(0).toUpperCase()}</span>}
                </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black font-mono tracking-widest uppercase ${proposal.status === 'ACCEPTED' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-amber-900/30 text-amber-400 border border-amber-500/30'}`}>
                {proposal.status}
            </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h3 onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="text-base font-black text-white hover:text-cyan-400 cursor-pointer transition-colors uppercase tracking-tight truncate">
                {proposal.worker_name || t("task_owner.unknown_worker")}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1"><span className="text-cyan-500 opacity-50">#</span> {proposal.worker_email}</span>
                <span className="flex items-center gap-1"><span className="text-cyan-500 opacity-50">@</span> {t("job_detail.applied_on")} {new Date(proposal.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-cyan-400 font-mono tracking-tighter">{Number(proposal.proposed_price || 0).toLocaleString()} CRED</p>
            </div>
          </div>

          <div className="relative rounded-xl border border-white/5 bg-slate-950/40 p-4 group-hover:bg-slate-950/60 transition-colors">
            <p className="text-[9px] font-mono font-black text-slate-500 mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-cyan-500 opacity-50">&gt;&gt;</span> {t("job_detail.cover_letter")}
            </p>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-all pr-2">
              {coverLetter || t("job_detail.no_cover_letter")}
              {showReadMore && !isExpanded && "..."}
            </div>
            {showReadMore && <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest font-mono hover:text-cyan-400 transition-colors">
                {isExpanded ? "[ THU GỌN ]" : "[ ĐỌC THÊM ]"}
              </button>}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="flex-1 min-w-[120px] px-4 py-2 border border-white/10 text-slate-400 font-mono text-[9px] font-black tracking-widest uppercase hover:bg-white/5 hover:text-white transition-all rounded-lg">
                {t("job_detail.view_profile")}
            </button>
            <button onClick={() => handleStartChat(proposal.worker_id)} className="flex-1 min-w-[120px] px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-black tracking-widest uppercase hover:bg-cyan-500/20 transition-all rounded-lg flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {t("job_detail.chat")}
            </button>
            {proposal.status === 'PENDING' && <>
                <button onClick={() => handleAcceptProposal(proposal.id)} className="flex-1 min-w-[120px] px-4 py-2 bg-emerald-600 text-[#020617] font-mono text-[9px] font-black tracking-widest uppercase hover:bg-emerald-500 transition-all rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  {t("job_detail.accept_proposal")}
                </button>
                <button onClick={() => handleRejectProposal(proposal.id)} className="flex-1 min-w-[120px] px-4 py-2 border border-rose-500/20 text-rose-500 font-mono text-[9px] font-black tracking-widest uppercase hover:bg-rose-500/10 transition-all rounded-lg">
                  {t("job_detail.reject")}
                </button>
              </>}
          </div>
        </div>
      </div>
    </div>;
};
const JobDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [contractDetail, setContractDetail] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [recommendedWorkers, setRecommendedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('proposals');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const { user } = useAuth();

  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    confirmText: 'CONFIRM'
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchJobData();
  }, [id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [jobRes, proposalsRes, recommendedRes] = await Promise.all([
        jobsApi.getJobDetail(id),
        jobsApi.getJobProposals(id),
        matchingApi.getRecommendedWorkers(id)
      ]);
      setJob(jobRes.data);
      setProposals(proposalsRes.data || []);
      setRecommendedWorkers(recommendedRes.data || []);

      if (jobRes.data.contract?.id) {
        try {
          const contractRes = await contractsApi.getContractById(jobRes.data.contract.id);
          setContractDetail(contractRes.data);
          
          // Check for existing reviews
          const reviewsRes = await reviewsApi.getContractReviews(jobRes.data.contract.id);
          const userReview = reviewsRes.data.find(r => String(r.reviewer_id) === String(user.id));
          if (userReview) setHasReviewed(true);
        } catch (contractErr) {
          console.warn('Failed to fetch contract detail:', contractErr);
          setContractDetail(jobRes.data.contract);
        }
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError(t("job_detail.not_found"));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    setConfirmModal({
      isOpen: true,
      title: t("job_detail.accept_proposal_title"),
      message: t("job_detail.accept_proposal_msg"),
      type: "info",
      confirmText: t("job_detail.accept"),
      onConfirm: async () => {
        try {
          const res = await jobsApi.acceptProposal(proposalId);
          toast.success(t("job_detail.proposal_accepted_toast"));
          closeConfirmModal();
          const contractId = res.data?.contract?.id;
          if (contractId) {
            navigate(`/task-owner/contracts/${contractId}/review`);
          } else {
            fetchJobData();
          }
        } catch (err) {
          console.error("Error accepting proposal:", err);
          toast.error(err.response?.data?.message || t("job_detail.proposal_reject_fail"));
          closeConfirmModal();
        }
      }
    });
  };

  const handleRejectProposal = async (proposalId) => {
    setConfirmModal({
      isOpen: true,
      title: t("job_detail.reject_modal_title"),
      message: t("job_detail.reject_modal_msg"),
      type: "warning",
      confirmText: t("job_detail.reject_confirm_btn"),
      onConfirm: async () => {
        try {
          await jobsApi.rejectProposal(proposalId);
          toast.success(t("job_detail.proposal_rejected_msg"));
          closeConfirmModal();
          fetchJobData();
        } catch (err) {
          console.error("Error rejecting proposal:", err);
          toast.error(err.response?.data?.message || t("job_detail.proposal_reject_fail"));
          closeConfirmModal();
        }
      }
    });
  };

  const handleInviteWorker = (workerId) => {
    toast.info(`Invite sent to worker #${workerId}! (Demo)`);
  };

  const [startChatLoading, setStartChatLoading] = useState(false);

  const handleStartChat = async (userId) => {
    try {
      setStartChatLoading(true);
      await chatApi.startChat(userId);
      toast.success(t("job_detail.chat_opened", "Secure communication channel opened."));
      navigate('/messages');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(t("job_detail.chat_fail"));
    } finally {
      setStartChatLoading(false);
    }
  };

  const handleRenewJob = async () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const newEndDateStr = defaultDate.toISOString().split('T')[0];

    setConfirmModal({
      isOpen: true,
      title: "RENEW_JOB_POST",
      message: `Extending mission duration. Default extension set to: ${newEndDateStr}. Confirm renewal?`,
      type: "info",
      confirmText: "CONFIRM RENEWAL",
      onConfirm: async () => {
        try {
          setLoading(true);
          await jobsApi.renewJob(job.id, { endDate: newEndDateStr });
          toast.success("Job mission renewed successfully!");
          closeConfirmModal();
          fetchJobData();
        } catch (error) {
          console.error("Renewal Error:", error);
          toast.error(error.response?.data?.message || "Failed to renew job");
          closeConfirmModal();
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (loading) return <div className="flex items-center justify-center p-20">{t("task_owner.loading_data")}</div>;
  if (error || !job) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <p className="text-red-500 mb-4">{error || t("job_detail.not_found")}</p>
      <button onClick={() => navigate("/task-owner/jobs")} className="text-blue-600 hover:underline">{t("job_detail.back_to_jobs")}</button>
    </div>
  );

  return (
    <>
      <div className="flex-1 flex flex-col bg-transparent min-h-full">
        {/* Header */}
        <header className="bg-[#090e17]/80 backdrop-blur-xl border-b border-white/5 px-6 sm:px-10 py-6 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button onClick={() => navigate("/task-owner/jobs")} className="inline-flex items-center text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-1">
                <span className="mr-1">←</span> {t("job_detail.back_to_jobs")}
              </button>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight break-all">{job.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {job.category_name} • {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <button onClick={() => navigate(`/task-owner/jobs/${job.id}/edit`)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white text-xs rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20">
                  {t("job_detail.edit_job")}
                </button>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  job.status === "OPEN" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" :
                  job.status === "IN_PROGRESS" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
                  job.status === "CANCELLED" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" :
                  job.status === "EXPIRED" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                  "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {job.status}
                </span>
                {job.status === "EXPIRED" && (
                  <button onClick={handleRenewJob} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white text-xs rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-md shadow-amber-500/20">Renew</button>
                )}
                {job.status === "COMPLETED" && !hasReviewed && (
                  <button onClick={() => setIsReviewModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-white text-xs rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20">
                    {t("auto.db_acffaf", "★ Worker Evaluation")}
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("job_detail.budget")}: <span className="font-semibold text-gray-900 dark:text-white">{Number(job.budget).toLocaleString()} CRED</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: job details */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Overview */}
              <section className="relative group rounded-3xl border border-white/5 bg-[#0f172a]/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all hover:bg-[#0f172a]/60">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                   <svg className="w-24 h-24 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h2 className="text-xs font-black tracking-widest text-cyan-500 uppercase font-mono mb-4 flex items-center gap-2">
                   <span className="text-cyan-400 opacity-50">//</span> {t("job_detail.description")}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                  {job.description || t("job_detail.no_desc")}
                </p>
              </section>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <section className="rounded-3xl border border-white/5 bg-[#0f172a]/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all hover:bg-[#0f172a]/60">
                  <h2 className="text-xs font-black tracking-widest text-cyan-500 uppercase font-mono mb-4 flex items-center gap-2">
                    <span className="text-cyan-400 opacity-50">//</span> {t("job_detail.skills_req")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(skill => (
                      <span key={skill.id} className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black font-mono tracking-widest uppercase bg-cyan-950/30 text-cyan-400 border border-cyan-500/20">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Tabs Section */}
              <section className="rounded-3xl border border-white/5 bg-[#0f172a]/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm overflow-hidden transition-all">
                <div className="flex border-b border-white/5 bg-slate-900/40 overflow-x-auto no-scrollbar">
                  {['proposals', 'recommended', 'checkpoints', 'contract'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap px-8 py-4 text-[10px] font-black font-mono tracking-widest uppercase border-b-2 transition-all ${
                        activeTab === tab 
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40' 
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      {tab === 'proposals' ? `${t("job_detail.tab_proposals")} (${proposals.length})` : 
                       tab === 'recommended' ? t("job_detail.tab_candidates") : 
                       tab === 'checkpoints' ? t("job_detail.tab_checkpoints") : 
                       tab === 'contract' ? t("job_detail.tab_contract") : tab}
                    </button>
                  ))}
                </div>
                
                <div className="p-6">
                  {activeTab === 'proposals' && (
                    <div className="space-y-6">
                      {proposals.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/20">
                          <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase italic">{t("job_detail.no_proposals")}</p>
                        </div>
                      ) : (
                        proposals.map(proposal => <ProposalItem key={proposal.id} proposal={proposal} handleStartChat={handleStartChat} handleAcceptProposal={handleAcceptProposal} handleRejectProposal={handleRejectProposal} t={t} navigate={navigate} />)
                      )}
                    </div>
                  )}

                  {activeTab === 'recommended' && (
                    <div className="space-y-4">
                      {recommendedWorkers.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/20">
                          <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase italic">{t("job_detail.no_recommendations")}</p>
                        </div>
                      ) : (
                        recommendedWorkers.map(worker => (
                          <div key={worker.id} className="relative group p-5 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 hover:border-cyan-500/30 transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10 shrink-0">
                                  {worker.full_name?.charAt(0) || "W"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-black text-white uppercase tracking-wider truncate hover:text-cyan-400 cursor-pointer" onClick={() => navigate(`/profile/${worker.id}`)}>{worker.full_name}</h3>
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black font-mono tracking-widest uppercase px-2 py-0.5 rounded border border-emerald-500/20">{worker.match_score}% {t("job_detail.match")}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 mb-2 line-clamp-1">{worker.bio || t("job_detail.no_bio")}</p>
                                  <div className="flex flex-wrap gap-2">
                                     {worker.skills?.slice(0, 3).map(s => <span key={s.id} className="text-[8px] font-mono bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5 uppercase font-black">{s.name}</span>)}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleInviteWorker(worker.id)} className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-black tracking-widest uppercase hover:bg-cyan-500/20 transition-all rounded-lg shrink-0">
                                {t("job_detail.invite_to_apply")}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'checkpoints' && (
                    <div className="space-y-6">
                      {contractDetail && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t("job_detail.manage_checkpoints")}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{t("job_detail.manage_checkpoints_desc")}</p>
                          </div>
                          <button onClick={() => navigate(`/task-owner/contracts/${contractDetail.id}/review`)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md transform active:scale-95 transition-all">{t("job_detail.review_submissions")}</button>
                        </div>
                      )}
                      <div className="space-y-4">
                        {(contractDetail?.checkpoints || job.checkpoints || []).map((cp, idx) => (
                          <div key={idx} className="border border-gray-100 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-gray-500">{idx + 1}</div>
                                <div>
                                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{cp.title || `Checkpoint ${idx + 1}`}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cp.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900 dark:text-white text-xl">{Number(cp.amount).toLocaleString()} CRED</div>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-gray-100 dark:bg-slate-700 text-gray-500">{cp.status || 'PENDING'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'contract' && (
                    <div>
                      {contractDetail ? (
                        <div className="space-y-6 text-gray-900 dark:text-white">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{t("job_detail.contract_doc")}</h3>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">{contractDetail.status || 'DRAFT'}</span>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t("job_detail.total_contract_value")}</div>
                            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{Number(contractDetail.total_amount || 0).toLocaleString()} CRED</div>
                          </div>
                          <div className="border-2 border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
                            <div className="bg-white dark:bg-slate-800 p-8 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: contractDetail.contract_content || contractDetail.terms }} />
                          </div>
                          <div className="mt-6 p-6 bg-gray-50 dark:bg-slate-900/50 rounded-xl border-2 border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold mb-4">{t("job_detail.contract_signatures")}</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800 border-2">
                                <p className="font-semibold">{t("job_detail.worker_label")}</p>
                                <p className="text-sm font-bold text-gray-500">{contractDetail.signature_worker ? t("job_detail.signed") : t("job_detail.pending")}</p>
                              </div>
                              <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800 border-2">
                                <p className="font-semibold">{t("job_detail.employer_label")}</p>
                                <p className="text-sm font-bold text-gray-500">{contractDetail.signature_client ? t("job_detail.signed") : t("job_detail.pending_your_sig")}</p>
                              </div>
                            </div>
                            {!contractDetail.signature_client && contractDetail.signature_worker && (
                              <button onClick={() => navigate(`/task-owner/contracts/${contractDetail.id}/sign`)} className="w-full mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">{t("job_detail.review_sign_contract")}</button>
                            )}
                            {contractDetail.status === 'COMPLETED' && !hasReviewed && (
                              <button onClick={() => setIsReviewModalOpen(true)} className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all">
                                {t("auto.db_acffaf", "★ Worker Evaluation")}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">{t("job_detail.no_contract")}</p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right: summary card */}
            <div className="space-y-6">
              <section className="relative rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sticky top-[100px] overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h2 className="text-[10px] font-mono font-black text-cyan-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                    {t("job_detail.summary_title")}
                </h2>
                <div className="space-y-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">{t("job_detail.duration")}</span>
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                        {job.start_date ? new Date(job.start_date).toLocaleDateString() : 'ASAP'} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Open'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                    <span className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase">{t("job_detail.budget")}</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">
                        {Number(job.budget).toLocaleString()} CRED
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">{t("job_detail.status")}</span>
                    <span className={`inline-flex px-3 py-1 rounded w-fit text-[9px] font-black font-mono tracking-widest uppercase ${
                        job.status === "OPEN" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30" :
                        job.status === "IN_PROGRESS" ? "bg-cyan-900/30 text-cyan-400 border border-cyan-500/30" :
                        "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                        {job.status}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
      
      {contractDetail && (
        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
          contractId={contractDetail.id} 
          jobId={job.id} 
          onSuccess={() => {
            setHasReviewed(true);
            fetchJobData();
          }} 
        />
      )}
      <CyberModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} />
    </>
  );
};

export default JobDetail;