import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../auth/AuthContext';
import { aiApi } from '../../api/ai.api';
import { io } from 'socket.io-client';

/* ─── Helpers ─── */
const fmt = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
const FILTERS = [
    { name: 'Gốc', css: '' },
    { name: 'Sáng', css: 'brightness(1.3) contrast(1.1)' },
    { name: 'Tối', css: 'brightness(0.7) contrast(1.2)' },
    { name: 'B&W', css: 'grayscale(1)' },
    { name: 'Warm', css: 'sepia(0.4) saturate(1.3)' },
    { name: 'Cool', css: 'hue-rotate(180deg) saturate(0.8)' },
    { name: 'Vintage', css: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
    { name: 'Vivid', css: 'saturate(2) contrast(1.2)' },
];

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Impact', 'Comic Sans MS', 'Verdana'];

/* ─── Main Component ─── */
const VideoEditor = ({ onSubmissionReady }) => {
    const toast = useToast();
    const { user } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const timelineRef = useRef(null);
    const animFrameRef = useRef(null);
    const socketRef = useRef(null);

    const [roomId] = useState('demo_collab_room'); // Simulated room ID
    const [remoteCursors, setRemoteCursors] = useState({});

    /* Video state */
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    /* Trim */
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [dragging, setDragging] = useState(null); // 'start'|'end'

    /* Caption overlays */
    const [captions, setCaptions] = useState([]);
    const [activeCaption, setActiveCaption] = useState(null);
    const [captionText, setCaptionText] = useState('');
    const [captionFont, setCaptionFont] = useState('Arial');
    const [captionSize, setCaptionSize] = useState(32);
    const [captionColor, setCaptionColor] = useState('#ffffff');
    const [captionBg, setCaptionBg] = useState('#000000');
    const [captionX, setCaptionX] = useState(50);
    const [captionY, setCaptionY] = useState(85);

    /* Speed */
    const [speed, setSpeed] = useState(1);

    /* Filter */
    const [filterIdx, setFilterIdx] = useState(0);

    /* Color grading */
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [hue, setHue] = useState(0);
    const [blur, setBlur] = useState(0);

    /* Transform */
    const [rotation, setRotation] = useState(0); // 0,90,180,270
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);

    /* Stickers */
    const [stickers, setStickers] = useState([]);
    // { id, emoji, x, y, size, startTime, endTime }
    const EMOJI_LIST = ['😂','❤️','🔥','👍','💯','🎉','✨','😍','🎬','🎵','💪','🌟','😎','🚀','💀','👀','🎤','🎶','💃','🕺'];

    /* PiP Camera */
    const [pipActive, setPipActive] = useState(false);
    const [pipPos, setPipPos] = useState({ x: 70, y: 5 });
    const pipVideoRef = useRef(null);
    const pipStreamRef = useRef(null);

    /* Volume */
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);

    /* Background audio */
    const [bgAudioFile, setBgAudioFile] = useState(null);
    const [bgAudioUrl, setBgAudioUrl] = useState(null);
    const [bgVolume, setBgVolume] = useState(0.5);
    const bgAudioRef = useRef(null);

    /* Cut segments */
    const [cuts, setCuts] = useState([]); // [{start, end, label}]
    const [cutMode, setCutMode] = useState(false);

    /* FFmpeg */
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processLog, setProcessLog] = useState('');
    const [processProgress, setProcessProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState(null);
    const ffmpegRef = useRef(null);

    /* Upload */
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(null);

    /* UI */
    const [activePanel, setActivePanel] = useState('trim');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportRes, setExportRes] = useState('1080p');
    const [exportFps, setExportFps] = useState('60');

    /* ── Load FFmpeg ── */
    const loadFFmpeg = async () => {
        if (ffmpegLoaded || ffmpegLoading) return;
        setFfmpegLoading(true);
        setProcessLog('⏳ Đang tải FFmpeg (~30MB), vui lòng chờ...');
        try {
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => setProcessLog(message));
            ffmpeg.on('progress', ({ progress }) => setProcessProgress(Math.round(progress * 100)));
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            ffmpegRef.current = ffmpeg;
            setFfmpegLoaded(true);
            setProcessLog('✅ FFmpeg sẵn sàng!');
        } catch (e) {
            setProcessLog('❌ Lỗi tải FFmpeg: ' + e.message);
        } finally {
            setFfmpegLoading(false);
        }
    };

    /* ── Video file load ── */
    const handleFileLoad = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setOutputUrl(null);
        setCuts([]);
    };

    /* ── Live Co-Op Socket Sync ── */
    useEffect(() => {
        // Init socket
        const socket = io(import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')) || 'http://localhost:5000', {
            auth: { token: localStorage.getItem('accessToken') }
        });
        socketRef.current = socket;

        socket.emit('join_video_room', roomId);

        socket.on('video_sync_play', ({ time }) => {
            if (videoRef.current && videoRef.current.paused) {
                videoRef.current.currentTime = time;
                videoRef.current.play().catch(e => console.error("Auto-play prevented", e));
            }
        });

        socket.on('video_sync_pause', ({ time }) => {
            if (videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
                videoRef.current.currentTime = time;
            }
        });

        socket.on('video_sync_seek', ({ time }) => {
            if (videoRef.current) {
                videoRef.current.currentTime = time;
            }
        });

        socket.on('video_cursor_move', (data) => {
            setRemoteCursors(prev => ({
                ...prev,
                [data.userId]: data
            }));
            
            // Auto clean up stale cursors after 5s
            setTimeout(() => {
                setRemoteCursors(prev => {
                    const next = { ...prev };
                    if (next[data.userId]?.timestamp === data.timestamp) {
                        delete next[data.userId];
                    }
                    return next;
                });
            }, 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    // Broadcast cursor movements visually over the canvas Wrapper
    const handleCanvasMouseMove = (e) => {
        if (!canvasRef.current || !socketRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Throttle emission slightly in a real app, but for demo:
        socketRef.current.emit('video_cursor_move', {
            roomId,
            x,
            y,
            userName: user?.full_name || 'Anonymous',
            timestamp: Date.now(),
            color: user?.role === 'employer' ? '#d946ef' : '#0ea5e9' // fuchsia vs sky
        });
    };

    /* ── Sync currentTime from video ── */
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onTime = () => {
            const t = v.currentTime;
            setCurrentTime(t);
            // Enforce trim bounds during playback
            if (t >= trimEnd && trimEnd > 0) {
                v.pause();
                v.currentTime = trimStart;
                setIsPlaying(false);
            }
        };
        const onLoaded = () => {
            const d = v.duration;
            if (!isNaN(d) && d > 0) {
                setDuration(d);
                setTrimStart(0);
                setTrimEnd(d);
            }
        };
        
        // If metadata is already loaded before the listener attaches
        if (v.readyState >= 1) {
            onLoaded();
        }

        v.addEventListener('timeupdate', onTime);
        v.addEventListener('loadedmetadata', onLoaded);
        v.addEventListener('play', () => setIsPlaying(true));
        v.addEventListener('pause', () => setIsPlaying(false));
        return () => {
            v.removeEventListener('timeupdate', onTime);
            v.removeEventListener('loadedmetadata', onLoaded);
            v.removeEventListener('play', () => setIsPlaying(true));
            v.removeEventListener('pause', () => setIsPlaying(false));
        };
    }, [videoUrl, trimStart, trimEnd]);

    /* ── Computed CSS filter (color grading + preset) ── */
    const computedFilter = () => {
        const base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;
        const preset = FILTERS[filterIdx].css;
        return preset ? `${preset} ${base}` : base;
    };

    /* ── PiP camera start/stop ── */
    const togglePip = async () => {
        if (pipActive) {
            pipStreamRef.current?.getTracks().forEach(t => t.stop());
            if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
            setPipActive(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                pipStreamRef.current = stream;
                if (pipVideoRef.current) { pipVideoRef.current.srcObject = stream; pipVideoRef.current.play(); }
                setPipActive(true);
            } catch (e) { toast.error('Không thể mở camera: ' + e.message); }
        }
    };

    /* ── Background audio sync ── */
    useEffect(() => {
        if (bgAudioRef.current) bgAudioRef.current.volume = bgVolume;
    }, [bgVolume]);

    /* ── Canvas overlay (captions + stickers) ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const render = () => {
            const ctx = canvas.getContext('2d');
            // Match canvas logical size to its visual size for crisp rendering and correct overlay coords
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                animFrameRef.current = requestAnimationFrame(render);
                return;
            }
            if (canvas.width !== rect.width) canvas.width = rect.width;
            if (canvas.height !== rect.height) canvas.height = rect.height;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw visible captions
            captions.filter(c => currentTime >= c.startTime && currentTime <= c.endTime).forEach(cap => {
                const scaledSize = Math.max(12, (cap.size / 100) * canvas.height); // Scale size relative to screen
                ctx.font = `bold ${scaledSize}px ${cap.font || 'Arial'}`;
                const x = (cap.x / 100) * canvas.width;
                const y = (cap.y / 100) * canvas.height;
                const tw = ctx.measureText(cap.text).width;
                const th = scaledSize;
                
                // Draw background box
                if (cap.bg && cap.bg !== 'transparent') {
                    ctx.fillStyle = cap.bg;
                    ctx.fillRect(x - tw / 2 - 8, y - th + 4, tw + 16, th + 8);
                }
                
                // Draw Text
                ctx.fillStyle = cap.color || '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(cap.text, x, y);
            });

            // Draw stickers
            stickers.filter(s => currentTime >= s.startTime && currentTime <= s.endTime).forEach(s => {
                const scaledSize = Math.max(16, (s.size / 100) * canvas.height);
                ctx.font = `${scaledSize}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(s.emoji, (s.x / 100) * canvas.width, (s.y / 100) * canvas.height);
            });

            animFrameRef.current = requestAnimationFrame(render);
        };
        animFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [captions, stickers, currentTime]);

    /* ── Speed ── */
    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = speed;
    }, [speed]);

    /* ── Volume ── */
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = muted;
        }
    }, [volume, muted]);

    /* ── Play/Pause ── */
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            if (v.currentTime >= trimEnd) v.currentTime = trimStart;
            v.play();
            socketRef.current?.emit('video_sync_play', { roomId, time: v.currentTime });
        } else {
            v.pause();
            socketRef.current?.emit('video_sync_pause', { roomId, time: v.currentTime });
        }
    };

    /* ── Seek ── */
    const seekTo = (pct) => {
        const t = pct * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = t;
            socketRef.current?.emit('video_sync_seek', { roomId, time: t });
        }
    };

    /* ── Timeline drag ── */
    const handleTimelineMouse = useCallback((e) => {
        if (!dragging || !timelineRef.current || !duration || isNaN(duration)) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const t = pct * duration;
        if (dragging === 'start') {
            setTrimStart(Math.min(t, trimEnd - 0.5));
        } else if (dragging === 'end') {
            setTrimEnd(Math.max(t, trimStart + 0.5));
        } else if (dragging === 'seek') {
            if (videoRef.current) videoRef.current.currentTime = t;
        }
    }, [dragging, duration, trimStart, trimEnd]);

    const handleTimelineMouseUp = useCallback(() => setDragging(null), []);

    useEffect(() => {
        window.addEventListener('mousemove', handleTimelineMouse);
        window.addEventListener('mouseup', handleTimelineMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleTimelineMouse);
            window.removeEventListener('mouseup', handleTimelineMouseUp);
        };
    }, [handleTimelineMouse, handleTimelineMouseUp]);

    /* ── Add Caption ── */
    const addCaption = () => {
        if (!captionText.trim()) return;
        const cap = {
            id: Date.now(),
            text: captionText,
            font: captionFont,
            size: captionSize,
            color: captionColor,
            bg: captionBg,
            x: captionX,
            y: captionY,
            startTime: currentTime,
            endTime: Math.min(currentTime + 3, duration),
        };
        setCaptions(prev => [...prev, cap]);
        setCaptionText('');
    };

    const removeCaption = (id) => setCaptions(prev => prev.filter(c => c.id !== id));

    const [isAITranscribing, setIsAITranscribing] = useState(false);
    const handleAutoSubtitle = async () => {
        if (!videoFile) return;
        setIsAITranscribing(true);
        try {
            toast.info('Đang phân tích âm thanh bằng AI...');
            const res = await aiApi.transcribeVideo(videoFile);
            if (res.data?.success && res.data?.captions) {
                const newCaps = res.data.captions.map((c, i) => ({
                    id: Date.now() + i,
                    text: c.text,
                    font: captionFont,
                    size: captionSize,
                    color: captionColor,
                    bg: captionBg,
                    x: captionX,
                    y: captionY,
                    startTime: c.start,
                    endTime: c.end
                }));
                // Merge with existing
                setCaptions(prev => [...prev, ...newCaps]);
                toast.success('AI đã tạo phụ đề thành công!');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi khi tạo phụ đề AI: ' + e.message);
        } finally {
            setIsAITranscribing(false);
        }
    };

    /* ── Add Cut Segment ── */
    const addCut = () => {
        const start = trimStart;
        const end = trimEnd;
        setCuts(prev => [...prev, { id: Date.now(), start, end, label: `Clip ${prev.length + 1}` }]);
        setCutMode(false);
    };

    /* ── FFmpeg: Render ── */
    const handleRender = async () => {
        if (!ffmpegLoaded || !videoFile || processing) return;
        setProcessing(true);
        setProcessProgress(0);
        setProcessLog('🚀 Bắt đầu render...');
        setOutputUrl(null);

        const ffmpeg = ffmpegRef.current;
        try {
            await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

            const filterStr = FILTERS[filterIdx].css ? buildVfFilter(filterIdx) : null;
            const args = ['-i', 'input.mp4'];

            // Trim
            if (trimStart > 0 || trimEnd < duration) {
                args.push('-ss', String(trimStart.toFixed(3)));
                args.push('-to', String(trimEnd.toFixed(3)));
            }

            // Speed
            if (speed !== 1) {
                const vSetpts = `setpts=${(1 / speed).toFixed(3)}*PTS`;
                const atempo = speed > 2
                    ? `atempo=2.0,atempo=${(speed / 2).toFixed(3)}`
                    : speed < 0.5
                        ? `atempo=0.5,atempo=${(speed * 2).toFixed(3)}`
                        : `atempo=${speed.toFixed(3)}`;
                args.push('-filter_complex', `[0:v]${vSetpts}${filterStr ? `,${filterStr}` : ''}[v];[0:a]${atempo}[a]`);
                args.push('-map', '[v]', '-map', '[a]');
            } else if (filterStr) {
                args.push('-vf', filterStr);
            }

            // Volume
            if (!muted && volume !== 1) {
                args.push('-af', `volume=${volume.toFixed(2)}`);
            }
            if (muted) args.push('-an');

            const resScale = exportRes === '1080p' ? '1920:1080' : '1280:720';
            args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-r', exportFps, '-s', resScale, '-c:a', 'aac', 'output.mp4');

            setProcessLog('⚙️ Đang xử lý video...');
            await ffmpeg.exec(args);

            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);
            setProcessLog('✅ Render xong! Nhấn tải về để lưu.');
        } catch (err) {
            setProcessLog('❌ Lỗi: ' + err.message);
        } finally {
            setProcessing(false);
            setProcessProgress(100);
        }
    };

    const buildVfFilter = (idx) => {
        const filters = ['', 'eq=brightness=0.1:contrast=1.1:saturation=1', 'eq=brightness=-0.15:contrast=1.2', 'hue=s=0', 'colortemperature=temperature=6500', 'hue=h=180', 'eq=saturation=0.6:brightness=-0.05:contrast=1.1', 'eq=saturation=2:contrast=1.2'];
        return filters[idx] || '';
    };

    /* ── Upload to backend ── */
    const handleUpload = async () => {
        if (!outputUrl || uploading) return;
        setUploading(true);
        try {
            const res = await fetch(outputUrl);
            const blob = await res.blob();
            const formData = new FormData();
            formData.append('file', blob, videoFile?.name || 'video.mp4');
            const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/uploads/submission`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (!uploadRes.ok) throw new Error('Upload thất bại');
            const { url } = await uploadRes.json();
            setUploadedUrl(url);
            if (onSubmissionReady) onSubmissionReady(url);
        } catch (err) {
            toast.error('Lỗi upload: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const pct = (t) => duration ? ((t / duration) * 100).toFixed(2) + '%' : '0%';
    const isLoaded = !!videoUrl;

    /* ─────────────────── RENDER ─────────────────── */
    return (
        <div className="flex flex-col h-full bg-[#0e0e0e] text-gray-300 select-none font-sans overflow-hidden absolute inset-0 z-50">
            {/* ── HEADER ── */}
            <header className="h-14 bg-[#141414] border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 font-semibold text-sm">Untitled Project</span>
                    {ffmpegLoading && <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Downloading Core...</span>}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadFFmpeg} className="text-xs font-semibold px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                        {ffmpegLoaded ? '✅ FFmpeg Ready' : 'Load Engine'}
                    </button>
                    <button 
                        onClick={() => setShowExportModal(true)}
                        disabled={!isLoaded || !ffmpegLoaded}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-700 text-white font-semibold text-sm px-5 py-1.5 rounded transition-all">
                        Xuất Bản
                    </button>
                </div>
            </header>

            {!isLoaded ? (
                <div className="flex-1 flex items-center justify-center bg-[#111]">
                    <label className="cursor-pointer group flex flex-col items-center">
                        <div className="w-32 h-32 bg-gray-800 rounded-3xl flex items-center justify-center text-5xl mb-4 group-hover:scale-105 group-hover:bg-gray-700 transition-all shadow-xl">
                            <span className="group-hover:-translate-y-2 transition-transform">🎥</span>
                        </div>
                        <p className="text-white font-semibold mb-1">Nhập tệp phương tiện</p>
                        <p className="text-gray-500 text-sm">Hỗ trợ MP4, MOV, WEBM</p>
                        <input type="file" accept="video/*" onChange={handleFileLoad} className="hidden" />
                    </label>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* ── LEFT PANEL (ASSETS/FX) ── */}
                    <div className="w-80 bg-[#141414] border-r border-gray-800 flex flex-col shrink-0">
                        <div className="flex text-xs font-medium text-gray-400 border-b border-gray-800">
                            {['media','text','filters','adjust'].map(t => (
                                <button key={t} onClick={() => setActivePanel(t)}
                                    className={`flex-1 py-3 capitalize ${activePanel === t ? 'text-white border-b-2 border-white' : 'hover:text-gray-200'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {activePanel === 'media' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-white text-sm">Media</h4>
                                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                                        <video src={videoUrl} className="w-full h-full object-cover opacity-50" />
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-xs text-white truncate max-w-[150px]">{videoFile?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activePanel === 'text' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-white text-sm">Thêm Văn Bản</h4>
                                    <input value={captionText} onChange={e=>setCaptionText(e.target.value)} placeholder="Nhập phụ đề..." className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                        <div>
                                            <label className="text-gray-500 mb-1 block">Màu chữ</label>
                                            <input type="color" value={captionColor} onChange={e=>setCaptionColor(e.target.value)} className="w-full h-8 bg-transparent cursor-pointer rounded" />
                                        </div>
                                        <div>
                                            <label className="text-gray-500 mb-1 block">Màu nền</label>
                                            <input type="color" value={captionBg} onChange={e=>setCaptionBg(e.target.value)} className="w-full h-8 bg-transparent cursor-pointer rounded" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                        <div><label className="text-gray-500 block mb-1">Cỡ chữ</label><input type="number" value={captionSize} onChange={e=>setCaptionSize(+e.target.value)} className="w-full bg-gray-800 text-white rounded p-1"/></div>
                                        <div><label className="text-gray-500 block mb-1">X (%)</label><input type="number" min={0} max={100} value={captionX} onChange={e=>setCaptionX(+e.target.value)} className="w-full bg-gray-800 text-white rounded p-1"/></div>
                                        <div><label className="text-gray-500 block mb-1">Y (%)</label><input type="number" min={0} max={100} value={captionY} onChange={e=>setCaptionY(+e.target.value)} className="w-full bg-gray-800 text-white rounded p-1"/></div>
                                    </div>
                                    <button onClick={addCaption} disabled={!captionText} className="w-full bg-gray-800 hover:bg-blue-600 font-bold text-white p-2 rounded text-sm disabled:opacity-50 transition-colors">+ Thêm vào Track</button>
                                    
                                    <div className="relative mt-4 pt-4 border-t border-gray-800">
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-fuchsia-500/10 rounded-full blur-xl animate-pulse" />
                                        <button 
                                            onClick={handleAutoSubtitle} 
                                            disabled={isAITranscribing || !videoFile}
                                            className="w-full relative overflow-hidden bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 font-black text-white p-2.5 rounded text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_20px_rgba(192,38,211,0.5)]"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {isAITranscribing ? (
                                                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> ĐANG LẮNG NGHE AI...</>
                                                ) : (
                                                    <>✨ AUTO DỊCH PHỤ ĐỀ (AI)</>
                                                )}
                                            </span>
                                        </button>
                                        <p className="text-[9px] text-fuchsia-400 mt-2 text-center uppercase tracking-widest font-mono">Powered by Web3 Neural Net</p>
                                    </div>
                                </div>
                            )}
                            {activePanel === 'filters' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-white text-sm">Bộ Lọc</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FILTERS.map((f, i) => (
                                            <div key={i} onClick={() => setFilterIdx(i)} className={`cursor-pointer rounded overflow-hidden border-2 ${filterIdx === i ? 'border-blue-500' : 'border-transparent'}`}>
                                                <div className="h-16 bg-gradient-to-br from-gray-600 to-gray-800" style={{ filter: f.css }} />
                                                <div className="bg-gray-900 text-center text-xs py-1 text-gray-300">{f.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activePanel === 'adjust' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-white text-sm">Căn Chỉnh Màu</h4>
                                    {[['Độ sáng', brightness, setBrightness, 0, 200, '%'],['Tương phản', contrast, setContrast, 0, 200, '%'],['Bão hoà', saturation, setSaturation, 0, 200, '%']].map(([l,v,s,mn,mx,u]) => (
                                        <div key={l}>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{l}</span><span>{v}{u}</span></div>
                                            <input type="range" min={mn} max={mx} value={v} onChange={e=>s(+e.target.value)} className="w-full accent-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── CENTER PLAYER ── */}
                    <div className="flex-1 bg-[#0a0a0a] flex flex-col relative">
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div 
                                className="relative bg-black rounded shadow-2xl overflow-hidden max-w-full max-h-full aspect-video border border-gray-800 ring-1 ring-black/50 cursor-crosshair"
                                onMouseMove={handleCanvasMouseMove}
                            >
                                <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" style={{ filter: computedFilter(), transform: `rotate(${rotation}deg) scaleX(${flipH?-1:1}) scaleY(${flipV?-1:1})` }} onClick={togglePlay} onContextMenu={e => e.preventDefault()} />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                                
                                {/* Remote Cursors Overlay */}
                                {Object.values(remoteCursors).map(cursor => (
                                    <div 
                                        key={cursor.userId}
                                        className="absolute pointer-events-none transition-all duration-75"
                                        style={{ 
                                            left: `${cursor.x}%`, 
                                            top: `${cursor.y}%`,
                                            zIndex: 100 
                                        }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))` }}>
                                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 00-.85.35z" fill={cursor.color} stroke="white" strokeWidth="1.5"/>
                                        </svg>
                                        <div 
                                            className="absolute left-4 top-4 px-2 py-0.5 rounded text-[10px] font-black font-mono text-white shadow-lg tracking-widest uppercase whitespace-nowrap opacity-90"
                                            style={{ backgroundColor: cursor.color }}
                                        >
                                            {cursor.userName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Player Controls */}
                        <div className="h-12 bg-[#141414] border-t border-gray-800 flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center gap-4 text-gray-400">
                                <span className="text-xs font-mono">{fmt(currentTime)} / {fmt(duration)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 1)} className="hover:text-white">⏪ 1s</button>
                                <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-white">
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                                <button onClick={() => videoRef.current && (videoRef.current.currentTime += 1)} className="hover:text-white">1s ⏩</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Tốc độ: {speed}x</span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL (PROPERTIES) ── */}
                    <div className="w-72 bg-[#141414] border-l border-gray-800 p-4 overflow-y-auto custom-scrollbar shrink-0">
                        <h4 className="font-bold text-white text-sm border-b border-gray-800 pb-2 mb-4">Thuộc Tính</h4>
                        <div className="space-y-6">
                            {/* Trim Controls */}
                            <div>
                                <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Cắt Video (Trim)</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                        <p className="text-gray-500 mb-1">Bắt đầu</p>
                                        <input type="number" min={0} step={0.1} value={trimStart.toFixed(1)} onChange={e=>setTrimStart(+e.target.value)} className="w-full bg-transparent text-white outline-none" />
                                    </div>
                                    <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                        <p className="text-gray-500 mb-1">Kết thúc</p>
                                        <input type="number" step={0.1} value={trimEnd.toFixed(1)} onChange={e=>setTrimEnd(+e.target.value)} className="w-full bg-transparent text-white outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Audio Controls */}
                            <div>
                                <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Âm Thanh</h5>
                                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Âm lượng gốc</span><span>{Math.round(volume*100)}%</span></div>
                                <input type="range" min={0} max={2} step={0.05} value={volume} onChange={e=>setVolume(+e.target.value)} className="w-full accent-blue-500" />
                            </div>

                            {/* Transform Controls */}
                            <div>
                                <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Biến Đổi</h5>
                                <div className="flex gap-2 mb-2">
                                    <button onClick={()=>setRotation((rotation+90)%360)} className="flex-1 bg-gray-900 border border-gray-800 py-1.5 rounded text-xs hover:bg-gray-800">Xoay {rotation}°</button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={()=>setFlipH(!flipH)} className={`flex-1 py-1.5 rounded text-xs border ${flipH ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>Lật Ngang</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BOTTOM TIMELINE ── */}
            {isLoaded && (
                <div className="h-64 bg-[#111] border-t border-gray-800 flex flex-col shrink-0 relative z-10 w-full overflow-hidden">
                    <div className="h-8 bg-[#181818] border-b border-gray-800 flex items-center px-4 justify-between shrink-0 w-full">
                        <div className="text-xs text-gray-500 font-mono">TIMELINE KHUNG HÌNH (0 - {isNaN(duration) || duration <= 0 || duration === Infinity ? '0:00' : fmt(duration)})</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">Kéo chuột trên thước thời gian để seek</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar p-2 w-full">
                        
                        <div className="relative min-w-[1000px] h-full" style={{ width: '100%' }} ref={timelineRef}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                if(!timelineRef.current || !duration || isNaN(duration)) return;
                                const rect = timelineRef.current.getBoundingClientRect();
                                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                if (videoRef.current) videoRef.current.currentTime = pct * duration;
                                setDragging('seek');
                            }}>
                            {/* Time ruler */}
                            <div className="h-6 border-b border-gray-800 mb-2 relative select-none overflow-hidden group cursor-pointer pointer-events-none">
                                <div className="absolute inset-0 group-hover:bg-blue-500/10 transition-colors" />
                                {Array.from({length: Math.max(1, Math.min(1000, isNaN(duration) || duration <= 0 ? 1 : Math.ceil(duration/5)+1))}).map((_,i) => (
                                    <div key={i} className="absolute text-[8px] text-gray-500 group-hover:text-blue-400 transition-colors" style={{ left: `${duration > 0 ? (i*5/duration)*100 : 0}%` }}>
                                        | {fmt(i*5)}
                                    </div>
                                ))}
                            </div>

                            {/* TRACK 1: TEXT/CAPTIONS */}
                            <div className="h-10 w-full bg-gray-800/20 mb-1 relative rounded border border-gray-800/50 flex items-center">
                                <div className="absolute left-0 w-24 bg-[#141414] h-full flex items-center px-2 text-[10px] text-gray-500 font-bold border-r border-gray-800 z-10 select-none shadow-[2px_0_5px_rgba(0,0,0,0.5)]">T (Text)</div>
                                <div className="absolute left-24 right-0 h-full overflow-hidden">
                                    {captions.map(c => (
                                        <div key={c.id} className="absolute top-1 bottom-1 bg-gradient-to-r from-amber-600 to-amber-500 border border-amber-400 rounded cursor-pointer group shadow-md flex items-center justify-between px-2"
                                            style={{ left: pct(c.startTime), width: `calc(${pct(c.endTime)} - ${pct(c.startTime)})` }}>
                                            <span className="text-[10px] text-amber-50 font-bold truncate flex-1 drop-shadow-md">{c.text}</span>
                                            <button onClick={()=>removeCaption(c.id)} className="text-amber-100/50 hover:text-white px-1 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TRACK 2: MAIN VIDEO */}
                            <div className="h-20 w-full bg-gray-800/20 mb-1 relative rounded border border-gray-800/50 flex items-center">
                                <div className="absolute left-0 w-24 bg-[#141414] h-full flex items-center px-2 text-[10px] text-gray-500 font-bold border-r border-gray-800 z-10 select-none shadow-[2px_0_5px_rgba(0,0,0,0.5)]">V1 (Main)</div>
                                <div className="absolute left-24 right-0 h-full p-2 overflow-hidden">
                                    {/* Video Clip Block */}
                                    <div className="absolute top-2 bottom-2 bg-blue-600/30 border border-blue-500/80 rounded shadow-md overflow-hidden group"
                                        style={{ left: pct(trimStart), width: `calc(${pct(trimEnd)} - ${pct(trimStart)})` }}>
                                        <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)' }} />
                                        <span className="absolute left-3 top-1.5 text-[10px] text-blue-100 font-mono font-bold drop-shadow-md z-10 truncate right-3">{videoFile?.name}</span>
                                        {/* Trim Handles */}
                                        <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-500 hover:bg-white transition-all cursor-col-resize rounded-l flex items-center justify-center z-20 group-hover:w-5 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                            onMouseDown={(e)=>{e.stopPropagation(); setDragging('start');}}>
                                            <div className="w-0.5 h-6 bg-blue-900 opacity-50 rounded" />
                                        </div>
                                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-blue-500 hover:bg-white transition-all cursor-col-resize rounded-r flex items-center justify-center z-20 group-hover:w-5 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                            onMouseDown={(e)=>{e.stopPropagation(); setDragging('end');}}>
                                            <div className="w-0.5 h-6 bg-blue-900 opacity-50 rounded" />    
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Playhead Indicator */}
                            <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none transition-all duration-75 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                style={{ left: `calc(96px + (${pct(currentTime)} * (100% - 96px) / 100))` }}>
                                <div className="w-3 h-4 bg-red-500 absolute -top-1 -ml-[5px] rounded-sm clip-polygon-[50%_100%,_0_50%,_0_0,_100%_0,_100%_50%]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODALS ── */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-[#141414] border border-gray-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
                        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="bg-blue-600/20 text-blue-400 p-1.5 rounded-lg">🚀</span> Xuất Bản Video
                            </h3>
                            <button onClick={()=>setShowExportModal(false)} className="text-gray-500 hover:text-white bg-gray-900 hover:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center transition-all">✕</button>
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="flex gap-4 items-center bg-gray-900/50 p-3 rounded-xl border border-gray-800/50">
                                <div className="w-28 aspect-video bg-black rounded-lg border border-gray-700 flex-shrink-0 overflow-hidden relative shadow-inner">
                                    <video src={videoUrl} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-white mb-1 truncate" title={videoFile?.name}>{videoFile?.name}</p>
                                    <p className="text-xs font-mono text-gray-400 mb-0.5">Thời lượng: <span className="text-gray-200">{fmt(trimEnd-trimStart)}</span></p>
                                    <p className="text-xs font-mono text-gray-400">Dung lượng Ước tính: <span className="text-gray-200">~{((trimEnd-trimStart) * 1.5).toFixed(1)} MB</span></p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Độ Phân Giải</label>
                                    <div className="flex gap-2">
                                        {['720p', '1080p'].map(r => (
                                            <button key={r} onClick={()=>setExportRes(r)} className={`flex-1 py-2.5 rounded-lg border transition-all text-sm font-medium ${exportRes===r ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500' : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800'}`}>
                                                {r} {r === '1080p' && <span className="text-[10px] ml-1 bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text font-black">HD</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Tốc Độ Khung Hình (FPS)</label>
                                    <div className="flex gap-2">
                                        {['30', '60'].map(f => (
                                            <button key={f} onClick={()=>setExportFps(f)} className={`flex-1 py-2.5 rounded-lg border transition-all text-sm font-medium ${exportFps===f ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500' : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800'}`}>
                                                {f} fps
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {processing && (
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-blue-500/20 shadow-inner">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest animate-pulse">Đang Kết Xuất...</span>
                                            <span className="text-xs font-mono text-white">{processProgress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner mb-2 border border-gray-700/50">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 relative" style={{width: `${processProgress}%`}}>
                                                <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono text-center truncate">{processLog}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-t from-[#111] to-[#141414] border-t border-gray-800 flex justify-end gap-3">
                            {outputUrl ? (
                                <div className="w-full flex gap-3">
                                    <a href={outputUrl} download={`export_${videoFile?.name}`} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Tải Về Máy
                                    </a>
                                    <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
                                        {uploading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        {uploading ? 'Đang Tải Lên...' : 'Nộp Khách Hàng'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleRender} disabled={processing || !ffmpegLoaded} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                                    {processing ? 'Đang Khởi Tạo FFmpeg...' : 'Xác Nhận Xuất Bản'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default VideoEditor;
