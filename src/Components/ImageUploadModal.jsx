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

  // ✅ common product fields
  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
  });

  // ✅ variants state
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    size: "",
    oprice: "",
    discount: 0,
    stock: 0,
    showAsSingleProduct: false,
  });

  // ------------------- handlers -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
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
      toast.success("✅ Images uploaded successfully!");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("❌ Image upload failed.");
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.size || !newVariant.oprice) {
      return toast.error("Size and Price are required");
    }
    if (newVariant.stock < 0) {
      return toast.error("Stock cannot be negative");
    }
    setVariants([...variants, newVariant]);
    setNewVariant({
      size: "",
      oprice: "",
      discount: 0,
      stock: 0,
      showAsSingleProduct: false,
    });
  };

  const handleSubmit = async () => {
    if (uploadedUrls.length === 0) {
      return toast.error("Please upload images first.");
    }
    if (!product.name || !product.description) {
      return toast.error("Please fill in product details.");
    }
    if (variants.length === 0) {
      return toast.error("Please add at least one variant.");
    }

    const payload = {
      ...product,
      imageurl: uploadedUrls,
      variants,
    };

    const success = await addProduct(payload);
    if (success) {
      toast.success("✅ Product with variants added!");
      resetForm();
      onClose();
    } else {
      toast.error("❌ Failed to add product.");
    }
  };

  const resetForm = () => {
    setStep(1);
    setImages([]);
    setUploadedUrls([]);
    setProduct({
      name: "",
      composition: "",
      description: "",
      fragrance: "",
      fragranceNotes: "",
    });
    setVariants([]);
    setNewVariant({
      size: "",
      oprice: "",
      discount: 0,
      stock: 0,
      showAsSingleProduct: false,
    });
  };

  // ------------------- render -------------------
  return (
    <div>
      {isOpen && (
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

            {/* STEP 1: Upload images */}
            {step === 1 && (
              <div className="text-center">
                <h2 className="text-lg font-semibold">Upload Product Images</h2>
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
              </div>
            )}

            {/* STEP 2: Product details */}
            {step === 2 && (
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
                <button
                  className="mt-4 bg-blue-500 px-4 py-2 rounded"
                  onClick={() => setStep(3)}
                >
                  Next: Add Variants →
                </button>
              </div>
            )}

            {/* STEP 3: Variants */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold">Add Variants</h2>
                <div className="grid gap-3 mt-4">
                  <input
                    type="number"
                    placeholder="Size (ml)"
                    value={newVariant.size}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, size: e.target.value })
                    }
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newVariant.oprice}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, oprice: e.target.value })
                    }
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    placeholder="Discount (%)"
                    value={newVariant.discount}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, discount: e.target.value })
                    }
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    value={newVariant.stock}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, stock: e.target.value })
                    }
                    className="p-2 rounded bg-white text-black"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newVariant.showAsSingleProduct}
                      onChange={(e) =>
                        setNewVariant({
                          ...newVariant,
                          showAsSingleProduct: e.target.checked,
                        })
                      }
                    />
                    Show as Single Product
                  </label>
                  <button
                    onClick={handleAddVariant}
                    className="mt-2 bg-green-600 px-3 py-1 rounded text-white"
                  >
                    ➕ Add Variant
                  </button>
                </div>

                {/* List of added variants */}
                <ul className="mt-4">
                  {variants.map((v, i) => (
                    <li
                      key={i}
                      className="flex justify-between bg-gray-200 text-black p-2 mb-1 rounded"
                    >
                      <span>
                        {v.size}ml – ₹{v.oprice} ({v.discount}% off, Stock:{" "}
                        {v.stock})
                      </span>
                      <button
                        onClick={() =>
                          setVariants(variants.filter((_, idx) => idx !== i))
                        }
                        className="text-red-600"
                      >
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-500 px-4 py-2 rounded"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </button>
                  <button
                    className="bg-blue-600 px-4 py-2 rounded"
                    onClick={handleSubmit}
                  >
                    Save Product
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadModal;
