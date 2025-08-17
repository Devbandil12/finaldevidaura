import React, { useState, useContext } from "react";
import useCloudinary from "../utils/useCloudinary";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";
import { toast } from "react-toastify";
import { ProductContext } from "../contexts/productContext";

const ImageUploadModal = ({ isopen, onClose }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const { uploadImage, uploading, error } = useCloudinary();
  const { setProducts } = useContext(ProductContext);

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
    
    if (name === "discount" || name === "oprice" || name === "size" || name === "quantity") {
      // Convert to number, or default to 0 if the input is empty or invalid
      setProduct({ ...product, [name]: Number(value) || 0 });
    } else {
      setProduct({ ...product, [name]: value });
    }
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
    if (images.length === 0) {
      return toast.error("Please select at least one image to upload.");
    }
    
    try {
      const urls = [];
      for (const imageFile of images) {
        const url = await uploadImage(imageFile);
        urls.push(url);
      }
      
      setUploadedUrls(urls);
      setStep(2);
      toast.success("Images uploaded successfully!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Image upload failed. Please try again.");
    }
  };
  
  const handlesubmit = async () => {
    const requiredFields = ["name", "composition", "description", "fragrance", "fragranceNotes", "discount", "oprice", "size", "quantity"];
    for (const field of requiredFields) {
      const value = product[field];
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === "") || (typeof value === 'number' && isNaN(value))) {
        return toast.error(`Please fill in the '${field}' field.`);
      }
    }
    
    if (uploadedUrls.length === 0) {
      return toast.error("No images were uploaded. Please upload images before submitting.");
    }
    
    const payload = {
      ...product,
      imageurl: uploadedUrls,
    };
    
    toast.info(`Attempting to add product. Payload: ${JSON.stringify(payload)}`);

    try {
      const res = await db
        .insert(productsTable)
        .values(payload)
        .returning(productsTable);
      
      setProducts(prev => [...prev, res[0]]);
      
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Database insert failed:", error);
      toast.error("Failed to add product. Check the payload and console for details.");
    } finally {
      setIsOpen(false);
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
      onClose();
    }
  };

  const isUploadDisabled = uploading || images.length === 0;

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="bg-black text-white p-6 rounded-lg shadow-xl w-96 relative">
            <button
              onClick={() => { setIsOpen(false); onClose(); }}
              className="absolute top-2 right-3 text-white hover:text-white"
            >
              ✖
            </button>

            {step === 1 ? (
              <div className="text-center flex items-center justify-center flex-col">
                <h2 className="text-lg font-semibold">Upload Product Images</h2>
                <div className="mt-4 w-full">
                  <h3 className="text-md font-medium text-left mb-2">
                    Select Images (Max 10)
                  </h3>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full cursor-pointer"
                  />
                  {images.length > 0 && (
                    <p className="text-gray-400 mt-2 text-sm text-left">
                      {images.length} images selected
                    </p>
                  )}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploadDisabled}
                  className="mt-6 bg-blue-500 px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  {uploading ? "Uploading..." : "Upload Images"}
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold">Enter Product Details</h2>
                <div className="grid gap-3 mt-4">
                  <input
                    name="name"
                    placeholder="Product Name"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="composition"
                    placeholder="Top Notes"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="fragrance"
                    placeholder="Heart Note"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    name="fragranceNotes"
                    placeholder="Base Notes"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    name="discount"
                    placeholder="Discount %"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    name="oprice"
                    placeholder="Original Price"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                  <input
                    type="number"
                    name="size"
                    placeholder="Size"
                    onChange={handleChange}
                    className="p-2 rounded bg-white text-black"
                  />
                </div>
                <div className="flex justify-center items-center">
                  <button
                    className="mt-4 bg-black px-4 py-2 rounded transition"
                    onClick={handlesubmit}
                  >
                    Submit
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
