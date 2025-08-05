import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import "./style/ReviewComponent.css";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/reviews`;

const ReviewComponent = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingStats, setRatingStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/${productId}`);
      setReviews(res.data);

      const total = res.data.length;
      if (total > 0) {
        const sum = res.data.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating((sum / total).toFixed(1));

        const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        res.data.forEach((r) => stats[r.rating]++);
        setRatingStats(stats);
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
        userId: user?.id || null,
        photoUrls: images,
      };

      if (editingReviewId) {
        await axios.put(`${API_BASE}/${editingReviewId}`, payload);
        setEditingReviewId(null);
      } else {
        await axios.post(API_BASE, payload);
      }

      resetForm();
      fetchReviews();
    } catch (err) {
      console.error("Review submission failed", err);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setImages([]);
    setName(user?.name || "");
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
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then(setImages);
  };

  const openImagePreview = (index) => setPreviewImageIndex(index);
  const closePreview = () => setPreviewImageIndex(null);

  const renderStars = (value) => {
    return (
      <div className="star-row">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            fill={i < Math.floor(value) ? "#facc15" : i < value ? "url(#halfStar)" : "none"}
            stroke="#facc15"
            size={18}
          />
        ))}
      </div>
    );
  };

  const getPercent = (count) => {
    const total = reviews.length || 1;
    return ((count / total) * 100).toFixed(0);
  };

  return (
    <div className="review-component">
      <div className="review-summary">
        <div className="left">
          <div className="avg-rating">{averageRating}</div>
          {renderStars(averageRating)}
          <div className="total-reviews">{reviews.length} reviews</div>
        </div>
        <div className="right">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="progress-line">
              <span>{star}</span>
              <div className="progress">
                <div className="fill" style={{ width: `${getPercent(ratingStats[star])}%` }}></div>
              </div>
              <span>{ratingStats[star]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="review-list">
        {reviews.map((r, i) => (
          <div key={i} className="review-card">
            <div className="review-header">
              <strong>{r.name}</strong>
              {r.isVerified && <span className="badge">Verified Purchase</span>}
              {user?.id === r.userId && (
                <button className="edit-btn" onClick={() => handleEdit(r)}>
                  Edit
                </button>
              )}
            </div>
            {r.photoUrls?.length > 0 && (
              <div className="review-images">
                {r.photoUrls.slice(0, 4).map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="review"
                    onClick={() => openImagePreview(idx)}
                  />
                ))}
                {r.photoUrls.length > 4 && (
                  <div className="extra-img" onClick={() => openImagePreview(4)}>
                    +{r.photoUrls.length - 4}
                  </div>
                )}
              </div>
            )}
            <p>{r.comment}</p>
            {renderStars(r.rating)}
            <small>{new Date(r.createdAt).toLocaleDateString()}</small>

            {previewImageIndex !== null && (
              <div className="preview-overlay" onClick={closePreview}>
                <img
                  src={r.photoUrls[previewImageIndex]}
                  alt="preview"
                  className="preview-img"
                />
                <button
                  className="nav left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImageIndex((prev) => (prev > 0 ? prev - 1 : r.photoUrls.length - 1));
                  }}
                >
                  ◀
                </button>
                <button
                  className="nav right"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImageIndex((prev) => (prev < r.photoUrls.length - 1 ? prev + 1 : 0));
                  }}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
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
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} required>
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
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
        <div className="preview-thumbs">
          {images.map((src, i) => (
            <img key={i} src={src} alt="preview" />
          ))}
        </div>
        <button type="submit">{editingReviewId ? "Update Review" : "Submit Review"}</button>
      </form>
    </div>
  );
};

export default ReviewComponent;
