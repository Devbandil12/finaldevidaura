import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import "../style/confirmation.css";


export default function Confirmation({ resetCheckout }) {
  const navigate = useNavigate();

  return (
    <div className="confirmation success-container">
      <CheckCircle size={64} color="#4CAF50" strokeWidth={1.5} className="success-icon" />

      <h2 className="confirmation-title">Order Confirmed!</h2>
      <p className="confirmation-message">
        Thank you for your purchase. Your order has been placed and is being processed.
      </p>

      <div className="confirmation-actions">
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          🏠 Back to Home
        </button>
        <button onClick={() => navigate("/myorder")} className="btn btn-primary">
          📦 View My Orders
        </button>
      </div>
    </div>
  );
}
