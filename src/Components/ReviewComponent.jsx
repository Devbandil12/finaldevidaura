// src/components/ReviewComponent.jsx

import React, { useEffect, useState, memo } from "react";
import { Star, ArrowDown, ArrowUp, Edit3, Filter, Loader2, Heart, ShoppingCart } from "lucide-react";
import axios from "axios";
import "../style/reviewcomponent.css";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;
const REVIEWS_PER_PAGE = 3;

const ReviewComponent = memo(({ productId, user, userdetails }) => {
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
      fetchReviews(true);
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
          fill={i < value ? "var(--color-accent)" : "transparent"}
          stroke={i < value ? "var(--color-accent)" : "var(--color-muted)"}
          className="rc-star-icon"
        />
      ))}
    </div>
  );

  const starRatingInput = (
    <div className="rc-rating-input">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`rc-star-input-icon ${i < rating ? "filled" : ""}`}
          onClick={() => setRating(i + 1)}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
      ))}
    </div>
  );

  const totalReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);

  const renderFilterOptions = () => (
    <AnimatePresence>
      <div className={`rc-dropdown ${formOpen ? "open" : ""}`}>
        <div onClick={() => setStarFilter(null)}>
          All ({totalReviews})
        </div>
        {[5, 4, 3, 2, 1].map(star => (
          <div key={star} onClick={() => setStarFilter(star)}>
            {star} Star ({ratingCounts[star] || 0})
          </div>
        ))}
      </div>
    </AnimatePresence>
  );

  const getReviewCountByStar = (star) => ratingCounts[star] || 0;

  const getPercentage = (star) => {
    if (totalReviews === 0) return 0;
    return (getReviewCountByStar(star) / totalReviews) * 100;
  };

  return (
    <div className="rc-review-component">
      <div className="rc-review-summary">
        <div className="rc-summary-left">
          <p className="rc-avg-rating">{averageRating.toFixed(1)}</p>
          {renderStars(Math.round(averageRating))}
          <p className="rc-review-count">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
        </div>

        <div className="rc-summary-right">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="rc-rating-bar-item" onClick={() => setStarFilter(star)}>
              <span className="rc-star-label">{star} Star</span>
              <div className="rc-progress-bar">
                <div
                  className="rc-progress-fill"
                  style={{ width: `${getPercentage(star)}%` }}
                ></div>
              </div>
              <span className="rc-rating-count">{getReviewCountByStar(star)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rc-main-actions">
        <div className="rc-dropdown-wrapper">
          <button className={`rc-dropdown-toggle ${formOpen ? "active" : ""}`} onClick={() => setFormOpen(!formOpen)}>
            <Filter size={18} />
            <span>{starFilter ? `${starFilter} Stars` : "All Reviews"}</span>
            {formOpen ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
          {formOpen && renderFilterOptions()}
        </div>
        <button className="rc-write-review-btn" onClick={() => setFormOpen(true)}>
          <Edit3 size={18} />
          Write a Review
        </button>
      </div>

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
            {/* Form content... */}
            <div className="rc-form-group">
              <label className="rc-label">Your Rating</label>
              {starRatingInput}
            </div>
            <div className="rc-form-group">
              <label className="rc-label">Your Comment</label>
              <textarea
                className="rc-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on the product..."
              />
            </div>
            <div className="rc-form-group">
              <label className="rc-label">Your Name</label>
              <input
                className="rc-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="rc-form-group">
              <label className="rc-label">Add Images (max 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              <div className="rc-image-previews">
                {images.map((img, idx) => (
                  <div key={idx} className="rc-image-preview-item">
                    <img src={img} alt="preview" onClick={() => openImagePreview(idx, images)} />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="rc-remove-image-btn"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rc-form-actions">
              <button type="submit" className="rc-submit-btn">
                {editingReviewId ? "Update Review" : "Submit Review"}
              </button>
              <button type="button" onClick={resetForm} className="rc-cancel-btn">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="rc-review-list">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            className="rc-review-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rc-review-card-header">
              <div className="rc-review-user-info">
                <span className="rc-review-user-name">{review.name}</span>
                <span className="rc-review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="rc-review-rating">{renderStars(review.rating)}</div>
            </div>
            <p className="rc-review-comment">{review.comment}</p>
            {review.photoUrls && review.photoUrls.length > 0 && (
              <div className="rc-review-images">
                {review.photoUrls.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    className="rc-review-image"
                    onClick={() => openImagePreview(idx, review.photoUrls)}
                    onError={handleImgError}
                  />
                ))}
              </div>
            )}
            {(review.userId === userdetails?.id || review.clerkId === user?.id) && (
              <div className="rc-review-actions">
                <button onClick={() => handleEdit(review)} className="rc-edit-btn">
                  <Edit3 size={16} /> Edit
                </button>
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && <Loader2 className="rc-loading-spinner" size={24} />}
        {!isLoading && hasMore && (
          <button className="rc-load-more-btn" onClick={() => fetchReviews()}>
            Load More Reviews
          </button>
        )}
      </div>

      <AnimatePresence>
        {preview.images.length > 0 && (
          <motion.div
            className="rc-preview-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <div className="rc-preview-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={preview.images[preview.index]}
                alt="Image preview"
                className="rc-preview-image"
              />
              <button className="rc-preview-close" onClick={closePreview}>&times;</button>
              <button className="rc-preview-nav left" onClick={() => openImagePreview(preview.index - 1, preview.images)}>&lsaquo;</button>
              <button className="rc-preview-nav right" onClick={() => openImagePreview(preview.index + 1, preview.images)}>&rsaquo;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ReviewComponent;
