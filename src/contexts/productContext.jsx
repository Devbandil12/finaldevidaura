// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const getProducts = async () => {
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
  };
  
  const addProduct = async (productData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        throw new Error("Failed to add product");
      }
      const newProduct = await res.json();
      setProducts(prevProducts => [...prevProducts, newProduct]);
      toast.success("Product added successfully!");
      return newProduct;
    } catch (error) {
      console.error("❌ Failed to add product:", error);
      toast.error("Failed to add product.");
      throw error;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) throw new Error("Failed to update product");
      await getProducts();
      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("❌ Failed to update product:", error);
      toast.error("Failed to update product.");
    }
  };

  const deleteProduct = async (productId) => {
    try {
      if (window.confirm("Are you sure you want to delete this product?")) {
        const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete product");
        await getProducts();
        toast.success("Product deleted successfully!");
      }
    } catch (error) {
      console.error("❌ Failed to delete product:", error);
      toast.error("Failed to delete product.");
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, getProducts, updateProduct, deleteProduct, loading, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
