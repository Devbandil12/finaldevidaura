// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  // Fetches products from the backend API endpoint
  const getProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, updatedData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }
      // After a successful update, refresh the product list
      getProducts();
    } catch (error) {
      console.error("❌ Error updating product:", error);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }
      // After a successful deletion, refresh the product list
      getProducts();
    } catch (error) {
      console.error("❌ Error deleting product:", error);
    }
  };

  // Calls the fetch function when the component mounts
  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, getProducts, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
