import React, { useState } from "react";
import "../style/AnimatedMenu.css";

const AnimatedMenu = ({ size = 50 }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-nav" style={{ width: size, height: size }}>
     <svg
  className={`menu-icon ${open ? "open" : ""}`}
  viewBox="0 0 100 56"
  onClick={() => setOpen((prev) => !prev)}
>
  <path d="M48.33,45.6H18a14.17,14.17,0,0,1,0-28.34H78.86a17.37,17.37,0,0,1,0,34.74H42.33l-21-21.26L47.75,4"/>
  <path d="M48.33,45.6H18a14.17,14.17,0,0,1,0-28.34H78.86a17.37,17.37,0,0,1,0,34.74H42.33l-21-21.26L47.75,4"/>
</svg>

    </div>
  );
};

export default AnimatedMenu;
