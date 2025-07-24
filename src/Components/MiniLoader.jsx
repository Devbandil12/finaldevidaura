// src/components/MiniLoader.jsx
import React from "react";
import "../style/loader.css"; // reuse your existing spinner styles

export default function MiniLoader({ text = "Loading..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        className="spinner"
        style={{ width: 18, height: 18, borderWidth: 2 }}
      />
      <span>{text}</span>
    </div>
  );
}
