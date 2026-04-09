import { useTranslation } from 'react-i18next';
import React, { useRef, useState, useEffect } from 'react';
const TermsOfServiceModal = ({
  isOpen,
  onClose,
  onReadComplete
}) => {
  const {
    t
  } = useTranslation();
  const scrollRef = useRef(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setHasReachedBottom(false);
    }
  }, [isOpen]);
  const handleScroll = () => {
    if (scrollRef.current) {
      const {
        scrollTop,
        scrollHeight,
        clientHeight
      } = scrollRef.current;
      // Use a small buffer (5px) to account for rounding errors
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setHasReachedBottom(true);
      }
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-slate-900/50 border border-purple-500/30 rounded-3xl p-1 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-slate-950/80 rounded-[22px] p-6 sm:p-8 overflow-hidden relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]"></div>
                            <h2 className="text-xs font-black font-mono tracking-[0.3em] text-white uppercase">
                                SYSTEM_PROTOCOL :: TERMS_AND_PRIVACY
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div ref={scrollRef} onScroll={handleScroll} className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar text-slate-300 font-mono text-xs leading-relaxed space-y-8">
                        <section>
                            <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
                                <span className="opacity-50">01_</span>{t("auto.db_204a6b")}</h3>
                            <div className="space-y-4 opacity-80">
                                <p>{t("auto.db_8bf096")}</p>
                                <p>{t("auto.db_778a9f")}</p>
                                <p>{t("auto.db_e06d39")}</p>
                                <p>{t("auto.db_ecc5c1")}</p>
                                <p>{t("auto.db_df0006")}</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                                <span className="opacity-50">02_</span>{t("auto.db_fc690a")}</h3>
                            <div className="space-y-4 opacity-80">
                                <p>{t("auto.db_f1658f")}</p>
                                <p>{t("auto.db_9de6e9")}</p>
                                <p>{t("auto.db_462100")}</p>
                                <p>{t("auto.db_334cf8")}</p>
                                <p>{t("auto.db_0b8c86")}</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                                <span className="opacity-50">03_</span>{t("auto.db_5bc7f8")}</h3>
                            <div className="space-y-4 opacity-80">
                                <p>{t("auto.db_99fb8a")}</p>
                                <p className="text-[10px] text-slate-500 italic mt-8 border-t border-white/5 pt-4">LAST_UPDATE :: 2026.03.23.1044</p>
                            </div>
                        </section>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-8 border-t border-white/10 pt-6 flex flex-col items-center gap-4">
                        {!hasReachedBottom ? <div className="flex items-center gap-2 text-[10px] text-purple-400 animate-pulse font-bold tracking-widest uppercase">
                                <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>{t("auto.db_f5c13b")}</div> : <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t("auto.db_e11b5e")}</div>}

                        <button disabled={!hasReachedBottom} onClick={() => {
            onReadComplete();
            onClose();
          }} className={`w-full py-4 rounded-xl font-mono font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${hasReachedBottom ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-purple-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 opacity-50'}`}>
                            {hasReachedBottom && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>}
                            <span className="relative z-10">{t("auto.db_1e5e79")}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>;
};
export default TermsOfServiceModal;