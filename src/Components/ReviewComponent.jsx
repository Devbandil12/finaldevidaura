// ReviewComponent.jsx
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import "../style/reviewcomponent.css";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;

const ReviewComponent = ({ productId, user, userdetails }) => {
  // review list + stats
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingStats, setRatingStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

const [currentPage, setCurrentPage] = useState(1);
const REVIEWS_PER_PAGE = 3;


const [totalReviews, setTotalReviews] = useState(0);

  // form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [name, setName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
  const [editingReviewId, setEditingReviewId] = useState(null);

  // filtering & preview state
  const [starFilter, setStarFilter] = useState(null);
  const [preview, setPreview] = useState({ images: [], index: null });

  // fetch on mount & when productId or starFilter changes
  useEffect(() => {
  fetchReviews(starFilter);
}, [productId, starFilter, currentPage]);


  const fetchReviews = async (filter) => {
    try {
      const url = filter
        ? `${API_BASE}/${productId}?rating=${filter}`
        : `${API_BASE}/${productId}`;
      const res = await axios.get(url);
      const data = res.data;
      const startIdx = (currentPage - 1) * REVIEWS_PER_PAGE;
const endIdx = startIdx + REVIEWS_PER_PAGE;
setReviews(data.slice(startIdx, endIdx));
setTotalReviews(data.length); // we'll add this state next


      // recalc stats if no filter
      if (!filter) {
        const total = data.length;
        if (total > 0) {
          const sum = data.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating((sum / total).toFixed(1));
          const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          data.forEach((r) => stats[r.rating]++);
          setRatingStats(stats);
        } else {
          setAverageRating(0);
          setRatingStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
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
  };

  const handleEdit = (review) => {
    setRating(review.rating);
    setComment(review.comment);
    setImages(review.photoUrls || []);
    setEditingReviewId(review.id);
    setName(review.name);
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
          fill={
            i < Math.floor(value)
              ? "#facc15"
              : i < value
              ? "url(#halfStar)"
              : "none"
          }
          stroke="#facc15"
          size={18}
        />
      ))}
    </div>
  );

  const getPercent = (count) => {
    const total = reviews.length || 1;
    return ((count / total) * 100).toFixed(0);
  };

  return (
    <div className="rc-review-component">
      {/* Filter Controls */}
      <div className="rc-filter-stars">
        <button
          className={starFilter === null ? "active" : ""}
          onClick={() => setStarFilter(null)}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            className={starFilter === s ? "active" : ""}
            onClick={() => setStarFilter(starFilter === s ? null : s)}
          >
            {s}★
          </button>
        ))}
      </div>

      {/* Summary (only when no filter) */}
      {starFilter === null && (
        <div className="rc-review-summary">
          <div className="rc-left">
            <div className="rc-avg-rating">{averageRating}</div>
            {renderStars(averageRating)}
            <div className="rc-total-reviews">{reviews.length} reviews</div>
          </div>
          <div className="rc-right">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="rc-progress-line">
                <span>{star}</span>
                <div className="rc-progress">
                  <div
                    className="rc-fill"
                    style={{ width: `${getPercent(ratingStats[star])}%` }}
                  />
                </div>
                <span>{ratingStats[star]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review List */}
      <div className="rc-review-list">
        {reviews.map((r) => (
          <div key={r.id} className="rc-review-card">
            <div className="rc-review-header">
              <strong>{r.name}</strong>
              {r.isVerifiedBuyer && (
                <span className="rc-badge">Verified Purchase</span>
              )}
              {user?.userDetails?.id === r.userId && (
                <button className="rc-edit-btn" onClick={() => handleEdit(r)}>
                  Edit
                </button>
              )}
            </div>

            {/* Thumbnails */}
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
            {renderStars(r.rating)}
            <small>{new Date(r.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>

      {/* Image Preview Overlay */}
      {preview.index !== null && (
        <div className="rc-preview-overlay" onClick={closePreview}>
          <img
            src={preview.images[preview.index]}
            alt="preview"
            className="rc-preview-img"
            onError={handleImgError}
          />
          <button
            className="rc-nav rc-left"
            onClick={(e) => {
              e.stopPropagation();
              setPreview((p) => ({
                images: p.images,
                index: p.index > 0 ? p.index - 1 : p.images.length - 1,
              }));
            }}
          >
            ◀
          </button>
          <button
            className="rc-nav rc-right"
            onClick={(e) => {
              e.stopPropagation();
              setPreview((p) => ({
                images: p.images,
                index: p.index < p.images.length - 1 ? p.index + 1 : 0,
              }));
            }}
          >
            ▶
          </button>
        </div>
      )}

<div className="rc-pagination">
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    Previous
  </button>
  <span>
    Page {currentPage} of {Math.ceil(totalReviews / REVIEWS_PER_PAGE)}
  </span>
  <button
    disabled={currentPage === Math.ceil(totalReviews / REVIEWS_PER_PAGE)}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next
  </button>
</div>


      {/* Review Form */}
      <form className="rc-review-form" onSubmit={handleSubmit}>
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
      </form>
    </div>
  );
};

export default ReviewComponent;