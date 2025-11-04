// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect, useCallback } from "react"; // 👈 IMPORT useCallback

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedProducts, setArchivedProducts] = useState([]);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetch active products (for the storefront)
  const getProducts = useCallback(async () => { // 👈 WRAP
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
  }, [BACKEND_URL]); // 👈 ADD DEPENDENCIES
  
  // 🟢 NEW: Fetches *only* archived products (for the admin panel)
  const getArchivedProducts = useCallback(async () => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived products");
      const data = await res.json();
      setArchivedProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch archived products:", error);
      window.toast.error("Could not load archived products.");
    }
  }, [BACKEND_URL]); // 👈 ADD DEPENDENCIES

  // Add product (Unchanged)
  const addProduct = useCallback(async (newProduct) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) throw new Error("Failed to add product");
      await res.json();
      await getProducts(); // refresh product list
      return true;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES

  // Update product (Unchanged)
  const updateProduct = useCallback(async (productId, updatedData) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error("Failed to update product");
      await res.json();
      await getProducts(); // refresh
      return true;
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES

  // 🟢 MODIFIED: This function now "archives" a product
  const deleteProduct = useCallback(async (productId) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/archive`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to archive product");
      await res.json();
      await getProducts(); // Refreshes the main list
      await getArchivedProducts(); // Refreshes the archived list
      return true;
    } catch (error) {
      console.error("❌ Error archiving product:", error);
      window.toast.error("Failed to archive product.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getArchivedProducts]); // 👈 ADD DEPENDENCIES
  
  // 🟢 NEW: Function to unarchive a product
  const unarchiveProduct = useCallback(async (productId) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/unarchive`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to unarchive product");
      await res.json();
      await getProducts(); // Refreshes the main list
      await getArchivedProducts(); // Refreshes the archived list
      window.toast.success("Product unarchived!");
      return true;
    } catch (error) {
      console.error("❌ Error unarchiving product:", error);
      window.toast.error("Failed to unarchive product.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getArchivedProducts]); // 👈 ADD DEPENDENCIES

  // 🟢 NEW: Add a new variant
  const addVariant = useCallback(async (variantData) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantData),
      });
      if (!res.ok) throw new Error("Failed to add variant");
      await res.json();
      await getProducts(); // Refresh list
      window.toast.success("Variant added successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error adding variant:", error);
      window.toast.error("Failed to add variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES

  // 🟢 NEW: Update a single variant
  const updateVariant = useCallback(async (variantId, variantData) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantData),
      });
      if (!res.ok) throw new Error("Failed to update variant");
      await res.json();
      await getProducts(); // Refresh list
      window.toast.success("Variant updated successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error updating variant:", error);
      window.toast.error("Failed to update variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES

  // 🟢 MODIFIED: This function now "archives" a variant
  const deleteVariant = useCallback(async (variantId) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/archive`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to archive variant");
      await res.json();
      await getProducts(); // Refresh list
      window.toast.success("Variant archived successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error archiving variant:", error);
      window.toast.error("Failed to archive variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES
  
  // 🟢 NEW: Function to unarchive a variant
  const unarchiveVariant = useCallback(async (variantId) => { // 👈 WRAP
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/unarchive`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to unarchive variant");
      await res.json();
      await getProducts(); // Refresh list
      window.toast.success("Variant unarchived successfully.");
      return true;
    } catch (error) {
      console.error("❌ Error unarchiving variant:", error);
      window.toast.error("Failed to unarchive variant.");
      return false;
    }
  }, [BACKEND_URL, getProducts]); // 👈 ADD DEPENDENCIES

  useEffect(() => {
    getProducts();
    getArchivedProducts(); // Also fetch archived list on load
  }, [getProducts, getArchivedProducts]); // 👈 UPDATE DEPENDENCY ARRAY

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
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};