import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../../api/wallet.api'
import { useToast } from '../../contexts/ToastContext'

const Withdrawpoint = () => {
    const navigate = useNavigate()
    const toast = useToast()
    
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
        } finally {
            setFetchingBalance(false)
        }
    }

    const systemFee = 2500 // Fixed fee in CRED
    const amountNum = Number(withdrawalAmount) || 0

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
            toast.error("Vui lòng nhập số điện thoại liên hệ")
            return
        }

        if (transferMethod === 'atm') {
            if (!bankName || !accountNumber || !accountHolder) {
                toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng")
                return
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
        <div className="w-full min-h-screen bg-[#020617] text-slate-300 flex flex-col font-sans py-12 px-4">
            <div className="mx-auto max-w-xl w-full">
                {/* Main Card */}
                <div className="relative bg-[#0b1120] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
                    {/* Header Section */}
                    <div className="flex items-center gap-5 mb-10">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center p-3">
                            <svg className="w-full h-full text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-widest uppercase mb-1">YÊU CẦU RÚT TIỀN</h1>
                            <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Rút tiền qua MoMo hoặc ATM</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Balance Display */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SỐ DƯ KHẢ DỤNG</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                                    {fetchingBalance ? '...' : availableBalance.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-black text-slate-500 uppercase">CRED</span>
                            </div>
                        </div>

                        {/* Method Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setTransferMethod('momo')}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${transferMethod === 'momo' ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#a50064] flex items-center justify-center p-1.5 ring-1 ring-white/10">
                                    <svg viewBox="0 0 512 512" className="w-full h-full fill-white"><path d="M439.8 48H72.2C58.8 48 48 58.8 48 72.2v367.6C48 453.2 58.8 464 72.2 464h367.6c13.3 0 24.2-10.8 24.2-24.2V72.2C464 58.8 453.2 48 439.8 48zM315.6 348.8c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6zm-119.2 0c-23 0-41.6-18.6-41.6-41.6 0-23 18.6-41.6 41.6-41.6s41.6 18.6 41.6 41.6c0 23-18.6 41.6-41.6 41.6z"/></svg>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${transferMethod === 'momo' ? 'text-rose-400' : 'text-slate-500'}`}>Momo</span>
                            </button>
                            <button
                                onClick={() => setTransferMethod('atm')}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${transferMethod === 'atm' ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center ring-1 ring-white/10">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${transferMethod === 'atm' ? 'text-indigo-400' : 'text-slate-500'}`}>ATM / Bank</span>
                            </button>
                        </div>

                        {/* Common Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">SỐ TIỀN RÚT</label>
                                <input
                                    type="number"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    placeholder="TỐI THIỂU: 10,000 CRED"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-lg font-black text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">SỐ ĐIỆN THOẠI {transferMethod === 'momo' ? 'MOMO' : 'LIÊN HỆ'}</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="09xx xxx xxx"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-white/10"
                                />
                            </div>
                        </div>

                        {/* ATM Conditional Fields */}
                        {transferMethod === 'atm' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">STK NGÂN HÀNG</label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            placeholder="Số tài khoản"
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">NGÂN HÀNG</label>
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
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">TÊN CHỦ THẺ (KHÔNG DẤU)</label>
                                    <input
                                        type="text"
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                        placeholder="NGUYEN VAN A"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-indigo-500/50 uppercase placeholder-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Withdraw Button */}
                        <button
                            onClick={handleWithdraw}
                            disabled={loading || !withdrawalAmount || amountNum < 10000}
                            className="w-full relative group h-16 rounded-2xl overflow-hidden disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600" />
                            <div className="relative flex items-center justify-center gap-3 text-xs font-black text-white tracking-[0.3em] uppercase">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        XÁC NHẬN RÚT TIỀN <span className="text-lg">»</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    QUAY LẠI VÍ
                </button>
            </div>
        </div>
    )
}

export default Withdrawpoint
