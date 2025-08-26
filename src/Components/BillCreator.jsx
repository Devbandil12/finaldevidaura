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
  
  // New state to hold the canvas image data
  const [canvasImage, setCanvasImage] = useState(null);

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
    setCanvasImage(null); // Clear previous image

    setTimeout(async () => {
      const input = invoiceRef.current;
      if (!input) {
        setPdfError("Invoice element not found. Please refresh the page.");
        setIsGenerating(false);
        return;
      }

      try {
        const canvas = await html2canvas(input, {
          scale: 2,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        setCanvasImage(imgData); // Display the canvas image
        
        // This is the part that was causing the issue, so we'll leave it out for now.
        // const pdf = new jsPDF("p", "mm", "a4");
        // const pdfWidth = pdf.internal.pageSize.getWidth();
        // const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        // pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        // pdf.save(`DEVID_AURA_Invoice_${invoiceNumber}.pdf`);
      
      } catch (error) {
        console.error("Canvas generation failed:", error);
        setPdfError("Failed to capture image. Please check your browser settings or try again.");
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  return (
    <div className="p-4 md:p-12 font-sans min-h-screen" style={{ backgroundColor: '#fafafa', color: '#3f3f3f' }}>
      <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: '#171717' }}>DEVID AURA</h2>
      <p className="text-center italic mb-8" style={{ color: '#525252' }}>Presence in Every Step</p>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="p-6 rounded-2xl shadow-md space-y-4" style={{ backgroundColor: '#ffffff' }}>
          <h4 className="font-semibold text-lg" style={{ color: '#404040' }}>User Details</h4>
          <input
            type="text"
            placeholder="Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <h4 className="font-semibold mt-6 text-lg" style={{ color: '#404040' }}>Delivery Partner</h4>
          <input
            type="text"
            placeholder="Delivery Partner Name"
            value={deliveryPartner}
            onChange={(e) => setDeliveryPartner(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <h4 className="font-semibold mt-6 text-lg" style={{ color: '#404040' }}>Payment Mode</h4>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
            />
          )}
        </div>

        {/* Products Input */}
        <div className="p-6 rounded-2xl shadow-md space-y-4" style={{ backgroundColor: '#ffffff' }}>
          <h4 className="font-semibold text-lg" style={{ color: '#404040' }}>Products</h4>
          {products.map((p, index) => (
            <div key={index} className="flex flex-wrap gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={p.name}
                onChange={(e) => handleProductChange(index, "name", e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg min-w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Size"
                value={p.size}
                onChange={(e) => handleProductChange(index, "size", e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Price"
                value={p.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Disc %"
                value={p.discount}
                onChange={(e) => handleProductChange(index, "discount", e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={p.qty}
                onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg min-w-[50px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={addProduct}
            className="hover:bg-blue-600 transition text-white px-4 py-2 rounded-lg mt-2 shadow-md"
            style={{ backgroundColor: '#3b82f6' }}
          >
            Add Another Product
          </button>
        </div>
      </div>

      {/* Generate PDF Button & Error Message */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg ${isGenerating ? "bg-gray-400 cursor-not-allowed" : "text-white hover:bg-blue-700"}`}
        style={{ backgroundColor: isGenerating ? '#9ca3af' : '#2563eb' }}
      >
        {isGenerating ? "Generating..." : "Generate PDF"}
      </button>

      {pdfError && (
        <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: '#fecaca', color: '#b91c1c' }}>
          Error: {pdfError}
        </div>
      )}

      {/* Canvas Preview Image */}
      {canvasImage && (
        <div className="mt-8 text-center">
          <p className="font-semibold mb-4">Canvas Preview:</p>
          <img src={canvasImage} alt="Invoice Preview" className="mx-auto" style={{ maxWidth: '100%' }} />
        </div>
      )}

      {/* Invoice Preview */}
      <div className="overflow-auto max-h-[80vh] p-2 mt-8 mx-auto">
        <div
          ref={invoiceRef}
          className="w-[210mm] min-h-[297mm] p-8 box-border shadow-2xl rounded-2xl"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
            <h1 className="text-4xl font-extrabold" style={{ color: '#171717' }}>DEVID AURA</h1>
            <div className="text-right mt-4 md:mt-0">
              <p className="text-lg font-semibold">INVOICE</p>
              <p className="text-sm"><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p className="text-sm"><strong>Date:</strong> {invoiceDate}</p>
            </div>
          </div>

          {/* User & Delivery */}
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e5e5' }}>
              <h5 className="font-semibold" style={{ color: '#404040' }}>BILL TO:</h5>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#525252' }}>{user.address}</p>
              <p className="text-sm" style={{ color: '#525252' }}>{user.phone}</p>
            </div>
            <div className="mt-4 md:mt-0 p-4 border rounded-lg" style={{ borderColor: '#e5e5e5' }}>
              <h5 className="font-semibold" style={{ color: '#404040' }}>DELIVERY:</h5>
              <p className="font-medium">{deliveryPartner}</p>
              {paymentMode === "UPI" && (
                <>
                  <h5 className="font-semibold mt-2" style={{ color: '#404040' }}>UTR No:</h5>
                  <p className="text-sm">{utrNo || "N/A"}</p>
                </>
              )}
            </div>
          </div>

          {/* Product Table */}
          <table className="w-full border-collapse mb-8 text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#e5e5e5' }}>
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
                  <tr key={index} className="border-b transition-colors" style={{ borderColor: '#e5e5e5', '--tw-bg-opacity': '1' }}>
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
              <div className="flex justify-between items-center text-lg font-bold border-t-2 pt-2 mt-2" style={{ borderColor: '#a3a3a3' }}>
                <span>Total:</span>
                <span>₹{calculateTotals()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm mt-8" style={{ color: '#737373' }}>
            <p>Thank you for shopping with DEVID AURA!</p>
            <p>All sales are subject to our return policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCreator;
