import React, { useState, useContext } from "react";
import useCloudinary from "../utils/useCloudinary";
import { ProductContext } from "../contexts/productContext";
import { Plus, Trash2 } from "lucide-react";

// 🟢 NEW: A sub-component to manage a single variant
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
    <div className="p-3 border rounded-lg grid grid-cols-2 gap-x-3 gap-y-2 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-600">Variant Name</label>
        <input name="name" placeholder="e.g., 20ml or 50ml" type="text" value={variant.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Size (ml)</label>
        <input name="size" placeholder="20" type="number" value={variant.size} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Stock</label>
        <input name="stock" placeholder="100" type="number" value={variant.stock} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Original Price (₹)</label>
        <input name="oprice" placeholder="1500" type="number" value={variant.oprice} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Cost Price (₹)</label>
        <input name="costPrice" placeholder="500" type="number" value={variant.costPrice} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-600">Discount (%)</label>
        <input name="discount" placeholder="10" type="number" value={variant.discount} onChange={handleChange} className="w-full p-2 border rounded-md" />
      </div>
    </div>
  );
};


const ImageUploadModal = ({ isopen, onClose }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const { uploadImage, uploading, error } = useCloudinary();
  const { addProduct } = useContext(ProductContext);

  // 🟢 MODIFIED: This state is now ONLY for the parent product
  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
    category: "Uncategorized",
  });
  
  // 🟢 NEW: State to hold the array of variants
  const [variants, setVariants] = useState([
    { name: "20ml", size: 20, oprice: 0, costPrice: 0, discount: 0, stock: 0 },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  // --- Variant State Handlers ---
  const handleVariantChange = (index, updatedVariant) => {
    const newVariants = [...variants];
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", size: 0, oprice: 0, costPrice: 0, discount: 0, stock: 0 }]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) {
      window.toast.error("You must have at least one variant.");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };
  // ---

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 10) {
      window.toast.error("You can upload a maximum of 10 images.");
      setImages([]);
    } else {
      setImages(files);
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) return window.toast.error("Please select images.");

    try {
      const urls = [];
      for (const imageFile of images) {
        const url = await uploadImage(imageFile);
        urls.push(url);
      }
      setUploadedUrls(urls);
      setStep(2); // Move to Step 2 (Product Details)
      window.toast.success("Images uploaded successfully!");
    } catch (err) {
      console.error("Image upload failed:", err);
      window.toast.error("Image upload failed.");
    }
  };

  const goToStep3 = () => {
    // Validate main product fields before moving to variants
    const required = ["name", "description", "category"];
    for (const f of required) {
      if (!product[f]) {
        return window.toast.error(`Please fill in '${f}'`);
      }
    }
    setStep(3); // Move to Step 3 (Variants)
  };
  
  // 🟢 MODIFIED: This now bundles the product + variants
  const handleSubmit = async () => {
    // 1. Validate variants
    if (variants.length === 0) {
      return window.toast.error("Please add at least one product variant.");
    }
    for (const v of variants) {
      if (!v.name || !v.size || !v.oprice) {
        return window.toast.error("All variants must have a Name, Size, and Price.");
      }
    }
    // 2. Validate images
    if (uploadedUrls.length === 0) {
      return window.toast.error("Please go back and upload images.");
    }

    // 3. Create the final payload
    const payload = { 
      ...product, 
      imageurl: uploadedUrls, // Main images
      variants: variants      // Array of variant objects
    };
    
    const success = await addProduct(payload); // addProduct is from context

    if (success) {
      window.toast.success("✅ Product added successfully!");
      handleClose(); // Call the unified close function
    } else {
      window.toast.error("❌ Failed to add product.");
    }
  };
  
  // 🟢 NEW: Unified reset/close function
  const handleClose = () => {
    setIsOpen(false);
    onClose();
    // reset state
    setStep(1);
    setImages([]);
    setUploadedUrls([]);
    setProduct({
      name: "", composition: "", description: "", fragrance: "", fragranceNotes: "", category: "Uncategorized"
    });
    setVariants([
      { name: "20ml", size: 20, oprice: 0, costPrice: 0, discount: 0, stock: 0 },
    ]);
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-xl w-full max-w-lg relative">
            <button
              onClick={handleClose}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>

            {/* --- STEP 1: IMAGES --- */}
            {step === 1 && (
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Step 1: Upload Images</h2>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading || images.length === 0}
                  className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {uploading ? "Uploading..." : `Upload ${images.length} Image(s) & Next`}
                </button>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
              </div>
            )}
            
            {/* --- STEP 2: PRODUCT DETAILS --- */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Step 2: Enter Product Details</h2>
                <div className="grid grid-cols-2 gap-3 mt-4 max-h-96 overflow-y-auto pr-2">
                  {[
                    { name: "name", type: "text", span: 2 },
                    { name: "category", type: "text", span: 2 },
                    { name: "description", type: "text", span: 2 },
                    { name: "composition", type: "text", span: 1 },
                    { name: "fragrance", type: "text", span: 1 },
                    { name: "fragranceNotes", type: "text", span: 2 },
                  ].map((field) => (
                    <div key={field.name} className={field.span === 2 ? "col-span-2" : ""}>
                      <label className="text-xs font-medium text-gray-600 capitalize">{field.name.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        name={field.name}
                        placeholder={field.name.replace(/([A-Z])/g, ' $1')}
                        type={field.type}
                        value={product[field.name]}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  onClick={goToStep3}
                >
                  Next: Add Variants
                </button>
              </div>
            )}

            {/* --- STEP 3: VARIANTS --- */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Step 3: Add Variants</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {variants.map((v, i) => (
                    <VariantInput
                      key={i}
                      index={i}
                      variant={v}
                      onChange={handleVariantChange}
                      onRemove={removeVariant}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" /> Add Another Variant
                </button>
                <button
                  className="mt-6 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  onClick={handleSubmit}
                >
                  Submit Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadModal;