import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { walletApi } from '../../api/wallet.api';
const DepositResult = () => {
  const {
    t
  } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState(t("auto.db_a89c44"));
  const [credited, setCredited] = useState(false);
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);

    // ZaloPay params
    const appTransId = queryParams.get('apptransid');

    // MoMo params
    const orderId = queryParams.get('orderId');
    const resultCode = queryParams.get('resultCode');
    console.log('Payment Redirect Params:', Object.fromEntries(queryParams.entries()));
    const verifyPayment = async (id, method) => {
      try {
        const res = await walletApi.checkStatus(id, method);
        if (res.status === 'done' || res.data?.status === 'done') {
          setStatus('success');
          setMessage(t("auto.db_148de5"));
        } else {
          setStatus('error');
          setMessage(t("auto.db_c6b5a1"));
        }
      } catch (err) {
        console.error('Verify payment error:', err);
        setStatus('error');
        setMessage(t("auto.db_efbff3"));
      }
    };
    if (appTransId) {
      verifyPayment(appTransId, 'zalopay');
    } else if (orderId) {
      if (resultCode === '0') {
        verifyPayment(orderId, 'momo');
      } else {
        setStatus('error');
        setMessage(t("auto.db_896cee"));
      }
    } else {
      setStatus('error');
      setMessage(t("auto.db_c3392b"));
    }
  }, [location]);
  return <div className="w-full min-h-[80vh] bg-transparent text-slate-300 relative font-sans flex items-center justify-center p-4">
            <div className="rounded-2xl border p-8 bg-[#090e17]/80 backdrop-blur-md relative overflow-hidden max-w-md w-full text-center" style={{
      borderColor: status === 'processing' ? 'rgba(56,189,248,0.3)' : status === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'
    }}>
                {status === 'processing' ? <div className="mb-6 mx-auto h-20 w-20 flex items-center justify-center bg-cyan-900/40 border border-cyan-500/50 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                         <svg className="w-10 h-10 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                     </div> : status === 'success' ? <div className="mb-6 mx-auto h-20 w-20 flex items-center justify-center bg-emerald-900/40 border border-emerald-500/50 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                         <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                     </div> : <div className="mb-6 mx-auto h-20 w-20 flex items-center justify-center bg-rose-900/40 border border-rose-500/50 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                         <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </div>}
                
                <h1 className={`text-2xl font-black uppercase tracking-widest font-mono mb-2 ${status === 'processing' ? 'text-cyan-400 text-shadow-glow-cyan' : status === 'success' ? 'text-emerald-400 text-shadow-glow-emerald' : 'text-rose-400 text-shadow-glow-rose'}`}>
                    {status === 'processing' ? t("auto.db_368e59") : status === 'success' ? t("auto.db_878f7f") : t("auto.db_91ec09")}
                </h1>
                
                <p className="text-sm text-slate-400 font-mono tracking-wide mb-8">
                    {message}
                </p>
                
                {status !== 'processing' && <button onClick={() => navigate('/wallet')} className="w-full px-6 py-4 bg-[#02040a] hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-black font-mono tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>{t("auto.db_e94e70")}</button>}
            </div>
        </div>;
};
export default DepositResult;