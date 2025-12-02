import React, { useState, useContext, useEffect, useRef } from "react";
import { ProductContext } from "../contexts/productContext";
import useCloudinary from "../utils/useCloudinary";
import { Plus, X, Trash2, UploadCloud, ArrowRight, ArrowLeft, Save, Archive, Undo } from 'lucide-react';

const ModernInput = ({ label, name, value, onChange, type = "text", span = "col-span-1" }) => (
  <div className={span}>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">{label}</label>
    <input name={name} type={type} placeholder={label} value={value} onChange={onChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
  </div>
);

const ProductVariantEditor = ({ product, onClose }) => {
  const { updateProduct, addVariant, updateVariant, deleteVariant, unarchiveVariant } = useContext(ProductContext);
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
  
  // (Logic remains identical to original)
  const handleParentChange = (e) => { const { name, value } = e.target; setParentData((prev) => ({ ...prev, [name]: value })); };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newFiles.length + files.length > 10) return window.toast.error("Max 10 images.");
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
      await updateProduct(product.id, { ...parentData, imageurl: finalImageArray });
      setNewFiles([]); setPreviews([]); setExistingImages(finalImageArray);
      window.toast.success("Details updated!");
      if (shouldClose) onClose();
    } catch (error) { window.toast.error("Update failed."); } finally { setIsSaving(false); }
  };
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];
    if (["oprice", "costPrice", "discount", "size", "stock"].includes(name)) { newVariants[index][name] = value === "" ? "" : Number(value); } else { newVariants[index][name] = value; }
    setVariants(newVariants);
  };
  const handleAddNewVariant = () => {
    setNewVariantIndex(variants.length);
    setVariants([...variants, { productId: product.id, name: "New Variant", size: 0, oprice: 0, costPrice: 0, discount: 0, stock: 0, isArchived: false }]);
  };
  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    setIsSaving(true);
    try {
      if (variant.id) await updateVariant(variant.id, variant);
      else {
        const newVariant = await addVariant(variant);
        if (newVariant) { const newVariants = [...variants]; newVariants[index] = newVariant; setVariants(newVariants); }
      }
      window.toast.success(`Variant saved!`);
    } catch (e) { window.toast.error("Failed to save."); } finally { setIsSaving(false); }
  };
  const handleArchiveToggle = async (index) => {
    const variant = variants[index];
    if (!variant.id) { setVariants(variants.filter((_, i) => i !== index)); return; }
    if (variant.isArchived) {
      if (window.confirm(`Unarchive?`)) {
        setIsSaving(true); await unarchiveVariant(variant.id);
        const newVariants = [...variants]; newVariants[index].isArchived = false; setVariants(newVariants); setIsSaving(false);
      }
    } else {
      const activeVariants = variants.filter((v) => !v.isArchived);
      if (activeVariants.length <= 1) return window.toast.error("Keep at least one active variant.");
      if (window.confirm(`Archive?`)) {
        setIsSaving(true); await deleteVariant(variant.id);
        const newVariants = [...variants]; newVariants[index].isArchived = true; setVariants(newVariants); setIsSaving(false);
      }
    }
  };

  useEffect(() => { if (newVariantCardRef.current) { newVariantCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); setNewVariantIndex(-1); } }, [newVariantIndex]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[100000] p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        <div className="px-8 py-6 bg-white flex justify-between items-center z-10 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-800 tracking-tight">Edit Product</h2><p className="text-sm text-gray-400 mt-0.5 font-medium">{parentData.name}</p></div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"><X size={22} /></button>
        </div>
        <div className="flex px-8 gap-8 border-b border-gray-50">
          <button onClick={() => setActiveTab("general")} className={`py-4 text-sm font-bold tracking-wide border-b-2 transition-all ${activeTab === "general" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>General & Images</button>
          <button onClick={() => setActiveTab("variants")} className={`py-4 text-sm font-bold tracking-wide border-b-2 transition-all ${activeTab === "variants" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Variants ({variants.length})</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50">
          {activeTab === "general" && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 ml-1">Product Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <label className="flex flex-col items-center justify-center aspect-square rounded-3xl cursor-pointer bg-gray-50 hover:bg-indigo-50/50 transition-all group border-2 border-dashed border-gray-200 hover:border-indigo-200">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-indigo-500 mb-4"><Plus size={24} /></div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-wider">Add New</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {existingImages.map((url, idx) => (
                    <div key={`exist-${idx}`} className="relative aspect-square group rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
                      <img src={url} alt="Product" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingImage(idx)} className="absolute top-3 right-3 bg-white/90 text-red-500 border border-gray-100 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {previews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square group rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
                      <img src={url} alt="New" className="w-full h-full object-cover border-4 border-indigo-50" />
                      <div className="absolute inset-x-0 bottom-0 bg-indigo-600 text-white text-[9px] font-bold text-center py-1 tracking-wider">NEW UPLOAD</div>
                      <button onClick={() => removeNewFile(idx)} className="absolute top-3 right-3 bg-white/90 text-red-500 border border-gray-100 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput label="Product Name" name="name" value={parentData.name} onChange={handleParentChange} />
                <ModernInput label="Category" name="category" value={parentData.category} onChange={handleParentChange} />
                <div className="md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Description</label><textarea name="description" rows={3} value={parentData.description} onChange={handleParentChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-gray-300" /></div>
                <ModernInput label="Top Notes" name="composition" value={parentData.composition} onChange={handleParentChange} />
                <ModernInput label="Base Notes" name="fragranceNotes" value={parentData.fragranceNotes} onChange={handleParentChange} />
                <ModernInput label="Heart Notes" name="fragrance" value={parentData.fragrance} onChange={handleParentChange} />
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleSaveParent(false)} disabled={isSaving || uploading} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">{uploading ? <span className="animate-pulse">Uploading...</span> : isSaving ? "Saving..." : <><UploadCloud size={20} /> Save Details</>}</button>
                <button onClick={() => setActiveTab("variants")} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">Next <ArrowRight size={18} /></button>
              </div>
            </div>
          )}
          {activeTab === "variants" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 ml-2">Manage Variants</h3>
                <button onClick={handleAddNewVariant} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition flex items-center gap-2"><Plus size={16} /> Add Variant</button>
              </div>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id || `new-${index}`} ref={index === newVariantIndex ? newVariantCardRef : null} className={`p-6 rounded-3xl border transition-all ${variant.isArchived ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div><h4 className="font-bold text-gray-800 text-sm">{variant.name || "Untitled"} {variant.isArchived && <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-500 text-[10px] rounded-lg uppercase tracking-wide">Archived</span>}</h4></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveVariant(index)} disabled={isSaving} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"><Save size={18} /></button>
                        <button onClick={() => handleArchiveToggle(index)} disabled={isSaving} className={`p-2.5 rounded-xl transition-colors ${variant.isArchived ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>{variant.isArchived ? <Undo size={18} /> : <Archive size={18} />}</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                      <ModernInput label="Name" name="name" value={variant.name} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Size" name="size" type="number" value={variant.size} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Stock" name="stock" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Price" name="oprice" type="number" value={variant.oprice} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Cost" name="costPrice" type="number" value={variant.costPrice} onChange={(e) => handleVariantChange(index, e)} />
                      <ModernInput label="Disc %" name="discount" type="number" value={variant.discount} onChange={(e) => handleVariantChange(index, e)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                <button onClick={() => setActiveTab("general")} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"><ArrowLeft size={18} /> Back</button>
                <button onClick={onClose} className="w-2/3 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all">Finish Editing</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductVariantEditor;