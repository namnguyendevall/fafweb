import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useChatContext } from '../../contexts/ChatContext';
import { useAuth } from '../../auth/AuthContext';
import { chatApi } from '../../api/chat.api';
import { uploadApi } from '../../api/upload.api';

const ChatWidget = () => {
    const { user } = useAuth();
    const { isOpen, activeConvId, setIsOpen, setActiveConvId, closeChat, unreadCount, socket } = useChatContext();
    const [conversations, setConversations] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const { messages, loading } = useChat(activeConvId);
    const messagesEndRef = useRef(null);
    const [attachment, setAttachment] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Fetch conversation list when widget opens or list is empty
    useEffect(() => {
        if (!user) return;
        const fetchConversations = async () => {
            try {
                const res = await chatApi.getConversations();
                setConversations(res?.data ?? []);
            } catch (err) {
                console.error("Failed to load conversations:", err);
            }
        };
        fetchConversations();
    }, [user, isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() && !attachment) return;
        
        let imageUrl = null;
        if (attachment) {
            setUploading(true);
            try {
                const res = await uploadApi.uploadSubmission(attachment);
                imageUrl = res.url || res.data?.url;
            } catch (err) {
                console.error("Upload failed", err);
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        if (socket && activeConvId) {
            socket.emit('send_message', {
                conversationId: activeConvId,
                content: messageInput,
                imageUrl: imageUrl
            });
        }

        setMessageInput('');
        setAttachment(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    if (!user) return null;

    const selectedConv = conversations.find(c => String(c.id) === String(activeConvId));
    
    // Calculate display name for the header
    const otherParticipant = selectedConv?.participants?.find(p => String(p.id) !== String(user.id));
    const otherUserName = otherParticipant?.full_name || otherParticipant?.email?.split('@')[0] || 'Chat';

    const isManager = user?.role === 'manager';
    const isAdmin = user?.role === 'admin';

    const getTheme = () => {
        if (isAdmin) return {
            fab: 'bg-purple-900/40 border border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-purple-800/50 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]',
            window: 'bg-[#090e17]/95 backdrop-blur-xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-xl',
            header: 'bg-purple-950/50 border-b border-purple-500/30 text-purple-400',
            avatar: 'bg-purple-950 border border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
            msgMine: 'bg-purple-950 border border-purple-500/30 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
            msgOther: 'bg-[#02040a] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#02040a]/80 border-t border-purple-500/30',
            inputNode: 'bg-[#090e17] border border-slate-800 text-slate-300 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-600',
            sendBtn: 'text-purple-500 hover:text-purple-400',
            unreadBadge: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] border-[#090e17] text-[#02040a]',
            listItem: 'hover:bg-purple-900/10 border-b border-slate-800/50',
            subtitle: 'text-purple-400 text-shadow-glow-purple',
        };
        if (isManager) return {
            fab: 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-800/50 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]',
            window: 'bg-[#090e17]/95 backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-xl',
            header: 'bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-400',
            avatar: 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            msgMine: 'bg-emerald-950 border border-emerald-500/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
            msgOther: 'bg-[#02040a] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#02040a]/80 border-t border-emerald-500/30',
            inputNode: 'bg-[#090e17] border border-slate-800 text-slate-300 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600',
            sendBtn: 'text-emerald-500 hover:text-emerald-400',
            unreadBadge: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] border-[#090e17] text-[#02040a]',
            listItem: 'hover:bg-emerald-900/10 border-b border-slate-800/50',
            subtitle: 'text-emerald-400 text-shadow-glow-emerald',
        };
        return {
            fab: 'bg-cyan-900/40 border border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-800/50 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]',
            window: 'bg-[#090e17]/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] rounded-xl',
            header: 'bg-cyan-950/50 border-b border-cyan-500/30 text-cyan-400',
            avatar: 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
            msgMine: 'bg-cyan-950 border border-cyan-500/30 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
            msgOther: 'bg-[#02040a] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#02040a]/80 border-t border-cyan-500/30',
            inputNode: 'bg-[#090e17] border border-slate-800 text-slate-300 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-600',
            sendBtn: 'text-cyan-500 hover:text-cyan-400',
            unreadBadge: 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] border-[#090e17] text-[#02040a]',
            listItem: 'hover:bg-cyan-900/10 border-b border-slate-800/50',
            subtitle: 'text-cyan-400 text-shadow-glow-cyan',
        };
    };
    const t = getTheme();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none font-mono">
            {/* Chat Window */}
            {isOpen && activeConvId && (
                <div className={`w-80 h-[450px] ${t.window} flex flex-col overflow-hidden mb-4 pointer-events-auto transition-all transform origin-bottom-right`}>
                    {/* Header */}
                    <div className={`p-3 ${t.header} flex items-center justify-between shadow-sm`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black uppercase text-xs ${t.avatar}`}>
                                {otherUserName.charAt(0)}
                            </div>
                            <span className="font-black text-[12px] truncate uppercase tracking-widest">{otherUserName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setActiveConvId(null)}
                                className="p-1.5 hover:bg-black/20 text-slate-400 hover:text-white rounded transition-colors"
                                title="Back to list"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-black/20 text-slate-400 hover:text-white rounded transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent custom-scrollbar">
                        {loading && <div className="text-center py-2 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">SEARCHING_NODE...</div>}
                        {messages.map((msg, idx) => {
                            const isMe = String(msg.sender_id) === String(user.id);
                            return (
                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded text-[11px] leading-relaxed break-words whitespace-pre-wrap ${
                                        isMe ? `${t.msgMine} rounded-tr-none font-bold tracking-wide` : `${t.msgOther} rounded-tl-none`
                                    }`}>
                                        <p>{msg.content}</p>
                                        {msg.image_url && <a href={msg.image_url} target="_blank" rel="noopener noreferrer"><img src={msg.image_url} alt="attachment" className="max-w-[200px] mt-2 rounded border border-slate-700/50 object-cover" /></a>}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex flex-col bg-[#02040a]/80 border-t border-slate-800">
                        {attachment && (
                            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800 text-[10px] text-slate-300">
                                <span className="truncate flex-1">{attachment.name}</span>
                                <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-red-500 hover:text-red-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSend} className={`p-2 ${t.inputArea} flex gap-2 items-center`}>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 rounded hover:bg-white/5 transition-colors text-slate-400 hover:${t.sendBtn}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </button>
                            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="> TERMINAL_INPUT..."
                                disabled={uploading}
                                className={`flex-1 px-3 py-2 rounded font-mono text-[11px] uppercase tracking-wider outline-none transition-colors disabled:opacity-50 ${t.inputNode}`}
                            />
                            <button type="submit" disabled={(!messageInput.trim() && !attachment) || uploading} className={`p-2 rounded hover:bg-white/5 transition-colors disabled:opacity-30 ${t.sendBtn}`}>
                                {uploading ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Conversation List Window */}
            {isOpen && !activeConvId && (
                <div className={`w-80 h-[450px] ${t.window} flex flex-col overflow-hidden mb-4 pointer-events-auto transition-all transform origin-bottom-right`}>
                    <div className={`p-3 ${t.header} flex items-center justify-between shadow-sm`}>
                        <span className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                           SYS.COMMS
                        </span>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-black/20 text-slate-400 hover:text-white rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="p-10 text-center text-[10px] uppercase font-black tracking-widest text-slate-600">NO_ACTIVE_LINKS</div>
                        ) : (
                            conversations.map(conv => {
                                const other = conv.participants?.find(p => String(p.id) !== String(user.id));
                                const name = other?.full_name || other?.email?.split('@')[0] || 'UNKNOWN_NODE';
                                const isUnread = conv.unread_count > 0;
                                return (
                                    <button 
                                        key={conv.id} 
                                        onClick={() => setActiveConvId(conv.id)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${t.listItem} ${isUnread ? 'bg-white/5' : 'bg-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 rounded text-[12px] flex items-center justify-center uppercase font-black shrink-0 ${isUnread ? t.avatar : 'bg-[#02040a] border border-slate-700 text-slate-500'}`}>
                                            {name.charAt(0)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className={`font-black text-[11px] uppercase tracking-widest truncate ${isUnread ? t.subtitle : 'text-slate-300'}`}>{name}</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 truncate font-bold flex justify-between">
                                                <span>{conv.last_message ? `> ${conv.last_message}` : '> AWAITING_INPUT'}</span>
                                            </div>
                                        </div>
                                        {isUnread && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.unreadBadge} animate-pulse shrink-0`} />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 flex items-center justify-center transition-all pointer-events-auto relative rounded z-50 ${t.fab}`}
            >
                {isOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        
                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                            <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-sm border-2 font-black text-[9px] tracking-widest ${t.unreadBadge} z-10 animate-pulse`}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
