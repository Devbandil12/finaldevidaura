import React, { useEffect, useState, useCallback } from "react";
import {
  Star,
  ArrowDown,
  ArrowUp,
  Edit3,
  Filter,
  Loader2,
  X
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;
const REVIEWS_PER_PAGE = 3;

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
  const [debouncedFilter, setDebouncedFilter] = useState(starFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(starFilter), 300);
    return () => clearTimeout(t);
  }, [starFilter]);

  const fetchReviews = useCallback(async (initial = false) => {
    try {
      setIsLoading(true);
      const url = `${API_BASE}/${productId}?limit=${REVIEWS_PER_PAGE}` +
        (debouncedFilter ? `&rating=${debouncedFilter}` : "") +
        (cursor && !initial ? `&cursor=${cursor}` : "");

      const res = await axios.get(url);
      const { reviews: newReviews, nextCursor, hasMore, averageRating, ratingCounts } = res.data;
      setReviews(prev => initial ? newReviews : [...prev, ...newReviews]);
      setCursor(nextCursor);
      setHasMore(hasMore);
      if (initial && debouncedFilter === null) {
        setAverageRating(averageRating);
        setRatingCounts(ratingCounts);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, debouncedFilter, cursor]);

  useEffect(() => {
    setCursor(null);
    fetchReviews(true);
  }, [debouncedFilter, fetchReviews]);

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
        await axios.put(`${API_BASE}/${editingReviewId}`, payload);
      } else {
        await axios.post(API_BASE, payload);
      }

      resetForm();
      fetchReviews(true); // Re-fetch all reviews after submission
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then(setImages);
  };

  const openImagePreview = (idx, photoUrls) => {
    setPreview({ images: photoUrls, index: idx });
  };

  const closePreview = () => setPreview({ images: [], index: null });

  const handleImgError = (e) => {
    e.currentTarget.style.display = "none";
  };

  const renderStars = (value) => (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          fill={i < Math.floor(value) ? "#facc15" : "none"}
          stroke="#facc15"
          size={18}
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
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <label className="flex items-center text-gray-700">
            <Filter size={14} className="mr-1" />
            Filter by Rating:
          </label>
          <select
            value={starFilter ?? ""}
            onChange={(e) => setStarFilter(e.target.value ? parseInt(e.target.value) : null)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s} Stars
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Section */}
      {starFilter === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
          <div className="flex flex-col items-start gap-2">
            <div className="text-5xl font-extrabold text-gray-900">{averageRating.toFixed(1)}</div>
            {renderStars(averageRating)}
            <div className="text-sm text-gray-500 mt-1">{totalReviews} reviews</div>
          </div>
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-1 font-semibold">{star}</span>
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

      {/* Review List */}
      <div className="space-y-6">
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

      {/* Pagination & Load More */}
      <div className="flex justify-center items-center gap-4 mt-6">
        {hasMore && !isLoading && (
          <button
            onClick={() => fetchReviews(false)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowDown size={16} />
            Load More Reviews
          </button>
        )}
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
        {isLoading && <Loader2 className="animate-spin text-gray-500" size={24} />}
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
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
              className="p-3 border border-gray-300 rounded-md"
            >
              <option value="">Rating</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} Stars
                </option>
              ))}
            </select>
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
            <div className="flex gap-2 flex-wrap col-span-1 md:col-span-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded-md border border-gray-300" onError={handleImgError} />
              ))}
            </div>
            <button type="submit" className="px-6 py-3 bg-black text-white rounded-md font-semibold transition-colors hover:bg-gray-800 col-span-1 md:col-span-2">
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
