import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BillCreator = () => {
  const [products, setProducts] = useState([
    { name: "", size: "", price: "", discount: "", qty: 1 },
  ]);
  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [utrNo, setUtrNo] = useState("");

  const invoiceNumber = `INV-${Math.floor(Math.random() * 100000)}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB");
  const invoiceRef = useRef();

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

  const generatePDF = () => {
    setTimeout(() => {
      const input = invoiceRef.current;
      if (!input) return;
      html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`DEVID_AURA_Invoice_${invoiceNumber}.pdf`);
      });
    }, 500);
  };

  return (
    <div className="p-4 md:p-6 font-sans bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center text-black-600">DEVID AURA</h2>
      <p className="text-center italic text-gray-600 mb-6">Presence in Every Step</p>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">User Details</h4>
          <input
            type="text"
            placeholder="Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <h4 className="font-semibold mt-4 text-lg">Delivery Partner</h4>
          <input
            type="text"
            placeholder="Delivery Partner Name"
            value={deliveryPartner}
            onChange={(e) => setDeliveryPartner(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <h4 className="font-semibold mt-4 text-lg">Payment Mode</h4>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full p-2 border rounded"
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
              className="w-full p-2 border rounded mt-2"
            />
          )}
        </div>

        {/* Products Input */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg">Products</h4>
          {products.map((p, index) => (
            <div key={index} className="flex flex-wrap gap-2 mb-2">
              <input
                type="text"
                placeholder="Product Name"
                value={p.name}
                onChange={(e) => handleProductChange(index, "name", e.target.value)}
                className="flex-2 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Size"
                value={p.size}
                onChange={(e) => handleProductChange(index, "size", e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={p.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Discount %"
                value={p.discount}
                onChange={(e) => handleProductChange(index, "discount", e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Qty"
                value={p.qty}
                onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                className="flex-1 p-2 border rounded"
              />
            </div>
          ))}
          <button
            onClick={addProduct}
            className="bg-pink-500 text-white px-4 py-2 rounded mt-2"
          >
            Add Another Product
          </button>
        </div>
      </div>

      {/* Generate PDF */}
      <button
        onClick={generatePDF}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6"
      >
        Generate PDF
      </button>

      {/* Invoice Preview */}
      <div className="overflow-auto max-h-[80vh] p-2 border bg-white rounded mx-auto">
        <div
          ref={invoiceRef}
          className="w-[210mm] min-h-[297mm] p-6 md:p-8 bg-white box-border shadow-md"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-pink-600">DEVID AURA</h1>
            <div className="text-right mt-2 md:mt-0">
              <p><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p><strong>Date:</strong> {invoiceDate}</p>
            </div>
          </div>

          {/* User & Delivery */}
          <div className="flex flex-col md:flex-row justify-between p-4 bg-gray-100 rounded mb-6">
            <div>
              <strong>User Details</strong><br />
              {user.name}<br />
              {user.address}<br />
              {user.phone}
            </div>
            <div className="mt-4 md:mt-0">
              <strong>Delivery Partner</strong><br />
              {deliveryPartner}
            </div>
            {paymentMode === "UPI" && (
              <div className="mt-4 md:mt-0">
                <strong>UTR No:</strong><br />
                {utrNo || "N/A"}
              </div>
            )}
          </div>

          {/* Product Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border px-4 py-2">Product</th>
                <th className="border px-4 py-2">Size</th>
                <th className="border px-4 py-2">Qty</th>
                <th className="border px-4 py-2">Price</th>
                <th className="border px-4 py-2">Discount %</th>
                <th className="border px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => {
                const discountedPrice =
                  Number(p.price || 0) * (1 - Number(p.discount || 0) / 100);
                return (
                  <tr key={index}>
                    <td className="border px-4 py-2">{p.name}</td>
                    <td className="border px-4 py-2">{p.size}</td>
                    <td className="border px-4 py-2">{p.qty}</td>
                    <td className="border px-4 py-2">₹{p.price}</td>
                    <td className="border px-4 py-2">{p.discount}%</td>
                    <td className="border px-4 py-2">₹{(discountedPrice * p.qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="flex justify-end gap-6 mb-6">
            <div className="text-right space-y-1">
              <div>
                <strong>Paid:</strong> ₹{paidAmount}
              </div>
              <div>
                <strong>Left:</strong> ₹{leftAmount}
              </div>
              <div className="text-xl font-bold">
                <strong>Total:</strong> ₹{calculateTotals()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-4">
            Thank you for shopping with DEVID AURA!<br />
            All sales are subject to our return policy.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCreator;
