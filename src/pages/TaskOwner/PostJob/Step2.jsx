import React, { useEffect, useState } from "react";
import { jobsApi } from "../../../api/jobs.api";
import SkillSelector from "../../../components/SkillSelector";
import { useTranslation } from "react-i18next";

const Step2JobDetails = ({
  jobTitle,
  setJobTitle,
  category,
  setCategory,
  jobDescription,
  setJobDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  skills,
  setSkills,
  resourceUrls,
  setResourceUrls,
  onContinue,
  onBack,
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleDownloadResource = async (url, index) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Extract filename or fallback to extension from MIME
        let filename = url.split('/').pop().split('?')[0];
        if (!filename || filename.length < 5 || !filename.includes('.')) {
            const mimeToExt = {
                'application/zip': 'zip',
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'application/octet-stream': 'zip' // Often raw files are zip
            };
            const ext = mimeToExt[blob.type] || blob.type.split('/')[1] || 'bin';
            filename = `attachment_${index + 1}.${ext}`;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Download failed:", error);
        window.open(url, '_blank'); // Fallback
    }
  };

  useEffect(() => {
    jobsApi
      .getCate()
      .then((res) => setCategories(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#090e17]/80 backdrop-blur-md rounded-2xl border border-white/5 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        
        {/* HEADER */}
        <div className="mb-10 relative z-10 border-b border-white/5 pb-6">
            <p className="text-[10px] font-mono font-black text-fuchsia-500 uppercase tracking-[0.3em] mb-2">{t('postjob.step2_subtitle', 'CORE_CONFIGURATION')}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-mono">
                {t('postjob.step2_title', 'JOB_DOSSIER_DETAILS')}
            </h1>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* JOB TITLE */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  {t('postjob.job_title_label', 'ID_DESIGNATION')}
                </label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t('postjob.job_title_pl', 'ENTER_JOB_TITLE...')}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm placeholder-slate-700 outline-none focus:border-fuchsia-500/50 transition-all uppercase tracking-wide"
                />
              </div>

              {/* CATEGORY */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  {t('postjob.category_label', 'SECTOR_CLASSIFICATION')}
                </label>
                <div className="relative group">
                    <select
                        value={category?.id || ""}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId === 'other') {
                                setCategory({ id: 'other', name: '' });
                            } else {
                                const selectedCategory = categories.find((c) => String(c.id) === selectedId);
                                setCategory(selectedCategory);
                            }
                        }}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all appearance-none uppercase tracking-widest"
                    >
                        <option value="" className="bg-[#0f172a]">{t('postjob.category_select', 'SELECT_CATEGORY')}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#0f172a]">
                                {c.name.toUpperCase()}
                            </option>
                        ))}
                        <option value="other" className="bg-[#0f172a] text-yellow-400 font-bold">● KHÁC (NHẬP TÙY CHỌN)...</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 transition-colors group-hover:text-fuchsia-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
                {/* Custom Category Input */}
                {category?.id === 'other' && (
                    <input
                        type="text"
                        autoFocus
                        value={category.name}
                        onChange={(e) => setCategory({ id: 'other', name: e.target.value })}
                        placeholder="Nhập tên danh mục bạn muốn..."
                        className="w-full px-4 py-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg text-fuchsia-300 font-mono text-xs placeholder-fuchsia-500/50 outline-none focus:border-fuchsia-400 transition-all mt-2 uppercase tracking-wide"
                    />
                )}
              </div>
          </div>

          {/* JOB DESCRIPTION */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
              {t('postjob.job_desc_label', 'MISSION_PARAMETERS')}
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
              placeholder={t('postjob.job_desc_pl', 'INITIALIZE_TASK_DESCRIPTION...')}
              className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl text-slate-300 font-mono text-sm placeholder-slate-800 outline-none focus:border-fuchsia-500/50 transition-all leading-relaxed resize-none"
            />
          </div>

          {/* JOB DURATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                {t('postjob.start_date', 'EXECUTION_START')}
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={startDate ? String(startDate).split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                {t('postjob.end_date', 'DEPLOYMENT_DEADLINE')}
              </label>
              <input
                type="date"
                min={startDate ? String(startDate).split('T')[0] : ''}
                value={endDate ? String(endDate).split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* SKILLS */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>{t('postjob.skills_req', 'MODULE_PREREQUISITES')}</span>
              <span className="text-[9px] text-fuchsia-500/50 italic capitalize">{t('postjob.skills_hint', 'MAX: 05 MODULES')}</span>
            </label>
            <div className="p-1 bg-black/20 rounded-xl border border-white/5">
                <SkillSelector 
                  selectedSkills={skills} 
                  onChange={setSkills} 
                  limit={5}
                  variant="fuchsia"
                />
            </div>
          </div>

          {/* MATERIALS AND GOOGLE DRIVE LINK */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>ATTACHMENTS & MATERIALS</span>
              <span className="text-[9px] text-yellow-500 hover:text-yellow-400 transition-colors uppercase italic cursor-help" title="If your files are large, please upload them to Google Drive and paste the link here.">
                Khuyến khích gửi link Google Drive
              </span>
            </label>
            <div className="flex flex-col gap-3">
               <input
                 type="text"
                 placeholder="Dán link Google Drive hoặc Dropbox vào đây..."
                 className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs placeholder-slate-700 outline-none focus:border-fuchsia-500/50 transition-all font-sans"
                 onKeyDown={(e) => {
                     if (e.key === 'Enter' && e.target.value.trim()) {
                         e.preventDefault();
                         setResourceUrls([...(resourceUrls || []), e.target.value.trim()]);
                         e.target.value = '';
                     }
                 }}
               />
               <div className="flex items-center gap-4">
                    {isUploading ? (
                        <div className="inline-flex flex-col gap-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-fuchsia-400 font-mono text-[10px] animate-pulse">
                                <div className="w-3 h-3 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                ĐANG TẢI LÊN ({uploadProgress.current}/{uploadProgress.total})...
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-fuchsia-500 h-full transition-all duration-300" 
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-slate-300 font-mono text-xs">
                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Tải lên tài liệu (Chọn nhiều file)
                        <input type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.zip,.rar" onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                                try {
                                    setIsUploading(true);
                                    setUploadProgress({ current: 0, total: files.length });
                                    const { uploadApi } = await import('../../../api/upload.api');
                                    
                                    const newUrls = [];
                                    for (let i = 0; i < files.length; i++) {
                                        const res = await uploadApi.uploadSubmission(files[i], files[i].name);
                                        if (res && res.url) {
                                            newUrls.push(res.url);
                                        }
                                        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
                                    }
                                    
                                    setResourceUrls([...(resourceUrls || []), ...newUrls]);
                                } catch (error) {
                                    console.error("Upload failed:", error);
                                } finally {
                                    setIsUploading(false);
                                }
                            }
                        }} />
                      </label>
                    )}
                  <span className="text-[10px] text-slate-500 italic">Hỗ trợ: ảnh, pdf, doc, zip, rar</span>
               </div>
               
               {/* Display uploaded/added links */}
               {(resourceUrls || []).length > 0 && (
                   <div className="flex flex-col gap-2 mt-2">
                       {(resourceUrls || []).map((url, idx) => (
                           <div key={idx} className="flex items-center justify-between text-xs px-3 py-2 bg-black/50 border border-fuchsia-500/20 rounded text-fuchsia-300 font-mono">
                               <button 
                                 onClick={() => handleDownloadResource(url, idx)} 
                                 className="truncate hover:underline max-w-[80%] text-left"
                               >
                                 {url.split('/').pop().split('?')[0] || `Tài liệu ${idx + 1}`}
                               </button>
                               <button onClick={() => setResourceUrls((resourceUrls || []).filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                                   ✕
                               </button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-12 flex flex-col gap-4 relative z-10 pt-6 border-t border-white/5">
          <button
            onClick={onContinue}
            className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-[#020617] font-black font-mono text-xs tracking-[0.2em] uppercase rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all active:scale-[0.98]"
          >
            {t('postjob.btn_continue', 'VERIFY_AND_CONTINUE')}
          </button>

          <button
            onClick={onBack}
            className="text-[10px] font-black font-mono tracking-widest uppercase text-slate-500 hover:text-white transition-colors"
          >
             {t('postjob.btn_back', '<< PREVIOUS_PHASE')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2JobDetails;
