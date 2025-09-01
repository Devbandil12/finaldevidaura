import React, { useState } from "react";

const VariantsManager = ({ product, onRefresh }) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
  const [loading, setLoading] = useState(false);

  // Add new variant
  const handleAddVariant = async () => {
    const size = prompt("Enter size (ml):");
    const oprice = prompt("Enter original price:");
    const discount = prompt("Enter discount %:");
    const stock = prompt("Enter stock:");
    const showAsSingleProduct = confirm("Show this variant as single product?");

    if (!size || !oprice) return;

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/products/${product.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: Number(size),
          oprice: Number(oprice),
          discount: Number(discount) || 0,
          stock: Number(stock) || 0,
          showAsSingleProduct,
        }),
      });

      if (!res.ok) throw new Error("Failed to add variant");
      await onRefresh();
    } catch (error) {
      console.error("❌ Error adding variant:", error);
    } finally {
      setLoading(false);
    }
  };

  // Edit existing variant
  const handleEditVariant = async (variant) => {
    const size = prompt("Enter new size:", variant.size);
    const oprice = prompt("Enter new price:", variant.oprice);
    const discount = prompt("Enter discount %:", variant.discount);
    const stock = prompt("Enter stock:", variant.stock);
    const showAsSingleProduct = confirm("Show as single product?");

    try {
      setLoading(true);
      const res = await fetch(
        `${BACKEND_URL}/api/products/${product.id}/variants/${variant.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            size: Number(size),
            oprice: Number(oprice),
            discount: Number(discount),
            stock: Number(stock),
            showAsSingleProduct,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update variant");
      await onRefresh();
    } catch (error) {
      console.error("❌ Error updating variant:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete variant
  const handleDeleteVariant = async (variantId) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${BACKEND_URL}/api/products/${product.id}/variants/${variantId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete variant");
      await onRefresh();
    } catch (error) {
      console.error("❌ Error deleting variant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold">Variants</h3>
      <table className="w-full border mt-2 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Size</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Discount</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Single Product</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {product.variants.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="p-2 border">{v.size} ml</td>
              <td className="p-2 border">₹{v.oprice}</td>
              <td className="p-2 border">{v.discount}%</td>
              <td className="p-2 border">{v.stock}</td>
              <td className="p-2 border">{v.showAsSingleProduct ? "✅" : "❌"}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleEditVariant(v)}
                  className="px-2 py-1 bg-blue-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteVariant(v.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded ml-2"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {product.variants.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-3 text-gray-500">
                No variants added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        onClick={handleAddVariant}
        disabled={loading}
        className="mt-3 px-3 py-2 bg-green-600 text-white rounded"
      >
        {loading ? "Saving..." : "+ Add Variant"}
      </button>
    </div>
  );
};

export default VariantsManager;
