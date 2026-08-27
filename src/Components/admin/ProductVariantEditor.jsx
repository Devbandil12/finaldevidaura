import React, { useState, useEffect, useRef } from "react";
import { useUpdateProduct, useAddVariant, useUpdateVariant, useDeleteVariant, useUnarchiveVariant } from "../../features/catalog/hooks/useProducts";
import useCloudinary from "../../hooks/useCloudinary";
import { Plus, X, Trash2, UploadCloud, ArrowRight, ArrowLeft, Save, Archive, Undo, Image as ImageIcon } from 'lucide-react';
import { ModernInput } from '../../features/admin/components/products/ModernInput';

const ProductVariantEditor = ({ product, onClose }) => {
  const { mutateAsync: updateProduct } = useUpdateProduct();
  const { mutateAsync: addVariant } = useAddVariant();
  const { mutateAsync: updateVariant } = useUpdateVariant();
  const { mutateAsync: deleteVariant } = useDeleteVariant();
  const { mutateAsync: unarchiveVariant } = useUnarchiveVariant();
  const { uploadImage, uploading } = useCloudinary();

  const [parentData, setParentData] = useState({
    name: product.name, category: product.category, description: product.description,
    composition: product.composition, fragrance: product.fragrance, fragranceNotes: product.fragranceNotes,
  });
  const [existingImages, setExistingImages] = useState(Array.isArray(product.imageurl) ? product.imageurl : (product.imageurl ? [product.imageurl] : []));
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [variants, setVariants] = useState(product.variants || []);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [newVariantIndex, setNewVariantIndex] = useState(-1);
  const newVariantCardRef = useRef(null);

  useEffect(() => { return () => previews.forEach(url => URL.revokeObjectURL(url)); }, [previews]);
  
  const handleParentChange = (e) => { const { name, value } = e.target; setParentData((prev) => ({ ...prev, [name]: value })); };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newFiles.length + files.length > 10) return window.toast?.error("Max 10 images.");
    setNewFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeExistingImage = (index) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  
  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveParent = async (shouldClose = false) => {
    setIsSaving(true);
    try {
      let finalNewUrls = [];
      if (newFiles.length > 0) { for (const file of newFiles) { finalNewUrls.push(await uploadImage(file)); } }
      const finalImageArray = [...existingImages, ...finalNewUrls];
      await updateProduct({ productId: product.id, updatedData: { ...parentData, imageurl: finalImageArray } });
      setNewFiles([]); setPreviews([]); setExistingImages(finalImageArray);
      window.toast?.success("Details updated!");
      if (shouldClose) onClose();
    } catch (error) { window.toast?.error("Update failed."); } finally { setIsSaving(false); }
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];
    if (["oprice", "costPrice", "discount", "size", "stock", "weight", "length", "breadth", "height"].includes(name)) { 
        newVariants[index][name] = value === "" ? "" : Number(value); 
    } else { 
        newVariants[index][name] = value; 
    }
    setVariants(newVariants);
  };

  const handleAddNewVariant = () => {
    setNewVariantIndex(variants.length);
    setVariants([...variants, { 
        productId: product.id, 
        name: "New Variant", 
        size: 0, oprice: 0, costPrice: 0, discount: 0, stock: 0, isArchived: false,
        weight: 0.5, length: 10, breadth: 10, height: 10
    }]);
  };

  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    setIsSaving(true);
    try {
      if (variant.id) await updateVariant({ variantId: variant.id, variantData: variant });
      else {
        const newVariant = await addVariant(variant);
        if (newVariant) { const newVariants = [...variants]; newVariants[index] = newVariant; setVariants(newVariants); }
      }
      window.toast?.success(`Variant saved!`);
    } catch (e) { window.toast?.error("Failed to save."); } finally { setIsSaving(false); }
  };

  const handleArchiveToggle = async (index) => {
    const variant = variants[index];
    if (!variant.id) { setVariants(variants.filter((_, i) => i !== index)); return; }
    if (variant.isArchived) {
      if (window.confirm(`Unarchive variant?`)) {
        setIsSaving(true); await unarchiveVariant(variant.id);
        const newVariants = [...variants]; newVariants[index].isArchived = false; setVariants(newVariants); setIsSaving(false);
      }
    } else {
      const activeVariants = variants.filter((v) => !v.isArchived);
      if (activeVariants.length <= 1) return window.toast?.error("Keep at least one active variant.");
      if (window.confirm(`Archive variant?`)) {
        setIsSaving(true); await deleteVariant(variant.id);
        const newVariants = [...variants]; newVariants[index].isArchived = true; setVariants(newVariants); setIsSaving(false);
      }
    }
  };

  useEffect(() => { 
    if (newVariantCardRef.current) { 
      newVariantCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); 
      setNewVariantIndex(-1); 
    } 
  }, [newVariantIndex]);

  return (
    <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-md flex items-center justify-center z-[100000] p-4 sm:p-6 transition-all duration-500 font-body">
      <div className="bg-[var(--surface)] w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-[var(--border)]/40">
        
        {/* MODAL HEADER */}
        <div className="px-8 py-6 bg-[var(--surface)] flex justify-between items-center z-10 border-b border-[var(--border)]/30">
          <div>
            <h2 className="text-2xl font-display font-medium text-[var(--text)] tracking-tight">Edit Configuration</h2>
            <p className="text-[11px] font-body text-[var(--sub)] mt-1.5 font-bold uppercase tracking-widest">{parentData.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* LUXURY TABS */}
        <div className="flex px-8 gap-8 border-b border-[var(--border)]/30 bg-[var(--surface-muted)]/20">
          <button 
            onClick={() => setActiveTab("general")} 
            className={`py-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${activeTab === "general" ? "border-[var(--text)] text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            Core & Media
          </button>
          <button 
            onClick={() => setActiveTab("variants")} 
            className={`py-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${activeTab === "variants" ? "border-[var(--text)] text-[var(--text)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            Variants ({variants.length})
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-[var(--bg)]">
          
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* Media Block */}
              <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--border)]/40">
                <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-5 ml-1 flex items-center gap-2"><ImageIcon size={16}/> Media Assets</h3>
                <div className="flex flex-wrap gap-4">
                  
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl cursor-pointer bg-[var(--surface-muted)]/50 hover:bg-[var(--surface)] transition-all group border border-dashed border-[var(--border)] hover:border-[var(--brand)]/50">
                    <Plus size={20} className="text-[var(--muted)] group-hover:text-[var(--brand)] mb-1.5 transition-colors" />
                    <span className="text-[9px] font-bold text-[var(--muted)] group-hover:text-[var(--brand)] uppercase tracking-widest">Upload</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  {existingImages.map((url, idx) => (
                    <div key={`exist-${idx}`} className="relative w-24 h-24 group rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition-all">
                      <img src={url} alt="Product" className="w-full h-full object-cover mix-blend-multiply" />
                      <button onClick={() => removeExistingImage(idx)} className="absolute inset-0 bg-white/80 backdrop-blur-sm text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {previews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative w-24 h-24 group rounded-2xl overflow-hidden border-2 border-[var(--accent-soft)] bg-[var(--surface)] shadow-sm">
                      <img src={url} alt="New" className="w-full h-full object-cover opacity-80" />
                      <button onClick={() => removeNewFile(idx)} className="absolute inset-0 bg-white/80 backdrop-blur-sm text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Block */}
              <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[var(--border)]/40 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput label="Item Name" name="name" value={parentData.name} onChange={handleParentChange} />
                <ModernInput label="Classification" name="category" value={parentData.category} onChange={handleParentChange} />
                <div className="md:col-span-2 group">
                  <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2 block px-1 group-focus-within:text-[var(--brand)] transition-colors">Description</label>
                  <textarea 
                    name="description" 
                    rows={3} 
                    value={parentData.description} 
                    onChange={handleParentChange} 
                    className="w-full px-4 py-3.5 bg-[var(--surface)] border border-[var(--border)]/40 hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:bg-[var(--surface)] focus:border-[var(--brand)]/50 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.03)] transition-all resize-none shadow-[0_2px_8px_rgba(0,0,0,0.02)] placeholder-[var(--muted)]" 
                  />
                </div>
                <ModernInput label="Top Notes" name="composition" value={parentData.composition} onChange={handleParentChange} />
                <ModernInput label="Base Notes" name="fragranceNotes" value={parentData.fragranceNotes} onChange={handleParentChange} />
                <ModernInput label="Heart Notes" name="fragrance" value={parentData.fragrance} onChange={handleParentChange} span="md:col-span-2" />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button onClick={() => handleSaveParent(false)} disabled={isSaving || uploading} className="button-hero flex-1 bg-[var(--text)] hover:bg-[var(--brand)] text-[var(--surface)] px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] disabled:opacity-50">
                  {uploading ? <span className="animate-pulse">Uploading...</span> : isSaving ? "Saving..." : <><UploadCloud size={16} /> Sync Details</>}
                </button>
                <button onClick={() => setActiveTab("variants")} className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]/50 hover:bg-[var(--surface-muted)] px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[var(--surface)] p-5 rounded-[1.25rem] shadow-sm border border-[var(--border)]/40">
                <h3 className="text-sm font-bold text-[var(--text)] ml-1">Configured Variants</h3>
                <button onClick={handleAddNewVariant} className="px-4 py-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]/50 hover:text-[var(--brand)] hover:border-[var(--brand)]/40 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm">
                  <Plus size={14} strokeWidth={2.5} /> New Variant
                </button>
              </div>
              <div className="space-y-5">
                {variants.map((variant, index) => (
                  <div key={variant.id || `new-${index}`} ref={index === newVariantIndex ? newVariantCardRef : null} className={`p-6 sm:p-8 rounded-[1.5rem] transition-all duration-500 border ${variant.isArchived ? "bg-[var(--surface-muted)]/40 border-[var(--border)]/30 opacity-70" : "bg-[var(--surface)] border-[var(--border)]/40 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"}`}>
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--border)]/30 pb-4">
                      <h4 className="font-bold text-[var(--text)] text-sm tracking-tight flex items-center gap-3">
                        {variant.name || "Untitled Config"} 
                        {variant.isArchived && <span className="px-2 py-1 bg-[var(--surface-muted)] text-[var(--muted)] border border-[var(--border)]/50 text-[9px] rounded-md uppercase tracking-widest font-bold">Archived</span>}
                      </h4>
                      <div className="flex gap-2.5">
                        <button onClick={() => handleSaveVariant(index)} disabled={isSaving} className="p-2.5 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-xl hover:bg-[var(--success)] hover:text-white transition-colors">
                          <Save size={16} strokeWidth={2} />
                        </button>
                        <button onClick={() => handleArchiveToggle(index)} disabled={isSaving} className={`p-2.5 rounded-xl border transition-colors ${variant.isArchived ? "bg-[var(--surface)] text-[var(--brand)] border-[var(--border)]/50 hover:border-[var(--brand)]" : "bg-[var(--error)]/5 text-[var(--error)] border-[var(--error)]/20 hover:bg-[var(--error)] hover:text-white"}`}>
                          {variant.isArchived ? <Undo size={16} strokeWidth={2} /> : <Archive size={16} strokeWidth={2} />}
                        </button>
                      </div>
                    </div>
                    {/* Breathable Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      <ModernInput label="SKU/Name" name="name" value={variant.name} onChange={(e) => handleVariantChange(index, e)} span="col-span-2" />
                      <ModernInput label="Size" name="size" type="number" value={variant.size} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Stock" name="stock" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Price (₹)" name="oprice" type="number" value={variant.oprice} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Cost (₹)" name="costPrice" type="number" value={variant.costPrice} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Disc (%)" name="discount" type="number" value={variant.discount} onChange={(e) => handleVariantChange(index, e)} />
                      
                      <ModernInput label="Wt (kg)" name="weight" type="number" value={variant.weight} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="L (cm)" name="length" type="number" value={variant.length} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="B (cm)" name="breadth" type="number" value={variant.breadth} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="H (cm)" name="height" type="number" value={variant.height} onChange={(e) => handleVariantChange(index, e)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-6 mt-8 border-t border-[var(--border)]/40">
                <button onClick={() => setActiveTab("general")} className="bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)] border border-[var(--border)]/50 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={onClose} className="button-hero flex-1 bg-[var(--text)] hover:bg-[var(--brand)] text-[var(--surface)] px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all">
                  Close Editor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductVariantEditor;