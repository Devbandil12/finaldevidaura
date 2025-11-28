import React, { useState, useContext, useEffect } from "react";
import useCloudinary from "../utils/useCloudinary";
import { ProductContext } from "../contexts/productContext";
import { Plus, Trash2, X, UploadCloud, Image as ImageIcon, ArrowLeft, ArrowRight } from "lucide-react";

// --- Variant Input (Light Border + Soft Shadow) ---
const VariantInput = ({ index, variant, onChange, onRemove }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(index, {
      ...variant,
      [name]: ["oprice", "costPrice", "discount", "size", "stock"].includes(name)
        ? Number(value) || 0
        : value,
    });
  };

  return (
    <div className="relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -top-3 -right-3 bg-white text-red-400 border border-gray-100 shadow-sm rounded-full p-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors z-10"
        title="Remove Variant"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Variant Name</label>
          <input 
            name="name" 
            placeholder="e.g., 20ml" 
            type="text" 
            value={variant.name} 
            onChange={handleChange} 
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Size (ml)</label>
          <input name="size" placeholder="20" type="number" value={variant.size} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Stock</label>
          <input name="stock" placeholder="100" type="number" value={variant.stock} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Orig. Price</label>
          <input name="oprice" placeholder="1500" type="number" value={variant.oprice} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Cost Price</label>
          <input name="costPrice" placeholder="500" type="number" value={variant.costPrice} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Discount (%)</label>
          <input name="discount" placeholder="10" type="number" value={variant.discount} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" />
        </div>
      </div>
    </div>
  );
};

const ImageUploadModal = ({ isopen, onClose }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const { uploadImage, uploading, error } = useCloudinary();
  const { addProduct } = useContext(ProductContext);

  const [product, setProduct] = useState({
    name: "", composition: "", description: "", fragrance: "", fragranceNotes: "", category: "Uncategorized",
  });

  const [variants, setVariants] = useState([
    { name: "20ml", size: 20, oprice: 0, costPrice: 0, discount: 0, stock: 0 },
  ]);

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleVariantChange = (index, updatedVariant) => {
    const newVariants = [...variants];
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", size: 0, oprice: 0, costPrice: 0, discount: 0, stock: 0 }]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) return window.toast.error("You must have at least one variant.");
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (images.length + files.length > 10) return window.toast.error("Max 10 images.");
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) return window.toast.error("Please select images.");
    try {
      const urls = [];
      for (const imageFile of images) {
        urls.push(await uploadImage(imageFile));
      }
      setUploadedUrls(urls);
      setStep(2);
      window.toast.success("Images uploaded successfully!");
    } catch (err) {
      console.error(err);
      window.toast.error("Image upload failed.");
    }
  };

  const goToStep3 = () => {
    const required = ["name", "description", "category"];
    for (const f of required) {
      if (!product[f]) return window.toast.error(`Please fill in '${f}'`);
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (variants.length === 0) return window.toast.error("Add at least one variant.");
    for (const v of variants) {
      if (!v.name || !v.size || !v.oprice) return window.toast.error("Complete variant details.");
    }
    if (uploadedUrls.length === 0) return window.toast.error("No images uploaded.");

    const payload = { ...product, imageurl: uploadedUrls, variants: variants };
    const success = await addProduct(payload);

    if (success) {
      window.toast.success("✅ Product added!");
      handleClose();
    } else {
      window.toast.error("❌ Failed to add product.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
    setStep(1);
    setImages([]);
    setPreviews([]);
    setUploadedUrls([]);
    setProduct({ name: "", composition: "", description: "", fragrance: "", fragranceNotes: "", category: "Uncategorized" });
    setVariants([{ name: "20ml", size: 20, oprice: 0, costPrice: 0, discount: 0, stock: 0 }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-6 bg-white flex justify-between items-center z-10 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Add New Product</h2>
            <p className="text-sm text-gray-400 mt-0.5 font-medium">Step {step} of 3</p>
          </div>
          <button onClick={handleClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
            <X size={22} />
          </button>
        </div>

        {/* --- STEP 1: IMAGES --- */}
        {step === 1 && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                
                {/* Add Button */}
                <label className="flex flex-col items-center justify-center aspect-square rounded-3xl cursor-pointer bg-gray-50 hover:bg-indigo-50/50 transition-all group border-2 border-dashed border-gray-200 hover:border-indigo-200">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-indigo-500 mb-4">
                    <Plus size={28} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-widest">Add Images</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {/* Previews */}
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square group rounded-3xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 bg-white">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <button 
                      onClick={() => removeImage(index)} 
                      className="absolute top-3 right-3 bg-white/90 text-red-500 border border-gray-100 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {images.length === 0 && (
                <div className="flex flex-col items-center justify-center h-56 text-gray-300">
                  <ImageIcon size={64} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Start by selecting product images</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-white/50 border-t border-gray-100">
              <button 
                onClick={handleUpload} 
                disabled={uploading || images.length === 0} 
                className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2.5"
              >
                {uploading ? <span className="animate-pulse">Uploading...</span> : <><UploadCloud size={20} /> Upload & Continue</>}
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: DETAILS --- */}
        {step === 2 && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "name", type: "text", span: 2, label: "Product Name" },
                  { name: "category", type: "text", span: 2, label: "Category" },
                  { name: "description", type: "textarea", span: 2, label: "Description" },
                  { name: "composition", type: "text", span: 1, label: "Top Notes" },
                  { name: "fragranceNotes", type: "text", span: 2, label: "Base Notes" },
                  { name: "fragrance", type: "text", span: 1, label: "Heart Notes" },
                ].map((field) => (
                  <div key={field.name} className={field.span === 2 ? "col-span-1 md:col-span-2" : "col-span-1"}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                      {field.label} {['name', 'category', 'description'].includes(field.name) && <span className="text-red-400">*</span>}
                    </label>
                    {field.name === 'description' ? (
                      <textarea 
                        name={field.name} 
                        rows={3} 
                        value={product[field.name]} 
                        onChange={handleChange} 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-gray-300" 
                      />
                    ) : (
                      <input 
                        name={field.name} 
                        type={field.type} 
                        value={product[field.name]} 
                        onChange={handleChange} 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-8 bg-white/50 border-t border-gray-100 flex gap-4">
              <button onClick={() => setStep(1)} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
              <button onClick={goToStep3} className="w-2/3 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2">
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: VARIANTS --- */}
        {step === 3 && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {variants.map((v, i) => (
                <VariantInput key={i} index={i} variant={v} onChange={handleVariantChange} onRemove={removeVariant} />
              ))}
              <button onClick={addVariant} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
                <Plus size={18} /> Add Another Variant
              </button>
            </div>
            
            <div className="p-8 bg-white/50 border-t border-gray-100 flex gap-4">
              <button onClick={() => setStep(2)} className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
              <button onClick={handleSubmit} className="w-2/3 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-green-200 transition-all transform hover:-translate-y-0.5">
                Publish Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadModal;