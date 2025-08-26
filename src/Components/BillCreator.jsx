import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const BillCreator = () => {
  const [products, setProducts] = useState([
    { name: "", size: "", price: "", discount: "", qty: 1 },
  ]);
  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [utrNo, setUtrNo] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", size: "", price: "", discount: "", qty: 1 }]);
  };

  // The core function to generate and download the PDF
  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/create-manual-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          deliveryPartner,
          paymentMode,
          utrNo,
          products,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF. Please try again.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manual_invoice.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Bill downloaded successfully!");

    } catch (error) {
      console.error("❌ Manual PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-12 font-sans bg-neutral-50 text-neutral-800 min-h-screen">
      <h2 className="text-3xl font-bold mb-2 text-center text-neutral-900">DEVID AURA</h2>
      <p className="text-center italic text-neutral-600 mb-8">Presence in Every Step</p>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <h4 className="font-semibold text-lg text-neutral-700">User Details</h4>
          <input
            type="text"
            placeholder="Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <h4 className="font-semibold mt-6 text-lg text-neutral-700">Delivery Partner</h4>
          <input
            type="text"
            placeholder="Delivery Partner Name"
            value={deliveryPartner}
            onChange={(e) => setDeliveryPartner(e.target.value)}
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <h4 className="font-semibold mt-6 text-lg text-neutral-700">Payment Mode</h4>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UPI">UPI</option>
            <option value="CashOnDelivery">Cash on Delivery</option>
          </select>

          {paymentMode === "UPI" && (
            <input
              type="text"
              placeholder="UTR Number"
              value={utrNo}
              onChange={(e) => setUtrNo(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2"
            />
          )}
        </div>

        {/* Products Input */}
        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <h4 className="font-semibold text-lg text-neutral-700">Products</h4>
          {products.map((p, index) => (
            <div key={index} className="flex flex-wrap gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={p.name}
                onChange={(e) => handleProductChange(index, "name", e.target.value)}
                className="flex-1 p-2 border border-neutral-300 rounded-lg min-w-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Size"
                value={p.size}
                onChange={(e) => handleProductChange(index, "size", e.target.value)}
                className="flex-1 p-2 border border-neutral-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Price"
                value={p.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                className="flex-1 p-2 border border-neutral-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Disc %"
                value={p.discount}
                onChange={(e) => handleProductChange(index, "discount", e.target.value)}
                className="flex-1 p-2 border border-neutral-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={p.qty}
                onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                className="flex-1 p-2 border border-neutral-300 rounded-lg min-w-[50px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button
            onClick={addProduct}
            className="bg-indigo-500 hover:bg-indigo-600 transition text-white px-4 py-2 rounded-lg mt-2 shadow-md"
          >
            Add Another Product
          </button>
        </div>
      </div>

      {/* Generate PDF Button & Error Message */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg ${isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
      >
        {isGenerating ? "Generating..." : "Generate PDF"}
      </button>

      {/* This component will no longer show the UI error message, as that's handled by toasts */}
    </div>
  );
};

export default BillCreator;
