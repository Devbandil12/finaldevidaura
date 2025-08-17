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

  // Corrected code
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

    // Await the response from the update request
    // This ensures the update is complete before fetching again
    await res.json();
    
    // Now, safely re-fetch the updated list of products
    getProducts();

  } catch (error) {
    console.error("❌ Error updating product:", error);
    // You might want to display a toast notification to the user here.
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
      getProducts();
    } catch (error) {
      console.error("❌ Error deleting product:", error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, getProducts, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
