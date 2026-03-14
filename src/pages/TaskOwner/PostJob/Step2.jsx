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
                        value={category?.id === 'other' ? 'other' : (category?.id || "")}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId === 'other') {
                                setCategory({ id: 'other', name: 'Other / Suggest New', isProposal: true });
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
                        <option value="other" className="bg-[#0f172a] text-fuchsia-400">++ {t('postjob.other_category', 'OTHER / SUGGEST NEW')} ++</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 transition-colors group-hover:text-fuchsia-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {category?.id === 'other' && (
                  <div className="mt-4 p-4 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-fuchsia-500/70 uppercase font-mono">Proposed Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. AI Image Generation"
                        className="w-full bg-black/30 border border-fuchsia-500/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-500/50 font-mono"
                        onChange={(e) => setCategory({ ...category, proposedName: e.target.value })}
                        value={category.proposedName || ''}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-fuchsia-500/70 uppercase font-mono">Details / Description</label>
                      <textarea 
                        placeholder="Describe this category..."
                        rows={2}
                        className="w-full bg-black/30 border border-fuchsia-500/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-500/50 font-mono resize-none"
                        onChange={(e) => setCategory({ ...category, proposedDescription: e.target.value })}
                        value={category.proposedDescription || ''}
                      />
                    </div>
                  </div>
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

          {/* PROJECT RESOURCES (NEW) */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>{t('postjob.resources_label', 'PROJECT_RESOURCES_&_ATTACHMENTS')}</span>
              <span className="text-[9px] text-cyan-500/50 italic capitalize">{t('postjob.resources_hint', 'MAX: 5 DOCUMENTS (IMG/VID)')}</span>
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Upload Trigger */}
                {resourceUrls.length < 5 && (
                    <label className="aspect-video relative group cursor-pointer border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden">
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    const response = await fetch('/api/uploads/submission', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    const result = await response.json();
                                    
                                    if (result.url) {
                                        setResourceUrls([...resourceUrls, result.url]);
                                    }
                                } catch (err) {
                                    console.error("Upload failed:", err);
                                }
                            }}
                        />
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">UPLOAD_DOC</span>
                        
                        {/* Scanner Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1/2 w-full animate-[scan_2s_infinite] pointer-events-none" />
                    </label>
                )}

                {/* Resource List */}
                {resourceUrls.map((url, idx) => (
                    <div key={idx} className="aspect-video relative rounded-xl border border-white/10 overflow-hidden group">
                        {url.match(/\.(mp4|webm|ogg)$/) ? (
                             <div className="w-full h-full bg-black/40 flex items-center justify-center">
                                <svg className="w-8 h-8 text-cyan-500/50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                             </div>
                        ) : (
                            <img src={url} alt={`Resource ${idx}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                             <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase truncate pr-2">DOC_{idx + 1}</span>
                             <button 
                                onClick={() => setResourceUrls(resourceUrls.filter((_, i) => i !== idx))}
                                className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                             >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx="true">{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(200%); }
                }
            `}</style>
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
