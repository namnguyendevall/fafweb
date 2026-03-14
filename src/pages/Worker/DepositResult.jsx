import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const DepositResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const [credited, setCredited] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        
        const returnCode = queryParams.get('returncode');
        const statusParam = queryParams.get('status');
        const zptransid = queryParams.get('zptransid') || queryParams.get('zaptransid') || queryParams.get('apptransid');
        const amountVnd = queryParams.get('amount');
        
        // MoMo redirect params: resultCode=0 means success
        const momoResultCode = queryParams.get('resultCode');
        
        const zalopayMessage = queryParams.get('returnmessage');
        const momoMessage = queryParams.get('message');

        console.log('Payment Redirect Params:', Object.fromEntries(queryParams.entries()));
        
        const isZaloPaySuccess = returnCode === '1' || statusParam === '1';
        const isMoMoSuccess = momoResultCode === '0';
        
        if (isZaloPaySuccess || isMoMoSuccess) {
            setStatus('success');
            setMessage(zalopayMessage || momoMessage || 'Giao dịch nạp điểm thành công!');
            
            // For ZaloPay: call credit-redirect endpoint to add points
            if (isZaloPaySuccess && zptransid && !credited) {
                const amount = parseInt(amountVnd, 10) || 0;
                console.log(`Attempting to credit points: amount=${amount}, transId=${zptransid}`);
                
                if (amount > 0) {
                    setCredited(true);
                    axiosClient.post('/wallets/deposit/zalopay/credit-redirect', {
                        amount: amount,
                        zptransid: zptransid
                    }).then(res => {
                        console.log('Credit result success:', res.data);
                    }).catch(err => {
                        console.error('Credit after redirect error:', err?.response?.data || err.message);
                    });
                } else {
                    console.warn('Cannot credit: amount is 0 or invalid', amountVnd);
                }
            }
        } else {
            setStatus('error');
            setMessage(zalopayMessage || momoMessage || 'Giao dịch nạp điểm thất bại hoặc đã bị hủy từ hệ thống ngân hàng.');
        }
    }, [location]);

    return (
        <div className="w-full min-h-[80vh] bg-transparent text-slate-300 relative font-sans flex items-center justify-center p-4">
            <div className="rounded-2xl border p-8 bg-[#090e17]/80 backdrop-blur-md relative overflow-hidden max-w-md w-full text-center" style={{ borderColor: status === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)' }}>
                {status === 'success' ? (
                     <div className="mb-6 mx-auto h-20 w-20 flex items-center justify-center bg-emerald-900/40 border border-emerald-500/50 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                         <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                     </div>
                ) : (
                     <div className="mb-6 mx-auto h-20 w-20 flex items-center justify-center bg-rose-900/40 border border-rose-500/50 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                         <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </div>
                )}
                
                <h1 className={`text-2xl font-black uppercase tracking-widest font-mono mb-2 ${status === 'success' ? 'text-emerald-400 text-shadow-glow-emerald' : 'text-rose-400 text-shadow-glow-rose'}`}>
                    {status === 'success' ? 'NẠP TIỀN THÀNH CÔNG' : 'GIAO DỊCH THẤT BẠI'}
                </h1>
                
                <p className="text-sm text-slate-400 font-mono tracking-wide mb-8">
                    {message}
                </p>
                
                <button
                     onClick={() => navigate('/wallet')}
                     className="w-full px-6 py-4 bg-[#02040a] hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-black font-mono tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     QUAY LẠI VÍ
                </button>
            </div>
        </div>
    );
};

export default DepositResult;
