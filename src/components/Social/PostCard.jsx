import React, { useState, useRef, useEffect } from 'react';
import { postsApi } from '../../api/posts.api';
import CommentSection from './CommentSection';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';

/* ── Confirm Deletion Modal ── */
const ConfirmModal = ({ onConfirm, onCancel, postContent }) => (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
        <div className="w-full max-w-[380px] rounded-2xl border overflow-hidden animate-[modalPop_.22s_cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(239,68,68,0.3)' }}>
            {/* Top neon line – red */}
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent pointer-events-none" />

            <div className="p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </div>

                <p className="text-[9px] font-black tracking-widest text-red-400 uppercase font-mono text-center mb-1">// WARNING</p>
                <h3 className="text-[15px] font-black text-white text-center mb-2 uppercase tracking-wide">Delete Post?</h3>
                <p className="text-[12px] text-slate-400 text-center font-mono mb-4 leading-relaxed">
                    This action is <span className="text-red-400 font-black">permanent</span> and cannot be undone.
                </p>

                {postContent && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2 mb-4">
                        <p className="text-[11px] text-slate-500 font-mono line-clamp-2">
                            {postContent.substring(0, 80)}{postContent.length > 80 ? '...' : ''}
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all">
                        CANCEL
                    </button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white border border-red-500/40 shadow-lg shadow-red-500/20 transition-all">
                        🗑 DELETE
                    </button>
                </div>
            </div>
        </div>
    </div>
);

/* ── Edit Modal ── */
const EditModal = ({ post, onClose, onUpdated }) => {
    const [content, setContent] = useState(post.content || '');
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const handleSave = async () => {
        if (!content.trim()) return;
        try {
            setSaving(true);
            const res = await postsApi.updatePost(post.id, { content });
            toast.success('Post updated!');
            onUpdated({ ...post, content: res.data?.data?.content || content });
            onClose();
        } catch {
            toast.error('Failed to update post');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-[500px] rounded-2xl border overflow-hidden animate-[modalPop_.22s_cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ background: 'linear-gradient(145deg,#0d1224,#0f172a)', borderColor: 'rgba(6,182,212,0.25)' }}>
                {/* Top neon line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/80" />
                        <span className="text-[12px] font-black tracking-widest text-white font-mono uppercase">// EDIT POST</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/40 flex items-center justify-center transition-all group">
                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        className="w-full resize-none rounded-xl border px-4 py-3 text-[14px] leading-relaxed focus:outline-none font-mono"
                        style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(6,182,212,0.15)', color: '#e2e8f0', caretColor: '#06b6d4' }}
                        placeholder="Edit your post..."
                        autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                        <button onClick={onClose}
                            className="flex-1 py-2 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono border border-slate-600/40 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all">
                            CANCEL
                        </button>
                        <button onClick={handleSave} disabled={!content.trim() || saving}
                            className={`flex-1 py-2 rounded-xl font-black text-[11px] tracking-widest uppercase font-mono transition-all ${
                                !content.trim() || saving
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-500/40'
                            }`}>
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3 h-3 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                                    SAVING...
                                </span>
                            ) : '► SAVE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════
   MAIN POST CARD
═══════════════════════════════ */
const PostCard = ({ post: initialPost, onLikeToggle, onDeleted }) => {
    const { user: currentUser } = useAuth();
    const toast = useToast();
    const [post, setPost] = useState(initialPost);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(post.is_liked_by_me);
    const [likesCount, setLikesCount] = useState(Number(post.likes_count));
    const [commentsCount] = useState(Number(post.comments_count));
    const [likeLoading, setLikeLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const menuRef = useRef(null);

    const isOwner = currentUser && currentUser.id === post.user_id;

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
        return `${backendRoot}${url}`;
    };

    const isVideoUrl = (url) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.mkv');
    };

    // close menu on outside click
    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
        if (showMenu) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const handleLike = async () => {
        try {
            setLikeLoading(true);
            const res = await postsApi.toggleLike(post.id);
            const liked = res.data?.liked;
            setIsLiked(liked);
            setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
            if (onLikeToggle) onLikeToggle(post.id, liked);
        } catch { console.error('Like failed'); }
        finally { setLikeLoading(false); }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await postsApi.deletePost(post.id);
            toast.success('Post deleted');
            if (onDeleted) onDeleted(post.id);
        } catch {
            toast.error('Failed to delete post');
            setDeleting(false);
        }
    };

    if (deleting) return null;

    const roleColors = {
        worker: {
            glow: 'neon-border-cyan',
            text: 'text-cyan-400',
            border: 'border-cyan-500/30',
            bg: 'bg-cyan-500/5',
            accent: 'cyan'
        },
        employer: {
            glow: 'neon-border-purple',
            text: 'text-purple-400',
            border: 'border-purple-500/30',
            bg: 'bg-purple-500/5',
            accent: 'purple'
        },
        manager: {
            glow: 'neon-border-emerald',
            text: 'text-emerald-400',
            border: 'border-emerald-500/30',
            bg: 'bg-emerald-500/5',
            accent: 'emerald'
        }
    };
    const c = roleColors[post.author_role] || roleColors.worker;

    return (
        <>
            <div className={`relative rounded-2xl border ${c.border} bg-slate-900/40 backdrop-blur-md p-0 mb-6 group transition-all duration-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.1)] overflow-hidden`}>
                {/* Corner Brackets */}
                <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-${c.accent}-400/50 rounded-tl-lg`} />
                <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-${c.accent}-400/50 rounded-tr-lg`} />
                <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-${c.accent}-400/50 rounded-bl-lg`} />
                <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${c.accent}-400/50 rounded-br-lg`} />

                {/* Top decorative line */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${c.accent}-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* Header */}
                <div className="flex items-start justify-between p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Link to={`/profile/${post.user_id}`} className="flex-shrink-0">
                            <div className={`w-14 h-14 rounded-xl border ${c.border} bg-slate-800 flex items-center justify-center text-slate-100 font-bold overflow-hidden shadow-lg shadow-black/20 ring-1 ring-white/10`}>
                                {post.author_avatar
                                    ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                                    : <span className="text-xl">{post.author_name?.charAt(0).toUpperCase() || 'U'}</span>}
                            </div>
                        </Link>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link to={`/profile/${post.user_id}`} className={`font-black tracking-wide text-base text-slate-100 hover:${c.text} transition-colors uppercase`}>
                                    {post.author_name}
                                </Link>
                                <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border ${c.border} ${c.text} uppercase bg-slate-800/50`}>
                                    {post.author_role || 'AGENT'}
                                </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span className="text-cyan-500/60 font-black">{'//'}</span>
                                <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {post.updated_at && post.updated_at !== post.created_at && <span className="italic opacity-60">· edited</span>}
                                <span className="opacity-40">•</span>
                                <span className="text-[8px] tracking-widest text-slate-600">ID:0x{post.id.toString(16).padStart(4, '0')}</span>
                            </div>
                        </div>
                    </div>

                    {/* ··· menu */}
                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(v => !v)}
                            className="text-slate-500 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 animate-[dropIn_.15s_ease-out] overflow-hidden">
                                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${c.accent}-400/40 to-transparent`} />
                                {isOwner ? (
                                    <>
                                        <button
                                            onClick={() => { setShowEdit(true); setShowMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors text-[11px] font-black tracking-widest uppercase font-mono">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                            EDIT_DATA
                                        </button>
                                        <div className="h-px bg-slate-800 mx-3" />
                                        <button
                                            onClick={() => { setShowConfirmDelete(true); setShowMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400/70 hover:bg-red-900/20 hover:text-red-400 transition-colors text-[11px] font-black tracking-widest uppercase font-mono">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                            TERMINATE
                                        </button>
                                    </>
                                ) : (
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors text-[11px] font-black tracking-widest uppercase font-mono">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                                        </svg>
                                        REPORT_ANOMALY
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-2">
                    <p className="text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                </div>

                {post.image_url && (
                    <div className="mt-4 px-4 pb-4">
                        <div className={`relative rounded-xl overflow-hidden border ${c.border} bg-slate-950/50 aspect-video group/media`}>
                            {/* Scanline overlay for media */}
                            <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                            
                            {isVideoUrl(post.image_url) ? (
                                <video 
                                    src={getImageUrl(post.image_url)} 
                                    controls 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-[1.02]" 
                                />
                            ) : (
                                <img 
                                    src={getImageUrl(post.image_url)} 
                                    alt="Post attachment" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-[1.02]" 
                                    loading="lazy" 
                                />
                            )}
                            
                            {/* Digital noise overlay on hover */}
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Metrics & Interaction Bar */}
                <div className="flex flex-col px-4 pb-4">
                    <div className="flex items-center justify-between px-2 py-3 border-t border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <button onClick={handleLike} disabled={likeLoading}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold text-[11px] tracking-widest uppercase font-mono ${isLiked ? `bg-${c.accent}-500/10 ${c.text} shadow-[0_0_15px_rgba(6,182,212,0.1)]` : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
                                </svg>
                                {likesCount > 0 ? likesCount : 'LIKE'}
                            </button>
                            <button onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold text-[11px] tracking-widest uppercase font-mono ${showComments ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {commentsCount > 0 ? commentsCount : 'REPLY'}
                            </button>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1.5">
                            <div className={`w-1 h-1 rounded-full bg-${c.accent}-400 animate-ping`} />
                            <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase">Status:Secure</span>
                        </div>
                    </div>

                    {showComments && (
                        <div className="mt-2 animate-[dropIn_.2s_ease-out]">
                            <CommentSection postId={post.id} initialCommentsCount={commentsCount} />
                        </div>
                    )}
                </div>
            </div>

            {showEdit && (
                <EditModal
                    post={post}
                    onClose={() => setShowEdit(false)}
                    onUpdated={(updated) => setPost(updated)}
                />
            )}

            {showConfirmDelete && (
                <ConfirmModal
                    postContent={post.content}
                    onConfirm={() => { setShowConfirmDelete(false); handleDelete(); }}
                    onCancel={() => setShowConfirmDelete(false)}
                />
            )}
        </>
    );
};

export default PostCard;
