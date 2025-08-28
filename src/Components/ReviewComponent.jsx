import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Star,
  ArrowDown,
  ArrowUp,
  Edit3,
  SlidersHorizontal,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import useCloudinary from "../utils/useCloudinary";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;
const REVIEWS_PER_PAGE = 3;

// Custom Dropdown Component (no change)
const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption.label}
        {isOpen ? <ChevronUp className="-mr-1 ml-2 h-5 w-5" /> : <ChevronDown className="-mr-1 ml-2 h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Star Rating Dropdown for Form (no change)
const StarRatingDropdown = ({ rating, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderStars = (value, size) => (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          fill={i < value ? "#facc15" : "none"}
          stroke="#facc15"
          size={size || 18}
        />
      ))}
    </div>
  );

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex justify-between items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {rating > 0 ? (
          <div className="flex items-center gap-2">
            {renderStars(rating)}
            <span>{rating} Stars</span>
          </div>
        ) : (
          <span>Select Rating</span>
        )}
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="origin-top-right absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          >
            <div className="py-1">
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {renderStars(s, 18)}
                  <span>{s} Stars</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const ReviewComponent = ({ productId, user, userdetails }) => {
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [reviews, setReviews] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [name, setName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [preview, setPreview] = useState({ images: [], index: null });
  const [formOpen, setFormOpen] = useState(false);
  

  const { uploadImage, uploading, error: uploadError } = useCloudinary();

  const fetchReviews = useCallback(async (initial = false) => {
  try {
    setIsLoading(true);

    const fetchCursor = initial ? null : cursor;

    const url = `${API_BASE}/${productId}?limit=${REVIEWS_PER_PAGE}` +
  (starFilter ? `&rating=${starFilter}` : "") +
  (fetchCursor ? `&cursor=${fetchCursor}` : "");


    const res = await axios.get(url);
    const { reviews: newReviews, nextCursor, hasMore: more, averageRating: avg, ratingCounts: counts } = res.data;

    setReviews(prev => initial ? newReviews : [...prev, ...newReviews]);
    setCursor(nextCursor);
    setHasMore(more);

    if (initial) {
      setAverageRating(avg);
      setRatingCounts(counts);
    }
  } catch (err) {
    console.error("Failed to fetch reviews", err);
  } finally {
    setIsLoading(false);
  }
}, [productId, starFilter]);


  useEffect(() => {
    setCursor(null);
    setReviews([]);      
    setHasMore(true);    
    fetchReviews(true);  
  }, [starFilter, fetchReviews]);


    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment || (!user && !name)) return;
    try {
        const payload = {
            productId,
            rating,
            comment,
            name: user?.name || name,
            userId: userdetails?.id,
            clerkId: user?.id,
            photoUrls: images,
        };

        if (editingReviewId) {
            // Update a review
            const res = await axios.put(`${API_BASE}/${editingReviewId}`, payload);
            const updatedReview = res.data.updated[0];

            // 🟢 Update the reviews list in state directly to show the change
            setReviews((prev) =>
                prev.map((r) => (r.id === updatedReview.id ? updatedReview : r))
            );
        } else {
            // Add a new review
            const res = await axios.post(API_BASE, payload);
            const newReview = res.data;

            // 🟢 Add the new review to the start of the list in state
            setReviews((prev) => [newReview, ...prev]);
        }

        // 🟢 Remove the full re-fetch here to avoid duplication
        // The list is now updated instantly, but stats are not.
        // We will call a separate function to update stats
        
        resetForm();
        fetchReviewStats(); // 🟢 New call to update stats only
        
    } catch (err) {
        console.error("Review submission failed", err);
    }
};


  const resetForm = () => {
    setRating(0);
    setComment("");
    setImages([]);
    setName(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
    setEditingReviewId(null);
    setFormOpen(false);
  };

  const handleEdit = (review) => {
    setRating(review.rating);
    setComment(review.comment);
    setImages(review.photoUrls || []);
    setEditingReviewId(review.id);
    setName(review.name);
    setFormOpen(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      } catch (err) {
        console.error("Failed to upload image:", err);
      }
    }
    setImages(uploadedUrls);
  };

  const openImagePreview = (idx, photoUrls) => {
    setPreview({ images: photoUrls, index: idx });
  };

  const closePreview = () => setPreview({ images: [], index: null });

  const handleImgError = (e) => {
    e.currentTarget.style.display = "none";
  };

  const renderStars = (value, size) => (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          fill={i < Math.floor(value) ? "#facc15" : "none"}
          stroke="#facc15"
          size={size || 18}
        />
      ))}
    </div>
  );

  const totalReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
  const getPercent = (count) => {
    const total = totalReviews || 1;
    return ((count / total) * 100).toFixed(0);
  };

  return (
    <div className="max-w-[900px] mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-xl">
      {/* Summary Section */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Customer Reviews</h2>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <label className="flex items-center text-gray-700">
            <SlidersHorizontal size={16} className="mr-2" />
            Filter by Rating:
          </label>
          <CustomDropdown
            value={starFilter}
            onChange={(val) => setStarFilter(val)}
            options={[
              { value: null, label: "All Ratings" },
              { value: 5, label: "5 Stars" },
              { value: 4, label: "4 Stars" },
              { value: 3, label: "3 Stars" },
              { value: 2, label: "2 Stars" },
              { value: 1, label: "1 Star" },
            ]}
          />
        </div>
      </div>
      {starFilter === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
          <div className="flex flex-col items-start gap-2">
            <div className="text-5xl font-extrabold text-gray-900">{averageRating.toFixed(1)}</div>
            {renderStars(averageRating, 24)}
            <div className="text-sm text-gray-500 mt-1">{totalReviews} reviews</div>
          </div>
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-1 flex items-center gap-1 font-semibold text-gray-900">
                  {star} <Star fill="#facc15" stroke="#facc15" size={14} />
                </span>
                <div className="col-span-10 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${getPercent(ratingCounts[star])}%` }}
                  />
                </div>
                <span className="col-span-1 text-sm text-gray-500 text-right">{ratingCounts[star]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Initial Loader */}
      {isLoading && reviews.length === 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {/* 🟢 Add a condition to show a message if there are no reviews */}
        {!isLoading && reviews.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p>No reviews found for this product yet.</p>
            <p>Be the first to leave a review!</p>
          </div>
        )}
        <AnimatePresence>
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              className="p-6 border-b border-gray-200 last:border-b-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <strong className="text-lg font-semibold text-gray-900">{r.name}</strong>
                  {r.isVerifiedBuyer && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Verified Purchase</span>
                  )}
                </div>
                {userdetails?.id === r.userId && (
                  <button
                    className="text-gray-500 hover:text-gray-800 transition-colors"
                    onClick={() => handleEdit(r)}
                    title="Edit Review"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {renderStars(r.rating)}
                <span className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-4 text-gray-700 leading-relaxed">{r.comment}</p>
              
              {/* Review Images */}
              {r.photoUrls?.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {r.photoUrls.slice(0, 4).map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Review image ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-md border border-gray-200 cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openImagePreview(idx, r.photoUrls)}
                      onError={handleImgError}
                    />
                  ))}
                  {r.photoUrls.length > 4 && (
                    <div
                      className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openImagePreview(4, r.photoUrls)}
                    >
                      +{r.photoUrls.length - 4}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More / Pagination Section */}
      <div className="flex flex-col items-center gap-4 mt-6">
        {/* Load More button */}
        {hasMore && !isLoading && (
          <button
            onClick={() => fetchReviews(false)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ArrowDown size={16} />
            Load More Reviews
          </button>
        )}
        {/* Pagination loader */}
        {isLoading && reviews.length > 0 && (
          <div className="flex justify-center mt-2">
            <Loader2 className="animate-spin text-gray-500" size={20} />
          </div>
        )}
        {/* Back to Top button */}
        {reviews.length > REVIEWS_PER_PAGE && (
          <button
            onClick={() => {
              setCursor(null);
              fetchReviews(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowUp size={16} />
            Back to Top
          </button>
        )}
      </div>

      {/* Toggle Form Button */}
      <div className="flex justify-center mt-6">
        <button onClick={() => setFormOpen(!formOpen)} className="px-6 py-3 bg-black text-white rounded-full font-semibold transition-colors hover:bg-gray-800">
          {formOpen ? "Close Review Form" : "Write a Review"}
        </button>
      </div>

      {/* Review Form with Animation */}
      <AnimatePresence>
        {formOpen && (
          <motion.form
            className="mt-8 p-6 bg-gray-50 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold col-span-1 md:col-span-2">{editingReviewId ? "Edit Your Review" : "Leave a Review"}</h3>
            {!user && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="p-3 border border-gray-300 rounded-md col-span-1 md:col-span-2"
              />
            )}
            <StarRatingDropdown rating={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review"
              required
              className="p-3 border border-gray-300 rounded-md col-span-1 md:col-span-2 min-h-[100px]"
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="p-3 border border-gray-300 rounded-md col-span-1 md:col-span-2"
            />
            {uploading && <p className="col-span-1 md:col-span-2 text-center text-gray-500">Uploading image(s)...</p>}
            {uploadError && <p className="col-span-1 md:col-span-2 text-center text-red-500">Error: {uploadError}</p>}
            <div className="flex gap-2 flex-wrap col-span-1 md:col-span-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded-md border border-gray-300" onError={handleImgError} />
              ))}
            </div>
            <button type="submit" disabled={uploading || isLoading} className="px-6 py-3 bg-black text-white rounded-md font-semibold transition-colors hover:bg-gray-800 col-span-1 md:col-span-2">
              {editingReviewId ? "Update Review" : "Submit Review"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {preview.index !== null && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <motion.div
              className="relative bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] flex flex-col items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closePreview} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-800 hover:bg-gray-200 z-10">
                <X size={24} />
              </button>
              <img
                src={preview.images[preview.index]}
                alt="preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={handleImgError}
              />
              <div className="flex justify-between gap-4 mt-4 w-full">
                <button
                  onClick={() => setPreview(p => ({ ...p, index: (p.index > 0 ? p.index - 1 : p.images.length - 1) }))}
                  className="p-3 bg-gray-200 rounded-full text-gray-800 hover:bg-gray-300"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setPreview(p => ({ ...p, index: (p.index < p.images.length - 1 ? p.index + 1 : 0) }))}
                  className="p-3 bg-gray-200 rounded-full text-gray-800 hover:bg-gray-300"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ReviewComponent;
