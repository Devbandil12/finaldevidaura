import { useState } from "react";
import axios from "axios";

const useCloudinary = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState(null);

  const uploadImage = async (file) => {
    if (!file) {
      setError("No file selected!");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "freelance");
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    
    // Add the image compression and format transformation here
    formData.append("transformation", "q_auto,f_auto");

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      
      const secureUrl = response.data.secure_url;
      setUploadedUrl(secureUrl);
      
      return secureUrl;
      
    } catch (err) {
      setError(err.message);
      throw err; 
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, uploadedUrl, error };
};

export default useCloudinary;
