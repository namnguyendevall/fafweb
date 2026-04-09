import { useTranslation } from 'react-i18next';
import React from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
const Step2 = ({
  onBack,
  onNext,
  job,
  proposalData,
  setProposalData
}) => {
  const {
    t
  } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const handleChange = (field, value) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = () => {
    // Validate before going to next step
    if (!proposalData.coverLetter.trim()) {
      toast.warning('Please write a cover letter');
      return;
    }
    if (!proposalData.proposedPrice || parseFloat(proposalData.proposedPrice) <= 0) {
      toast.warning('Please enter a valid proposed price');
      return;
    }
    onNext();
  };
  return <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 px-6 sm:px-10 py-8">
                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                                {t("apply.submit_proposal_title")}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t("apply.submit_proposal_desc")}
                            </p>
                        </div>

                        {/* Proposed Price */}
                        <div className="mb-8">
                            <label className="block mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">{t("apply.proposed_price_label")}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{t("apply.proposed_price_budget")} ${Number(job?.budget || 0).toLocaleString()}</span>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">CRED</span>
                                    <input type="number" value={proposalData.proposedPrice} readOnly disabled className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xl font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="mt-2 text-[10px] uppercase font-black tracking-widest text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{t("auto.db_1214fd")}</p>
                            </label>
                        </div>

                        {/* Cover Letter */}
                        <div className="mb-8">
                            <label className="block">
                                <span className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 block">{t("apply.cover_letter_label")}</span>
                                <textarea value={proposalData.coverLetter} onChange={e => handleChange('coverLetter', e.target.value)} rows={12} required className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-cyan-900/300 focus:ring-2 focus:ring-cyan-800/50 transition-all resize-none text-sm text-slate-700 dark:text-slate-300" placeholder={t("apply.cover_letter_placeholder")}></textarea>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {t("apply.characters_count", { count: proposalData.coverLetter.length })}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {t("apply.moderation_warning")}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Checkpoints/Milestones Info */}
                        {job?.checkpoints && job.checkpoints.length > 0 && <div className="mb-8">
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">{t("apply.project_milestones_title")}</h2>
                                <div className="space-y-3">
                                    {job.checkpoints.map((checkpoint, index) => <div key={checkpoint.id || index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-cyan-500">{t("apply.milestone_label")} {index + 1}</span>
                                                        <span className="px-2 py-1 bg-cyan-900/50 text-cyan-400 text-xs font-bold rounded-full">
                                                            {t("apply.milestone_funded")}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                                                        {checkpoint.title || checkpoint.name || `Checkpoint ${index + 1}`}
                                                    </h3>
                                                    {checkpoint.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{checkpoint.description}</p>}
                                                    {checkpoint.due_date ? <p className="text-[10px] text-cyan-500 font-mono flex items-center gap-1.5 uppercase tracking-wider font-bold">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{t("auto.db_4bebba")}{new Date(checkpoint.due_date).toLocaleDateString()}
                                                        </p> : checkpoint.duration_days && <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-wider italic opacity-70">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t("auto.db_266cd1")}{checkpoint.duration_days}{t("auto.db_0b7342")}</p>}
                                                </div>
                                                {checkpoint.amount && <div className="text-right shrink-0">
                                                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                                                            ${Number(checkpoint.amount).toLocaleString()}
                                                        </div>
                                                    </div>}
                                            </div>
                                        </div>)}
                                </div>
                            </div>}

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={onBack || (() => navigate(-1))} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white font-medium">
                                {t("apply.back_to_profile")}
                            </button>
                            <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                {t("apply.continue_to_review")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6">
                        {/* Job Info Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t("job.summary_title")}</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t("apply.applying_to")}</div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{job?.title}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{t("job.budget_label")}</span>
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{Number(job?.budget || 0).toLocaleString()} CRED</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{t("apply.job_type")}</span>
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {job?.job_type === 'SHORT_TERM' ? t("apply.short_term") : t("apply.long_term")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FAF Secure Escrow Card */}
                        <div className="bg-cyan-900/30 rounded-3xl border border-cyan-900/50 p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-cyan-900/50 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white text-center mb-2">{t("apply.secure_escrow_title")}</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                                {t("apply.secure_escrow_desc")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
};
export default Step2;