import React, { useState, useEffect } from 'react';
import { Save, Trash2, Image as ImageIcon } from 'lucide-react';
import useCloudinary from '../../../../hooks/useCloudinary';
import { useAboutUs, useUpdateAboutUs } from '../../../cms/hooks/useCms';

const AboutUsImageField = ({ label, field, val, onUpload, onRemove }) => (
    <div className="flex items-center gap-5 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] transition-colors group">
        <div className="w-16 h-16 bg-[var(--surface)] rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 relative shadow-sm group-hover:border-[var(--brand)] transition-all duration-300">
            {val ? (
                <>
                    <img src={val} className="w-full h-full object-cover blend-luxury" alt="Preview" />
                    <button 
                        onClick={(e) => { e.preventDefault(); onRemove(field); }}
                        className="absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 text-[var(--text)] hover:text-[var(--error)]"
                        title="Remove Image"
                    >
                        <Trash2 size={18} strokeWidth={2} className="transition-colors" />
                    </button>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                    <ImageIcon size={20} strokeWidth={1.5} />
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-body text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 transition-colors group-hover:text-[var(--brand)]">{label}</p>
            <div className="relative">
                <input 
                    type="file" 
                    onChange={(e) => onUpload(e.target.files[0], field)} 
                    className="font-body text-xs font-bold text-[var(--muted)] file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[var(--surface-muted)] file:text-[var(--brand)] hover:file:bg-[var(--border)] cursor-pointer w-full transition-all" 
                    accept="image/*"
                />
            </div>
        </div>
    </div>
);

const AboutUsSection = ({ title, children }) => (
    <div className="bg-[var(--surface)] p-6 md:p-8 rounded-3xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] border border-[var(--border)] hover:border-[var(--border)] space-y-6 transition-all duration-500">
        <h3 className="font-display text-2xl font-medium text-[var(--text)] border-b border-[var(--border)] pb-4 tracking-tight">{title}</h3>
        {children}
    </div>
);

const AboutUsManager = () => {
  const { uploadImage, uploading } = useCloudinary();
  const [loading, setLoading] = useState(false);
  const { data: initialData, isLoading } = useAboutUs();
  const { mutateAsync: updateAboutUsMutation } = useUpdateAboutUs();
  
  const [data, setData] = useState({
    heroTitle: '', heroSubtitle: '', heroImage: '',
    foundersImage: '', foundersDesc: '', founder1Name: '', founder2Name: '',
    pillar1Title: '', pillar1Desc: '', pillar1Image: '',
    pillar2Title: '', pillar2Desc: '', pillar2Image: '',
    pillar3Title: '', pillar3Desc: '', pillar3Image: '',
    footerTitle: '', footerImageDesktop: '', footerImageMobile: ''
  });

  useEffect(() => {
    if (initialData) {
      setData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (file, fieldName) => {
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setData(prev => ({ ...prev, [fieldName]: url }));
  };

  const handleRemoveImage = (fieldName) => {
    setData(prev => ({ ...prev, [fieldName]: "" })); 
  };

  const handleSave = async () => {
    setLoading(true);
    const { id, createdAt, ...payload } = data;
    try {
        await updateAboutUsMutation(payload);
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const inputClasses = "w-full p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder-[var(--muted)]";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn font-body">
        <div className="flex justify-end sticky top-20 z-20 mb-6">
            <button 
              onClick={handleSave} 
              disabled={loading || uploading} 
              className="px-8 py-3.5 bg-[var(--brand)] hover:brightness-110 text-[var(--bg)] font-body font-bold text-sm rounded-xl shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition-all flex items-center gap-2 disabled:opacity-50 button-hero"
            >
                {loading ? <span className="animate-pulse">Saving...</span> : <><Save size={18} strokeWidth={2.5} /> Save Changes</>}
                {!loading && !uploading && <div className="pulse border-[#F5F1E8]"></div>}
            </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            <AboutUsSection title="Hero Section">
                <div className="space-y-4">
                    <input name="heroTitle" placeholder="Main Title" value={data.heroTitle} onChange={handleChange} className={inputClasses} />
                    <input name="heroSubtitle" placeholder="Subtitle" value={data.heroSubtitle} onChange={handleChange} className={inputClasses} />
                </div>
                <AboutUsImageField label="Hero Bottle Image" field="heroImage" val={data.heroImage} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
            </AboutUsSection>

            <AboutUsSection title="Founders">
                <AboutUsImageField label="Founders Photo" field="foundersImage" val={data.foundersImage} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
                <textarea name="foundersDesc" placeholder="Founders Description" value={data.foundersDesc} onChange={handleChange} className={`${inputClasses} h-32 resize-none leading-relaxed`} />
                <div className="grid grid-cols-2 gap-4">
                    <input name="founder1Name" placeholder="Founder 1 Name" value={data.founder1Name} onChange={handleChange} className={inputClasses} />
                    <input name="founder2Name" placeholder="Founder 2 Name" value={data.founder2Name} onChange={handleChange} className={inputClasses} />
                </div>
            </AboutUsSection>
        </div>

        <AboutUsSection title="Pillars (Horizontal Scroll)">
            <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(num => (
                    <div key={num} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] transition-colors duration-300 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <p className="font-body text-[11px] font-bold text-[var(--brand)] uppercase tracking-widest">Pillar {num}</p>
                            <div className="w-10 h-10 bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-center overflow-hidden relative group shadow-sm">
                                {data[`pillar${num}Image`] ? (
                                    <>
                                        <img src={data[`pillar${num}Image`]} className="w-full h-full object-cover blend-luxury" alt={`Pillar ${num}`} />
                                        <button 
                                          onClick={() => handleRemoveImage(`pillar${num}Image`)} 
                                          className="absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm flex items-center justify-center text-[var(--text)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </>
                                ) : <ImageIcon size={16} strokeWidth={1.5} className="text-[var(--muted)]"/>}
                            </div>
                        </div>
                        <input name={`pillar${num}Title`} placeholder={`Pillar ${num} Title`} value={data[`pillar${num}Title`]} onChange={handleChange} className={`${inputClasses} p-3 text-xs`} />
                        <textarea name={`pillar${num}Desc`} placeholder={`Pillar ${num} Description`} value={data[`pillar${num}Desc`]} onChange={handleChange} className={`${inputClasses} p-3 text-xs h-20 resize-none leading-relaxed`} />
                        
                        <div className="relative mt-2">
                            <input type="file" onChange={(e) => handleImageUpload(e.target.files[0], `pillar${num}Image`)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" title="Change Image" />
                            <button className="w-full py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-body font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors group-hover:bg-[var(--surface-muted)]">
                              Change Image
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </AboutUsSection>

        <AboutUsSection title="Footer Parallax">
            <input name="footerTitle" placeholder="Footer Title" value={data.footerTitle} onChange={handleChange} className={inputClasses} />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <AboutUsImageField label="Desktop Background" field="footerImageDesktop" val={data.footerImageDesktop} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
                <AboutUsImageField label="Mobile Background" field="footerImageMobile" val={data.footerImageMobile} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
            </div>
        </AboutUsSection>
    </div>
  );
};

export default AboutUsManager;