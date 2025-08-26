import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BillCreator = () => {
  const [products, setProducts] = useState([
    { name: "", size: "", price: "", discountedPrice: "", qty: 1 },
  ]);
  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const invoiceNumber = `INV-${Math.floor(Math.random() * 100000)}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB");

  const invoiceRef = useRef();

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { name: "", size: "", price: "", discountedPrice: "", qty: 1 },
    ]);
  };

  const calculateTotal = () => {
    return products.reduce(
      (sum, p) => sum + Number(p.discountedPrice || 0) * Number(p.qty || 0),
      0
    );
  };

  const generatePDF = () => {
    const input = invoiceRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DEVID_AURA_Invoice_${invoiceNumber}.pdf`);
    });
  };

  return (
    <div className="p-4 md:p-6 font-sans bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">DEVID AURA - Bill Generator</h2>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User & Delivery */}
        <div>
          <h4 className="font-semibold mb-2">User Details</h4>
          <input
            type="text"
            placeholder="Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <textarea
            placeholder="Address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />

          <h4 className="font-semibold mb-2 mt-4">Delivery Partner</h4>
          <input
            type="text"
            placeholder="Delivery Partner Name"
            value={deliveryPartner}
            onChange={(e) => setDeliveryPartner(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
        </div>

        {/* Products Input */}
        <div>
          <h4 className="font-semibold mb-2">Products</h4>
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
                placeholder="Original Price"
                value={p.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Discounted Price"
                value={p.discountedPrice}
                onChange={(e) =>
                  handleProductChange(index, "discountedPrice", e.target.value)
                }
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

      {/* Generate PDF Button */}
      <button
        onClick={generatePDF}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6"
      >
        Generate PDF
      </button>

      {/* Scrollable Invoice Preview */}
      <div className="overflow-auto max-h-[80vh] p-2 border bg-white rounded mx-auto">
        <div
          ref={invoiceRef}
          className="w-[210mm] min-h-[297mm] p-6 md:p-8 bg-white box-border"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl text-black-600 font-bold">DEVID AURA</h1>
              <p className="italic text-gray-600 text-lg">Presence in every step</p>
            </div>
            <div className="text-right flex-1 mt-4 md:mt-0">
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
          </div>

          {/* Product Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border px-4 py-2">Product</th>
                <th className="border px-4 py-2">Size</th>
                <th className="border px-4 py-2">Qty</th>
                <th className="border px-4 py-2">Price</th>
                <th className="border px-4 py-2">Discounted</th>
                <th className="border px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{p.name}</td>
                  <td className="border px-4 py-2">{p.size}</td>
                  <td className="border px-4 py-2">{p.qty}</td>
                  <td className="border px-4 py-2">₹{p.price}</td>
                  <td className="border px-4 py-2">₹{p.discountedPrice}</td>
                  <td className="border px-4 py-2">
                    ₹{Number(p.discountedPrice || 0) * Number(p.qty || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total */}
          <div className="text-right text-xl font-bold p-4 bg-gray-200 rounded mb-6">
            Grand Total: ₹{calculateTotal()}
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            Thank you for shopping with DEVID AURA!<br />
            All sales are subject to our return policy.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCreator;
