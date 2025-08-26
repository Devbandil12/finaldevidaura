import React, { useRef, useState } from "react";
import ReactToPdf from "react-to-pdf";

const TailwindBillGenerator = () => {
  const [products, setProducts] = useState([
    { name: "", size: "", price: "", discountedPrice: "", qty: 1 },
  ]);

  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const pdfRef = useRef();

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", size: "", price: "", discountedPrice: "", qty: 1 }]);
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + Number(p.discountedPrice) * Number(p.qty), 0);
  };

  const invoiceNumber = `INV-${Math.floor(Math.random() * 100000)}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB");

  return (
    <div className="p-6 font-sans">
      <h2 className="text-2xl font-bold mb-6">DEVID AURA - Bill Generator</h2>

      {/* User Inputs */}
      <div className="mb-6">
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
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-2">Delivery Partner</h4>
        <input
          type="text"
          placeholder="Delivery Partner Name"
          value={deliveryPartner}
          onChange={(e) => setDeliveryPartner(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
      </div>

      <div className="mb-6">
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
              onChange={(e) => handleProductChange(index, "discountedPrice", e.target.value)}
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

      {/* Generate PDF */}
      <ReactToPdf
        targetRef={pdfRef}
        filename="DEVID_AURA_Bill.pdf"
        x={0}
        y={0}
        scale={0.9}
      >
        {({ toPdf }) => (
          <button
            onClick={toPdf}
            className="bg-green-600 text-white px-4 py-2 rounded mb-6"
          >
            Generate PDF
          </button>
        )}
      </ReactToPdf>

      {/* PDF Content */}
      <div
        ref={pdfRef}
        className="w-[210mm] min-h-[297mm] p-8 border bg-white box-border"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl text-pink-600 font-bold">DEVID AURA</h1>
            <p className="italic text-gray-600 text-lg">ORESENCE IN EVERY STEP</p>
          </div>
          <div className="text-right flex-1">
            <p><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p><strong>Date:</strong> {invoiceDate}</p>
          </div>
        </div>

        {/* User & Delivery */}
        <div className="flex justify-between p-4 bg-gray-100 rounded mb-8">
          <div>
            <strong>User Details</strong><br />
            {user.name}<br />
            {user.address}<br />
            {user.phone}
          </div>
          <div>
            <strong>Delivery Partner</strong><br />
            {deliveryPartner}
          </div>
        </div>

        {/* Product Table */}
        <table className="w-full border-collapse mb-8">
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
                <td className="border px-4 py-2">₹{Number(p.discountedPrice) * Number(p.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand Total */}
        <div className="text-right text-xl font-bold p-4 bg-gray-200 rounded mb-8">
          Grand Total: ₹{calculateTotal()}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          Thank you for shopping with DEVID AURA!<br />
          All sales are subject to our return policy.
        </div>
      </div>
    </div>
  );
};

export default TailwindBillGenerator;
