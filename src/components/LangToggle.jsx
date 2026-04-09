import React from 'react';
import { useTranslation } from 'react-i18next';

const LangToggle = ({ className = "" }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language || localStorage.getItem('lang') || 'vi';

    const toggleLang = () => {
        const nextLang = lang === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(nextLang);
        localStorage.setItem('lang', nextLang);
    };

    return (
        <button 
            onClick={toggleLang} 
            title={lang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'} 
            className={`w-10 h-10 flex items-center justify-center rounded bg-black/40 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-mono text-xs font-black transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] ${className}`}
        >
            {lang.toUpperCase()}
        </button>
    );
};

export default LangToggle;
