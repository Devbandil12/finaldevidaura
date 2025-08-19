import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto text-center">
      <CheckCircle size={80} className="text-green-500 mb-4" strokeWidth={1.5} />
      
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your order has been placed and is being processed.
      </p>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full">
        <button
          onClick={() => navigate("/")}
          className="w-full sm:w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
        >
          🏠 Back to Home
        </button>
        <button
          onClick={() => navigate("/myorder")}
          className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
        >
          📦 View My Orders
        </button>
      </div>
    </div>
  );
}
