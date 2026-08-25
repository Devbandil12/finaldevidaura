import React, { useState } from 'react';
import { Monitor, Layout, CheckCircle2, Eye, EyeOff, Trash2, Image as ImageIcon } from 'lucide-react';
import { useBanners, useCreateBanner, useDeleteBanner, useToggleBanner } from '../../../cms/hooks/useCms';
import useCloudinary from '../../../../hooks/useCloudinary';

const ImageUploadBox = ({ label, field, value, onUpload, uploading }) => (
    <div className="relative group h-32 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center overflow-hidden hover:border-[var(--brand)] hover:bg-[var(--surface-muted)] transition-all duration-300 cursor-pointer font-body">
        {value ? (
            <img src={value} className="h-full w-full object-contain p-2 blend-luxury group-hover:scale-105 transition-transform duration-500 ease-out" alt="Preview" />
        ) : (
            <div className="text-center text-[var(--muted)] group-hover:text-[var(--brand)] transition-colors">
                <div className="w-10 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-[var(--muted)] group-hover:text-[var(--brand)] group-hover:scale-110 transition-all duration-300">
                    <ImageIcon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
        )}
        <input 
            type="file" 
            onChange={(e) => onUpload(e.target.files[0], field)} 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            accept="image/*" 
            title={`Upload ${label}`}
        />
        {uploading && (
            <div className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-sm flex items-center justify-center text-[11px] font-bold tracking-widest uppercase text-[var(--brand)] animate-pulse z-20">
                Uploading...
            </div>
        )}
    </div>
);

