import React, { useState, useContext } from "react";
import useCloudinary from "../utils/useCloudinary";
import { toast } from "react-toastify";
import { ProductContext } from "../contexts/productContext";

const ImageUploadModal = ({ isopen, onClose }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const { uploadImage, uploading, error } = useCloudinary();
  const { addProduct } = useContext(ProductContext);

  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
    discount: 0,
    oprice: 0,
    size: 0,
    stock: 0,
    // --- NEW FIELDS ---
    costPrice: 0,
    category: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]:
        ["discount", "oprice", "size", "stock", "costPrice"].includes(name) // Added costPrice
          ? Number(value) || 0
          : value,
    });
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 10) {
      toast.error("You can upload a maximum of 10 images.");
      setImages([]);
    } else {
      setImages(files);
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) return toast.error("Please select images.");

    try {
      const urls = [];
      for (const imageFile of images) {
        const url = await uploadImage(imageFile);
        urls.push(url);
      }

      setUploadedUrls(urls);
      setStep(2);
      toast.success("Images uploaded successfully!");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Image upload failed.");
    }
  };

  const handleSubmit = async () => {
    const required = [
      "name", "composition", "description", "fragrance", "fragranceNotes",
      "discount", "oprice", "size", "stock", "costPrice", "category" // Added new fields
    ];
    for (const f of required) {
      if (!product[f] && product[f] !== 0) { // Check for empty string or null, allow 0
        return toast.error(`Please fill in '${f}'`);
      }
    }

    if (product.stock < 0 || product.costPrice < 0 || product.oprice < 0) {
      return toast.error("Prices and stock cannot be negative.");
    }

    if (uploadedUrls.length === 0) {
      return toast.error("Please upload images before submitting.");
    }

    const payload = { ...product, imageurl: uploadedUrls };
    const success = await addProduct(payload);

    if (success) {
      toast.success("✅ Product added successfully!");
      setIsOpen(false);
      onClose();
    } else {
      toast.error("❌ Failed to add product.");
    }

    // reset state
    setStep(1);
    setImages([]);
    setUploadedUrls([]);
    setProduct({
      name: "", composition: "", description: "", fragrance: "", fragranceNotes: "",
      discount: 0, oprice: 0, size: 0, stock: 0, costPrice: 0, category: ""
    });
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={() => { setIsOpen(false); onClose(); }}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>

            {step === 1 ? (
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
                  {uploading ? "Uploading..." : `Upload ${images.length} Image(s)`}
                </button>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">Step 2: Enter Details</h2>
                <div className="grid grid-cols-2 gap-3 mt-4 max-h-96 overflow-y-auto pr-2">
                  {[
                    { name: "name", type: "text" }, { name: "category", type: "text" },
                    { name: "composition", type: "text" }, { name: "description", type: "text" },
                    { name: "fragrance", type: "text" }, { name: "fragranceNotes", type: "text" },
                    { name: "oprice", type: "number" }, { name: "costPrice", type: "number" },
                    { name: "discount", type: "number" }, { name: "size", type: "number" },
                    { name: "stock", type: "number" },
                  ].map((field) => (
                    <div key={field.name} className={["composition", "description", "fragranceNotes"].includes(field.name) ? "col-span-2" : ""}>
                      <label className="text-xs font-medium text-gray-600 capitalize">{field.name.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        name={field.name}
                        placeholder={field.name.replace(/([A-Z])/g, ' $1')}
                        type={field.type}
                        min={field.type === "number" ? 0 : undefined}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  ))}
                </div>
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