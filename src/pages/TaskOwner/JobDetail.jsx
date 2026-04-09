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
      <div className="flex-1 flex flex-col bg-transparent min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-6 sm:px-10 py-6 sticky top-0 z-20 shadow-sm">
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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: job details */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Overview */}
              <section className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t("job_detail.description")}</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-all">
                  {job.description || t("job_detail.no_desc")}
                </p>
              </section>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <section className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t("job_detail.skills_req")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(skill => (
                      <span key={skill.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Tabs Section */}
              <section className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="border-b border-gray-100 dark:border-slate-700 flex overflow-x-auto">
                  {['proposals', 'recommended', 'checkpoints', 'contract'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[120px] py-4 text-sm font-semibold text-center transition-colors whitespace-nowrap capitalize ${
                        activeTab === tab ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab === 'proposals' ? `${t("job_detail.tab_proposals")} (${proposals.length})` : 
                       tab === 'recommended' ? t("job_detail.tab_candidates") : 
                       tab === 'checkpoints' ? t("job_detail.tab_checkpoints") : 
                       tab === 'contract' ? t("job_detail.tab_contract") : tab}
                    </button>
                  ))}
                </div>
                
                <div className="p-8">
                  {activeTab === 'proposals' && (
                    <div className="space-y-4">
                      {proposals.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{t("job_detail.no_proposals")}</p>
                        </div>
                      ) : (
                        proposals.map(proposal => (
                          <div key={proposal.id} className="flex gap-4 p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="cursor-pointer hover:opacity-80 transition-opacity">
                              {proposal.worker_avatar ? <img src={proposal.worker_avatar} alt={proposal.worker_name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200">{(proposal.worker_name || proposal.worker_email || 'W').charAt(0).toUpperCase()}</div>}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors text-base">{proposal.worker_name || t("task_owner.unknown_worker")}</h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{proposal.worker_email}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("job_detail.applied_on")} {new Date(proposal.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-white text-lg">{Number(proposal.proposed_price || 0).toLocaleString()} CRED</p>
                                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${proposal.status === 'ACCEPTED' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'}`}>{proposal.status}</span>
                                </div>
                              </div>
                              <div className="mt-4 p-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t("job_detail.cover_letter")}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{proposal.cover_letter || t("job_detail.no_cover_letter")}</p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => navigate(`/profile/${proposal.worker_id}`)} className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">{t("job_detail.view_profile")}</button>
                                <button onClick={() => handleStartChat(proposal.worker_id)} className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                  {t("job_detail.chat")}
                                </button>
                                {proposal.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleAcceptProposal(proposal.id)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-xl">{t("job_detail.accept_proposal")}</button>
                                    <button onClick={() => handleRejectProposal(proposal.id)} className="flex-1 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl">{t("job_detail.reject")}</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'recommended' && (
                    <div className="space-y-4">
                      {recommendedWorkers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4">{t("job_detail.no_recommendations")}</p>
                      ) : (
                        recommendedWorkers.map(worker => (
                          <div key={worker.id} className="border border-gray-100 dark:border-slate-700 rounded-2xl p-5 bg-gradient-to-r from-blue-50/50 dark:from-blue-900/10 to-white dark:to-slate-800 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                  {worker.full_name?.charAt(0) || "W"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => navigate(`/profile/${worker.id}`)}>{worker.full_name}</h3>
                                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{worker.match_score}% {t("job_detail.match")}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{worker.bio || t("job_detail.no_bio")}</p>
                                </div>
                              </div>
                              <button onClick={() => handleInviteWorker(worker.id)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">{t("job_detail.invite_to_apply")}</button>
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
              <section className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-md sticky top-[100px]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("job_detail.summary_title")}</h2>
                <div className="space-y-2 text-sm text-gray-900 dark:text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("job_detail.duration")}</span>
                    <span className="font-medium text-right">{job.start_date ? new Date(job.start_date).toLocaleDateString() : 'ASAP'} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Open'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("job_detail.budget")}</span>
                    <span className="font-bold">{Number(job.budget).toLocaleString()} CRED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("job_detail.status")}</span>
                    <span className="font-medium">{job.status}</span>
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