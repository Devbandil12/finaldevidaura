import React, { useState, useContext } from "react";
import useCloudinary from "../utils/useCloudinary";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";
import { toast } from "react-toastify";
import { ProductContext } from "../contexts/productContext";

const ImageUploadModal = ({ isopen }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]); // Will hold all selected image files
  const [uploadedUrls, setUploadedUrls] = useState([]); // This will hold the combined array of URLs
  
  const { uploadImage, uploading, error } = useCloudinary();
  const { setProducts } = useContext(ProductContext); // Use context to update product list

  const [product, setProduct] = useState({
    name: "",
    composition: "",
    description: "",
    fragrance: "",
    fragranceNotes: "",
    discount: "",
    oprice: "",
    size: "",
  });

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
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
    try {
      const res = await db
        .insert(productsTable)
        .values({ 
          ...product,
          imageurl: uploadedUrls, // Correctly submits a single array
        })
        .returning(productsTable);
      
      // THIS IS THE CRITICAL FIX: Update the parent component's state
      setProducts(prev => [...prev, res[0]]);
      
      console.log(res);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Database insert failed:", error);
      toast.error("Failed to add product.");
    } finally {
      // It's good practice to close the modal here to ensure it closes
      // even if there's a problem with the database insert.
      setIsOpen(false);
    }
  };

  const isUploadDisabled = uploading || images.length === 0;

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="bg-black text-white p-6 rounded-lg shadow-xl w-96 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-3 text-white hover:text-white"
            >
              ✖
            </button>

            {step === 1 ? (
              <div className="text-center flex items-center justify-center flex-col">
                <h2 className="text-lg font-semibold">Upload Product Images</h2>
                
                {/* Single, Multi-Image Upload Field */}
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
              // Step 2: Product Details
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
