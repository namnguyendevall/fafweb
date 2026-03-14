import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useChatContext } from '../../contexts/ChatContext';
import { useAuth } from '../../auth/AuthContext';
import { chatApi } from '../../api/chat.api';

const ChatWidget = () => {
    const { user } = useAuth();
    const { isOpen, activeConvId, setIsOpen, setActiveConvId, closeChat, unreadCount } = useChatContext();
    const [conversations, setConversations] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const { messages, sendMessage, loading } = useChat(activeConvId);
    const messagesEndRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

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

    // Scroll to bottom when messages change or conversation changes
    useEffect(() => {
        if (messages.length > 0 || activeConvId) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
        return () => clearTimeout(scrollTimeoutRef.current);
    }, [messages, activeConvId, isOpen, isMinimized]);


    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
        setMessageInput('');
    };

    if (!user) return null;

    const selectedConv = conversations.find(c => String(c.id) === String(activeConvId));
    const otherParticipant = selectedConv?.participants?.find(p => String(p.id) !== String(user.id));
    const otherUserName = otherParticipant?.full_name || otherParticipant?.email?.split('@')[0] || 'Chat';
    const isManager = user?.role === 'manager';
    const accentColor = isManager ? 'emerald' : 'blue';

    // Toggle minimize
    const toggleMinimize = (e) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <div className="fixed z-[9999] bottom-6 right-6 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && !isMinimized && (
                <div className="w-72 h-[400px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200 flex flex-col overflow-hidden mb-4 pointer-events-auto transition-all transform origin-bottom-right">
                    {/* Header */}
                    <div 
                        className={`p-3 bg-${accentColor}-600 text-white flex items-center justify-between shadow-sm select-none`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0">
                                {activeConvId ? otherUserName.charAt(0) : '💬'}
                            </div>
                            <span className="font-bold text-sm truncate">{activeConvId ? otherUserName : 'Chats'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {activeConvId && (
                                <button 
                                    onClick={() => setActiveConvId(null)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title="Back to list"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}
                            <button 
                                onClick={toggleMinimize}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Minimize"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Close"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Window Content */}
                    {activeConvId ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 pointer-events-auto">
                                {loading && <div className="text-center py-2 text-xs text-gray-400">Loading...</div>}
                                {messages.map((msg, i) => {
                                    const isMe = String(msg.sender_id) === String(user.id);
                                    return (
                                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs shadow-sm ${
                                                isMe ? `bg-${accentColor}-600 text-white rounded-tr-none` : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                            }`}>
                                                <p>{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 bg-white pointer-events-auto">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Aa"
                                    className={`flex-1 px-3 py-1.5 bg-gray-100 border-none rounded-full focus:ring-1 focus:ring-${accentColor}-500 text-sm`}
                                />
                                <button type="submit" disabled={!messageInput.trim()} className={`text-${accentColor}-600 font-bold disabled:opacity-30`}>
                                    <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto pointer-events-auto">
                            {conversations.length === 0 ? (
                                <div className="p-10 text-center text-xs text-gray-400">No messages yet.</div>
                            ) : (
                                conversations.map(conv => {
                                    const other = conv.participants?.find(p => String(p.id) !== String(user.id));
                                    const name = other?.full_name || other?.email?.split('@')[0] || 'User';
                                    return (
                                        <button 
                                            key={conv.id} 
                                            onClick={() => setActiveConvId(conv.id)}
                                            className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-full bg-${accentColor}-100 flex items-center justify-center text-${accentColor}-600 font-bold shrink-0`}>
                                                {name.charAt(0)}
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <div className="font-bold text-sm text-gray-900 truncate">{name}</div>
                                                <div className="text-xs text-gray-500 truncate">{conv.last_message || 'Start chatting...'}</div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Bubble Button */}
            <button
                onClick={() => {
                    if (isMinimized) setIsMinimized(false);
                    else setIsOpen(!isOpen);
                }}
                className={`w-12 h-12 bg-${accentColor}-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-${accentColor}-700 hover:scale-105 active:scale-95 transition-all pointer-events-auto relative select-none`}
            >
                {isOpen && !isMinimized ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                ) : (
                    <>
                        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white flex items-center justify-center min-w-[22px] h-[22px] shadow-lg animate-bounce z-10">
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
