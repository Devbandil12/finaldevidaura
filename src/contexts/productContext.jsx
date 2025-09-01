import React, { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  /* =======================
     Fetch all products
  ======================= */
  const getProducts = async () => {
    setLoading(true);
    try {
      // ✅ use standard endpoint unless you kept a special /grouped route
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

  /* =======================
     Fetch single product
  ======================= */
  const getProductById = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return await res.json();
    } catch (error) {
      console.error("❌ Error fetching product:", error);
      return null;
    }
  };

  /* =======================
     Add product (with variants + images JSON)
  ======================= */
  const addProduct = async (newProduct) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct), // newProduct must include `variants` + `imageurl`
      });
      if (!res.ok) throw new Error("Failed to add product");

      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      return false;
    }
  };

  /* =======================
     Update product (replace variants array if changed)
  ======================= */
  const updateProduct = async (productId, updatedData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData), // must include updated variants if changed
      });
      if (!res.ok) throw new Error("Failed to update product");

      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return false;
    }
  };

  /* =======================
     Delete product
  ======================= */
  const deleteProduct = async (productId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");

      await res.json();
      await getProducts();
      return true;
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      return false;
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        getProducts,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
