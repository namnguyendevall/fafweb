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
  onBack
}) => {
  const {
    t
  } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0
  });
  const getAttachmentUrl = url => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('cloudinary.com') && !url.includes('fl_attachment')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };
  const handleDownloadResource = resource => {
    const url = typeof resource === 'string' ? resource : resource.url;
    window.open(getAttachmentUrl(url), '_blank');
  };
  useEffect(() => {
    jobsApi.getCate().then(res => setCategories(res.data)).catch(console.error);
  }, []);
  return <div className="max-w-4xl mx-auto">
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
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder={t('postjob.job_title_pl', 'ENTER_JOB_TITLE...')} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-sm placeholder-slate-700 outline-none focus:border-fuchsia-500/50 transition-all uppercase tracking-wide" />
              </div>

              {/* CATEGORY */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  {t('postjob.category_label', 'SECTOR_CLASSIFICATION')}
                </label>
                <div className="relative group">
                    <select value={category?.id || ""} onChange={e => {
                const selectedId = e.target.value;
                if (selectedId === 'other') {
                  setCategory({
                    id: 'other',
                    name: ''
                  });
                } else {
                  const selectedCategory = categories.find(c => String(c.id) === selectedId);
                  setCategory(selectedCategory);
                }
              }} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all appearance-none uppercase tracking-widest">
                        <option value="" className="bg-[#0f172a]">{t('postjob.category_select', 'SELECT_CATEGORY')}</option>
                        {categories.map(c => <option key={c.id} value={c.id} className="bg-[#0f172a]">
                                {c.name.toUpperCase()}
                            </option>)}
                        <option value="other" className="bg-[#0f172a] text-yellow-400 font-bold">{t("auto.db_51ceca")}</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 transition-colors group-hover:text-fuchsia-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
                {/* Custom Category Input */}
                {category?.id === 'other' && <input type="text" autoFocus value={category.name} onChange={e => setCategory({
              id: 'other',
              name: e.target.value
            })} placeholder={t("auto.db_d8fd11")} className="w-full px-4 py-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg text-fuchsia-300 font-mono text-xs placeholder-fuchsia-500/50 outline-none focus:border-fuchsia-400 transition-all mt-2 uppercase tracking-wide" />}
              </div>
          </div>

          {/* JOB DESCRIPTION */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
              {t('postjob.job_desc_label', 'MISSION_PARAMETERS')}
            </label>
            <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={5} placeholder={t('postjob.job_desc_pl', 'INITIALIZE_TASK_DESCRIPTION...')} className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl text-slate-300 font-mono text-sm placeholder-slate-800 outline-none focus:border-fuchsia-500/50 transition-all leading-relaxed resize-none" />
          </div>

          {/* JOB DURATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                {t('postjob.start_date', 'EXECUTION_START')}
              </label>
              <input type="date" min={new Date().toISOString().split('T')[0]} value={startDate ? String(startDate).split('T')[0] : ''} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                {t('postjob.end_date', 'DEPLOYMENT_DEADLINE')}
              </label>
              <input type="date" min={startDate ? String(startDate).split('T')[0] : ''} value={endDate ? String(endDate).split('T')[0] : ''} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs outline-none focus:border-fuchsia-500/50 transition-all [color-scheme:dark]" />
            </div>
          </div>

          {/* SKILLS */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>{t('postjob.skills_req', 'MODULE_PREREQUISITES')}</span>
              <span className="text-[9px] text-fuchsia-500/50 italic capitalize">{t('postjob.skills_hint', 'MAX: 05 MODULES')}</span>
            </label>
            <div className="p-1 bg-black/20 rounded-xl border border-white/5">
                <SkillSelector selectedSkills={skills} onChange={setSkills} limit={5} variant="fuchsia" />
            </div>
          </div>

          {/* MATERIALS AND GOOGLE DRIVE LINK */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>ATTACHMENTS & MATERIALS</span>
              <span className="text-[9px] text-yellow-500 hover:text-yellow-400 transition-colors uppercase italic cursor-help" title="If your files are large, please upload them to Google Drive and paste the link here.">{t("auto.db_bcf05e")}</span>
            </label>
            <div className="flex flex-col gap-3">
               <input type="text" placeholder={t("auto.db_564ed6")} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs placeholder-slate-700 outline-none focus:border-fuchsia-500/50 transition-all font-sans" onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                setResourceUrls([...(resourceUrls || []), e.target.value.trim()]);
                e.target.value = '';
              }
            }} />
               <div className="flex items-center gap-4">
                    {isUploading ? <div className="inline-flex flex-col gap-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-fuchsia-400 font-mono text-[10px] animate-pulse">
                                <div className="w-3 h-3 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />{t("auto.db_783d77")}{uploadProgress.current}/{uploadProgress.total})...
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="bg-fuchsia-500 h-full transition-all duration-300" style={{
                    width: `${uploadProgress.current / uploadProgress.total * 100}%`
                  }} />
                            </div>
                        </div> : <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 hover:bg-slate-800 border border-white/10 rounded-lg transition-colors text-slate-300 font-mono text-[10px]">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{t("auto.db_e34fae")}<input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={async e => {
                  const files = Array.from(e.target.files || []);
                  const invalidFiles = files.filter(f => f.name.endsWith('.zip') || f.name.endsWith('.rar'));
                  if (invalidFiles.length > 0) {
                    toast.error(t("auto.db_73f313"));
                    return;
                  }
                  if (files.length > 0) {
                    try {
                      setIsUploading(true);
                      setUploadProgress({
                        current: 0,
                        total: files.length
                      });
                      const {
                        uploadApi
                      } = await import('../../../api/upload.api');
                      const newAssets = [];
                      for (let i = 0; i < files.length; i++) {
                        const res = await uploadApi.uploadSubmission(files[i], files[i].name);
                        if (res && res.url) {
                          newAssets.push({
                            url: res.url,
                            name: res.filename || files[i].name,
                            size: res.size || files[i].size
                          });
                        }
                        setUploadProgress(prev => ({
                          ...prev,
                          current: i + 1
                        }));
                      }
                      setResourceUrls([...(resourceUrls || []), ...newAssets]);
                    } catch (error) {
                      console.error("Upload failed:", error);
                    } finally {
                      setIsUploading(false);
                    }
                  }
                }} />
                      </label>}
                  <span className="text-[10px] text-slate-500 italic">{t("auto.db_3dd2ab")}</span>
               </div>
               
               {/* Display uploaded/added links */}
               {(resourceUrls || []).length > 0 && <div className="flex flex-col gap-2 mt-4">
                       {(resourceUrls || []).map((res, idx) => {
                const isObj = typeof res === 'object';
                const name = isObj ? res.name : res.split('/').pop().split('?')[0] || `Tài liệu ${idx + 1}`;
                const size = isObj && res.size ? (res.size / 1024).toFixed(1) + ' KB' : null;
                const isZip = name.toLowerCase().endsWith('.zip') || name.toLowerCase().endsWith('.rar');
                const isPdf = name.toLowerCase().endsWith('.pdf');
                const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                return <div key={idx} className="flex items-center justify-between group bg-white/5 border border-white/10 rounded-xl p-3 hover:border-fuchsia-500/30 transition-all hover:bg-white/[0.08]">
                               <div className="flex items-center gap-3 overflow-hidden">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isZip ? 'bg-amber-500/10 text-amber-500' : isPdf ? 'bg-rose-500/10 text-rose-500' : isImg ? 'bg-emerald-500/10 text-emerald-500' : 'bg-fuchsia-500/10 text-fuchsia-500'}`}>
                                   {isZip ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> : isPdf ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> : isImg ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                 </div>
                                 <div className="flex flex-col overflow-hidden">
                                   <button onClick={() => handleDownloadResource(res, idx)} className="text-xs font-mono text-slate-300 hover:text-fuchsia-400 truncate text-left transition-colors">
                                     {name}
                                   </button>
                                   {size && <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">{size}</span>}
                                 </div>
                               </div>
                               <button onClick={() => setResourceUrls((resourceUrls || []).filter((_, i) => i !== idx))} className="p-1 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                               </button>
                             </div>;
              })}
                   </div>}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-12 flex flex-col gap-4 relative z-10 pt-6 border-t border-white/5">
          <button onClick={onContinue} className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-[#020617] font-black font-mono text-xs tracking-[0.2em] uppercase rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all active:scale-[0.98]">
            {t('postjob.btn_continue', 'VERIFY_AND_CONTINUE')}
          </button>

          <button onClick={onBack} className="text-[10px] font-black font-mono tracking-widest uppercase text-slate-500 hover:text-white transition-colors">
             {t('postjob.btn_back', '<< PREVIOUS_PHASE')}
          </button>
        </div>
      </div>
    </div>;
};
export default Step2JobDetails;