const BannerManager = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const { data: banners = [], isLoading: loadingBanners } = useBanners();
  const { mutateAsync: createBannerMutation, isPending: creating } = useCreateBanner();
  const { mutateAsync: deleteBannerMutation } = useDeleteBanner();
  const { mutateAsync: toggleBannerMutation } = useToggleBanner();
  const [loading, setLoading] = useState(false);
  const { uploadImage, uploading } = useCloudinary();
  
  const [form, setForm] = useState({ 
    title: '', subtitle: '', imageUrl: '', link: '/products', buttonText: 'Shop Now',
    type: 'hero', layout: 'split',
    imageLayer1: '', imageLayer2: '', poeticLine: '', description: '',
    templateType: 'standard',
    config: {}
  });

  const handleImageSelect = async (file, field = 'imageUrl') => {
    if (file) {
      const url = await uploadImage(file);
      if (url) setForm(prev => ({ ...prev, [field]: url }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, type: activeTab === 'hero' ? 'hero' : 'mid_section' };
    
    try {
        await createBannerMutation(payload);
        setForm({ 
            title: '', subtitle: '', imageUrl: '', link: '/products', buttonText: 'Shop Now', 
            type: 'hero', layout: 'split', imageLayer1: '', imageLayer2: '', poeticLine: '', description: '',
            templateType: 'standard', config: {} 
        });
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const deleteBanner = async (id) => {
    if(!window.confirm("Delete this banner?")) return;
    try {
        await deleteBannerMutation(id);
    } catch(err) {
        console.error(err);
    }
  };

  const toggleActive = async (id, status) => {
    try {
        await toggleBannerMutation({ id, isActive: !status });
    } catch(err) {
        console.error(err);
    }
  };

  const currentBanners = banners.filter(b => activeTab === 'hero' ? b.type === 'hero' : b.type === 'mid_section');
  const inputClasses = "w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]";

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start animate-fadeIn font-body pb-20">
        
        {/* LEFT: Create Form */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[var(--surface)] p-6 md:p-8 rounded-[2rem] shadow-[var(--shadow)] border border-[var(--border)] sticky top-24">
            
            <div className="flex bg-[var(--surface)] p-1.5 rounded-xl mb-8 border border-[var(--border)] shadow-sm">
                {['hero', 'mid'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => { setActiveTab(tab); setForm(f => ({...f, layout: tab === 'hero' ? 'split' : 'full'})); }} 
                      className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === tab ? 'bg-[var(--brand)] text-[var(--surface)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'}`}
                    >
                        {tab === 'hero' ? 'Hero Section' : 'Mid Banner'}
                    </button>
                ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* HERO TAB LAYOUT SELECTOR */}
                {activeTab === 'hero' && (
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div onClick={() => setForm({...form, layout: 'split'})} className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 ${form.layout === 'split' ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <Monitor size={18} strokeWidth={1.5} className={form.layout === 'split' ? "text-[var(--brand)]" : "text-[var(--muted)]"}/>
                                {form.layout === 'split' && <CheckCircle2 size={16} strokeWidth={2.5} className="text-[var(--brand)]" />}
                            </div>
                            <span className="text-xs font-bold text-[var(--text)] block tracking-wide">Split View</span>
                        </div>
                        <div onClick={() => setForm({...form, layout: 'full'})} className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 ${form.layout === 'full' ? 'bg-[var(--accent-soft)] border-[var(--brand)] shadow-sm' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <Layout size={18} strokeWidth={1.5} className={form.layout === 'full' ? "text-[var(--brand)]" : "text-[var(--muted)]"}/>
                                {form.layout === 'full' && <CheckCircle2 size={16} strokeWidth={2.5} className="text-[var(--brand)]" />}
                            </div>
                            <span className="text-xs font-bold text-[var(--text)] block tracking-wide">Full Banner</span>
                        </div>
                    </div>
                )}

                {/* MID TAB ADVANCED TEMPLATE SELECTOR */}
                {activeTab === 'mid' && (
                    <div className="space-y-4 p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] mb-6 animate-in fade-in">
                        <label className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest block">Select Banner Design</label>
                        <div className="relative">
                          <select 
                              value={form.templateType} 
                              onChange={e => setForm({...form, templateType: e.target.value, config: {}})}
                              className="w-full py-3.5 px-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none shadow-sm appearance-none cursor-pointer transition-all"
                          >
                              <option value="standard">Standard (Image Left / Text Right)</option>
                              <option value="coupon">Coupon Code Banner</option>
                              <option value="countdown">Flash Sale Countdown</option>
                              <option value="full_video">Full Width Cinematic (Image/Video)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>

                        {/* DYNAMIC CONFIG FIELDS BASED ON SELECTION */}
                        {form.templateType === 'coupon' && (
                            <div className="flex gap-3 animate-in slide-in-from-top-2 pt-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest block mb-2">Coupon Code</label>
                                    <input type="text" placeholder="e.g. DIWALI50" value={form.config?.couponCode || ''} onChange={e => setForm({...form, config: { ...form.config, couponCode: e.target.value }})} className={inputClasses} required />
                                </div>
                                <div className="w-20">
                                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest block mb-2">Color</label>
                                    <input type="color" value={form.config?.bgColor || '#fef3c7'} onChange={e => setForm({...form, config: { ...form.config, bgColor: e.target.value }})} className="w-full h-[48px] p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl cursor-pointer shadow-sm" title="Background Color" />
                                </div>
                            </div>
                        )}

                        {form.templateType === 'countdown' && (
                            <div className="animate-in slide-in-from-top-2 pt-2">
                                <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest block mb-2">Sale End Date & Time</label>
                                <input type="datetime-local" value={form.config?.endDate || ''} onChange={e => setForm({...form, config: { ...form.config, endDate: e.target.value }})} className={inputClasses} required />
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <input type="text" placeholder="Main Title (Required)" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputClasses} />
                    <input type="text" placeholder="Subtitle" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className={inputClasses} />
                    
                    {form.layout === 'split' && activeTab === 'hero' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <input type="text" placeholder="Poetic Line (e.g. Build A Legacy)" value={form.poeticLine} onChange={e => setForm({...form, poeticLine: e.target.value})} className={inputClasses} />
                            <textarea placeholder="Description Text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputClasses} h-24 resize-none leading-relaxed`} />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <input type="text" placeholder="Link URL" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className={inputClasses} />
                        <input type="text" placeholder="Btn Text" value={form.buttonText} onChange={e => setForm({...form, buttonText: e.target.value})} className={`${inputClasses} w-1/3 text-center`} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="col-span-2">
                        <ImageUploadBox label={form.layout === 'full' || activeTab === 'mid' ? "Main Banner Image/Video" : "Main Bottle"} field="imageUrl" value={form.imageUrl} onUpload={handleImageSelect} uploading={uploading} />
                    </div>
                    {form.layout === 'split' && activeTab === 'hero' && (
                        <>
                            <ImageUploadBox label="Layer 1 (Back)" field="imageLayer1" value={form.imageLayer1} onUpload={handleImageSelect} uploading={uploading} />
                            <ImageUploadBox label="Layer 2 (Front)" field="imageLayer2" value={form.imageLayer2} onUpload={handleImageSelect} uploading={uploading} />
                        </>
                    )}
                </div>

                <button disabled={uploading || loading || creating} className="w-full py-4 bg-[var(--brand)] hover:brightness-110 text-[var(--bg)] font-bold text-sm rounded-xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-all mt-6 button-hero relative flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading || creating ? "Publishing..." : "Publish Content"}
                    {!loading && !creating && !uploading && <div className="pulse border-[#F5F1E8]"></div>}
                </button>
            </form>
        </div>

        {/* RIGHT: List Display */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentBanners.map((b) => (
                <div key={b.id} className="bg-[var(--surface)] p-5 rounded-[2rem] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] hover:border-[var(--border)] flex flex-col group transition-all duration-300 cursor-default">
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] mb-5 group-hover:border-[var(--brand)] transition-colors">
                        
                        {/* Support Video Previews for Full Video Banners */}
                        {b.imageUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                             <video src={b.imageUrl} className="w-full h-full object-cover" muted />
                        ) : (
                             <img src={b.imageUrl} className="w-full h-full object-cover blend-luxury group-hover:scale-105 transition-transform duration-500 ease-out" alt={b.title} />
                        )}
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                            <button 
                              onClick={()=>toggleActive(b.id, b.isActive)} 
                              className="w-12 h-12 rounded-full bg-[var(--surface)] text-[var(--brand)] shadow-sm border border-[var(--border)] flex items-center justify-center hover:scale-110 transition-transform"
                              title={b.isActive ? "Deactivate" : "Activate"}
                            >
                              {b.isActive ? <Eye size={20} strokeWidth={1.5}/> : <EyeOff size={20} strokeWidth={1.5}/>}
                            </button>
                            <button 
                              onClick={()=>deleteBanner(b.id)} 
                              className="w-12 h-12 rounded-full bg-[var(--surface)] text-[var(--error)] shadow-sm border border-[var(--border)] flex items-center justify-center hover:scale-110 hover:bg-[var(--error)] hover:text-[var(--bg)] hover:border-[var(--error)] transition-all"
                              title="Delete Banner"
                            >
                              <Trash2 size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                        
                        {/* Dynamic Tag label based on template/type */}
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-md text-[10px] font-bold uppercase tracking-widest text-[var(--sub)] shadow-sm">
                            {b.type === 'hero' 
                                ? (b.layout === 'split' ? '3D Split' : 'Full Hero') 
                                : (b.templateType === 'coupon' ? 'Coupon Banner' : b.templateType === 'countdown' ? 'Flash Sale' : b.templateType === 'full_video' ? 'Video Banner' : 'Standard Mid')}
                        </div>
                    </div>
                    
                    <h4 className="font-body font-bold text-[var(--text)] text-lg truncate tracking-tight">{b.title}</h4>
                    <p className="font-body text-xs font-bold text-[var(--sub)] mt-1 truncate">{b.subtitle || 'No subtitle provided'}</p>
                    
                    <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                        <span className={`font-body text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${b.isActive ? 'bg-[var(--surface)] text-[var(--success)] border-[var(--border)]' : 'bg-[var(--surface-muted)] text-[var(--muted)] border-transparent'}`}>
                            {b.isActive ? 'Active' : 'Draft'}
                        </span>
                        <span className="font-body text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase">ID: {b.id.slice(0,6)}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default BannerManager;