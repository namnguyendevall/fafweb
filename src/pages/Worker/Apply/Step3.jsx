import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { proposalsApi } from '../../../api/proposals.api';
const Step3 = ({
  onBack,
  job,
  proposalData
}) => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    escrow: false
  });
  const handleAgreementChange = key => {
    setAgreements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleSubmit = async () => {
    if (!agreements.terms || !agreements.escrow) {
      toast.warning(t("apply.accept_agreements_warning"));
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        jobId: parseInt(job.id),
        coverLetter: proposalData.coverLetter,
        proposedPrice: parseFloat(proposalData.proposedPrice)
      };
      await proposalsApi.submitProposal(payload);
      toast.success(t("auto.db_efdb3e"));
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit proposal';
      if (errorMsg.includes('ALREADY_APPLIED')) {
        toast.warning('You have already applied to this job.');
      } else if (errorMsg.includes('JOB_NOT_OPEN')) {
        toast.warning('This job is no longer accepting applications.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate service fee (5%)
  const serviceFee = (parseFloat(proposalData.proposedPrice) * 0.05).toFixed(2);
  const netEarnings = (parseFloat(proposalData.proposedPrice) - parseFloat(serviceFee)).toFixed(2);
  return <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 px-6 sm:px-10 py-8">
                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                                {t("apply.final_review_title")}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t("apply.final_review_desc")}
                            </p>
                        </div>

                        {/* Job Info */}
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t("apply.applying_to")}</div>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">{job.title}</h3>
                            <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <span>{t("job.budget_label")}: ${Number(job.budget).toLocaleString()}</span>
                                <span>•</span>
                                <span>{job.job_type === 'SHORT_TERM' ? t("apply.short_term") : t("apply.long_term")}</span>
                            </div>
                        </div>

                        {/* Your Proposed Price */}
                        <div className="mb-8">
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">{t("apply.proposed_price_label")}</h2>
                            <div className="bg-gradient-to-r from-cyan-900/30 to-indigo-50 border-2 border-cyan-800/50 rounded-xl p-6">
                                <div className="text-center">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t("apply.you_will_receive")}</div>
                                    <div className="text-4xl font-extrabold text-cyan-500 mb-1">
                                        ${Number(netEarnings).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        {t("apply.service_fee_calc", { bid: Number(proposalData.proposedPrice).toLocaleString(), fee: serviceFee })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Your Proposal Note */}
                        <div className="mb-8">
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">{t("apply.cover_letter_title")}</h2>
                            <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 max-h-[200px] overflow-y-auto">
                                {proposalData.coverLetter}
                            </div>
                        </div>

                        {/* Milestones Summary */}
                        {job.checkpoints && job.checkpoints.length > 0 && <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{t("apply.milestone_summary_title")}</h2>
                                    <span className="px-3 py-1 rounded-full bg-cyan-900/50 text-xs font-extrabold text-cyan-400">
                                        {t("apply.num_milestones", { count: job.checkpoints.length })}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {job.checkpoints.map((checkpoint, index) => {
                const milestoneNet = (parseFloat(checkpoint.amount) * 0.95).toFixed(2);
                return <div key={checkpoint.id || index} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{index + 1}.</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{checkpoint.title || checkpoint.name || `${t("apply.milestone_label")} ${index + 1}`}</span>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono line-clamp-1">
                                                                {checkpoint.description || t("job.no_desc")}
                                                            </span>
                                                            {checkpoint.due_date ? <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold font-mono flex items-center gap-1 uppercase tracking-tighter">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{t("job.due_date")}: {new Date(checkpoint.due_date).toLocaleDateString()}
                                                                </span> : checkpoint.duration_days && <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 uppercase tracking-tighter italic opacity-70">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t("apply.milestone_label")} {checkpoint.duration_days} {t("job.days")}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {checkpoint.amount && <div className="text-right">
                                                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                            ${Number(checkpoint.amount).toLocaleString()}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-cyan-500">{t("apply.milestone_net")}{Number(milestoneNet).toLocaleString()}
                                                        </div>
                                                    </div>}
                                            </div>;
              })}
                                </div>
                            </div>}

                        {/* Legal Agreements */}
                        <div className="mb-8">
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">{t("apply.legal_agreements_title")}</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <input type="checkbox" id="terms" checked={agreements.terms} onChange={() => handleAgreementChange('terms')} className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-900/300" />
                                    <label htmlFor="terms" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                        {t("apply.terms_agree")}
                                    </label>
                                </div>
                                <div className="flex items-start gap-3">
                                    <input type="checkbox" id="escrow" checked={agreements.escrow} onChange={() => handleAgreementChange('escrow')} className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-900/300" />
                                    <label htmlFor="escrow" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                        {t("apply.escrow_agree")}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={onBack} disabled={submitting} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white font-medium flex items-center gap-1 disabled:opacity-50">
                                {t("apply.back_to_proposal")}
                            </button>
                            <button disabled={!agreements.terms || !agreements.escrow || submitting} onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2">
                                {submitting ? <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t("apply.submitting_btn")}
                                    </> : <>
                                        {t("apply.confirm_submit_btn")}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6">
                        {/* Total Estimated Earnings */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="text-sm font-extrabold text-slate-600 dark:text-slate-400 mb-2">{t("apply.net_earnings_title")}</div>
                            <div className="text-3xl font-extrabold text-cyan-500 mb-1">
                                ${Number(netEarnings).toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{t("apply.service_fee_label")}</div>
                        </div>

                        {/* Contract Details */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">{t("apply.breakdown_title")}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{t("apply.your_bid")}</span>
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        ${Number(proposalData.proposedPrice).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{t("apply.service_fee_label")}</span>
                                    <span className="text-sm font-extrabold text-red-600">-${serviceFee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{t("apply.secure_escrow_title")}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-extrabold text-emerald-600">{t("apply.milestone_funded")}</span>
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="font-semibold text-emerald-600">{t("apply.payment_protection_active")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Submission Disclaimer */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            {t("apply.submission_disclaimer")}
                        </div>
                    </div>
                </div>
            </div>
        </div>;
};
export default Step3;