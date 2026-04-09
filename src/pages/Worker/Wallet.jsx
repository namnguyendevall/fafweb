import { useTranslation } from 'react-i18next';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { walletApi } from '../../api/wallet.api';
import { useToast } from '../../contexts/ToastContext';
const Wallet = () => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    fetchMe
  } = useAuth();
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedPackage, setSelectedPackage] = useState('Pro');
  const [customAmount, setCustomAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [realTransactions, setRealTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Integrated Withdrawal State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transferMethod, setTransferMethod] = useState('momo');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const toast = useToast();
  useEffect(() => {
    fetchMe();
    loadTransactions();
  }, []);
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await walletApi.getMyTransactions();
      setRealTransactions(res.data || []);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleWithdraw = async () => {
    const amountNum = Number(withdrawAmount) || 0;
    if (amountNum < 10) {
      toast.error(t("wallet.min_withdraw"));
      return;
    }
    if (amountNum > totalBalance) {
      toast.error(t("wallet.escrow_refund")); // Fallback or add proper error in i18n
      return;
    }
    if (!phoneNumber) {
      toast.error(t("wallet.phone"));
      return;
    }
    if (transferMethod === 'atm') {
      if (!bankName || !accountNumber || !accountHolder) {
        toast.error(t("wallet.bank_account"));
        return;
      }
    }
    const bankInfo = {
      method: transferMethod,
      phone: phoneNumber,
      ...(transferMethod === 'atm' && {
        bankName,
        accountNumber,
        accountHolder: accountHolder.toUpperCase()
      })
    };
    setIsWithdrawing(true);
    try {
      await walletApi.requestWithdrawal({
        amount: amountNum,
        bank_info: bankInfo
      });
      toast.success(t("wallet.withdraw_request"));
      setWithdrawAmount('');
      loadTransactions();
      fetchMe();
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error(error.response?.data?.message || t("wallet.withdraw_desc"));
    } finally {
      setIsWithdrawing(false);
    }
  };
  const walletId = user?.id ? `faf_${user.id}_wallet` : 'faf_wallet';
  const totalBalance = user?.balance_points ?? 0;
  const vndBalance = (totalBalance * 1).toLocaleString();
  const systemFee = 0; // No fee as per user request

  const transactions = useMemo(() => {
    return realTransactions
      .filter(tx => {
        // If user is employer, hide 'RELEASE' and 'SYSTEM_FEE' related to milestone releases
        // because funds were already escrowed (deducted) at job creation.
        if (user?.role === 'employer' && (tx.type === 'RELEASE' || tx.type === 'SYSTEM_FEE')) return false;
        return true;
      })
      .map(tx => {
        const isIncoming = tx.amount > 0;
        
        // Better labels for reference types
        let displayTitle = tx.description;
        if (!displayTitle) {
          switch(tx.reference_type) {
            case 'ZALOPAY_DEPOSIT': displayTitle = t("wallet.deposit_zalopay"); break;
            case 'MOMO_DEPOSIT': displayTitle = t("wallet.deposit_momo"); break;
            case 'BANK_DEPOSIT': displayTitle = t("wallet.deposit_bank"); break;
            case 'ESCROW_DEDUCTION': displayTitle = t("wallet.escrow_deduction"); break;
            case 'ESCROW_REFUND': displayTitle = t("wallet.escrow_refund"); break;
            case 'RELEASE': displayTitle = t("wallet.milestone_payment"); break;
            case 'WITHDRAWAL': displayTitle = t("wallet.withdrawal"); break;
            default: displayTitle = tx.type === 'DEPOSIT' ? t("wallet.deposit") : t("wallet.transaction");
          }
        }

        return {
          id: tx.id,
          type: isIncoming ? 'incoming' : 'outgoing',
          title: displayTitle,
          date: new Date(tx.created_at).toLocaleString('vi-VN', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', ' •'),
          amount: `${isIncoming ? '+' : '-'} ${Math.abs(tx.amount).toLocaleString()} CRED`,
          status: tx.status,
          statusColor: tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'text-emerald-400' : tx.status === 'PENDING' ? 'text-amber-400' : 'text-slate-500',
          icon: isIncoming ? 'plus' : 'up',
          raw: tx
        };
      });
  }, [realTransactions, user, t]);
  const filteredTransactions = useMemo(() => {
    if (selectedTab === 'All') return transactions;
    return transactions.filter(t => t.type === selectedTab.toLowerCase());
  }, [selectedTab]);
  const copyWalletId = async () => {
    try {
      await navigator.clipboard.writeText(walletId);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = walletId;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };
  const getTransactionIcon = iconType => {
    switch (iconType) {
      case 'down':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>;
      case 'up':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>;
      case 'document':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>;
      case 'plus':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>;
      default:
        return null;
    }
  };
  return (
    <div className="w-full min-h-screen bg-transparent text-slate-300 relative font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 relative z-10 w-full">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center bg-cyan-900/40 border border-cyan-500/30 rounded-xl">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-widest font-mono text-shadow-glow-cyan">
              {t("wallet.title")}
            </h1>
            <p className="mt-1 text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase">
              {t("wallet.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Total Balance Card */}
                        <div className="rounded-2xl border p-8 bg-[#090e17]/80 backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]" style={{
            borderColor: 'rgba(6,182,212,0.3)'
          }}>
                            <div className="absolute top-0 right-10 w-32 h-px bg-cyan-400/50" />
                            <div className="absolute overflow-hidden inset-0 pointer-events-none bg-gradient-to-br from-cyan-900/10 to-indigo-900/10" />

                            <div className="flex flex-col md:flex-row md:items-start justify-between relative z-10 gap-6">
                                <div>
                                    <div className="text-[10px] font-black text-cyan-500 font-mono uppercase tracking-widest mb-3">{t("wallet.total_assets")}</div>
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2 font-mono tracking-tighter">
                                        {totalBalance.toLocaleString()} <span className="text-xl text-cyan-500 tracking-widest">CRED</span>
                                    </div>
                                    <div className="text-lg font-bold text-slate-400 font-mono">~ {vndBalance} VND</div>

                                    <div className="mt-8 flex flex-wrap items-center gap-4">
                                        <div className="bg-[#02040a] border border-slate-800 rounded px-4 py-2 flex items-center gap-3 w-max">
                                            <div>
                                                <div className="text-[9px] font-black text-slate-500 mb-1 font-mono uppercase tracking-widest">{t("wallet.wallet_id")}</div>
                                                <div className="text-[12px] font-mono font-bold text-slate-300">{walletId}</div>
                                            </div>
                                            <button onClick={copyWalletId} className="text-cyan-500 hover:text-cyan-400 transition-colors p-1.5 rounded hover:bg-cyan-900/30 active:scale-95" aria-label="Copy wallet ID" title={copied ? 'Copied!' : 'Copy wallet ID'}>
                                                {copied ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>}
                                            </button>
                                        </div>
                                        <span className="inline-flex items-center rounded bg-emerald-900/30 border border-emerald-500/30 px-3 py-1.5 text-[9px] font-black text-emerald-400 font-mono tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">{t("wallet.status_active")}</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col gap-3 shrink-0">
                                   <button onClick={() => document.getElementById('buy-points-section').scrollIntoView({
                  behavior: 'smooth'
                })} className="px-6 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-400 text-[10px] font-black font-mono tracking-widest uppercase rounded flex items-center gap-2 transition-colors">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>{t("wallet.deposit")}</button>
                                   <button onClick={() => document.getElementById('withdraw-section').scrollIntoView({
                  behavior: 'smooth'
                })} className="px-6 py-3 bg-[#02040a] hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black font-mono tracking-widest uppercase rounded flex items-center gap-2 transition-colors">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>{t("wallet.withdraw")}</button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="rounded-2xl border border-slate-800 bg-[#090e17] shadow-xl overflow-hidden relative">
                            <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-[12px] font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{t("wallet.history")}</h2>
                                
                                {/* Tabs */}
                                <div className="flex bg-[#02040a] p-1 rounded border border-slate-800 w-max">
                                    {['All', 'Incoming', 'Outgoing'].map(tab => <button key={tab} onClick={() => setSelectedTab(tab)} className={`px-4 py-1.5 rounded text-[10px] font-black font-mono transition-colors uppercase tracking-widest ${selectedTab === tab ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-slate-500 border border-transparent hover:text-slate-300'}`}>
                                            {tab === 'All' ? t("wallet.tab_all") : tab === 'Incoming' ? t("wallet.tab_incoming") : tab === 'Outgoing' ? t("wallet.tab_outgoing") : tab}
                                        </button>)}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Transactions List */}
                                <div className="space-y-4">
                                    {filteredTransactions.map(transaction => <div key={transaction.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-800 bg-[#02040a] p-5 hover:border-cyan-500/30 transition-colors relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 group-hover:bg-cyan-500/50 transition-colors" />
                                            
                                            <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded border ${transaction.icon === 'plus' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : transaction.type === 'incoming' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-900/20 text-amber-400 border-amber-500/30'}`}>
                                                {getTransactionIcon(transaction.icon)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="min-w-0 pr-4">
                                                    <div className="text-[12px] font-bold text-slate-200 truncate uppercase font-mono tracking-wider">
                                                        {transaction.title}
                                                    </div>
                                                    <div className="mt-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {transaction.date}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                                                    <div className={`text-lg font-black font-mono tracking-tighter ${transaction.type === 'incoming' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                        {transaction.amount}
                                                    </div>
                                                    <div className={`mt-0.5 text-[9px] font-black font-mono uppercase tracking-widest ${transaction.statusColor}`}>
                                                        [{transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED' ? t("dashboard.approved_jobs") : transaction.status === 'PENDING' ? t("auto.db_5fd9ac") : transaction.status === 'FAILED' ? t("dashboard.other") : transaction.status === 'PROCESSED' ? t("auto.db_2125c9") : transaction.status}]
                                                    </div>
                                                </div>
                                            </div>
                                        </div>)}
                                </div>

                                <div className="mt-6 text-center">
                                    <button className="text-[10px] font-black font-mono text-cyan-500 hover:text-cyan-400 uppercase tracking-widest items-center inline-flex gap-2 group">{t("wallet.view_all")}<svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Buy Points Card */}
                        <div id="buy-points-section" className="rounded-2xl bg-[#090e17] border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />
                            
                            <div className="px-6 py-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded border border-cyan-500/30 bg-cyan-900/20 text-cyan-400 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-[12px] font-black text-white font-mono uppercase tracking-widest">{t("wallet.top_up")}</h2>
                                </div>
                                <p className="mt-2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">{t("wallet.top_up_desc")}</p>
                            </div>
                            
                            <div className="px-6 py-5 space-y-5">
                                <div className="grid grid-cols-3 gap-3">
                                    {[{
                  id: 'Starter',
                  label: 'TIER_1',
                  points: '100000C'
                }, {
                  id: 'Pro',
                  label: 'TIER_2',
                  points: '500000C'
                }, {
                  id: 'Expert',
                  label: 'TIER_3',
                  points: '1000000C'
                }].map(pkg => <div key={pkg.id} className="relative">
                                            {pkg.id === 'Pro' && <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                                                    <span className="inline-flex rounded bg-cyan-500 px-1.5 py-0.5 text-[8px] font-black text-black font-mono tracking-widest">{t("auto.db_9a1367")}</span>
                                                </div>}
                                            <button onClick={() => setSelectedPackage(pkg.id)} className={`w-full rounded border px-2 py-3 text-center transition-colors relative overflow-hidden ${selectedPackage === pkg.id ? 'border-cyan-500 bg-cyan-900/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-800 bg-[#02040a] hover:border-slate-700'}`}>
                                                {selectedPackage === pkg.id && <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />}
                                                <div className={`text-[9px] font-black uppercase tracking-wider font-mono ${selectedPackage === pkg.id ? 'text-cyan-400' : 'text-slate-400'}`}>{pkg.label}</div>
                                                <div className={`mt-1.5 text-sm font-black font-mono ${selectedPackage === pkg.id ? 'text-white' : 'text-slate-300'}`}>{pkg.points}</div>
                                            </button>
                                        </div>)}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-cyan-500 mb-2 font-mono uppercase tracking-widest">{t("wallet.custom_amount")}</label>
                                    <div className="relative">
                                        <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="0" className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 pr-16 text-sm font-black font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-500 uppercase">CRED</span>
                                    </div>
                                </div>
                                <button onClick={() => {
                const packagePoints = {
                  'Starter': 100000,
                  'Pro': 500000,
                  'Expert': 1000000
                };
                const points = customAmount ? parseInt(customAmount) : packagePoints[selectedPackage] || 500;
                navigate('/deposit-points', {
                  state: {
                    points,
                    package: selectedPackage
                  }
                });
              }} className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-4 text-[11px] font-black text-white transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/50 uppercase tracking-widest font-mono flex items-center justify-center gap-2">{t("wallet.confirm_topup")}<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Integrated Withdrawal Form Card */}
                        <div id="withdraw-section" className="rounded-2xl bg-[#090e17] border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none" />
                            
                            <div className="px-6 py-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded border border-rose-500/30 bg-rose-900/20 text-rose-400 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-[12px] font-black text-white font-mono uppercase tracking-widest">{t("wallet.withdraw_request")}</h2>
                                </div>
                                <p className="mt-2 text-[10px] text-slate-500 font-mono tracking-widest uppercase">{t("wallet.withdraw_desc")}</p>
                            </div>
                            
                            <div className="px-6 py-5 space-y-5">
                                {/* Method Selection */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setTransferMethod('momo')} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${transferMethod === 'momo' ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 'bg-[#02040a] border-slate-800 hover:border-slate-700'}`}>
                                        <div className="w-6 h-6 rounded bg-[#a50064] flex items-center justify-center p-1 ring-1 ring-white/10">
                                            <svg viewBox="0 0 512 512" className="w-full h-full fill-white"><path d="M439.8 48H72.2C58.8 48 48 58.8 48 72.2v367.6C48 453.2 58.8 464 72.2 464h367.6c13.3 0 24.2-10.8 24.2-24.2V72.2C464 58.8 453.2 48 439.8 48zM315.6 348.8c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6zm-119.2 0c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6z" /></svg>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${transferMethod === 'momo' ? 'text-rose-400' : 'text-slate-500'}`}>Momo</span>
                                    </button>
                                    <button onClick={() => setTransferMethod('atm')} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${transferMethod === 'atm' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-[#02040a] border-slate-800 hover:border-slate-700'}`}>
                                        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center ring-1 ring-white/10">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${transferMethod === 'atm' ? 'text-indigo-400' : 'text-slate-500'}`}>ATM / Bank</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t("wallet.withdraw_amount")}</label>
                                        <div className="relative">
                                            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={t("wallet.min_withdraw")} className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 text-sm font-black font-mono text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-800" />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-600">CRED</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t("wallet.phone")} {transferMethod === 'momo' ? 'MOMO' : ''}</label>
                                        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="09xx xxx xxx" className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-800" />
                                    </div>

                                    {transferMethod === 'atm' && <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t("wallet.bank_account")}</label>
                                                    <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="0000 0000 0000" className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500/50" />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t("wallet.bank")}</label>
                                                    <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 text-[10px] font-black font-mono text-slate-300 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer">
                                                        <option value="" disabled>-- SELECT --</option>
                                                        <option value="Vietcombank">VIETCOMBANK</option>
                                                        <option value="MBBank">MB BANK</option>
                                                        <option value="Techcombank">TECHCOMBANK</option>
                                                        <option value="TPBank">TP BANK</option>
                                                        <option value="Viettinbank">VIETTINBANK</option>
                                                        <option value="Agribank">AGRIBANK</option>
                                                        <option value="VPBank">VPBANK</option>
                                                        <option value="ACB">ACB</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t("wallet.holder")}</label>
                                                <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="NGUYEN VAN A" className="w-full rounded-lg border border-slate-700 bg-[#02040a] px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 uppercase placeholder-slate-800" />
                                            </div>
                                        </div>}
                                </div>

                                <div className="flex items-center justify-between rounded bg-[#02040a] border border-slate-800 px-4 py-3 font-mono">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t("wallet.fee")}</span>
                                    <span className="text-[10px] font-black text-white">{systemFee.toLocaleString()} CRED</span>
                                </div>

                                <button onClick={handleWithdraw} disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) < 10} className="w-full rounded-lg bg-gradient-to-r from-rose-700 to-indigo-700 hover:from-rose-600 hover:to-indigo-600 px-4 py-4 text-[11px] font-black text-white transition-colors shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-400/50 uppercase tracking-widest font-mono flex items-center justify-center gap-2 disabled:opacity-30">
                                    {isWithdrawing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>{t("wallet.confirm_withdraw")}<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                        </>}
                                </button>
                                
                                <p className="text-[8px] text-center text-slate-600 font-mono tracking-widest uppercase">{t("wallet.processing_time")}</p>
                            </div>
                        </div>

                        {/* Need Help Section */}
                        <div className="rounded-xl border border-slate-800 bg-[#090e17] p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-900 group-hover:bg-cyan-500 transition-colors" />
                            <div className="flex flex-col gap-3 relative z-10 pl-2">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <div className="text-[11px] font-black text-white font-mono uppercase tracking-widest">{t("wallet.help")}</div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase leading-relaxed">{t("wallet.help_desc")}</p>
                                <button className="text-[10px] font-black font-mono text-cyan-500 hover:text-cyan-400 uppercase tracking-widest self-start mt-2 border-b border-cyan-500/30 hover:border-cyan-400 pb-0.5 transition-colors">{t("wallet.submit_support")}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Minimal styling for custom scrollbars missing from utility class */}
            <style jsx="true">{`
              select {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                background-position: right 0.5rem center;
                background-repeat: no-repeat;
                background-size: 1.5em 1.5em;
              }
            `}</style>
        </div>
    );
};
export default Wallet;