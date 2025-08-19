
// src/components/Confirmation.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
// No need to import a separate CSS file anymore
// import "../style/confirmation.css";

export default function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg text-center border border-gray-200">
      <CheckCircle size={80} color="#22C55E" strokeWidth={1.5} className="mb-4" />

      <h2 className="text-3xl font-bold text-gray-800 mt-4">Order Confirmed!</h2>
      <p className="text-gray-600 mt-2 max-w-sm">
        Thank you for your purchase. Your order has been placed and is being processed.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={() => {
            navigate("/");
            resetCheckout();
          }}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 shadow-sm"
        >
          🏠 Back to Home
        </button>
        <button
          onClick={() => {
            navigate("/myorder");
            resetCheckout();
          }}
          className="px-6 py-3 rounded-md font-semibold transition-colors duration-200 shadow-md bg-blue-600 text-white hover:bg-blue-700"
        >
          📦 View My Orders
        </button>
      </div>
    </div>
  );
}
