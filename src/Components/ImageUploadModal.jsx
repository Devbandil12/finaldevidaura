import React, { useState } from "react";
import useCloudinary from "../utils/useCloudinary";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";
import { toast } from "react-toastify";

const ImageUploadModal = ({ isopen }) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [step, setStep] = useState(1);
  const [singleImage, setSingleImage] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);
  
  const [uploadedUrls, setUploadedUrls] = useState([]); // This will hold the single combined array
  
  const { uploadImage, uploading, error } = useCloudinary();

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

  const handleSingleFileChange = (event) => {
    const file = event.target.files[0];
    setSingleImage(file);
    setMultipleImages([]); 
  };

  const handleMultipleFilesChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 10) {
      toast.error("You can upload a maximum of 10 images.");
      setMultipleImages([]);
    } else {
      setMultipleImages(files);
      setSingleImage(null); 
    }
  };

  const handleUpload = async () => {
    const imagesToUpload = singleImage ? [singleImage] : multipleImages;

    if (imagesToUpload.length === 0) {
      return toast.error("Please select at least one image to upload.");
    }
    
    try {
      const urls = [];
      for (const imageFile of imagesToUpload) {
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
      
      console.log(res);
      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Database insert failed:", error);
      toast.error("Failed to add product.");
    }
    setIsOpen(false);
  };

  const isUploadDisabled =
    uploading || (!singleImage && multipleImages.length === 0);

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
                
                {/* Single Image Upload Section */}
                <div className="mt-4 w-full">
                  <h3 className="text-md font-medium text-left mb-2">
                    Upload a Single Image
                  </h3>
                  <input
                    type="file"
                    onChange={handleSingleFileChange}
                    className="w-full cursor-pointer"
                  />
                  {singleImage && (
                    <p className="text-gray-400 mt-2 text-sm text-left">
                      1 image selected
                    </p>
                  )}
                </div>

                {/* Multiple Images Upload Section */}
                <div className="mt-6 w-full">
                  <h3 className="text-md font-medium text-left mb-2">
                    Upload Multiple Images (Max 10)
                  </h3>
                  <input
                    type="file"
                    multiple
                    onChange={handleMultipleFilesChange}
                    className="w-full cursor-pointer"
                  />
                  {multipleImages.length > 0 && (
                    <p className="text-gray-400 mt-2 text-sm text-left">
                      {multipleImages.length} images selected
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
