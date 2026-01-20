import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Star, MessageSquareQuote } from "lucide-react";
import { motion } from "framer-motion";

// --- Shared Utility ---
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", { 
      month: "short", day: "numeric", year: "numeric" 
    });
};

export default function ReviewsTab({ userReviews, loadingReviews, products }) {
  const navigate = useNavigate();
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-zinc-100 pb-2">
         <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight">My Reviews</h2>
         <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Your feedback helps us craft better experiences.</p>
      </div>

      <div className="space-y-6">
        {loadingReviews && <div className="text-center text-zinc-300 py-20 italic">Loading feedback...</div>}
        
        {!loadingReviews && (!userReviews || userReviews.length === 0) && (
             <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                <MessageSquareQuote className="text-zinc-300 mb-4" size={48} strokeWidth={1} />
                <p className="text-zinc-400 font-light">You haven't reviewed any products yet.</p>
             </div>
        )}

        {(userReviews || []).map((review, i) => {
          const product = productMap.get(review.productId);
          return (
            <motion.div 
                key={review.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] border border-zinc-100 flex gap-6 items-start group hover:border-zinc-200 transition-all"
            >
              {/* Product Thumb */}
              <div className="w-20 h-20 rounded-2xl bg-zinc-50 p-2 border border-zinc-100 flex-shrink-0">
                 <img src={product?.imageurl?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product?.name} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-serif text-xl font-medium text-zinc-900 truncate">{product?.name}</h4>
                        <div className="flex gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200"} />
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/product/${review.productId}`, { state: { editReviewId: review.id } })} 
                        className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors"
                        title="Edit Review"
                    >
                        <Pencil size={16} />
                    </button>
                </div>
                
                <div className="relative mt-4 pl-4 border-l-2 border-zinc-100">
                    <p className="text-sm text-zinc-600 leading-relaxed italic font-serif">"{review.comment}"</p>
                </div>
                
                <p className="text-[10px] text-zinc-400 mt-4 font-bold uppercase tracking-widest">{formatDate(review.createdAt)}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}