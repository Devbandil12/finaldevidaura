import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "./UserContext"; 
import { useAuth } from "@clerk/clerk-react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedProducts, setArchivedProducts] = useState([]);
  
  const { userdetails } = useContext(UserContext);
  const { getToken } = useAuth();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Helper
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
  };

  // Fetch active products
  const getProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);
  
  // Fetch archived products
  const getArchivedProducts = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/products/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch archived products");
      const data = await res.json();
      setArchivedProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch archived products:", error);
    }
  }, [BACKEND_URL, getToken]);

  // Add product
  const addProduct = useCallback(async (newProduct) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...newProduct }), 
      });
      if (!res.ok) throw new Error("Failed to add product");
      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);

  // Update product
  const updateProduct = useCallback(async (productId, updatedData) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...updatedData }), 
      });
      if (!res.ok) throw new Error("Failed to update product");
      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);

  // Archive product
  const deleteProduct = useCallback(async (productId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/archive`, {
        method: "PUT",
        headers, 
        body: JSON.stringify({ }), 
      });
      if (!res.ok) throw new Error("Failed to archive product");
      await res.json();
      await getProducts();
      await getArchivedProducts();
      return true;
    } catch (error) {
      console.error("❌ Error archiving product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts, getArchivedProducts, getToken]);
  
  // Unarchive product
  const unarchiveProduct = useCallback(async (productId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/unarchive`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ }), 
      });
      if (!res.ok) throw new Error("Failed to unarchive product");
      await res.json();
      await getProducts();
      await getArchivedProducts();
      window.toast.success("Product unarchived!");
      return true;
    } catch (error) {
      console.error("❌ Error unarchiving product:", error);
      window.toast.error("Failed to unarchive product.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getArchivedProducts, getToken]);

  // Add variant
  const addVariant = useCallback(async (variantData) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/variants`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...variantData }), 
      });
      if (!res.ok) throw new Error("Failed to add variant");
      await res.json();
      await getProducts();
      window.toast.success("Variant added successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error adding variant:", error);
      window.toast.error("Failed to add variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);

  // Update variant
  const updateVariant = useCallback(async (variantId, variantData) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...variantData }), 
      });
      if (!res.ok) throw new Error("Failed to update variant");
      await res.json();
      await getProducts();
      window.toast.success("Variant updated successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error updating variant:", error);
      window.toast.error("Failed to update variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);

  // Archive variant
  const deleteVariant = useCallback(async (variantId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/archive`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ }), 
      });
      if (!res.ok) throw new Error("Failed to archive variant");
      await res.json();
      await getProducts();
      window.toast.success("Variant archived successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error archiving variant:", error);
      window.toast.error("Failed to archive variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);
  
  // Unarchive variant
  const unarchiveVariant = useCallback(async (variantId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/unarchive`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ }), 
      });
      if (!res.ok) throw new Error("Failed to unarchive variant");
      await res.json();
      await getProducts();
      window.toast.success("Variant unarchived successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error unarchiving variant:", error);
      window.toast.error("Failed to unarchive variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getToken]);

  const refreshProductStock = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(`${BACKEND_URL}/api/products/cache/invalidate`, { 
        method: "POST",
        headers
      });
      
      await getProducts();
      window.toast.success("Live stock updated!");
    } catch (error) {
      console.error("❌ Failed to refresh stock:", error);
      window.toast.error("Failed to refresh stock.");
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, getProducts, getToken]);

  useEffect(() => {
    getProducts();
    getArchivedProducts();
  }, [getProducts, getArchivedProducts]);

  return (
    <ProductContext.Provider
      value={{
        products,
        archivedProducts, 
        loading,
        getProducts,
        getArchivedProducts, 
        addProduct,
        updateProduct,
        deleteProduct,      
        unarchiveProduct,   
        addVariant,
        updateVariant,
        deleteVariant,      
        unarchiveVariant,   
        refreshProductStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};