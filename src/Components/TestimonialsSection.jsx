import React, { useEffect, useState, useRef } from "react";
import "../style/testimonials.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote, Star, StarOff } from "lucide-react";


const API_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api/testimonials`;


gsap.registerPlugin(ScrollTrigger);

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [form, setForm] = useState({
    name: "",
    title: "",
    text: "",
    rating: 0,
    avatar: "",
  });
  const [showForm, setShowForm] = useState(false);
  const marqueeRef = useRef(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (marqueeRef.current) {
      gsap.fromTo(
        marqueeRef.current,
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: marqueeRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
        }
      );
    }
  }, [testimonials]);

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

  // 💡 Check size (in bytes) — 2MB limit here
  const maxSize = 2 * 1024 * 1024; // 2MB
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


  return (
    <section className="testimonial-section">
      <div className="testimonial-container">
        <h2 className="testimonial-heading">What Our Customers Say</h2>

        <div
          className="marquee-row fade-scroll"
          ref={marqueeRef}
          onMouseEnter={() => gsap.to(".marquee-row", { x: 0 })}
          onMouseLeave={() =>
            gsap.to(".marquee-row", {
              x: "-20%",
              duration: 10,
              repeat: -1,
              ease: "linear",
            })
          }
        >
          {testimonials.map((t, index) => (
            <div key={index} className="testimonial-card">
              {t.avatar && (
                <img src={t.avatar} alt="avatar" className="avatar" />
              )}
              <div className="quote-icon">
                <Quote size={20} strokeWidth={1.5} />
              </div>
              <div className="testimonial-text">{t.text}</div>
              <div className="star-rating">
                {Array.from({ length: 5 }, (_, i) =>
                  i < t.rating ? (
                    <Star key={i} size={16} fill="#facc15" stroke="none" />
                  ) : (
                    <StarOff key={i} size={16} stroke="#ccc" />
                  )
                )}
              </div>
              <div className="testimonial-name">{t.name}</div>
              <div className="testimonial-title">{t.title}</div>
            </div>
          ))}
        </div>

        <button
          className="feedback-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close Feedback Form" : "Give Feedback"}
        </button>

        <div
          className={`feedback-form-wrapper ${
            showForm ? "slide-down" : "slide-up"
          }`}
        >
          {showForm && (
            <form className="feedback-form" onSubmit={handleSubmit}>
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
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                required
              />
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
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <button type="submit" className="submit-button">
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
