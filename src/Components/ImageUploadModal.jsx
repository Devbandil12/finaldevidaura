import React, { useState, useContext } from "react";
import useCloudinary from "../utils/useCloudinary";
import { toast } from "react-toastify";
import { ProductContext } from "../contexts/productContext";

const ImageUploadModal = ({ isopen, onClose }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);

  const [images, setImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState("default"); // 👈 images grouped by size
  const [uploadedUrls, setUploadedUrls] = useState({}); // { "100": [url1], "30": [url2] }

  const { uploadImage, uploading, error } = useCloudinary();
  const { addProduct } = useContext(ProductContext);

  // ✅ common product fields
  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
  });

  // ✅ variants array
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({
    size: "",
    oprice: "",
    discount: 0,
    stock: 0,
    showAsSingleProduct: false,
  });

  /* =======================
     Handlers
  ======================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleVariantChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentVariant({
      ...currentVariant,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addVariant = () => {
    if (!currentVariant.size || !currentVariant.oprice) {
      return toast.error("Please enter size and price for the variant");
    }
    setVariants([...variants, currentVariant]);
    setCurrentVariant({ size: "", oprice: "", discount: 0, stock: 0, showAsSingleProduct: false });
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
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

      setUploadedUrls((prev) => ({
        ...prev,
        [selectedSize]: [...(prev[selectedSize] || []), ...urls],
      }));

      setImages([]);
      toast.success(`Images uploaded for size ${selectedSize}!`);
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Image upload failed.");
    }
  };

  const handleSubmit = async () => {
    if (!product.name || !product.description) {
      return toast.error("Please fill in all product details.");
    }
    if (variants.length === 0) {
      return toast.error("Please add at least one variant.");
    }

    const payload = { ...product, imageurl: uploadedUrls, variants };

    const success = await addProduct(payload);

    if (success) {
      toast.success("✅ Product added successfully!");
      setIsOpen(false);
      onClose();
    } else {
      toast.error("❌ Failed to add product.");
    }

    // reset
    setStep(1);
    setImages([]);
    setUploadedUrls({});
    setVariants([]);
    setProduct({
      name: "",
      composition: "",
      description: "",
      fragrance: "",
      fragranceNotes: "",
    });
  };

  /* =======================
     UI
  ======================= */
  return (
    isOpen && (
      <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center">
        <div className="bg-black text-white p-6 rounded-lg shadow-xl w-96 relative">
          <button
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
            className="absolute top-2 right-3 text-white hover:text-white"
          >
            ✖
          </button>

          {step === 1 ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold">Upload Product Images</h2>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="mt-3 p-2 text-black rounded w-full"
              >
                <option value="default">Default</option>
                <option value="30">30ml</option>
                <option value="100">100ml</option>
              </select>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full cursor-pointer mt-3"
              />
              <button
                onClick={handleUpload}
                disabled={uploading || images.length === 0}
                className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-700"
              >
                {uploading ? "Uploading..." : "Upload Images"}
              </button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
              <button
                className="mt-4 bg-green-600 px-4 py-2 rounded"
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">Enter Product Details</h2>
              <div className="grid gap-3 mt-4">
                {["name", "composition", "description", "fragrance", "fragranceNotes"].map(
                  (field) => (
                    <input
                      key={field}
                      name={field}
                      placeholder={field}
                      value={product[field]}
                      onChange={handleChange}
                      className="p-2 rounded bg-white text-black"
                    />
                  )
                )}
              </div>

              {/* Variants */}
              <div className="mt-4 border p-3 rounded">
                <h3 className="font-semibold">Add Variant</h3>
                <input
                  type="number"
                  name="size"
                  placeholder="Size (ml)"
                  value={currentVariant.size}
                  onChange={handleVariantChange}
                  className="p-2 rounded bg-white text-black w-full mt-2"
                />
                <input
                  type="number"
                  name="oprice"
                  placeholder="Original Price"
                  value={currentVariant.oprice}
                  onChange={handleVariantChange}
                  className="p-2 rounded bg-white text-black w-full mt-2"
                />
                <input
                  type="number"
                  name="discount"
                  placeholder="Discount %"
                  value={currentVariant.discount}
                  onChange={handleVariantChange}
                  className="p-2 rounded bg-white text-black w-full mt-2"
                />
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock"
                  value={currentVariant.stock}
                  onChange={handleVariantChange}
                  className="p-2 rounded bg-white text-black w-full mt-2"
                />
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    name="showAsSingleProduct"
                    checked={currentVariant.showAsSingleProduct}
                    onChange={handleVariantChange}
                  />
                  <span className="ml-2">Show as single product</span>
                </label>
                <button
                  onClick={addVariant}
                  className="mt-3 bg-blue-500 px-3 py-1 rounded"
                >
                  Add Variant
                </button>
              </div>

              {/* List variants */}
              <ul className="mt-3">
                {variants.map((v, i) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    {v.size}ml - ₹{v.oprice} (-{v.discount}%) | Stock: {v.stock}
                    <button
                      className="text-red-400 ml-2"
                      onClick={() => removeVariant(i)}
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>

              <button
                className="mt-4 bg-green-600 px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default ImageUploadModal;
