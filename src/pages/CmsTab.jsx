import React, { useState, useEffect } from 'react';
import { Trash2, Monitor, Layout, Image as ImageIcon, CheckCircle2, Eye, EyeOff, Link as LinkIcon, Type, Save, Upload, BookOpen, Layers, X } from 'lucide-react';
import useCloudinary from '../utils/useCloudinary';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

// --- HELPER COMPONENTS ---

const ImageUploadBox = ({ label, field, value, onUpload, uploading }) => (
    <div className="relative group h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-300">
        {value ? (
            <img src={value} className="h-full w-full object-contain p-2" alt="Preview" />
        ) : (
            <div className="text-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 text-indigo-500 group-hover:scale-110 transition-transform">
                    <ImageIcon size={18} />
                </div>
                <span className="text-[10px] font-semibold">{label}</span>
            </div>
        )}
        <input 
            type="file" 
            onChange={(e) => onUpload(e.target.files[0], field)} 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            accept="image/*" 
        />
        {uploading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-indigo-600 animate-pulse">
                Uploading...
            </div>
        )}
    </div>
);

// 🟢 UPDATED: Now supports removing images
const AboutUsImageField = ({ label, field, val, onUpload, onRemove }) => (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors group">
        
        {/* Image Preview Area */}
        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 relative group-hover:shadow-md transition-all">
            {val ? (
                <>
                    <img src={val} className="w-full h-full object-cover" alt="Preview" />
                    {/* 🔴 Remove Button (Overlay) */}
                    <button 
                        onClick={(e) => { e.preventDefault(); onRemove(field); }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        title="Remove Image"
                    >
                        <Trash2 size={16} className="text-white hover:text-red-400 transition-colors" />
                    </button>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={16}/>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
            <div className="relative">
                <input 
                    type="file" 
                    onChange={(e) => onUpload(e.target.files[0], field)} 
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer w-full" 
                    accept="image/*"
                />
            </div>
        </div>
    </div>
);

const AboutUsSection = ({ title, children }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-shadow duration-500">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3">{title}</h3>
        {children}
    </div>
);

// --- MAIN COMPONENT ---

const CmsTab = () => {
  const [mainView, setMainView] = useState('banners'); 

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8 font-sans text-slate-600 space-y-10 animate-in fade-in duration-700">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-3xl font-light text-slate-800 tracking-tight">Content Manager</h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">Design your store's visual journey</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-50">
            <button 
                onClick={() => setMainView('banners')} 
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${mainView === 'banners' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                <Monitor size={16} /> Home Banners
            </button>
            <button 
                onClick={() => setMainView('about')} 
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${mainView === 'about' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                <BookOpen size={16} /> About Us Page
            </button>
        </div>
      </div>

      {mainView === 'banners' ? <BannerManager /> : <AboutUsManager />}
    </div>
  );
};

// --- SUB-COMPONENT: BANNER MANAGER ---
const BannerManager = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const { uploadImage, uploading } = useCloudinary();
  
  const [form, setForm] = useState({ 
    title: '', subtitle: '', imageUrl: '', link: '/products', buttonText: 'Shop Now',
    type: 'hero', layout: 'split',
    imageLayer1: '', imageLayer2: '', poeticLine: '', description: ''
  });

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cms/banners`);
      if (res.ok) setBanners(await res.json());
    } catch (err) { console.error(err); }
  };

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
    
    const res = await fetch(`${BACKEND_URL}/api/cms/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    
    if (res.ok) {
        fetchBanners();
        setForm({ 
            title: '', subtitle: '', imageUrl: '', link: '/products', buttonText: 'Shop Now', 
            type: 'hero', layout: 'split', imageLayer1: '', imageLayer2: '', poeticLine: '', description: '' 
        });
        if (window.toast) window.toast.success("Banner published successfully!");
    } else {
        if (window.toast) window.toast.error("Failed to publish banner.");
    }
  };

  const deleteBanner = async (id) => {
    if(!window.confirm("Delete this banner?")) return;
    await fetch(`${BACKEND_URL}/api/cms/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
    if (window.toast) window.toast.success("Banner deleted.");
  };

  const toggleActive = async (id, status) => {
    await fetch(`${BACKEND_URL}/api/cms/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !status })
    });
    fetchBanners();
    if (window.toast) window.toast.success(status ? "Banner hidden" : "Banner active");
  };

  const currentBanners = banners.filter(b => activeTab === 'hero' ? b.type === 'hero' : b.type === 'mid_section');

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Create Form */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 sticky top-8">
            <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
                {['hero', 'mid'].map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setForm(f => ({...f, layout: tab === 'hero' ? 'split' : 'full'})); }} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab === 'hero' ? 'Hero Section' : 'Mid Banner'}
                    </button>
                ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                {activeTab === 'hero' && (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div onClick={() => setForm({...form, layout: 'split'})} className={`cursor-pointer p-3 rounded-2xl border transition-all duration-300 ${form.layout === 'split' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <Monitor size={16} className={form.layout === 'split' ? "text-indigo-600" : "text-slate-400"}/>
                                {form.layout === 'split' && <CheckCircle2 size={14} className="text-indigo-600" />}
                            </div>
                            <span className="text-xs font-bold text-slate-700 block">Split View</span>
                        </div>
                        <div onClick={() => setForm({...form, layout: 'full'})} className={`cursor-pointer p-3 rounded-2xl border transition-all duration-300 ${form.layout === 'full' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <Layout size={16} className={form.layout === 'full' ? "text-indigo-600" : "text-slate-400"}/>
                                {form.layout === 'full' && <CheckCircle2 size={14} className="text-indigo-600" />}
                            </div>
                            <span className="text-xs font-bold text-slate-700 block">Full Banner</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <input type="text" placeholder="Main Title (Required)" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                    <input type="text" placeholder="Subtitle" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                    
                    {form.layout === 'split' && (
                        <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
                            <input type="text" placeholder="Poetic Line (e.g. Build A Legacy)" value={form.poeticLine} onChange={e => setForm({...form, poeticLine: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                            <textarea placeholder="Description Text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 h-20 resize-none" />
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <input type="text" placeholder="Link URL" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100" />
                        <input type="text" placeholder="Btn Text" value={form.buttonText} onChange={e => setForm({...form, buttonText: e.target.value})} className="w-1/3 px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium text-center focus:ring-2 focus:ring-indigo-100" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="col-span-2">
                        <ImageUploadBox label={form.layout === 'full' ? "Main Banner" : "Main Bottle"} field="imageUrl" value={form.imageUrl} onUpload={handleImageSelect} uploading={uploading} />
                    </div>
                    {form.layout === 'split' && (
                        <>
                            <ImageUploadBox label="Layer 1 (Back)" field="imageLayer1" value={form.imageLayer1} onUpload={handleImageSelect} uploading={uploading} />
                            <ImageUploadBox label="Layer 2 (Front)" field="imageLayer2" value={form.imageLayer2} onUpload={handleImageSelect} uploading={uploading} />
                        </>
                    )}
                </div>

                <button disabled={uploading || loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 hover:shadow-lg transition-all mt-4">
                    {loading ? "Publishing..." : "Publish Content"}
                </button>
            </form>
        </div>

        {/* RIGHT: List Display */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentBanners.map((b, idx) => (
                <div key={b.id} className="bg-white p-4 rounded-3xl shadow-[0_5px_20px_-5px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-50 mb-4 group-hover:ring-4 group-hover:ring-slate-50 transition-all">
                        <img src={b.imageUrl} className="w-full h-full object-cover" alt={b.title} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                            <button onClick={()=>toggleActive(b.id, b.isActive)} className="w-10 h-10 rounded-full bg-white text-indigo-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform">{b.isActive ? <Eye size={18}/> : <EyeOff size={18}/>}</button>
                            <button onClick={()=>deleteBanner(b.id)} className="w-10 h-10 rounded-full bg-white text-red-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                        </div>
                        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                            {b.layout === 'split' ? '3D Split' : 'Full Banner'}
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg truncate leading-tight">{b.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 truncate">{b.subtitle || 'No subtitle provided'}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center px-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            {b.isActive ? 'Active' : 'Draft'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">ID: {b.id.slice(0,6)}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

// --- SUB-COMPONENT: ABOUT US MANAGER ---
const AboutUsManager = () => {
  const { uploadImage, uploading } = useCloudinary();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    heroTitle: '', heroSubtitle: '', heroImage: '',
    foundersImage: '', foundersDesc: '', founder1Name: '', founder2Name: '',
    pillar1Title: '', pillar1Desc: '', pillar1Image: '',
    pillar2Title: '', pillar2Desc: '', pillar2Image: '',
    pillar3Title: '', pillar3Desc: '', pillar3Image: '',
    footerTitle: '', footerImageDesktop: '', footerImageMobile: ''
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/cms/about`).then(res => res.json()).then(d => d && setData(prev => ({ ...prev, ...d }))).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (file, fieldName) => {
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setData(prev => ({ ...prev, [fieldName]: url }));
  };

  // 🟢 NEW: Remove Image Function
  const handleRemoveImage = (fieldName) => {
    setData(prev => ({ ...prev, [fieldName]: "" })); // Clear the field
  };

  const handleSave = async () => {
    setLoading(true);
    const { id, createdAt, ...payload } = data;
    const res = await fetch(`${BACKEND_URL}/api/cms/about`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setLoading(false);
    if(res.ok) {
        if(window.toast) window.toast.success("About Us page updated successfully!");
    } else {
        if(window.toast) window.toast.error("Failed to update.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-end sticky top-6 z-20">
            <button onClick={handleSave} disabled={loading || uploading} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-105 transition-all flex items-center gap-2 transform active:scale-95">
                {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
            </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            <AboutUsSection title="Hero Section">
                <div className="space-y-3">
                    <input name="heroTitle" placeholder="Title" value={data.heroTitle} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 border-none" />
                    <input name="heroSubtitle" placeholder="Subtitle" value={data.heroSubtitle} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 border-none" />
                </div>
                {/* 🟢 PASSING handleRemoveImage */}
                <AboutUsImageField label="Hero Bottle Image" field="heroImage" val={data.heroImage} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
            </AboutUsSection>

            <AboutUsSection title="Founders">
                <AboutUsImageField label="Founders Photo" field="foundersImage" val={data.foundersImage} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
                <textarea name="foundersDesc" placeholder="Description" value={data.foundersDesc} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 border-none h-28 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                    <input name="founder1Name" placeholder="Name 1" value={data.founder1Name} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 border-none" />
                    <input name="founder2Name" placeholder="Name 2" value={data.founder2Name} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 border-none" />
                </div>
            </AboutUsSection>
        </div>

        <AboutUsSection title="Pillars (Horizontal Scroll)">
            <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map(num => (
                    <div key={num} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Pillar {num}</p>
                            <div className="w-8 h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden relative group">
                                {data[`pillar${num}Image`] ? (
                                    <>
                                        <img src={data[`pillar${num}Image`]} className="w-full h-full object-cover"/>
                                        <button onClick={() => handleRemoveImage(`pillar${num}Image`)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                                    </>
                                ) : <ImageIcon size={12} className="text-slate-300"/>}
                            </div>
                        </div>
                        <input name={`pillar${num}Title`} placeholder="Title" value={data[`pillar${num}Title`]} onChange={handleChange} className="w-full p-2 bg-white rounded-lg text-xs font-bold border-none shadow-sm focus:ring-1 focus:ring-indigo-200" />
                        <textarea name={`pillar${num}Desc`} placeholder="Description" value={data[`pillar${num}Desc`]} onChange={handleChange} className="w-full p-2 bg-white rounded-lg text-xs border-none shadow-sm h-16 resize-none focus:ring-1 focus:ring-indigo-200" />
                        
                        <div className="relative">
                            <input type="file" onChange={(e) => handleImageUpload(e.target.files[0], `pillar${num}Image`)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            <button className="w-full py-1.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-50 transition-colors">Change Image</button>
                        </div>
                    </div>
                ))}
            </div>
        </AboutUsSection>

        <AboutUsSection title="Footer Parallax">
            <input name="footerTitle" placeholder="Footer Title" value={data.footerTitle} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-100" />
            <div className="grid md:grid-cols-2 gap-6">
                <AboutUsImageField label="Desktop Background" field="footerImageDesktop" val={data.footerImageDesktop} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
                <AboutUsImageField label="Mobile Background" field="footerImageMobile" val={data.footerImageMobile} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
            </div>
        </AboutUsSection>
    </div>
  );
};

export default CmsTab;