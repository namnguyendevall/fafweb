import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../../api/wallet.api'
import { useToast } from '../../contexts/ToastContext'

const Withdrawpoint = () => {
    const navigate = useNavigate()
    const toast = useToast()
    const [withdrawalAmount, setWithdrawalAmount] = useState('')
    const [selectedBank, setSelectedBank] = useState('8821') // Pre-select standard option for mockup style
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

    const systemFeeFeeUSD = 2.50 // As per screenshot
    const systemFeeInCRED = 2500 // Assuming 1 USD roughly 1000 CRED or fixed for FAF context
    const amountNum = Number(withdrawalAmount) || 0

    const handleWithdraw = async () => {
        if (amountNum < 100) {
            toast.error("Số tiền rút tối thiểu là 100 CRED")
            return
        }
        if (amountNum > availableBalance) {
            toast.error("Số dư không đủ")
            return
        }

        const bankInfo = {
            method: 'atm',
            accountNumber: '**** 8821',
            bankName: 'MB BANK', 
            accountHolder: 'USER_1' // Mocking for now as per simplified design
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
            <div className="mx-auto max-w-lg w-full">
                {/* Main Card */}
                <div className="relative bg-[#0b1120] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
                    {/* Header Section */}
                    <div className="flex items-center gap-5 mb-12">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center p-3">
                            <svg className="w-full h-full text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-widest uppercase mb-1">YÊU CẦU RÚT TIỀN</h1>
                            <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Rút tiền ra ngân hàng ngoài</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Balance Display */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">SỐ DƯ KHẢ DỤNG</label>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-rose-400 font-mono tracking-tight">
                                        {fetchingBalance ? '...' : availableBalance.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CRED</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">SỐ TIỀN RÚT</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    placeholder="TỐI THIỂU: 100 CRED"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 py-6 text-center text-lg font-black text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-white/10 uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        {/* Bank Selection */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">CHỌN NGÂN HÀNG</label>
                            <div className="relative group">
                                <div className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 py-5 flex items-center justify-between cursor-pointer hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-white tracking-widest uppercase">NGÂN HÀNG [ **** 8821 ]</span>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Fee Display */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl px-8 py-5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">PHÍ GIAO DỊCH</span>
                            <span className="text-sm font-black text-white font-mono">$2.50 USD</span>
                        </div>

                        {/* Withdraw Button */}
                        <button
                            onClick={handleWithdraw}
                            disabled={loading || !withdrawalAmount || amountNum < 100}
                            className="w-full relative group h-16 rounded-2xl overflow-hidden disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                    QUAY LẠI
                </button>
            </div>
        </div>
    )
}

export default Withdrawpoint
