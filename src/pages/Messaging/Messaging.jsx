import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { chatApi } from '../../api/chat.api';
import { useAuth } from '../../auth/AuthContext';
import { useChatContext } from '../../contexts/ChatContext';
import { uploadApi } from '../../api/upload.api';

const Messaging = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const convIdFromUrl = searchParams.get('convId');
    const { socket } = useChatContext();
    const [conversations, setConversations] = useState([]);
    const [selectedConvId, setSelectedConvId] = useState(convIdFromUrl ? Number(convIdFromUrl) : null);
    const [messageInput, setMessageInput] = useState('');
    const { messages, loading } = useChat(selectedConvId);
    const messagesEndRef = useRef(null);
    const [attachment, setAttachment] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Load conversation list
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await chatApi.getConversations();
                setConversations(res?.data ?? []);
                
                const data = res?.data ?? [];
                // Auto-select based on URL or first item
                if (data.length > 0) {
                    if (convIdFromUrl) {
                        console.log('Selecting conversation from URL:', convIdFromUrl);
                        setSelectedConvId(convIdFromUrl);
                    } else if (!selectedConvId) {
                        setSelectedConvId(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load conversations:", err);
            }
        };
        fetchConversations();
    }, []);

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

        if (socket && selectedConvId) {
            socket.emit('send_message', {
                conversationId: selectedConvId,
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

    const conversationsWithOtherUser = conversations.map(conv => {
        const otherParticipant = conv.participants?.find(p => String(p.id) !== String(user.id));
        return {
            ...conv,
            other_user_name: otherParticipant?.full_name || otherParticipant?.email?.split('@')[0] || 'UNKNOWN_NODE',
            other_user_avatar: otherParticipant?.full_name?.charAt(0) || '?'
        };
    });

    const selectedConv = conversationsWithOtherUser.find(c => String(c.id) === String(selectedConvId));

    const isManager = user?.role === 'manager';
    const isAdmin = user?.role === 'admin';

    const getTheme = () => {
        if (isAdmin) return {
            bgMain: 'bg-[#02040a]',
            bgSide: 'bg-[#090e17]/90 border-r border-purple-500/20',
            textPrimary: 'text-purple-400 text-shadow-glow-purple',
            activeItem: 'bg-purple-950/40 border-r-2 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]',
            hoverItem: 'hover:bg-purple-900/10 border-r-2 border-transparent',
            avatar: 'bg-[#02040a] border border-slate-700 text-slate-500',
            avatarActive: 'bg-purple-950 border border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
            msgMine: 'bg-purple-950 border border-purple-500/30 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
            msgOther: 'bg-[#090e17] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#090e17]/95 border-t border-purple-500/20',
            inputNode: 'bg-[#02040a] border border-slate-800 text-slate-300 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 placeholder-slate-600',
            sendBtn: 'bg-purple-950 text-purple-400 hover:text-purple-300 hover:bg-purple-900/50 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
            headerBg: 'bg-[#090e17]/95 border-b border-purple-500/20 backdrop-blur-md',
        };
        if (isManager) return {
            bgMain: 'bg-[#02040a]',
            bgSide: 'bg-[#090e17]/90 border-r border-emerald-500/20',
            textPrimary: 'text-emerald-400 text-shadow-glow-emerald',
            activeItem: 'bg-emerald-950/40 border-r-2 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]',
            hoverItem: 'hover:bg-emerald-900/10 border-r-2 border-transparent',
            avatar: 'bg-[#02040a] border border-slate-700 text-slate-500',
            avatarActive: 'bg-emerald-950 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
            msgMine: 'bg-emerald-950 border border-emerald-500/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
            msgOther: 'bg-[#090e17] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#090e17]/95 border-t border-emerald-500/20',
            inputNode: 'bg-[#02040a] border border-slate-800 text-slate-300 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600',
            sendBtn: 'bg-emerald-950 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            headerBg: 'bg-[#090e17]/95 border-b border-emerald-500/20 backdrop-blur-md',
        };
        return {
            bgMain: 'bg-[#02040a]',
            bgSide: 'bg-[#090e17]/90 border-r border-cyan-500/20',
            textPrimary: 'text-cyan-400 text-shadow-glow-cyan',
            activeItem: 'bg-cyan-950/40 border-r-2 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]',
            hoverItem: 'hover:bg-cyan-900/10 border-r-2 border-transparent',
            avatar: 'bg-[#02040a] border border-slate-700 text-slate-500',
            avatarActive: 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
            msgMine: 'bg-cyan-950 border border-cyan-500/30 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
            msgOther: 'bg-[#090e17] border border-slate-700 text-slate-300',
            inputArea: 'bg-[#090e17]/95 border-t border-cyan-500/20',
            inputNode: 'bg-[#02040a] border border-slate-800 text-slate-300 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-600',
            sendBtn: 'bg-cyan-950 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
            headerBg: 'bg-[#090e17]/95 border-b border-cyan-500/20 backdrop-blur-md',
        };
    };
    const t = getTheme();

    return (
        <div className={`flex h-[calc(100vh-56px)] ${t.bgMain} overflow-hidden font-mono uppercase tracking-widest`}>
            {/* Sidebar: Conversations */}
            <div className={`w-80 ${t.bgSide} flex flex-col z-20`}>
                <div className="p-5 border-b border-slate-800/50 flex flex-col justify-center">
                    <h2 className={`text-[14px] font-black ${t.textPrimary} flex items-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        SYS.COMMS_HUB
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-[10px] font-black">
                            NO_ACTIVE_LINKS
                        </div>
                    ) : (
                        conversationsWithOtherUser.map(conv => {
                            const isActive = String(selectedConvId) === String(conv.id);
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConvId(conv.id)}
                                    className={`w-full p-4 flex items-center gap-4 transition-all ${isActive ? t.activeItem : t.hoverItem}`}
                                >
                                    <div className={`w-10 h-10 rounded text-[12px] flex items-center justify-center font-black shrink-0 ${isActive ? t.avatarActive : t.avatar}`}>
                                        {conv.other_user_avatar}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <h4 className={`font-black text-[12px] truncate ${isActive ? t.textPrimary : 'text-slate-400'}`}>
                                            {conv.other_user_name}
                                        </h4>
                                        <p className={`text-[9px] truncate mt-1 font-bold ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {conv.last_message ? `> ${conv.last_message}` : '> AWAITING_INPUT'}
                                        </p>
                                    </div>
                                    {conv.unread_count > 0 && !isActive && (
                                        <span className={`w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,1)] animate-pulse shrink-0 ml-auto`} />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-transparent relative`}>
                {selectedConvId ? (
                    <>
                        {/* Chat Header */}
                        <div className={`p-4 sm:px-6 ${t.headerBg} z-10 flex items-center gap-4`}>
                            <div className={`w-10 h-10 rounded shrink-0 flex items-center justify-center font-black text-[12px] ${t.avatarActive}`}>
                                {selectedConv?.other_user_avatar || '?'}
                            </div>
                            <div>
                                <h3 className={`font-black text-[14px] ${t.textPrimary}`}>{selectedConv?.other_user_name}</h3>
                                <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></span> ONLINE_NODE</p>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="text-[10px] text-slate-500 animate-pulse font-black">ESTABLISHING_CONNECTION...</div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    if (msg.type === 'SYSTEM') {
                                        return (
                                            <div key={msg.id || idx} className="flex justify-center my-4">
                                                <div className="bg-[#02040a] text-slate-500 text-[9px] px-3 py-1.5 rounded border border-slate-800 font-bold tracking-widest shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                                    SYS_MSG: {msg.content}
                                                </div>
                                            </div>
                                        );
                                    }
                                    const isMe = msg.sender_id == user.id;
                                    return (
                                        <div 
                                            key={msg.id || idx} 
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] px-4 py-3 rounded text-[11px] leading-relaxed break-words whitespace-pre-wrap ${
                                                isMe ? `${t.msgMine} rounded-tr-none font-bold` : `${t.msgOther} rounded-tl-none`
                                            }`}>
                                                <p className="normal-case tracking-normal font-sans">{msg.content}</p>
                                                {msg.image_url && <a href={msg.image_url} target="_blank" rel="noopener noreferrer"><img src={msg.image_url} alt="attachment" className="max-w-[250px] mt-2 rounded border border-slate-700/50 object-cover" /></a>}
                                                <div className={`text-[9px] mt-2 font-mono uppercase tracking-widest ${isMe ? 'text-slate-400 text-right' : 'text-slate-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="flex flex-col z-10 w-full">
                            {attachment && (
                                <div className="px-6 py-2 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-300 bg-[#090e17]/80">
                                    <span className="truncate flex-1 font-sans tracking-normal font-bold">ATTACHED: {attachment.name}</span>
                                    <button type="button" onClick={() => setAttachment(null)} className="ml-2 text-red-500 hover:text-red-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSend} className={`p-4 sm:p-5 ${t.inputArea} flex gap-3 items-center w-full`}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 sm:p-3 rounded transition-colors text-slate-400 hover:text-white ${t.sendBtn} bg-transparent border-transparent shadow-none`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                <div className="flex-1 flex items-center relative">
                                    <span className={`absolute left-4 text-[12px] font-black pointer-events-none ${t.textPrimary}`}>{'>_'}</span>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="TERMINAL_INPUT..."
                                        disabled={uploading}
                                        className={`w-full pl-10 pr-4 py-3 rounded text-[11px] font-mono tracking-widest outline-none transition-all disabled:opacity-50 ${t.inputNode}`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!messageInput.trim() && !attachment) || uploading}
                                    className={`w-12 h-12 shrink-0 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none ${t.sendBtn}`}
                                >
                                    {uploading ? (
                                        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-500">
                        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <h3 className="text-[14px] font-black uppercase tracking-widest mb-2">AWAITING_COMM_LINK</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-600">Please select an active node to initiate terminal connection.</p>
                    </div>
                )}
            </div>
            {/* custom styles for scrollbar embedded here or rely on global index.css */}
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isAdmin ? 'rgba(168, 85, 247, 0.2)' : isManager ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)'};
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${isAdmin ? 'rgba(168, 85, 247, 0.5)' : isManager ? 'rgba(16, 185, 129, 0.5)' : 'rgba(6, 182, 212, 0.5)'};
                }
            `}</style>
        </div>
    );
};

export default Messaging;
