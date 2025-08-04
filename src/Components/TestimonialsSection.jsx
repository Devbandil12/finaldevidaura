import React, { useEffect, useState, useRef, useMemo } from "react";
import "../style/testimonials.css";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => t.rating >= 3);
  }, [testimonials]);

  const splitIntoChunks = (arr) => {
    const MIN = 6;
    if (arr.length <= MIN) return [arr];
    const first = arr.slice(0, MIN);
    const second = arr.slice(MIN);
    return [first, second];
  };

  const duplicateCardsToFit = (cards, minLength = 8) => {
    let duplicated = [...cards];
    while (duplicated.length < minLength) {
      duplicated = duplicated.concat(cards.slice(0, minLength - duplicated.length));
    }
    return duplicated;
  };

  const chunks = useMemo(() => splitIntoChunks(filteredTestimonials), [filteredTestimonials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image is too large. Please upload an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const maxLength = 240;

  return (
    <section className="testimonial-section">
      <h2 className="testimonial-heading">What Our Customers Say</h2>

      <Marquee direction="left" alwaysShow>
        {duplicateCardsToFit(chunks[0] || []).map((t, i) => (
          <TestimonialCard key={i} data={t} />
        ))}
      </Marquee>

      {chunks[1]?.length > 0 && (
        <Marquee direction="right">
          {duplicateCardsToFit(chunks[1] || []).map((t, i) => (
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
              placeholder="Your Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Your Feedback"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              maxLength={maxLength}
              required
            />
            <p className="char-counter">{form.text.length}/{maxLength} characters</p>

            <div className="star-selector">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  onClick={() => setForm({ ...form, rating: i + 1 })}
                >
                  {form.rating > i ? (
                    <Star size={20} fill="#facc15" stroke="none" />
                  ) : (
                    <Star size={20} stroke="#ccc" />
                  )}
                </span>
              ))}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              required
            />

            <button type="submit" className="submit-button">
              Submit Feedback
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showThankYou && (
          <motion.div
            className="thank-you-popup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            Thank you for your feedback!
          </motion.div>
        )}
      </AnimatePresence>
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
      setShouldScroll(el.scrollWidth > el.clientWidth + 1); // consider overflow even by 1px
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
        className={`marquee-track scroll-${shouldScroll ? direction : ""} 
          ${!shouldScroll && alwaysShow ? "centered" : ""} 
          ${paused ? "paused" : ""}`}
      >
        {children}
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
        {Array.from({ length: 5 }, (_, i) =>
          i < data.rating ? (
            <Star key={i} size={16} fill="#facc15" stroke="none" />
          ) : (
            <Star key={i} size={16} stroke="#ccc" />
          )
        )}
        <span className="rating-number">{data.rating?.toFixed(1)}</span>
      </div>

      <div className="title">{data.title}</div>
      <div className="feedback">"{data.text}"</div>
    </div>
  );
}
