import React, { useEffect, useState, useMemo, memo, useContext, useRef } from "react";
import { Star, Quote, X, UploadCloud, CheckCircle, Lock } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import useCloudinary from "../utils/useCloudinary";
import { optimizeImage } from "../utils/imageOptimizer";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";

const API_URL = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/testimonials`;
const FALLBACK_AVATAR = "/images/avatar-placeholder.webp";

// FIX: Updated keyframes to -25% for seamless looping with 4 copies
const animationStyles = `
  @keyframes scrollLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-25%); } 
  }
  @keyframes scrollRight {
    0% { transform: translateX(-25%); }
    100% { transform: translateX(0); }
  }
  .marquee-container {
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  }
`;

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const formRef = useRef(null);

  // Context Data
  const { userdetails, isSignedIn } = useContext(UserContext);
  const { user } = useUser();
  const { orders } = useContext(OrderContext);

  const [form, setForm] = useState({
    name: "",
    title: "",
    text: "",
    rating: 0,
    avatar: "",
  });

  const { uploadImage, uploading, error: uploadError } = useCloudinary();

  const canReview = useMemo(() => {
    return isSignedIn && orders && orders.length > 0;
  }, [isSignedIn, orders]);

  // Auto-populate
  useEffect(() => {
    if (userdetails || user) {
      setForm((prev) => ({
        ...prev,
        name: userdetails?.name || user?.fullName || prev.name || "",
        avatar: userdetails?.profileImage || user?.imageUrl || prev.avatar || "", 
      }));
    }
  }, [userdetails, user]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Scroll to form
  useEffect(() => {
    if (showForm && formRef.current) {
        setTimeout(() => {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
    }
  }, [showForm]);

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
    if (arr.length < 6) return [arr];
    const half = Math.ceil(arr.length / 2);
    return [arr.slice(0, half), arr.slice(half)];
  };

  const chunks = useMemo(
    () => splitIntoChunks(filteredTestimonials),
    [filteredTestimonials]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.text || form.rating < 1 || !form.avatar) {
      alert("Please complete all fields and upload an avatar.");
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
        setForm((prev) => ({
          ...prev,
          title: "",
          text: "",
          rating: 0,
          avatar: userdetails?.profileImage || user?.imageUrl || "",
        }));
        setShowForm(false);
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 2500);
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
    <section className="relative py-24 md:py-32 bg-white overflow-hidden font-sans selection:bg-black selection:text-white">
      <style>{animationStyles}</style>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* === Header === */}
        <div className="text-center mb-20 space-y-4">
          <span className="block text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
            Community Voices
          </span>
          <h2 className="text-4xl md:text-6xl font-serif text-black tracking-tight">
            The Devid Aura
          </h2>
          <p className="max-w-xl mx-auto text-lg text-gray-500 font-light leading-relaxed">
            The presence they feel. The stories they tell.
          </p>
        </div>

        {/* === Marquee Streams === */}
        <div className="space-y-10 marquee-container">
          <Marquee direction="left" speed={60}>
            {chunks[0]?.map((t, i) => (
              <TestimonialCard key={`row1-${i}`} data={t} />
            ))}
          </Marquee>

          {chunks[1]?.length > 0 && (
            <Marquee direction="right" speed={70}>
              {chunks[1].map((t, i) => (
                <TestimonialCard key={`row2-${i}`} data={t} />
              ))}
            </Marquee>
          )}
        </div>

        {/* === Action Button === */}
        <div className="mt-20 text-center">
          {canReview ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(!showForm)}
              className={`
                relative inline-flex items-center justify-center px-10 py-4
                text-sm font-bold tracking-widest uppercase transition-all duration-300 rounded-full 
                ${
                  showForm
                    ? "bg-white text-black border border-gray-200 shadow-sm"
                    : "bg-black text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]"
                }
              `}
            >
              {showForm ? "Close" : "Share Your Experience"}
            </motion.button>
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <Lock size={20} />
              <p className="text-sm font-medium">
                {!isSignedIn
                  ? "Join our community to share your story."
                  : "Experience the product to leave a review."}
              </p>
            </div>
          )}
        </div>

        {/* === Smooth Slide-Down Form === */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, height: 0, y: 40 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
              className="overflow-hidden mt-12"
            >
              <div className="max-w-3xl mx-auto bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] p-8 md:p-12 relative">
                <form onSubmit={handleSubmit}>
                  <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-50">
                    <h3 className="text-3xl font-serif text-black">
                      Write a Review
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-gray-300 hover:text-black transition-colors p-2"
                    >
                      <X size={28} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-10 md:gap-16">
                    <div className="flex flex-col items-center gap-4">
                      {form.avatar ? (
                        <div className="text-center group">
                          <div className="relative p-1 rounded-full border-2 border-gray-100 group-hover:border-gray-300 transition-colors">
                            <img
                                src={optimizeImage(form.avatar, 'thumbnail')}
                                alt="User"
                                className="w-28 h-28 rounded-full object-cover"
                            />
                          </div>
                          <span className="block mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider truncate max-w-[140px]">
                            {form.name}
                          </span>
                        </div>
                      ) : (
                        <label
                          className={`
                            w-32 h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center 
                            cursor-pointer transition-all duration-300 hover:border-black hover:bg-gray-50/50
                            ${
                              uploading
                                ? "border-gray-200 bg-gray-50"
                                : "border-gray-200"
                            }
                          `}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                          <div className="text-center text-gray-300 px-2">
                            <UploadCloud size={24} strokeWidth={1.5} className="mx-auto mb-2" />
                            <span className="text-[11px] uppercase font-bold tracking-wider">
                              {uploading ? "..." : "Upload"}
                            </span>
                          </div>
                        </label>
                      )}
                      {uploadError && (
                        <span className="text-red-500 text-xs text-center leading-tight">
                          {uploadError}
                        </span>
                      )}
                    </div>

                    <div className="space-y-8">
                      <div className="relative group z-0">
                        <input
                          type="text"
                          id="name"
                          value={form.name}
                          disabled={!!userdetails?.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-black peer"
                          placeholder=" "
                          required
                        />
                        <label
                          htmlFor="name"
                          className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          Full Name
                        </label>
                      </div>

                      <div className="relative group z-0">
                        <input
                          type="text"
                          id="title"
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-black peer"
                          placeholder=" "
                        />
                        <label
                          htmlFor="title"
                          className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          Headline (Optional)
                        </label>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                          Your Rating
                        </span>
                        <div className="flex gap-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <motion.button
                              type="button"
                              key={i}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setForm({ ...form, rating: i + 1 })}
                              className="focus:outline-none"
                            >
                              <Star
                                size={26}
                                strokeWidth={1.5}
                                className={`transition-colors duration-200 ${
                                  i < form.rating
                                    ? "fill-[#C5A059] text-[#C5A059]"
                                    : "fill-transparent text-gray-200 hover:text-gray-300"
                                }`}
                              />
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          value={form.text}
                          onChange={(e) =>
                            setForm({ ...form, text: e.target.value })
                          }
                          maxLength={maxTextLength}
                          required
                          placeholder="Share your experience..."
                          className="w-full bg-white border-2 border-gray-100 rounded-xl p-5 text-stone-900 text-sm min-h-[140px] focus:outline-none focus:border-black transition-colors resize-y placeholder:text-gray-300"
                        />
                        <div className="absolute bottom-3 right-4 text-[10px] font-medium text-gray-300">
                          {form.text.length}/{maxTextLength}
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={uploading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                      >
                        {uploading ? "Uploading..." : "Publish Review"}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showThankYou && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-md"
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] border border-gray-50"
            >
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle size={36} className="text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif text-black mb-3">
                Review Submitted
              </h3>
              <p className="text-gray-500 font-light">
                Thank you for adding your voice to the Aura.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// === FIX: Duplicated 4 times + CSS keyframes adjusted to -25% ===
function Marquee({ children, direction = "left", speed = 40 }) {
  const [content, setContent] = useState([]);

  useEffect(() => {
    if (children && children.length > 0) {
      setContent([...children, ...children, ...children, ...children]);
    }
  }, [children]);

  return (
    <div className="w-full overflow-hidden select-none pointer-events-none">
      <div
        className="flex gap-8 w-max will-change-transform pointer-events-auto pt-3 pb-7"
        style={{
          animation: `scroll${
            direction === "left" ? "Left" : "Right"
          } ${speed}s linear infinite`,
        }}
      >
        {content.map((child, i) => (
          <div key={i} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

const TestimonialCard = memo(({ data }) => {
  const [loaded, setLoaded] = useState(false);
  const avatarUrl = useMemo(
    () => optimizeImage(data.avatar || FALLBACK_AVATAR, 'thumbnail'),
    [data.avatar]
  );

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative w-[320px] md:w-[340px] bg-white rounded-[2rem] p-8 
        border border-gray-100/50
        shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] 
        hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] 
        hover:border-gray-200/80
        transition-colors duration-300"
    >
      <Quote
        className="absolute top-8 right-8 text-gray-50 scale-x-[-1] transition-colors duration-300 group-hover:text-gray-100"
        size={48}
        strokeWidth={1}
      />

      <div className="relative z-10 flex items-center gap-5 mb-6">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-[3px] border-white shadow-sm group-hover:shadow-md transition-all duration-300">
          {!loaded && (
            <div className="absolute inset-0 bg-gray-50 animate-pulse" />
          )}
          <img
            src={avatarUrl}
            alt={data.name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-black leading-tight mb-1">
            {data.name}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={11}
                strokeWidth={1.5}
                className={
                  i < data.rating
                    ? "fill-[#C5A059] text-[#C5A059]"
                    : "fill-transparent text-gray-200"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {data.title && (
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 line-clamp-1 group-hover:text-black transition-colors">
            {data.title}
          </h4>
        )}
        <p className="text-[15px] leading-relaxed text-gray-600 font-light italic line-clamp-4">
          "{data.text}"
        </p>
      </div>
    </motion.div>
  );
});