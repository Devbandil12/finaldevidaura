// src/components/Loader.jsx
import React from "react";
import "../style/loader.css";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="loader-wrapper">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
