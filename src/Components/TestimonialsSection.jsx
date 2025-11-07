import React, { useEffect, useState, useRef, useMemo } from "react";
import "../style/testimonials.css";
import { Star } from "lucide-react";
import useCloudinary from "../utils/useCloudinary";

const API_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/testimonials`;
const FALLBACK_AVATAR = "/images/avatar-placeholder.webp"; // ✅ Add small placeholder

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    text: "",
    rating: 0,
    avatar: "",
  });

  const { uploadImage, uploading, error: uploadError } = useCloudinary();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error("Error loading testimonials:", err);
    }
  };

  const filteredTestimonials = useMemo(
    () => testimonials.filter((t) => t.rating >= 3),
    [testimonials]
  );

  const splitIntoChunks = (arr) => {
    if (arr.length < 12) return [arr];
    const half = Math.ceil(arr.length / 2);
    return [arr.slice(0, half), arr.slice(half)];
  };

  const chunks = useMemo(() => splitIntoChunks(filteredTestimonials), [filteredTestimonials]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.text || form.rating < 1 || !form.avatar) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setTestimonials([{ ...form }, ...testimonials]);
        setForm({ name: "", title: "", text: "", rating: 0, avatar: "" });
        setShowForm(false);
        setShowThankYou(true);

        setTimeout(() => setShowThankYou(false), 1800);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const maxTextLength = 220;

  return (
    <section className="testimonial-section">
      <div className="text-center mb-16 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight drop-shadow-md">
          The Devid Aura Sensation
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600">
          The aura they found. The presence they feel. The stories they now tell.
        </p>
      </div>

      <Marquee direction="left" alwaysShow>
        {chunks[0]?.map((t, i) => (
          <TestimonialCard key={i} data={t} />
        ))}
      </Marquee>

      {chunks[1]?.length > 0 && (
        <Marquee direction="right">
          {chunks[1].map((t, i) => (
            <TestimonialCard key={i} data={t} />
          ))}
        </Marquee>
      )}

      <button className="feedback-button" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close Feedback Form" : "Give Feedback"}
      </button>

      {showForm && (
        <form className="feedback-form fade-in" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Your Title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="Your Feedback"
            maxLength={maxTextLength}
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            required
          />

          <p className="char-counter">
            {form.text.length}/{maxTextLength}
          </p>

          <div className="star-selector">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} onClick={() => setForm({ ...form, rating: i + 1 })}>
                <Star
                  size={20}
                  fill={form.rating > i ? "#facc15" : "none"}
                  stroke={form.rating > i ? "none" : "#ccc"}
                />
              </span>
            ))}
          </div>

          <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />

          {uploading && <p>Uploading avatar...</p>}
          {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}

          {form.avatar && (
            <img
              src={form.avatar}
              className="avatar"
              alt="preview"
              loading="lazy"
            />
          )}

          <button type="submit" className="submit-button" disabled={uploading}>
            Submit Feedback
          </button>
        </form>
      )}

      {showThankYou && (
        <div className="modal-overlay fade-in">
          <div className="modal-content">
            <p>✅ Thank you for your feedback!</p>
            <button onClick={() => setShowThankYou(false)}>OK</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ✅ Marquee */
function Marquee({ children, direction = "left", alwaysShow = false }) {
  const wrapperRef = useRef();
  const [shouldScroll, setShouldScroll] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    const check = () => {
      if (!el) return;
      setShouldScroll(el.scrollWidth > el.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="marquee-wrapper"
      ref={wrapperRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`marquee-track ${shouldScroll ? `scroll-${direction}` : ""} 
        ${!shouldScroll && alwaysShow ? "centered" : ""} ${paused ? "paused" : ""}`}
      >
        {[...children, ...children].map((child, i) => (
          <div className="marquee-item" key={i}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ✅ Card with Lazy Images + Skeleton */
function TestimonialCard({ data }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="testimonial-card fade-up">
      <div className="avatar-row">
        {/* Skeleton shimmer until loaded */}
        {!loaded && (
          <div className="avatar skeleton" />
        )}

        <img
          src={data.avatar || FALLBACK_AVATAR}
          alt={data.name}
          loading="lazy"
          className={`avatar ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />

        <div className="name">{data.name}</div>
      </div>

      <div className="rating">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < data.rating ? "#facc15" : "none"}
            stroke={i < data.rating ? "none" : "#ccc"}
          />
        ))}
      </div>

      {data.title && <div className="title">{data.title}</div>}

      <div className="feedback">"{data.text}"</div>
    </div>
  );
}
