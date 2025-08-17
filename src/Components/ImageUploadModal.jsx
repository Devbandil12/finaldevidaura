// src/components/ImageUploadModal.jsx

import React, { useState, useContext, useEffect } from "react";
import useCloudinary from "../utils/useCloudinary";
import { toast } from "react-toastify";
import { ProductContext } from "../contexts/productContext";

const ImageUploadModal = ({ isopen, onClose, editingProduct }) => {
    const { uploadImage, uploading, error } = useCloudinary();
    const { addProduct, updateProduct, getProducts } = useContext(ProductContext);
    // Corrected the regex to fix the build error
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");

    const [isOpen, setIsOpen] = useState(isopen);
    const [step, setStep] = useState(1);
    const [images, setImages] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState(editingProduct?.images || []);
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

    // Effect to handle modal open/close state and pre-populate fields for editing
    useEffect(() => {
        setIsOpen(isopen);
        if (isopen && editingProduct) {
            // Populate form if we are editing a product
            setProduct({
                name: editingProduct.name || "",
                composition: editingProduct.composition || "",
                description: editingProduct.description || "",
                fragrance: editingProduct.fragrance || "",
                fragranceNotes: editingProduct.fragranceNotes || "",
                discount: editingProduct.discount,
                oprice: editingProduct.oprice,
                size: editingProduct.size,
            });
            setUploadedUrls(editingProduct.images || []);
            setStep(3); // Go directly to details step for editing
        } else if (isopen && !editingProduct) {
            // Reset form for new product
            setProduct({
                name: "",
                composition: "",
                description: "",
                fragrance: "",
                fragranceNotes: "",
                discount: "",
                oprice: "",
                size: "",
            });
            setUploadedUrls([]);
            setStep(1);
        }
    }, [isopen, editingProduct]);

    // Form change handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "discount" || name === "oprice" || name === "size") {
            setProduct({ ...product, [name]: Number(value) });
        } else {
            setProduct({ ...product, [name]: value });
        }
    };

    // File change handler
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 10) {
            toast.error("You can upload a maximum of 10 images.");
            return;
        }
        setImages(files);
        setStep(2);
    };

    // Image upload handler
    const handleImageUpload = async () => {
        if (images.length === 0) {
            toast.error("Please select at least one image.");
            return;
        }
        try {
            const uploadedUrls = await Promise.all(images.map(image => uploadImage(image)));
            setUploadedUrls(uploadedUrls);
            setStep(3);
            toast.success("Images uploaded successfully!");
        } catch (err) {
            toast.error("Image upload failed. Please try again.");
            console.error("❌ Cloudinary upload error:", err);
        }
    };

    // Product submission handler
    const handlesubmit = async () => {
        if (uploadedUrls.length === 0) {
            toast.error("Please upload images first.");
            return;
        }

        try {
            const productData = { ...product, images: uploadedUrls };
            if (editingProduct) {
                // Call the updateProduct function if an existing product is being edited
                await updateProduct({ ...productData, id: editingProduct._id });
                toast.success("Product updated successfully!");
            } else {
                // Call the addProduct function for a new product
                await addProduct(productData);
                toast.success("Product added successfully!");
            }
            onClose();
        } catch (err) {
            console.error("❌ Failed to save product:", err);
            toast.error("Failed to save product.");
        }
    };

    return (
        <div>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full relative text-white">
                        <button onClick={onClose} className="absolute top-2 right-2 text-xl font-bold">&times;</button>
                        <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                        {step === 1 && (
                            <div className="text-center">
                                <p className="mb-4">Step 1: Upload Images</p>
                                <input type="file" multiple onChange={handleFileChange} className="mb-4" />
                                <button onClick={handleImageUpload} className="bg-blue-500 text-white px-4 py-2 rounded transition hover:bg-blue-600" disabled={uploading}>
                                    {uploading ? "Uploading..." : "Upload Images"}
                                </button>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="text-center">
                                <p className="mb-4">Step 2: Preview Images & Enter Details</p>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {images.map((file, index) => (
                                        <img key={index} src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-auto rounded" />
                                    ))}
                                </div>
                                <button onClick={() => setStep(3)} className="bg-blue-500 text-white px-4 py-2 rounded transition hover:bg-blue-600">
                                    Continue to Details
                                </button>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-4">
                                <p className="text-center">Step 3: Enter Product Details</p>
                                <input name="name" placeholder="Name" onChange={handleChange} value={product.name} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <input name="composition" placeholder="Composition" onChange={handleChange} value={product.composition} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <textarea name="description" placeholder="Description" onChange={handleChange} value={product.description} className="p-2 rounded bg-gray-700 text-white w-full" rows="3" />
                                <input name="fragrance" placeholder="Fragrance" onChange={handleChange} value={product.fragrance} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <input name="fragranceNotes" placeholder="Fragrance Notes" onChange={handleChange} value={product.fragranceNotes} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <input type="number" name="discount" placeholder="Discount %" onChange={handleChange} value={product.discount} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <input type="number" name="oprice" placeholder="Original Price" onChange={handleChange} value={product.oprice} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <input type="number" name="size" placeholder="Size" onChange={handleChange} value={product.size} className="p-2 rounded bg-gray-700 text-white w-full" />
                                <div className="flex justify-center items-center">
                                    <button
                                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded transition hover:bg-blue-600"
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
