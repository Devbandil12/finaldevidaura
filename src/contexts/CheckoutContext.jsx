import React, { createContext, useState, useContext, useEffect } from "react";

export const CheckoutContext = createContext({
  buyNow: null,
  setBuyNow: () => {},
  startBuyNow: () => {},
  clearBuyNow: () => {},
});

export const CheckoutProvider = ({ children }) => {
  const [buyNow, setBuyNow] = useState(() => {
    try {
      const saved = localStorage.getItem("buyNowItem");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (buyNow) {
      localStorage.setItem("buyNowItem", JSON.stringify(buyNow));
    } else {
      localStorage.removeItem("buyNowItem");
    }
  }, [buyNow]);

  const startBuyNow = (productOrItem, variant, quantity) => {
    let item;
    if (variant && quantity !== undefined) {
      item = { 
        product: productOrItem, 
        variant, 
        quantity, 
        isBundle: false, 
        contents: []
      };
    } else {
      item = productOrItem; 
    }
    setBuyNow(item);
  };

  const clearBuyNow = () => setBuyNow(null);

  return (
    <CheckoutContext.Provider value={{ buyNow, setBuyNow, startBuyNow, clearBuyNow }}>
      {children}
    </CheckoutContext.Provider>
  );
};
