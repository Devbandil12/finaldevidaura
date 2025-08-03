// src/contexts/ProductContext.js
import React, { createContext, useState, useEffect } from "react";

import { db } from "../../configs";
import { productsTable } from "../../configs/schema";



export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);
  const getproducts = async () => {
    try {
      const res = await db.select().from(productsTable);
      setProducts(res);
    } catch (error) {}
  };
  useEffect(() => {
    getproducts();
    // Optionally load products from localStorage if available.
    // const storedProducts = getproducts();
    // if (storedProducts) {
    // }
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
