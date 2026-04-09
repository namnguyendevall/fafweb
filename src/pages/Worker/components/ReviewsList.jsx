import React from 'react';
import { useTranslation } from 'react-i18next';

const ReviewsList = ({ data }) => {
    const reviews = data?.reviews || [];
    
    // Fallback summary calculation if missing or showing 0 but reviews exist
    const calculatedSummary = React.useMemo(() => {
        if (data?.summary && data.summary.total_reviews > 0) return data.summary;
        
        if (reviews.length > 0) {
            const total = reviews.length;
            const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
            return {
                average_rating: sum / total,
                total_reviews: total
            };
        }
        return { average_rating: 0, total_reviews: 0 };
    }, [data, reviews]);

    const { t } = useTranslation();
    
    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400 text-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{star <= Math.round(rating) ? '★' : '☆'}</span>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-[#02040a]/40 rounded-xl border border-slate-800/50 p-6 shadow-sm">
            <h2 className="text-sm font-black text-white font-mono uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">{t('dashboard.reviews.title')}</h2>

            {calculatedSummary.total_reviews > 0 && (
                <div className="mb-6 flex items-center justify-center p-4 bg-[#090e17] border border-slate-800 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="text-center">
                        <span className="text-4xl font-black text-cyan-400 font-mono drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{Number(calculatedSummary.average_rating || 0).toFixed(1)}</span>
                        <div className="mt-2 flex justify-center text-lg">{renderStars(calculatedSummary.average_rating)}</div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-2 block">{calculatedSummary.total_reviews} {t('dashboard.reviews.reviews_count')}</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-8 bg-[#090e17] border border-slate-800 rounded-xl border-dashed">
                        <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest italic">{t('dashboard.reviews.no_reviews')}</p>
                    </div>
                ) : (
                    reviews.map(review => {
                        // Better name display fallback
                        const displayName = review.reviewer_name || 
                                          (review.reviewer_email ? review.reviewer_email.split('@')[0] : null) || 
                                          t('dashboard.reviews.anonymous');
                                          
                        return (
                            <div key={review.id} className="bg-[#090e17] border border-slate-800/80 rounded-xl p-5 hover:border-cyan-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-[13px] text-slate-200 uppercase tracking-wider truncate">{displayName}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">
                                            <span className="text-cyan-500 mr-2">SYS.LOG:</span>
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="shrink-0 bg-[#02040a] px-2 py-1 rounded border border-slate-700/50">{renderStars(review.rating)}</div>
                                </div>
                                
                                <div className="pl-3 border-l-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors">
                                    <p className="text-[13px] text-slate-400 leading-relaxed italic">"{review.comment || t('dashboard.reviews.no_comment')}"</p>
                                </div>
                                
                                {review.skillRatings && review.skillRatings.length > 0 && (
                                    <div className="mt-4 flex gap-2 flex-wrap pt-3 border-t border-slate-800/50">
                                        {review.skillRatings.map(sr => (
                                            <span key={sr.id || sr.skill_id} className="inline-flex items-center gap-1.5 text-[9px] uppercase font-black bg-slate-800/50 text-slate-300 border border-slate-700 px-2.5 py-1 rounded font-mono tracking-widest">
                                                <span className="text-emerald-400">{sr.skill_name}</span>
                                                <span className="text-yellow-500">{sr.rating}★</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ReviewsList;
