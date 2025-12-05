// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "./UserContext"; // 🟢 Import UserContext

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedProducts, setArchivedProducts] = useState([]);
  
  // 🟢 Get current user details to send actorId
  const { userdetails } = useContext(UserContext);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

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
      const res = await fetch(`${BACKEND_URL}/api/products/archived`);
      if (!res.ok) throw new Error("Failed to fetch archived products");
      const data = await res.json();
      setArchivedProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch archived products:", error);
      window.toast.error("Could not load archived products.");
    }
  }, [BACKEND_URL]);

  // 🟢 Add product (With actorId)
  const addProduct = useCallback(async (newProduct) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newProduct, actorId: userdetails?.id }), // 🟢 Added actorId
      });
      if (!res.ok) throw new Error("Failed to add product");
      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts, userdetails?.id]);

  // 🟢 Update product (With actorId)
  const updateProduct = useCallback(async (productId, updatedData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedData, actorId: userdetails?.id }), // 🟢 Added actorId
      });
      if (!res.ok) throw new Error("Failed to update product");
      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return false;
    }
  }, [BACKEND_URL, getProducts, userdetails?.id]);

  // 🟢 Archive product (With actorId)
  const deleteProduct = useCallback(async (productId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, // 🟢 Added Header
        body: JSON.stringify({ actorId: userdetails?.id }), // 🟢 Added Body
      });
      if (!res.ok) throw new Error("Failed to archive product");
      await res.json();
      await getProducts();
      await getArchivedProducts();
      return true;
    } catch (error) {
      console.error("❌ Error archiving product:", error);
      window.toast.error("Failed to archive product.");
      return false;
    }
  }, [BACKEND_URL, getProducts, getArchivedProducts, userdetails?.id]);
  
  // 🟢 Unarchive product (With actorId)
  const unarchiveProduct = useCallback(async (productId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}/unarchive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, // 🟢 Added Header
        body: JSON.stringify({ actorId: userdetails?.id }), // 🟢 Added Body
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
  }, [BACKEND_URL, getProducts, getArchivedProducts, userdetails?.id]);

  // 🟢 Add variant (With actorId)
  const addVariant = useCallback(async (variantData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...variantData, actorId: userdetails?.id }), // 🟢 Added actorId
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
  }, [BACKEND_URL, getProducts, userdetails?.id]);

  // 🟢 Update variant (With actorId)
  const updateVariant = useCallback(async (variantId, variantData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...variantData, actorId: userdetails?.id }), // 🟢 Added actorId
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
  }, [BACKEND_URL, getProducts, userdetails?.id]);

  // 🟢 Archive variant (With actorId)
  const deleteVariant = useCallback(async (variantId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, // 🟢 Added Header
        body: JSON.stringify({ actorId: userdetails?.id }), // 🟢 Added Body
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
  }, [BACKEND_URL, getProducts, userdetails?.id]);
  
  // 🟢 Unarchive variant (With actorId)
  const unarchiveVariant = useCallback(async (variantId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/variants/${variantId}/unarchive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, // 🟢 Added Header
        body: JSON.stringify({ actorId: userdetails?.id }), // 🟢 Added Body
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
  }, [BACKEND_URL, getProducts, userdetails?.id]);

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
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};