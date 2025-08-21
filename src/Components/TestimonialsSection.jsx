import React, { useEffect, useState, useRef, useMemo } from "react";
import "../style/testimonials.css";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// 🟢 Import your custom Cloudinary hook
import useCloudinary from '../utils/useCloudinary';

const API_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/testimonials`;
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
  
  // 🟢 Use your custom Cloudinary hook
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
    if (uploading) {
        alert("Please wait for the image to finish uploading.");
        return;
    }
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
        const newT = { ...form };
        setTestimonials([newT, ...testimonials]);
        setForm({ name: "", title: "", text: "", rating: 0, avatar: "" });
        setShowForm(false);
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 2000);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };
  
  // 🟢 Updated image upload handler to use your hook
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      // The `uploadImage` hook handles the upload and returns the URL.
      // We set the form's avatar field to this URL.
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      // The hook already sets an error state, but we can log it here too.
      console.error("Cloudinary upload failed:", err);
      alert("Image upload failed. Please try again.");
    }
  };

  const maxTextLength = 220;

  return (
    <section className="testimonial-section">
      <h2 className="testimonial-heading">What Our Customers Say</h2>

      <Marquee direction="left" alwaysShow>
        {chunks[0]?.map((t, i) => (
          <TestimonialCard key={i} data={t} />
        ))}
      </Marquee>

      {chunks[1] && chunks[1].length > 0 && (
        <Marquee direction="right">
          {chunks[1].map((t, i) => (
            <TestimonialCard key={i} data={t} />
          ))}
      </Marquee>
      )}

      <button className="feedback-button" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close Feedback Form" : "Give Feedback"}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="feedback-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
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
              value={form.text}
              maxLength={maxTextLength}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
            />
            <p className="char-counter">
              {form.text.length}/{maxTextLength} characters
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

            {/* 🟢 Updated file input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            {/* 🟢 Add loading and error feedback */}
            {uploading && <p>Uploading avatar...</p>}
            {uploadError && <p style={{ color: 'red' }}>Error: {uploadError}</p>}

            {form.avatar && <img src={form.avatar} className="avatar" alt="Preview" />}

            <button type="submit" className="submit-button" disabled={uploading}>
              Submit Feedback
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {showThankYou && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Thank you for your feedback!</p>
            <button onClick={() => setShowThankYou(false)}>OK</button>
          </div>
        </div>
      )}
    </section>
  );
}

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
  className={`marquee-track ${
    shouldScroll ? `scroll-${direction}` : ""
  } ${!shouldScroll && alwaysShow ? "centered" : ""} ${paused ? "paused" : ""}`}
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

function TestimonialCard({ data }) {
  return (
    <div className="testimonial-card">
      <div className="avatar-row">
        {data.avatar && <img src={data.avatar} className="avatar" alt={data.name} />}
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
<span className="rating-number">{data.rating.toFixed(1)}</span>

      
</div>

      {data.title && <div className="title">{data.title}</div>}
      <div className="feedback">"{data.text}"</div>
    </div>
  );
}