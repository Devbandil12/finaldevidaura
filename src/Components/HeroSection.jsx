// src/Components/HeroSection.jsx
import React, { useEffect, useRef, useState } from "react";
import BottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892.jpg";

/*
  Tailwind-only HeroSection with an improved, smooth typing effect.
  - Fully responsive layout (stack on mobile, split on lg+)
  - Accessible buttons
  - Smooth natural typing with randomized delays
  - Highlighted words and a blinking cursor (tiny inline style added)
  - Decorative gradient blobs and subtle entrance transitions using Tailwind classes
*/

const rawParts = [
  { text: "Not seen, not heard — only ", highlight: false },
  { text: "felt", highlight: true },
  { text: "\n", highlight: false },
  { text: "In every breath he ", highlight: false },
  { text: "leaves", highlight: true },
  { text: " behind.", highlight: false },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.random() * (max - min) + min;

export default function HeroSection() {
  const [html, setHtml] = useState("");
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);

    (async function typeAll() {
      // small initial delay for entrance
      await sleep(250);

      let finalHTML = "";

      for (let p = 0; p < rawParts.length && mountedRef.current; p++) {
        const { text, highlight } = rawParts[p];
        const chars = text.split("");
        let buffer = "";

        // If the part is a newline, inject <br/> immediately
        if (text === "\n") {
          finalHTML += "<br/>";
          setHtml(finalHTML);
          await sleep(120);
          continue;
        }

        for (let i = 0; i < chars.length && mountedRef.current; i++) {
          const ch = chars[i];
          buffer += ch === "\n" ? "<br/>" : ch;

          if (highlight) {
            setHtml(finalHTML + `<span class="text-indigo-600 font-semibold">${escapeHtml(buffer)}</span>`);
          } else {
            setHtml(finalHTML + escapeHtml(buffer));
          }

          // randomized delay for a more natural typing feel (faster for normal chars, slightly longer on spaces/punctuation)
          const base = ch === " " ? rand(12, 35) : rand(22, 40);
          const extra = /[.,—!?:;]/.test(ch) ? rand(40, 80) : 0;
          await sleep(base + extra);
        }

        // finalize the part
        if (highlight) {
          finalHTML += `<span class="text-indigo-600 font-semibold">${escapeHtml(buffer)}</span>`;
        } else {
          finalHTML += escapeHtml(buffer);
        }

        // slight pause between parts
        await sleep(120);
      }
    })();

    return () => {
      mountedRef.current = false;
      setMounted(false);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-16 -left-20 w-72 h-72 bg-gradient-to-br from-indigo-100 to-indigo-300 rounded-full opacity-30 blur-3xl transform -rotate-12 hidden lg:block" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tr from-pink-100 to-pink-300 rounded-full opacity-20 blur-3xl transform rotate-12 hidden lg:block" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
          {/* LEFT: text */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-sm font-medium text-indigo-600 mb-3">Final De Vida Aura</h2>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              A scent that tells a story.
            </h1>

            <div
              className="mt-6 text-lg sm:text-xl text-gray-700 max-w-2xl leading-relaxed tracking-tight"
              aria-live="polite"
            >
              {/* The typed slogan - we use dangerouslySetInnerHTML because we construct html with <span> and <br/> */}
              <p className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />
              {/* blinking cursor */}
              <span
                aria-hidden="true"
                className="align-middle ml-1 inline-block w-[2px] h-6 bg-indigo-600 rounded-sm md:animate-[blink_1.2s_steps(2,start)_infinite]"
                style={{
                  // Fallback CSS for systems where custom animation may not be present in Tailwind config
                  animation: "blink 1.2s steps(2,start) infinite",
                }}
              />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="#collection"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-sm font-semibold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition"
                aria-label="Explore Collection"
              >
                Explore Collection
              </a>

              <a
                href="#learn"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 px-5 py-3 text-sm font-semibold hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 transition"
                aria-label="Learn more about the fragrance"
              >
                Learn More
              </a>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Crafted with lasting notes — lightweight presence, unforgettable memory.
            </div>
          </div>

          {/* RIGHT: image */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg transform transition-transform duration-500 hover:scale-[1.02]">
              <img
                src={BottleImage}
                alt="Perfume bottle"
                className="w-full h-auto rounded-xl shadow-2xl object-cover"
                loading="eager"
              />
              {/* image highlight border */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-indigo-100 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframes for blinking cursor (keeps component self-contained) */}
      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

/* Utility to escape HTML while we construct strings */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}