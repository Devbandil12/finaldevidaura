// src/components/HeroButton.jsx
import React from "react";

export default function HeroButton({ children, onClick, className = "", ...props }) {
  const handleClick = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    circle.classList.add("pulse");

    // Get button bounds
    const rect = button.getBoundingClientRect();

    // Find the farthest corner from click point (to fully cover button)
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const maxX = Math.max(clickX, rect.width - clickX);
    const maxY = Math.max(clickY, rect.height - clickY);
    const radius = Math.sqrt(maxX ** 2 + maxY ** 2);

    const diameter = radius * 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${clickX - radius}px`;
    circle.style.top = `${clickY - radius}px`;

    // Detect background brightness for ripple color
    const bgColor = window.getComputedStyle(button).backgroundColor;
    const isLight = isLightColor(bgColor);
    circle.style.background = isLight
      ? "rgba(0,0,0,0.25)" // dark ripple on light bg
      : "rgba(255,255,255,0.35)"; // light ripple on dark bg

    // Remove any old ripple
    const oldPulse = button.querySelector(".pulse");
    if (oldPulse) oldPulse.remove();

    button.appendChild(circle);

    // Remove after animation
    circle.addEventListener("animationend", () => circle.remove());

    // Delay the actual onClick until ripple finishes (optional)
    setTimeout(() => {
      if (onClick) onClick(e);
    }, 300); // match animation duration
  };

  // Brightness checker
  const isLightColor = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 150;
  };

  return (
    <button
      className={`button-hero ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
