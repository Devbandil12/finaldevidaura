// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getproducts = async () => {
    setLoading(true);
    try {
      const res = await db.select().from(productsTable);
      setProducts(res);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      // Optional: Handle error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getproducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, loading }}>
      {children}
    </ProductContext.Provider>
  );
};
