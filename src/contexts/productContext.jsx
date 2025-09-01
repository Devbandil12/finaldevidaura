// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetch products
  const getProducts = async () => {
    setLoading(true);
    try {
      // ✅ Updated to use the new grouped endpoint
      const res = await fetch(`${BACKEND_URL}/api/products/grouped`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };


  // ✅ Add product
  const addProduct = async (newProduct) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to add product");

      await res.json(); // wait for response
      await getProducts(); // refresh product list
      return true;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      return false;
    }
  };

  // Update product
  const updateProduct = async (productId, updatedData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update product");
      await res.json();
      await getProducts(); // ✅ refresh
    } catch (error) {
      console.error("❌ Error updating product:", error);
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete product");
      await res.json();
      await getProducts(); // ✅ refresh
    } catch (error) {
      console.error("❌ Error deleting product:", error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, getProducts, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
