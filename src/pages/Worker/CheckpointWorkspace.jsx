import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractsApi } from '../../api/contracts.api';
import { workSessionsApi } from '../../api/workSessions.api';
import { useToast } from '../../contexts/ToastContext';
import VideoEditor from './VideoEditor';
import AudioWaveform from '../../components/Workplace/AudioWaveform';
import { useSubtitleGenerator } from '../../hooks/useSubtitleGenerator';
import { useTranslation } from 'react-i18next';

/* ─── Helpers ─── */
function formatTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}
function formatMinutes(m) {
    if (!m) return '0m';
    const h = Math.floor(m / 60), min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}
function toSrtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60), ms = Math.round((sec % 1) * 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

const AUTOSAVE_MS = 8000;

const CheckpointWorkspace = () => {
    const { checkpointId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const STORAGE_KEY = `wsd_${checkpointId}`;

    /* ── State ── */
    const [checkpoint, setCheckpoint] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitFile, setSubmitFile] = useState(null);
    const [submitProgress, setSubmitProgress] = useState(0);

    /* AI Simulation */
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState(null);

    /* Draft state */
    const [notes, setNotes] = useState('');
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [subtitles, setSubtitles] = useState([{ id: 1, start: 0, end: 3, text: '' }]);

    /* Screen recorder */
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordMode, setRecordMode] = useState('screen');
    const mediaRecorderRef = useRef(null);
    const recordTimerRef = useRef(null);
    const liveVideoRef = useRef(null);

    /* Video upload */
    const [uploadedVideos, setUploadedVideos] = useState([]);
    const [activeVideo, setActiveVideo] = useState(null);
    const videoPlayerRef = useRef(null);
    const [currentVideoTime, setCurrentVideoTime] = useState(0);

    /* AI Subtitles */
    const { 
        status: aiStatus, 
        progress: aiProgress, 
        message: aiMessage, 
        generateSubtitles 
    } = useSubtitleGenerator();

    /* Refs for cleanup */
    const timerRef = useRef(null);
    const sessionRef = useRef(null);
    const notesRef = useRef('');
    const urlRef = useRef('');
    const subsRef = useRef([]);
    useEffect(() => { notesRef.current = notes; }, [notes]);
    useEffect(() => { urlRef.current = submissionUrl; }, [submissionUrl]);
    useEffect(() => { subsRef.current = subtitles; }, [subtitles]);

    /* ── Draft save / load ── */
    const saveDraft = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                notes: notesRef.current, url: urlRef.current,
                subtitles: subsRef.current, savedAt: new Date().toISOString()
            }));
            setLastSaved(new Date());
        } catch {}
    }, [STORAGE_KEY]);

    const loadDraft = useCallback(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const d = JSON.parse(raw);
                if (d.notes) setNotes(d.notes);
                if (d.url) setSubmissionUrl(d.url);
                if (d.subtitles?.length) setSubtitles(d.subtitles);
                if (d.savedAt) setLastSaved(new Date(d.savedAt));
            }
        } catch {}
    }, [STORAGE_KEY]);

    /* ── Sessions ── */
    const fetchSessions = useCallback(async () => {
        try {
            const res = await workSessionsApi.getSessions(checkpointId);
            const { sessions: s, totalMinutes: tm, activeSession: as } = res.data;
            setSessions(s || []);
            setTotalMinutes(tm || 0);
            if (as) {
                sessionRef.current = as;
                setCurrentSessionId(as.id);
                setElapsed(Math.floor((Date.now() - new Date(as.check_in).getTime()) / 1000));
            } else {
                sessionRef.current = null;
                setCurrentSessionId(null);
            }
        } catch {}
    }, [checkpointId]);

    /* ── Mount: auto check-in ── */
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const allRes = await contractsApi.getMyContracts();
                for (const ct of (allRes?.data || [])) {
                    const fullRes = await contractsApi.getContractById(ct.id);
                    const cp = (fullRes?.data?.checkpoints || []).find(c => String(c.id) === String(checkpointId));
                    if (cp) { setCheckpoint({ ...cp, contract: fullRes.data }); break; }
                }
            } catch {}

            loadDraft();
            await fetchSessions();

            if (!sessionRef.current) {
                try {
                    await workSessionsApi.checkIn(checkpointId);
                    await fetchSessions();
                    toast.success('SYS_MSG: Work session initiated');
                } catch {}
            }
            setLoading(false);
        };
        init();

        const autoSave = setInterval(saveDraft, AUTOSAVE_MS);

        const onUnload = () => {
            saveDraft();
            navigator.sendBeacon?.(`/api/work-sessions/${checkpointId}/checkout`,
                new Blob([JSON.stringify({ notes: notesRef.current })], { type: 'application/json' }));
        };

        const onVisibility = async () => {
            if (document.visibilityState === 'hidden') saveDraft();
            if (document.visibilityState === 'visible') await fetchSessions();
        };

        window.addEventListener('beforeunload', onUnload);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.removeEventListener('beforeunload', onUnload);
            document.removeEventListener('visibilitychange', onVisibility);
            clearInterval(autoSave);
            saveDraft();
            if (sessionRef.current) workSessionsApi.checkOut(checkpointId, notesRef.current).catch(() => {});
        };
    }, [checkpointId, fetchSessions, loadDraft, saveDraft]);

    /* Timer tick */
    useEffect(() => {
        if (currentSessionId) {
            timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        } else clearInterval(timerRef.current);
        return () => clearInterval(timerRef.current);
    }, [currentSessionId]);

    /* ── Screen Recorder ── */
    const startRecording = async () => {
        try {
            let stream;
            if (recordMode === 'screen') {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } else if (recordMode === 'camera') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } else {
                const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream = new MediaStream([...screen.getTracks(), ...cam.getAudioTracks()]);
            }

            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.play();
            }

            const chunks = [];
            const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
            mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
                setRecordedChunks(chunks);
                stream.getTracks().forEach(t => t.stop());
                if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
                clearInterval(recordTimerRef.current);
            };

            mr.start(1000);
            mediaRecorderRef.current = mr;
            setIsRecording(true);
            setRecordingTime(0);
            setRecordedUrl(null);
            recordTimerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            toast.error('Record fail: ' + err.message);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const downloadRecording = () => {
        if (!recordedUrl) return;
        const a = document.createElement('a');
        a.href = recordedUrl;
        a.download = `mission_log_${checkpointId}_${Date.now()}.webm`;
        a.click();
    };

    /* ── Video Upload ── */
    const handleVideoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newVideos = files.map(f => ({
            id: Date.now() + Math.random(),
            name: f.name,
            url: URL.createObjectURL(f),
            size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
        }));
        setUploadedVideos(prev => [...prev, ...newVideos]);
        if (!activeVideo && newVideos.length) setActiveVideo(newVideos[0]);
    };

    /* ── Subtitle helpers ── */
    const addSubtitle = () => {
        const last = subtitles[subtitles.length - 1];
        setSubtitles(prev => [...prev, { id: Date.now(), start: last.end, end: last.end + 3, text: '' }]);
    };
    const updateSub = (id, field, val) => setSubtitles(prev => prev.map(s => s.id === id ? { ...s, [field]: field === 'text' ? val : Number(val) } : s));
    const removeSub = (id) => setSubtitles(prev => prev.filter(s => s.id !== id));
    const exportSrt = () => {
        const content = subtitles.map((s, i) => `${i + 1}\n${toSrtTime(s.start)} --> ${toSrtTime(s.end)}\n${s.text}\n`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `log_subs_${checkpointId}.srt`;
        a.click();
    };
    const stampTime = () => {
        if (!videoPlayerRef.current) return;
        const t = videoPlayerRef.current.currentTime;
        const last = subtitles[subtitles.length - 1];
        if (last && !last.text) {
            updateSub(last.id, 'start', t);
            updateSub(last.id, 'end', t + 3);
        } else {
            setSubtitles(prev => [...prev, { id: Date.now(), start: t, end: t + 3, text: '' }]);
        }
    };

    const handleRunAI = async () => {
        if (!activeVideo) return toast.warning('Vui lòng tải video lên trước!');
        
        try {
            const videoFile = await fetch(activeVideo.url).then(r => r.blob()).then(blob => new File([blob], activeVideo.name, { type: blob.type }));
            
            const result = await generateSubtitles(videoFile);
            
            if (result && result.chunks) {
                const newSubs = result.chunks.map(chunk => ({
                    id: Date.now() + Math.random(),
                    start: chunk.timestamp[0],
                    end: chunk.timestamp[1],
                    text: chunk.text.trim()
                }));
                
                setSubtitles(prev => [...prev, ...newSubs].sort((a,b) => a.start - b.start));
                toast.success('AI: Đã tạo phụ đề thành công!');
            }
        } catch (err) {
            toast.error('AI Error: ' + err.message);
        }
    };

    /* ── AI Simulation logic ── */
    const runAIScan = () => {
        setIsScanning(true);
        setScanResults(null);
        setTimeout(() => {
            setIsScanning(false);
            setScanResults({
                bitrate: (Math.random() * 5 + 2).toFixed(2) + ' Mbps',
                codec: 'h.264 / avc1',
                scenes: Math.floor(Math.random() * 10) + 5,
                objects: ['Person', 'Vehicle', 'Urban_Background'].join(', '),
                confidence: '98.4%'
            });
            toast.success('AI_DECK: Scan protocol complete');
        }, 3000);
    };

    /* ── Frame Seek ── */
    const seekFrame = (dir) => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.currentTime += (dir * (1/30));
        }
    };

    /* ── Keyboard Shortcuts ── */
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlayManual(); }
            if (e.code === 'KeyJ') videoPlayerRef.current.currentTime -= 5;
            if (e.code === 'KeyL') videoPlayerRef.current.currentTime += 5;
            if (e.code === 'ArrowLeft') seekFrame(-1);
            if (e.code === 'ArrowRight') seekFrame(1);
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    const togglePlayManual = () => {
        if (!videoPlayerRef.current) return;
        if (videoPlayerRef.current.paused) videoPlayerRef.current.play();
        else videoPlayerRef.current.pause();
    };

    /* ── Submit (file upload) ── */
    const handleSubmit = async () => {
        if (!submitFile && !submissionUrl.trim()) {
            return toast.warning('Missing payload link or file.');
        }
        setSubmitting(true);
        setSubmitProgress(0);
        try {
            let finalUrl = submissionUrl.trim();
            if (submitFile) {
                const formData = new FormData();
                formData.append('file', submitFile, submitFile.name);
                const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/uploads/submission`, {
                    method: 'POST', credentials: 'include', body: formData,
                });
                if (!uploadRes.ok) throw new Error('Upload failed');
                const { url } = await uploadRes.json();
                finalUrl = url;
                setSubmitProgress(60);
            }

            if (sessionRef.current) await workSessionsApi.checkOut(checkpointId, notes);
            setSubmitProgress(80);

            await contractsApi.submitCheckpoint(Number(checkpointId), {
                submission_url: finalUrl,
                submission_notes: notes,
            });
            localStorage.removeItem(STORAGE_KEY);
            toast.success('SYS: Payload submitted successfully!');
            setShowSubmitModal(false);
            setSubmitProgress(100);
            navigate(-1);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failure');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Pause / Resume ── */
    const handlePause = async () => {
        try {
            await workSessionsApi.checkOut(checkpointId, notes);
            sessionRef.current = null; setCurrentSessionId(null); setElapsed(0);
            saveDraft(); await fetchSessions();
            toast.info('SESSION: Paused');
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };
    const handleResume = async () => {
        try {
            await workSessionsApi.checkIn(checkpointId);
            await fetchSessions(); toast.success('SESSION: Active');
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">Initializing Cyber-deck...</span>
            </div>
        </div>
    );

    const isTracking = !!currentSessionId;
    const isSubmitted = checkpoint?.status === 'SUBMITTED';
    const isApproved = checkpoint?.status === 'APPROVED';
    const bothSigned = checkpoint?.contract?.signature_worker && checkpoint?.contract?.signature_client;
    const canWork = !isApproved && bothSigned;

    if (checkpoint && !bothSigned) {
        return (
            <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-rose-900/10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(225,29,72,0.05) 10px, rgba(225,29,72,0.05) 20px)' }} />
                <div className="bg-[#090e17]/80 backdrop-blur-md border border-rose-500/50 rounded-2xl max-w-lg w-full p-8 text-center shadow-[0_0_50px_rgba(225,29,72,0.15)] relative z-10">
                    <div className="w-16 h-16 bg-rose-900/40 border border-rose-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                        <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-xl font-black text-rose-400 font-mono tracking-widest uppercase mb-4">KHÓA TRUY CẬP (ACCESS DENIED)</h2>
                    <p className="text-slate-400 font-mono text-sm leading-relaxed mb-8">
                        Hợp đồng này chưa được ký kết đầy đủ bởi cả hai bên. Vui lòng quay lại Dashboard để ký hợp đồng hoặc chờ khách hàng ký trước khi bắt đầu làm việc.
                    </p>
                    <button onClick={() => navigate(-1)} className="px-8 py-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 font-black font-mono text-[11px] uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                        TRỞ VỀ (RETURN)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans relative flex flex-col">
            {/* ── TOP BAR ── */}
            <header className="relative z-30 bg-[#090e17]/90 backdrop-blur-xl border-b border-cyan-500/30 px-6 py-4 sticky top-0 flex items-center justify-between shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-cyan-500 hover:text-cyan-400 font-mono text-[10px] uppercase tracking-[0.2em] transition-all">
                        <div className="w-8 h-8 rounded border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </div>
                        ABORT_MISSION
                    </button>
                    <div className="h-10 w-px bg-slate-800"></div>
                    <div>
                        <p className="text-[9px] text-cyan-500/50 font-mono tracking-[0.3em] uppercase mb-1">LOCAL_NODE_DECK</p>
                        <h1 className="text-base font-black text-white uppercase tracking-wider">{checkpoint?.title || 'UNNAMED_TASK'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">TOTAL_EFFORT</p>
                        <p className="text-xl font-black text-white font-mono">{formatMinutes(totalMinutes + (isTracking ? Math.floor(elapsed / 60) : 0))}</p>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center min-w-[120px] transition-all ${isTracking ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
                        <span className={`text-[10px] font-mono font-black mb-1 ${isTracking ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`}>
                            {isTracking ? 'SIGNAL_ACTIVE' : 'SIGNAL_IDLE'}
                        </span>
                        <span className={`text-2xl font-black font-mono tracking-tighter ${isTracking ? 'text-white' : 'text-slate-700'}`}>
                            {formatTime(elapsed)}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {canWork && (
                            isTracking
                                ? <button onClick={handlePause} className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black font-mono text-[10px] uppercase tracking-widest rounded transition-all">⏸ SUSPEND</button>
                                : <button onClick={handleResume} className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black font-mono text-[10px] uppercase tracking-widest rounded transition-all">▶️ INITIATE</button>
                        )}
                        <button onClick={() => setShowSubmitModal(true)} className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black font-mono text-[10px] uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                            🚀 UPLOAD_REPO
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MAIN WORKSPACE GRID ── */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-1 p-1 h-[calc(100vh-90px)] overflow-hidden">
                
                {/* LEFT COLUMN: VISUAL CONSOLE */}
                <div className="flex flex-col gap-1 overflow-hidden">
                    
                    {/* VIDEO PLAYER CONSOLE */}
                    <div className="flex-1 bg-[#090e17] rounded-sm relative group overflow-hidden border border-slate-800/50">
                        {activeVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-black relative">
                                <video 
                                    ref={videoPlayerRef}
                                    src={activeVideo.url}
                                    className="max-w-full max-h-full object-contain"
                                    onTimeUpdate={e => setCurrentVideoTime(e.target.currentTime)}
                                />
                                
                                {/* AI Scan Overlay */}
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-10">
                                        <div className="h-px w-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1)] animate-[scan_2s_linear_infinite]" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 backdrop-blur-sm">
                                                <p className="text-cyan-400 font-mono text-[10px] animate-pulse">EXTRACTING_MOTION_VECTORS...</p>
                                                <div className="h-1 w-full bg-cyan-900 mt-2 overflow-hidden">
                                                    <div className="h-full bg-cyan-400 w-1/2 animate-[loading_1s_linear_infinite]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Subtitle Preview Overlay */}
                                <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none z-10">
                                    {subtitles.find(s => currentVideoTime >= s.start && currentVideoTime <= s.end)?.text && (
                                        <p className="bg-black/80 px-4 py-2 rounded text-lg font-bold text-white border border-white/20 backdrop-blur-md">
                                            {subtitles.find(s => currentVideoTime >= s.start && currentVideoTime <= s.end).text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-10 text-center">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-800 text-6xl">🎬</div>
                                <div>
                                    <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest mb-2">Awaiting Visual Input</h3>
                                    <label className="cursor-pointer px-8 py-4 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full font-black font-mono text-[11px] uppercase tracking-[0.2em] transition-all">
                                        TẢI VIDEO LÊN (LOAD_MEDIA)
                                        <input type="file" accept="video/*" multiple onChange={handleVideoUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TIMELINE CONSOLE */}
                    <div className="h-[240px] bg-[#090e17] border-t border-slate-800 p-4 flex flex-col gap-4 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {[
                                    { id: 0, label: '💬 SUBTITLES' },
                                    { id: 1, label: '📊 SESSION_LOGS' },
                                    { id: 2, label: '📦 MEDIA_ASSETS' },
                                    { id: 3, label: '🤖 AI_ENGINE' }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-cyan-500 text-black font-black' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-mono text-cyan-500/70 uppercase">FRAME: {Math.floor(currentVideoTime * 30)}_P</div>
                                <div className="flex gap-1">
                                    <button onClick={() => seekFrame(-1)} className="p-2 hover:bg-slate-800 rounded text-slate-500">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    </button>
                                    <button onClick={togglePlayManual} className="p-2 bg-cyan-500/20 text-cyan-400 rounded-full hover:scale-110 transition-transform">
                                        {videoPlayerRef.current?.paused ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                        )}
                                    </button>
                                    <button onClick={() => seekFrame(1)} className="p-2 hover:bg-slate-800 rounded text-slate-500">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative group">
                            <AudioWaveform 
                                isPlaying={videoPlayerRef.current && !videoPlayerRef.current.paused} 
                                currentTime={currentVideoTime}
                                duration={videoPlayerRef.current?.duration || 0}
                            />
                            
                            {/* Playhead line */}
                            <div className="absolute top-0 bottom-0 w-px bg-white/50 z-20 pointer-events-none" style={{ left: `${(currentVideoTime / (videoPlayerRef.current?.duration || 1)) * 100}%` }}>
                                <div className="w-3 h-3 bg-white rounded-full -ml-[6px] -mt-1 shadow-[0_0_10px_white]" />
                            </div>

                            {activeTab === 0 && (
                                <div className="mt-4 flex flex-col gap-3 h-full overflow-hidden">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex gap-2">
                                            <button onClick={addSubtitle} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase tracking-widest rounded hover:bg-cyan-500/20 transition-all">+ MAN_ADD</button>
                                            <button 
                                                onClick={handleRunAI} 
                                                disabled={aiStatus !== 'idle'}
                                                className={`px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[9px] uppercase tracking-widest rounded hover:bg-indigo-500/20 transition-all flex items-center gap-2 ${aiStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {aiStatus === 'idle' ? '🤖 AUTO_GEN' : '🤖 PROCESSING...'}
                                            </button>
                                        </div>
                                        {aiStatus !== 'idle' && (
                                            <div className="flex-1 max-w-[200px] ml-4">
                                                <div className="flex justify-between text-[8px] font-mono text-indigo-400 mb-1">
                                                    <span className="truncate uppercase">{aiMessage}</span>
                                                    <span>{Math.round(aiProgress)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden border border-indigo-500/20">
                                                    <div 
                                                        className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                        style={{ width: `${aiProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-x-auto whitespace-nowrap custom-scrollbar pb-2">
                                        <div className="inline-flex gap-2">
                                            {subtitles.map((s, idx) => (
                                                <div key={s.id} className={`w-40 h-16 rounded border p-2 flex flex-col justify-between transition-all ${currentVideoTime >= s.start && currentVideoTime <= s.end ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-900/50 border-slate-800'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[8px] font-mono text-cyan-500/50">IDX_{idx + 1}</span>
                                                        <button onClick={() => removeSub(s.id)} className="text-slate-600 hover:text-rose-500">×</button>
                                                    </div>
                                                    <input 
                                                        value={s.text}
                                                        onChange={e => updateSub(s.id, 'text', e.target.value)}
                                                        className="bg-transparent text-[10px] text-white focus:outline-none w-full"
                                                        placeholder="Enter text..."
                                                    />
                                                    <div className="text-[7px] font-mono text-slate-500">T_{s.start.toFixed(1)} - {s.end.toFixed(1)}s</div>
                                                </div>
                                            ))}
                                            {subtitles.length === 0 && (
                                                <div className="w-full flex items-center justify-center p-8 text-[10px] font-mono text-slate-600 uppercase italic">
                                                    No subtitles yet. Click + or AI Gen.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 1 && (
                                <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1">
                                    {sessions.length > 0 ? sessions.map(s => (
                                        <div key={s.id} className="flex justify-between p-2 bg-slate-900/50 border border-slate-800 rounded">
                                            <span className="text-slate-500">SESSION_{s.id.toString().slice(-4)}</span>
                                            <span className="text-cyan-400">{formatMinutes(s.duration_minutes)} EFFORT</span>
                                            <span className="text-slate-600">{new Date(s.check_in).toLocaleTimeString()}</span>
                                        </div>
                                    )) : (
                                        <div className="h-full flex items-center justify-center text-slate-700 italic uppercase">No session records found.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 3 && (
                                <div className="mt-4 flex-1 flex flex-col gap-4">
                                    <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-lg flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 text-xl font-bold">🤖</div>
                                        <div>
                                            <h4 className="text-indigo-300 font-mono text-xs uppercase tracking-[.2em] mb-1">LOCAL_AI_TRANSCRIBER</h4>
                                            <p className="text-slate-500 font-mono text-[9px] uppercase">Whisper via Transformers.js (v3)</p>
                                        </div>
                                        
                                        {aiStatus === 'idle' ? (
                                            <button 
                                                onClick={handleRunAI}
                                                className="px-8 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-black font-mono text-[10px] uppercase tracking-widest rounded transition-all"
                                            >
                                                INITIATE_ENGINE
                                            </button>
                                        ) : (
                                            <div className="w-full space-y-2">
                                                <div className="flex justify-between text-[10px] font-mono text-indigo-400 uppercase">
                                                    <span>{aiMessage}</span>
                                                    <span>{Math.round(aiProgress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-indigo-500/20">
                                                    <div className="h-full bg-indigo-500 animate-pulse transition-all duration-300" style={{ width: `${aiProgress}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg flex-1 font-mono text-[9px] text-slate-500 uppercase overflow-y-auto custom-scrollbar">
                                        <p>&gt; STATUS: {aiStatus}</p>
                                        <p>&gt; {aiMessage}</p>
                                        {aiStatus === 'transcribing' && <p className="animate-pulse">&gt; SAMPLING_AUDIO_STREAMS...</p>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 2 && (
                                <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
                                    {uploadedVideos.map(v => (
                                        <button key={v.id} onClick={() => setActiveVideo(v)} className={`relative flex flex-col items-center gap-2 p-2 rounded transition-all shrink-0 ${activeVideo?.id === v.id ? 'bg-cyan-500/10 ring-1 ring-cyan-500' : 'bg-slate-900'}`}>
                                            <div className="w-24 h-16 bg-black rounded overflow-hidden flex items-center justify-center">
                                                <video src={v.url} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[8px] font-mono text-slate-400 w-24 truncate">{v.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CONTROL PANEL */}
                <div className="bg-[#090e17] border-l border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
                        
                        {/* DEPLOYMENT STATUS */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">MISSION_STATUS</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-900 border border-slate-800">
                                    <p className="text-[8px] font-mono text-slate-500 uppercase">ENCRYPTION</p>
                                    <p className="text-cyan-400 font-mono text-xs">AES-256_ACTIVE</p>
                                </div>
                                <div className="p-3 bg-slate-900 border border-slate-800">
                                    <p className="text-[8px] font-mono text-slate-500 uppercase">CAPCUT_SYNC</p>
                                    <p className="text-emerald-400 font-mono text-xs">READY</p>
                                </div>
                            </div>
                        </div>

                        {/* AI ANALYSIS HUB */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">AI_ANALYSIS</h4>
                                <button onClick={runAIScan} disabled={isScanning || !activeVideo} className="text-[8px] font-black font-mono text-cyan-400 hover:text-white bg-cyan-900/30 px-3 py-1 border border-cyan-500/30 rounded-full disabled:opacity-30 transition-all">
                                    {isScanning ? 'RUNNING_INIT...' : 'SCAN_MEDIA'}
                                </button>
                            </div>
                            
                            <div className="bg-[#02040a] border border-cyan-500/20 p-4 font-mono">
                                {scanResults ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500 uppercase">Codec_Integrity:</span>
                                            <span className="text-cyan-400 uppercase">{scanResults.codec}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500 uppercase">Object_Detect:</span>
                                            <span className="text-emerald-400 text-right w-1/2 truncate uppercase">{scanResults.objects}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500 uppercase">Confidence_Rating:</span>
                                            <span className="text-white uppercase">{scanResults.confidence}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-700 text-[10px] italic">
                                        Awaiting scan protocol...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MISSION NOTES (NOTES) */}
                        <div className="space-y-4 flex-1 flex flex-col">
                            <h4 className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">NOTES_EDITOR</h4>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="> INITIATING_LOGS..."
                                className="flex-1 w-full bg-[#02040a] border border-slate-800 p-4 font-mono text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/40 custom-scrollbar resize-none"
                            />
                        </div>
                    </div>

                    {/* ACTIONS DOCK */}
                    <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveTab(4)} className="py-3 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/50 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(129,140,248,0.2)]">
                                INTERNAL_EDITOR
                            </button>
                            <button onClick={exportSrt} className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono font-black text-[10px] uppercase tracking-widest rounded transition-all">
                                EXPORT_.SRT
                            </button>
                        </div>
                        <button 
                            onClick={() => {
                                const w = 1440; const h = 900;
                                const left = (window.screen.width / 2) - (w / 2);
                                const top = (window.screen.height / 2) - (h / 2);
                                window.open('https://www.capcut.com/editor', 'CapCutStudio', `width=${w},height=${h},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
                            }} 
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-black text-[10px] uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-400/30"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                            EDIT_IN_CAPCUT
                        </button>
                    </div>
                </div>
            </main>

            {/* Sub-panels Overlay (Editor, Submit, etc.) */}
            {activeTab === 4 && (
                <div className="fixed inset-0 z-50 bg-[#02040a] flex flex-col animate-in fade-in duration-300">
                    <header className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-sm font-black text-indigo-400 font-mono tracking-widest uppercase">INTERNAL_WASM_EDITOR_ACTIVE</h2>
                        <button onClick={() => setActiveTab(0)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white">✕</button>
                    </header>
                    <div className="flex-1 overflow-auto p-10">
                        <VideoEditor 
                            onSubmissionReady={(url) => { 
                                setSubmissionUrl(url); 
                                setActiveTab(0);
                                setShowSubmitModal(true); 
                            }} 
                        />
                    </div>
                </div>
            )}

    
            {/* MODALS */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-transparent/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#090e17] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                        
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">GỬI BÀI LÀM</h3>
                        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">
                            TỔNG THỜI GIAN LÀM: <span className="text-cyan-400 font-black tracking-normal ml-1 bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/20">{formatMinutes(totalMinutes + (isTracking ? Math.floor(elapsed / 60) : 0))}</span>
                        </p>

                        <div className="space-y-6">
                            {/* File Upload */}
                            <div>
                                <label className="text-[10px] font-black font-mono text-cyan-500 uppercase tracking-widest block mb-2">TẢI FILE LÊN</label>
                                <label className="block cursor-pointer">
                                    <div className={`border border-dashed rounded-xl p-6 text-center transition-all ${
                                        submitFile
                                            ? 'border-emerald-500/50 bg-emerald-900/10'
                                            : 'border-slate-700 bg-[#02040a] hover:border-cyan-500/50 hover:bg-cyan-900/5'
                                    }`}>
                                        {submitFile ? (
                                            <div className="space-y-2">
                                                <p className="text-2xl">{submitFile.type.startsWith('video') ? '🎥' : '📦'}</p>
                                                <p className="text-emerald-300 font-bold text-sm truncate uppercase font-mono">{submitFile.name}</p>
                                                <p className="text-emerald-500/70 text-[10px] font-mono tracking-widest uppercase">{(submitFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-2xl opacity-50 text-cyan-500">[+]</p>
                                                <p className="text-cyan-400 text-xs font-black uppercase font-mono tracking-widest">CHỌN FILE TỪ MÁY</p>
                                                <p className="text-slate-600 text-[9px] font-mono uppercase tracking-widest">TỐI ĐA 500MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" onChange={e => setSubmitFile(e.target.files?.[0] || null)} className="hidden" />
                                </label>
                            </div>

                            {/* Link Input */}
                            <div>
                                <label className="text-[10px] font-black font-mono text-indigo-400 uppercase tracking-widest block mb-2">HOẶC ĐƯỜNG DẪN NGOÀI</label>
                                <input type="url" value={submissionUrl} onChange={e => setSubmissionUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-[#02040a] border border-slate-700 rounded-lg px-4 py-3 text-indigo-200 placeholder-slate-700 text-sm focus:outline-none focus:border-indigo-500/50 font-mono" />
                            </div>

                            {/* Transmission Notes */}
                            <div>
                                <label className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block mb-2">GHI CHÚ CHO KHÁCH HÀNG</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                    placeholder="> Nhập ghi chú thêm..."
                                    className="w-full bg-[#02040a] border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-700 text-sm resize-none focus:outline-none focus:border-cyan-500/50 font-mono" />
                            </div>

                            {/* Submit Progress */}
                            {submitting && submitProgress > 0 && (
                                <div className="space-y-2">
                                    <div className="w-full bg-[#02040a] border border-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-cyan-500 h-full transition-all duration-500 relative">
                                            <div className="absolute inset-0 bg-white/30" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-cyan-500 font-mono uppercase tracking-widest text-right">
                                        {submitProgress < 60 ? 'UPLOADING...' : submitProgress < 90 ? 'SYNCING_DB...' : 'FINALIZING...'} {submitProgress}%
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowSubmitModal(false)} disabled={submitting} 
                                className="flex-1 py-3 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-black rounded-xl text-[11px] font-mono tracking-widest uppercase transition-all">
                                HỦY BỎ
                            </button>
                            <button onClick={handleSubmit} disabled={submitting || (!submitFile && !submissionUrl.trim())}
                                className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:grayscale transition-all flex items-center justify-center gap-2 text-[11px] font-mono tracking-widest uppercase">
                                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'XÁC NHẬN NỘP BÀI'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom scrollbar styles inside */}
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.6); }
            `}</style>
        </div>
    );
};

export default CheckpointWorkspace;
