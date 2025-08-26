import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BillCreator = () => {
  // State for products, user, delivery partner, payment
  const [products, setProducts] = useState([
    { name: "", size: "", price: "", discount: "", qty: 1 },
  ]);
  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [utrNo, setUtrNo] = useState("");

  // State for loading and errors
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Invoice details
  const invoiceNumber = `INV-${Math.floor(Math.random() * 100000)}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB");
  const invoiceRef = useRef();

  // Handlers
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", size: "", price: "", discount: "", qty: 1 }]);
  };

  const calculateTotals = () => {
    let total = 0;
    products.forEach((p) => {
      const discountedPrice = Number(p.price || 0) * (1 - Number(p.discount || 0) / 100);
      total += discountedPrice * Number(p.qty || 0);
    });
    return total.toFixed(2);
  };

  const paidAmount = paymentMode === "UPI" ? calculateTotals() : 0;
  const leftAmount = paymentMode === "CashOnDelivery" ? calculateTotals() : 0;

  // The core function to generate and download the PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    setPdfError(null);

    // Give the DOM a moment to update with the latest state
    setTimeout(async () => {
      const input = invoiceRef.current;
      if (!input) {
        setPdfError("Invoice element not found. Please refresh the page.");
        setIsGenerating(false);
        return;
      }

      try {
        const canvas = await html2canvas(input, {
          scale: 2, // Higher scale for better image quality
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add the image to the PDF
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        // Save the PDF with a unique name
        pdf.save(`DEVID_AURA_Invoice_${invoiceNumber}.pdf`);
      } catch (error) {
        console.error("PDF generation failed:", error);
        setPdfError("Failed to generate PDF. Please check your browser settings or try again.");
      } finally {
        setIsGenerating(false);
      }
    }, 500);
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

      {pdfError && (
        <div className="bg-red-200 text-red-700 p-3 rounded-lg mt-4">
          Error: {pdfError}
        </div>
      )}

      {/* Invoice Preview */}
      <div className="overflow-auto max-h-[80vh] p-2 mt-8 mx-auto">
        <div
          ref={invoiceRef}
          className="w-[210mm] min-h-[297mm] p-8 bg-white box-border shadow-2xl rounded-2xl"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b-2 border-neutral-200">
            <h1 className="text-4xl font-extrabold text-neutral-900">DEVID AURA</h1>
            <div className="text-right mt-4 md:mt-0">
              <p className="text-lg font-semibold">INVOICE</p>
              <p className="text-sm"><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p className="text-sm"><strong>Date:</strong> {invoiceDate}</p>
            </div>
          </div>

          {/* User & Delivery */}
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="p-4 border border-neutral-200 rounded-lg">
              <h5 className="font-semibold text-neutral-700">BILL TO:</h5>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{user.address}</p>
              <p className="text-sm text-neutral-600">{user.phone}</p>
            </div>
            <div className="mt-4 md:mt-0 p-4 border border-neutral-200 rounded-lg">
              <h5 className="font-semibold text-neutral-700">DELIVERY:</h5>
              <p className="font-medium">{deliveryPartner}</p>
              {paymentMode === "UPI" && (
                <>
                  <h5 className="font-semibold text-neutral-700 mt-2">UTR No:</h5>
                  <p className="text-sm">{utrNo || "N/A"}</p>
                </>
              )}
            </div>
          </div>

          {/* Product Table */}
          <table className="w-full border-collapse mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="font-bold px-4 py-2 text-left">Product</th>
                <th className="font-bold px-4 py-2 text-left">Size</th>
                <th className="font-bold px-4 py-2 text-left">Qty</th>
                <th className="font-bold px-4 py-2 text-left">Price</th>
                <th className="font-bold px-4 py-2 text-left">Discount</th>
                <th className="font-bold px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => {
                const discountedPrice =
                  Number(p.price || 0) * (1 - Number(p.discount || 0) / 100);
                return (
                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.size}</td>
                    <td className="px-4 py-3">{p.qty}</td>
                    <td className="px-4 py-3">₹{p.price}</td>
                    <td className="px-4 py-3">{p.discount}%</td>
                    <td className="px-4 py-3 text-right">₹{(discountedPrice * p.qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/3 text-right">
              <div className="flex justify-between items-center text-sm mb-2">
                <span>Paid:</span>
                <span className="font-semibold">₹{paidAmount}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span>Left:</span>
                <span className="font-semibold">₹{leftAmount}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t-2 border-neutral-300 pt-2 mt-2">
                <span>Total:</span>
                <span>₹{calculateTotals()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-neutral-500 text-sm mt-8">
            <p>Thank you for shopping with DEVID AURA!</p>
            <p>All sales are subject to our return policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCreator;