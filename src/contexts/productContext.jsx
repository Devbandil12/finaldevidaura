import React, { createContext, useState, useEffect } from "react";
// Remove the initialProducts mock data as we will load a proper loading state
// import ProductImage from "../assets/images/mockup-empty-perfume-bottle-perfume-brand-design_826454-355-removebg-preview.png";
import { db } from "../../configs";
import { productsTable } from "../../configs/schema";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Added a loading state

  const getproducts = async () => {
    setLoading(true); // <-- Set loading to true before fetching
    try {
      const res = await db.select().from(productsTable);
      setProducts(res);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false); // <-- Set loading to false after fetch is complete
    }
  };

  useEffect(() => {
    getproducts();
  }, []);

  // Remove the localStorage useEffect as it's not needed for this use case

  return (
    <ProductContext.Provider value={{ products, setProducts, loading }}>
      {children}
    </ProductContext.Provider>
  );
};
