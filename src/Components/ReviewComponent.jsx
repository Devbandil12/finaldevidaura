import React, { useEffect, useState } from "react";
import {
  Star,
  ArrowDown,
  ArrowUp,
  Edit3,
  Filter,
  Loader2
} from "lucide-react";

import axios from "axios";
import "../style/reviewcomponent.css";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;

const ReviewComponent = ({ productId, user, userdetails }) => {
  const [averageRating, setAverageRating] = useState(0);
const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const REVIEWS_PER_PAGE = 3;
const [reviews, setReviews] = useState([]);
const [cursor, setCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);
const [isLoading, setIsLoading] = useState(false);


  const [rating, setRating] = useState(0);
  const [comment, setComment] =  useState("");
  const [images, setImages] = useState([]);
  const [name, setName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [preview, setPreview] = useState({ images: [], index: null });
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [starFilter]);

  const [debouncedFilter, setDebouncedFilter] = useState(starFilter);

useEffect(() => {
  const t = setTimeout(() => setDebouncedFilter(starFilter), 300);
  return () => clearTimeout(t);
}, [starFilter]);

useEffect(() => {
  setCursor(null); // reset pagination on filter change
  fetchReviews(true); // fetch fresh set
}, [productId, debouncedFilter]);


  const fetchReviews = async (initial = false) => {
  try {
    setIsLoading(true);
    const url = `${API_BASE}/${productId}?limit=${REVIEWS_PER_PAGE}` +
      (starFilter ? `&rating=${starFilter}` : "") +
      (cursor && !initial ? `&cursor=${cursor}` : "");

    const res = await axios.get(url);
    const { reviews: newReviews, nextCursor, hasMore, averageRating, ratingCounts } = res.data;

    setReviews(prev => initial ? newReviews : [...prev, ...newReviews]);
    setCursor(nextCursor);
    setHasMore(hasMore);
    setAverageRating(averageRating);
    setRatingCounts(ratingCounts);
  } catch (err) {
    console.error("Failed to fetch reviews", err);
  } finally {
    setIsLoading(false);
  }
};


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
      setCurrentPage(1);
      fetchReviews(starFilter);
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
    <div className="rc-star-row">
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
  const total = Object.values(ratingCounts).reduce((a, b) => a + b, 0) || 1;
  return ((count / total) * 100).toFixed(0);
};


  return (
    <div className="rc-review-component">
      {/* Star Filter Dropdown */}
      <div className="rc-filter-dropdown">
       <label className="rc-filter-label">
  <Filter size={14} className="mr-1" />
  Filter by Rating:
</label>

        <select
          value={starFilter ?? ""}
          onChange={(e) => setStarFilter(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s} Stars
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {starFilter === null && (
        <div className="rc-review-summary">
          <div className="rc-left">
            <div className="rc-avg-rating">{averageRating}</div>
            {renderStars(averageRating)}
            <div className="rc-total-reviews">{totalReviews} reviews</div>
          </div>
          <div className="rc-right">
            {[5, 4, 3, 2, 1].map((star) => (
  <div key={star} className="rc-progress-line">
    <span>{star}</span>
    <div className="rc-progress">
      <div
        className="rc-fill"
        style={{ width: `${getPercent(ratingCounts[star])}%` }}
      />
    </div>
    <span>{ratingCounts[star]}</span>
  </div>
))}

          </div>
        </div>
      )}

      {/* Review List */}
      
<div className="rc-review-list">
  <AnimatePresence>
    {reviews.map((r) => (
      <motion.div
        key={r.id}
        className="rc-review-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rc-review-header">
          <strong>{r.name}</strong>
          {r.isVerifiedBuyer && (
            <span className="rc-badge">Verified Purchase</span>
          )}
          {user?.userDetails?.id === r.userId && (
            <button
              className="rc-edit-btn"
              onClick={() => handleEdit(r)}
              title="Edit Review"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>

        {renderStars(r.rating)}
        <small>{new Date(r.createdAt).toLocaleDateString()}</small>

        {/* Review Images */}
        {r.photoUrls?.length > 0 && (
          <div className="rc-review-images">
            {r.photoUrls.slice(0, 4).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="review"
                onClick={() => openImagePreview(idx, r.photoUrls)}
                onError={handleImgError}
              />
            ))}
            {r.photoUrls.length > 4 && (
              <div
                className="rc-extra-img"
                onClick={() => openImagePreview(4, r.photoUrls)}
              >
                +{r.photoUrls.length - 4}
              </div>
            )}
          </div>
        )}

        <p>{r.comment}</p>
      </motion.div>
    ))}
  </AnimatePresence>
</div>



      {/* Image Preview Modal */}
      <AnimatePresence>
        {preview.index !== null && (
          <motion.div
            className="rc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <motion.div
              className="rc-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={preview.images[preview.index]}
                alt="preview"
                className="rc-preview-img"
                onError={handleImgError}
              />
              <div className="rc-modal-nav">
                <button onClick={() => setPreview(p => ({ ...p, index: (p.index > 0 ? p.index - 1 : p.images.length - 1) }))}>◀</button>
                <button onClick={() => setPreview(p => ({ ...p, index: (p.index < p.images.length - 1 ? p.index + 1 : 0) }))}>▶</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
     <div className="rc-pagination">
  {hasMore && !isLoading && (
    <button onClick={() => fetchReviews(false)}>
  <ArrowDown size={16} className="mr-1" />
  
</button>

  )}
  {reviews.length > REVIEWS_PER_PAGE && (
    <button onClick={() => {
  setCursor(null);
  fetchReviews(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}}>
  <ArrowUp size={16} className="mr-1" />
</button>

  )}
</div>

      {/* Toggle Button */}
      <button onClick={() => setFormOpen(!formOpen)} className="rc-toggle-form">
        {formOpen ? "Close Form" : "Write a Review"}
      </button>

      {/* Review Form with Animation */}
      <AnimatePresence>
        {formOpen && (
          <motion.form
            className="rc-review-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>{editingReviewId ? "Edit Your Review" : "Leave a Review"}</h3>
            {!user && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            )}
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
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
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
            <div className="rc-preview-thumbs">
              {images.map((src, i) => (
                <img key={i} src={src} alt="preview" onError={handleImgError} />
              ))}
            </div>
            <button type="submit">
              {editingReviewId ? "Update Review" : "Submit Review"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewComponent;
