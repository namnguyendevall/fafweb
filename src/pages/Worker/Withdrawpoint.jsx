import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../../api/wallet.api'
import { toast } from 'react-hot-toast'

const Withdrawpoint = () => {
    const navigate = useNavigate()
    const [withdrawalAmount, setWithdrawalAmount] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [transferMethod, setTransferMethod] = useState('momo') // 'momo' or 'atm'
    
    // ATM specific fields
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [accountHolder, setAccountHolder] = useState('')

    const [availableBalance, setAvailableBalance] = useState(0)
    const [loading, setLoading] = useState(false)
    const [fetchingBalance, setFetchingBalance] = useState(true)

    useEffect(() => {
        fetchBalance()
    }, [])

    const fetchBalance = async () => {
        try {
            const res = await walletApi.getWallet()
            if (res.data) {
                setAvailableBalance(Number(res.data.balance_points) || 0)
            }
        } catch (error) {
            console.error("Fetch balance error:", error)
            toast.error("Không thể lấy số dư ví")
        } finally {
            setFetchingBalance(false)
        }
    }

    const systemFeePercent = 0 // User image shows $2.50 flat or something, but let's stick to simple for now or follow user instructions. 
    // Actually user image shows "Phí giao dịch $2.50 USD". But our backend might not handle fees yet.
    // I'll leave it as 0 or 2500 CRED as a constant if desired.
    const systemFee = 2500 
    const amountNum = Number(withdrawalAmount) || 0
    const netReceive = Math.max(0, amountNum - systemFee)

    const handleMaxClick = () => {
        setWithdrawalAmount(availableBalance.toString())
    }

    const handleWithdraw = async () => {
        if (amountNum < 10000) {
            toast.error("Số tiền rút tối thiểu là 10,000 CRED")
            return
        }
        if (amountNum > availableBalance) {
            toast.error("Số dư không đủ")
            return
        }
        if (!phoneNumber) {
            toast.error("Vui lòng nhập số điện thoại")
            return
        }

        const bankInfo = {
            method: transferMethod,
            phone: phoneNumber,
            ...(transferMethod === 'atm' && {
                bankName,
                accountNumber,
                accountHolder: accountHolder.toUpperCase()
            })
        }

        setLoading(true)
        try {
            await walletApi.requestWithdrawal({
                amount: amountNum,
                bank_info: bankInfo
            })
            toast.success("Yêu cầu rút tiền đã được gửi!")
            setTimeout(() => navigate('/wallet'), 2000)
        } catch (error) {
            console.error("Withdraw error:", error)
            toast.error(error.response?.data?.message || "Rút tiền thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-300 flex flex-col font-sans py-12 px-4 selection:bg-rose-500/30">
            <div className="mx-auto max-w-2xl w-full">
                {/* Header Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="group mb-8 flex items-center gap-2 text-[10px] font-black font-mono text-cyan-500 uppercase tracking-[0.2em] transition-all hover:text-cyan-400"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    QUAY LẠI VÍ
                </button>

                {/* Main Card */}
                <div className="relative group/card">
                    {/* Decorative Background Elements */}
                    <div className="absolute -inset-px bg-gradient-to-br from-rose-500/20 via-transparent to-indigo-500/20 rounded-3xl blur-sm transition-opacity group-hover/card:opacity-100 opacity-50" />
                    
                    <div className="relative bg-[#0b1120] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
                        {/* Cyber Accents */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-[50px] -mr-8 -mt-8" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -ml-12 -mb-12" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

                        {/* Title Section */}
                        <div className="flex items-center gap-6 mb-10">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)] ring-1 ring-white/20">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-widest uppercase">YÊU CẦU RÚT TIỀN</h1>
                                <p className="text-[10px] font-bold text-rose-500/70 tracking-[0.3em] uppercase mt-1">Rút tiền ra ngân hàng ngoài</p>
                            </div>
                        </div>

                        {/* Balance Display */}
                        <div className="mb-10 p-6 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase mb-1 block">SỐ DƯ KHẢ DỤNG</span>
                                <div className="text-3xl font-black text-white font-mono tracking-tight">
                                    {fetchingBalance ? '---' : availableBalance.toLocaleString()} <span className="text-xs text-slate-500">CRED</span>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="space-y-8">
                            {/* Amount Input */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">SỐ TIỀN RÚT</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={withdrawalAmount}
                                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-white focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder-white/5"
                                    />
                                    <button 
                                        onClick={handleMaxClick}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all uppercase"
                                    >
                                        Tối đa
                                    </button>
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">SỐ ĐIỆN THOẠI LIÊN HỆ</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="09xx xxx xxx"
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder-white/5"
                                />
                            </div>

                            {/* Method Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">HÌNH THỨC CHUYỂN</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTransferMethod('momo')}
                                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${transferMethod === 'momo' ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#a50064] flex items-center justify-center p-1.5 ring-1 ring-white/10">
                                            <svg viewBox="0 0 512 512" className="w-full h-full fill-white"><path d="M439.8 48H72.2C58.8 48 48 58.8 48 72.2v367.6C48 453.2 58.8 464 72.2 464h367.6c13.3 0 24.2-10.8 24.2-24.2V72.2C464 58.8 453.2 48 439.8 48zM315.6 348.8c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6zm-119.2 0c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6z"/></svg>
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${transferMethod === 'momo' ? 'text-rose-400' : 'text-slate-500'}`}>Momo</span>
                                    </button>
                                    <button
                                        onClick={() => setTransferMethod('atm')}
                                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${transferMethod === 'atm' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center ring-1 ring-white/10">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${transferMethod === 'atm' ? 'text-indigo-400' : 'text-slate-500'}`}>ATM / Bank</span>
                                    </button>
                                </div>
                            </div>

                            {/* ATM Conditional Fields */}
                            {transferMethod === 'atm' && (
                                <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">STK NGÂN HÀNG</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="Ví dụ: 039882xxxx"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">NGÂN HÀNG</label>
                                            <select
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>-- Chọn --</option>
                                                <option value="Vietcombank">Vietcombank</option>
                                                <option value="MBBank">MB Bank</option>
                                                <option value="Techcombank">Techcombank</option>
                                                <option value="TPBank">TP Bank</option>
                                                <option value="Viettinbank">Viettinbank</option>
                                                <option value="Agribank">Agribank</option>
                                                <option value="VPBank">VPBank</option>
                                                <option value="ACB">ACB</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">TÊN CHỦ THẺ (KHÔNG DẤU)</label>
                                        <input
                                            type="text"
                                            value={accountHolder}
                                            onChange={(e) => setAccountHolder(e.target.value)}
                                            placeholder="NGUYEN VAN A"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 uppercase"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Summary & Button */}
                            <div className="pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center mb-6 px-1">
                                    <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">Phí giao dịch cố định</span>
                                    <span className="text-sm font-bold text-slate-300 font-mono">{systemFee.toLocaleString()} CRED</span>
                                </div>
                                
                                <button
                                    onClick={handleWithdraw}
                                    disabled={loading || !withdrawalAmount || amountNum > availableBalance}
                                    className="w-full relative group/btn h-16 rounded-2xl overflow-hidden disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-[1.01]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 animate-gradient" />
                                    <div className="absolute inset-px bg-black group-hover/btn:bg-transparent rounded-[15px] transition-colors" />
                                    <div className="relative flex items-center justify-center gap-3 text-[11px] font-black text-white tracking-[0.3em] uppercase">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                XÁC NHẬN RÚT TIỀN <span className="text-xs">»</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                                
                                <p className="text-center mt-6 text-[9px] font-bold text-slate-500 tracking-widest uppercase leading-relaxed">
                                    Thời gian xử lý dự kiến: <span className="text-cyan-500">24h - 48h</span> làm việc
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s infinite linear;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    )
}

export default Withdrawpoint
