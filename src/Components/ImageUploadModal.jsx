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
  const { addProduct } = useContext(ProductContext); // ✅ use context

  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
    discount: 0,
    oprice: 0,
    size: 0,
    quantity: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]:
        ["discount", "oprice", "size", "quantity"].includes(name)
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
    // ✅ validate fields
    const required = [
      "name",
      "composition",
      "description",
      "fragrance",
      "fragranceNotes",
      "discount",
      "oprice",
      "size",
      "quantity",
    ];
    for (const f of required) {
      if (!product[f] || product[f] === 0) {
        return toast.error(`Please fill in '${f}'`);
      }
    }
    if (uploadedUrls.length === 0) {
      return toast.error("Please upload images before submitting.");
    }

    const payload = { ...product, imageurl: uploadedUrls };

    const success = await addProduct(payload); // ✅ use API, not direct DB

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
      name: "",
      composition: "",
      description: "",
      fragrance: "",
      fragranceNotes: "",
      discount: 0,
      oprice: 0,
      size: 0,
      quantity: 1,
    });
  };

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

            {step === 1 ? (
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
            ) : (
              <div>
                <h2 className="text-lg font-semibold">Enter Product Details</h2>
                <div className="grid gap-3 mt-4">
                  {[
                    "name",
                    "composition",
                    "description",
                    "fragrance",
                    "fragranceNotes",
                    "discount",
                    "oprice",
                    "size",
                  ].map((field) => (
                    <input
                      key={field}
                      name={field}
                      placeholder={field}
                      type={["discount", "oprice", "size"].includes(field) ? "number" : "text"}
                      onChange={handleChange}
                      className="p-2 rounded bg-white text-black"
                    />
                  ))}
                </div>
                <button
                  className="mt-4 bg-black px-4 py-2 rounded"
                  onClick={handleSubmit}
                >
                  Submit
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
