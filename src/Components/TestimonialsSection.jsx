import React, { useEffect, useState, useRef, useMemo } from "react";
import "../style/testimonials.css";
import { Star, StarOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/testimonials`;

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  const splitIntoChunks = (arr) => {
    const MIN = 6;
    const first = arr.slice(0, MIN);
    const second = arr.length > 2 * MIN ? arr.slice(MIN, 2 * MIN) : arr.slice(MIN);
    const third = arr.length > 3 * MIN ? arr.slice(2 * MIN, 3 * MIN) : [];

    const remainder = arr.slice(3 * MIN);
    const balanced = [first, second, third].map((group) => [...group]);

    for (let i = 0; i < remainder.length; i++) {
      balanced[i % 3].push(remainder[i]);
    }

    return balanced.filter((group) => group.length > 0);
  };

  const chunks = useMemo(() => splitIntoChunks(testimonials), [testimonials]);

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


const maxTextLength = 240;

  return (
    <section className="testimonial-section">
      <h2 className="testimonial-heading">What Our Customers Say</h2>

      <Marquee direction="left" alwaysShow>
        {chunks[0]?.map((t, i) => (
          <TestimonialCard key={i} data={t} />
        ))}
      </Marquee>

      {chunks[1] && (
        <Marquee direction="right">
          {chunks[1].map((t, i) => (
            <TestimonialCard key={i} data={t} />
          ))}
        </Marquee>
      )}

      {chunks[2] && (
        <Marquee direction="left">
          {chunks[2].map((t, i) => (
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
                <span
                  key={i}
                  onClick={() => setForm({ ...form, rating: i + 1 })}
                  style={{ cursor: "pointer" }}
                >
                  {form.rating > i ? (
                    <Star size={20} fill="#facc15" stroke="none" />
                  ) : (
                    <StarOff size={20} stroke="#ccc" />
                  )}
                </span>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            <button type="submit" className="submit-button">
              Submit Feedback
            </button>
          </motion.form>
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
            <StarOff key={i} size={16} stroke="#ccc" />
          )
        )}
        <span className="rating-number">{data.rating?.toFixed(1)}</span>
      </div>

      {data.title && <div className="title">{data.title}</div>}
      <div className="feedback">"{data.text}"</div>
    </div>
  );
}