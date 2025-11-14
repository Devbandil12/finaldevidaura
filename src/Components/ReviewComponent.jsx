import React, { useEffect, useState, useRef, useCallback } from "react"; // MODIFIED: Added useCallback
import {
  Star,
  ArrowDown,
  Edit3,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import useCloudinary from "../utils/useCloudinary";
import imageCompression from 'browser-image-compression';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;
const REVIEWS_PER_PAGE = 3;

// --- Custom Dropdown Component (Unchanged) ---
const CustomDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex justify-between items-center w-full rounded-md border border-slate-100 px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 "
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption.label}
        <ChevronDown
          className={`-mr-1 ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-[0_8px_12px_rgba(230,229,229,0.3)] bg-white"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
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

// --- Interactive Star Rating for Form (Unchanged) ---
const StarRatingInput = ({ rating, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
        >
          <Star
            size={32}
            className="transition-colors duration-200"
            fill={(hoverRating || rating) >= star ? "#facc15" : "none"}
            stroke={(hoverRating || rating) >= star ? "#facc15" : "#cbd5e1"}
          />
        </motion.div>
      ))}
    </div>
  );
};

// MODIFICATION 1: Accept 'editReviewId' prop
const ReviewComponent = ({ productId, userdetails, editReviewId }) => {
  // --- States ---
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [reviews, setReviews] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [starFilter, setStarFilter] = useState(null);
  const [activeCursor, setActiveCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [name, setName] = useState(userdetails?.name || "");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [preview, setPreview] = useState({ images: [], index: null });
  const [formOpen, setFormOpen] = useState(false);
  const { uploadImage } = useCloudinary();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const newImageFiles = useRef([]);

  // MODIFICATION 2: Add state to track if initial edit is done
  const [initEditDone, setInitEditDone] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const performFetch = async () => {
      setIsLoading(true);
      try {
        const isInitialLoad = activeCursor === null;

        const urlParams = new URLSearchParams({
          limit: REVIEWS_PER_PAGE,
          ...(starFilter && { rating: starFilter }),
          ...(activeCursor && { cursor: activeCursor }),
        });
        const url = `${API_BASE}/${productId}?${urlParams}`;
        const res = await axios.get(url);
        const {
          reviews: newReviews,
          nextCursor: newNextCursor,
          hasMore: more,
          averageRating: avg,
          ratingCounts: counts
        } = res.data;

        setReviews(prev => isInitialLoad ? newReviews : [...prev, ...newReviews]);
        setNextCursor(newNextCursor);
        setHasMore(more);

        if (isInitialLoad) {
          setAverageRating(avg);
          setRatingCounts(counts);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (productId) {
      performFetch();
    }
  }, [productId, starFilter, activeCursor]);

  useEffect(() => {
    setReviews([]);
    setActiveCursor(null);
  }, [starFilter]);

  useEffect(() => {
    if (userdetails?.name) {
      setName(userdetails.name);
    }
  }, [userdetails]);

  // --- Functions ---
  const fetchReviewStats = async () => {
    try {
      const url = `${API_BASE}/stats/${productId}`;
      const res = await axios.get(url);
      const { averageRating: avg, ratingCounts: counts } = res.data;
      setAverageRating(avg);
      setRatingCounts(counts);
    } catch (err) {
      console.error("Failed to fetch review stats", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment) {
      alert("Please provide a rating and a comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      let finalPhotoUrls = [...images];

      if (newImageFiles.current.length > 0) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressionPromises = newImageFiles.current.map(file =>
          imageCompression(file, options)
        );
        const compressedFiles = await Promise.all(compressionPromises);
        const uploadPromises = compressedFiles.map(file => uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        finalPhotoUrls = [...finalPhotoUrls, ...uploadedUrls.filter(Boolean)];
      }

      const payload = {
        productId, rating, comment,
        name: userdetails?.name || "Anonymous",
        userId: userdetails?.id, clerkId: userdetails?.clerkId,
        photoUrls: finalPhotoUrls,
      };

      if (editingReviewId) {
        const res = await axios.put(`${API_BASE}/${editingReviewId}`, payload);
        const updatedReview = res.data.updated[0];
        setReviews(prev =>
          prev.map(r => (r.id === updatedReview.id ? updatedReview : r))
        );
      } else {
        const res = await axios.post(API_BASE, payload);
        const serverData = res.data;
        const newReview = { ...payload, ...serverData };
        setReviews(prev => [newReview, ...prev]);
      }

      resetForm();
      fetchReviewStats();
    } catch (err) {
      console.error("Review submission failed", err);
      const errorMsg = err.response?.data?.message || 'An unexpected error occurred.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveImage = (indexToRemove) => {
    const previewUrlToRemove = imagePreviews[indexToRemove];
    
    if (previewUrlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlToRemove);
    }
  
    const existingImagesCount = images.length;
    if (indexToRemove < existingImagesCount) {
      setImages(prev => prev.filter((_, i) => i !== indexToRemove));
    } else {
      const newFileIndex = indexToRemove - existingImagesCount;
      newImageFiles.current.splice(newFileIndex, 1);
    }
  
    setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setImages([]);
    setImagePreviews([]);
    newImageFiles.current = [];
    setName(userdetails?.name || "");
    setEditingReviewId(null);
    setFormOpen(false);
  };

  // MODIFICATION 3: Wrap handleEdit in useCallback
  const handleEdit = useCallback((review) => {
    setFormOpen(true);
    setEditingReviewId(review.id);
    setName(review.name);
    setRating(review.rating);
    setComment(review.comment);
    setImages(review.photoUrls || []);
    setImagePreviews(review.photoUrls || []);
    newImageFiles.current = [];
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start' // Scroll to the top of the form
      });
    }, 100);
  }, [setFormOpen, setEditingReviewId, setName, setRating, setComment, setImages, setImagePreviews]); // Added dependencies

  // MODIFICATION 4: Add useEffect to handle auto-edit on load
  useEffect(() => {
    if (editReviewId && !initEditDone && reviews.length > 0) {
      const reviewToEdit = reviews.find(r => r.id === editReviewId);
      if (reviewToEdit) {
        handleEdit(reviewToEdit);
        setInitEditDone(true); // Mark as done to prevent re-triggering
      }
    }
  }, [editReviewId, reviews, initEditDone, handleEdit]);

  // --- Helper Functions (Unchanged) ---
  const openImagePreview = (idx, photoUrls) => setPreview({ images: photoUrls, index: idx });
  const closePreview = () => setPreview({ images: [], index: null });
  const handleImgError = (e) => { e.currentTarget.style.display = "none"; };
  const renderStars = (value, size) => (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) =>
        <Star key={i} fill={i < Math.floor(value) ? "#facc15" : "none"} stroke="#facc15" size={size || 18} />
      )}
    </div>
  );
  const totalReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
  const getPercent = (count) => totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(0) : 0;

  return (
    <div className="max-w-4xl mx-auto py-5">
      {/* Header and Filter (Unchanged) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-6">
          <label className="text-sm font-medium text-slate-800">
            Filter by:
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
              { value: 1, label: "1 Star" }
            ]}
          />
        </div>
      </div>

      {/* Review Summary (Unchanged) */}
      {starFilter === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 p-6 bg-slate-50 rounded-lg shadow-[0_8px_12px_rgba(230,229,229,0.3)]">
          <div className="flex flex-col items-center md:items-start justify-center gap-2">
            <div className="text-5xl font-extrabold text-zinc-900">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(averageRating, 24)}
            <div className="text-sm text-slate-500 mt-1">
              Based on {totalReviews} reviews
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-16 flex items-center gap-1 text-sm font-semibold text-zinc-900">
                  {star} <Star fill="#facc15" stroke="#facc15" size={14} />
                </span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercent(ratingCounts[star])}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-yellow-400"
                  />
                </div>
                <span className="w-8 text-sm text-slate-500 text-right">
                  {ratingCounts[star]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loaders and Lists (Unchanged) */}
      {isLoading && reviews.length === 0 && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-500" size={32} />
        </div>
      )}
      <div className="space-y-6">
        {!isLoading && reviews.length === 0 && (
          <div className="text-center text-slate-500 py-10 border-t border-slate-100">
            <MessageSquare size={40} className="mx-auto mb-4 text-slate-400" />
            <p className="font-semibold text-lg text-slate-700">No reviews yet</p>
            <p>Be the first to share your thoughts on this product!</p>
          </div>
        )}
        <AnimatePresence>
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              className="py-6 border-t border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Review Content (Unchanged) */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-lg">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <strong className="font-semibold text-zinc-900">{r.name}</strong>
                    <div className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {userdetails?.id === r.userId && (
                  <button
                    className="text-slate-500 hover:text-teal-600 transition-colors p-2"
                    onClick={() => handleEdit(r)}
                    title="Edit Review"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
              <div className="ml-13 mt-2 flex items-center gap-2">
                {renderStars(r.rating)}
              </div>
              <p className="ml-13 mt-3 text-slate-600 leading-relaxed">
                {r.comment}
              </p>
              
              {r.photoUrls?.length > 0 && (
                <div className="ml-13 flex gap-2 mt-4 flex-wrap">
                  {r.photoUrls.slice(0, 4).map((src, idx) => {
                    const isLastImage = idx === 3;
                    const remainingImages = r.photoUrls.length - 4;
                    return (
                      <motion.div
                        key={idx}
                        className="relative w-20 h-20"
                        whileHover={{ scale: 1.05 }}
                      >
                        <LazyLoadImage
                          src={src}
                          alt={`Review image ${idx + 1}`}
                          effect="blur"
                          className="w-full h-full object-cover rounded-md border border-slate-100 cursor-pointer"
                          wrapperClassName="w-full h-full"
                          onClick={() => openImagePreview(idx, r.photoUrls)}
                          onError={handleImgError}
                        />
                        {isLastImage && remainingImages > 0 && (
                          <div
                            onClick={() => openImagePreview(idx, r.photoUrls)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold rounded-md cursor-pointer"
                          >
                            +{remainingImages}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls (Unchanged) */}
      <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-100">
        {hasMore && !isLoading && (
          <button
            onClick={() => setActiveCursor(nextCursor)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <ArrowDown size={16} /> Load More
          </button>
        )}
        {isLoading && reviews.length > 0 &&
          <Loader2 className="animate-spin text-slate-500" size={24} />
        }
      </div>

      {/* Write a Review Button (Unchanged) */}
      <div id="review-form-section" className="mt-12 text-center">
        {!formOpen && userdetails && (
          <motion.button
            onClick={() => setFormOpen(true)}
            className="px-8 py-3 bg-zinc-900 text-white rounded-md font-semibold transition-colors hover:bg-zinc-700 shadow-lg"
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
          >
            Write a Review
          </motion.button>
        )}
        {!userdetails && (
          <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-md">
            You must be logged in to write a review.
          </p>
        )}
      </div>

      {/* Form and Image Preview Modal (Unchanged) */}
      <AnimatePresence>
        {userdetails && formOpen && (
          <motion.form
            id="review-form"
            className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-100"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900">
                {editingReviewId ? "Edit Your Review" : "Share Your Thoughts"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Rating
                  </label>
                  <StarRatingInput rating={rating} onChange={setRating} />
                </div>
              </div>
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
                  Your Review
                </label>
                <textarea
                  id="comment" value={comment}
                  onChange={(e) => setComment(e.target.value)} required
                  className="w-full p-3 border border-slate-300 rounded-md min-h-[120px] focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-slate-700 mb-2">
                  Add Photos (optional, up to 10)
                </label>
                <input
                  id="images" type="file" multiple accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files).slice(0, 10 - imagePreviews.length);
                    if (!files.length) return;
                    newImageFiles.current = [...newImageFiles.current, ...files];
                    const previewUrls = files.map(file => URL.createObjectURL(file));
                    setImagePreviews(prev => [...prev, ...previewUrls]);
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviews.map((previewSrc, idx) => (
                    <div key={previewSrc} className="relative">
                      <img
                        src={previewSrc}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-md border border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-slate-800 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 px-6 bg-zinc-900 text-white rounded-md font-semibold transition-all hover:bg-zinc-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  editingReviewId ? "Update Review" : "Submit Review"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {preview.index !== null && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <motion.div
              className="relative bg-white rounded-lg p-2 max-w-4xl max-h-[90vh] flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closePreview}
                className="absolute top-3 right-3 p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-md text-slate-800 hover:bg-white z-10"
              >
                <X size={24} />
              </button>
              <AnimatePresence mode="wait">
                <motion.img
                  key={preview.index} src={preview.images[preview.index]}
                  alt="Review preview"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onError={handleImgError}
                />
              </AnimatePresence>
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(p => ({ ...p, index: (p.index > 0 ? p.index - 1 : p.images.length - 1) }))
                  }}
                  className="p-3 bg-white/70 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white shadow-md"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(p => ({ ...p, index: (p.index < p.images.length - 1 ? p.index + 1 : 0) }))
                  }}
                  className="p-3 bg-white/70 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white shadow-md"
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