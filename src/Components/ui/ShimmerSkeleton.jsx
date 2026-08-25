import React from 'react';
import { motion } from 'framer-motion';

export const ShimmerSweep = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-[-20deg]"
    animate={{ x: ["-150%", "150%"] }}
    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
  />
);

export const ShimmerBlock = ({ className, ...props }) => (
  <div className={`relative bg-black/5 overflow-hidden ${className || ""}`} {...props}>
    <ShimmerSweep />
  </div>
);

export const TestimonialCardSkeleton = () => (
  <div className="w-[320px] md:w-[340px] bg-white rounded-[2rem] p-8 border border-[var(--border)]/50">
    <div className="flex items-center gap-5 mb-6">
      <div className="relative w-14 h-14 rounded-full bg-black/5 overflow-hidden">
        <ShimmerSweep />
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative h-4 w-24 bg-black/5 rounded overflow-hidden"><ShimmerSweep /></div>
        <div className="relative h-3 w-16 bg-black/5 rounded overflow-hidden"><ShimmerSweep /></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="relative h-3 w-full bg-black/5 rounded overflow-hidden"><ShimmerSweep /></div>
      <div className="relative h-3 w-full bg-black/5 rounded overflow-hidden"><ShimmerSweep /></div>
      <div className="relative h-3 w-3/4 bg-black/5 rounded overflow-hidden"><ShimmerSweep /></div>
    </div>
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="relative aspect-[3/4] w-full rounded-xl bg-black/5 overflow-hidden">
      <ShimmerSweep />
    </div>
    <div className="space-y-2">
      <div className="relative h-5 w-3/4 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
      <div className="relative h-4 w-1/2 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
    </div>
  </div>
);

export const CartItemSkeleton = () => (
  <div className="flex gap-6 py-6 border-b border-zinc-200">
    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl bg-black/5 flex-shrink-0 overflow-hidden">
      <ShimmerSweep />
    </div>
    <div className="flex-grow flex flex-col justify-between py-1">
      <div className="space-y-3">
        <div className="relative h-5 w-3/4 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
        <div className="relative h-4 w-1/4 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="relative h-8 w-24 rounded-full bg-black/5 overflow-hidden"><ShimmerSweep /></div>
        <div className="relative h-6 w-20 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
      </div>
    </div>
  </div>
);

export const CheckoutSkeleton = () => (
  <div className="space-y-6">
    <div className="relative h-12 w-full rounded-xl bg-black/5 overflow-hidden"><ShimmerSweep /></div>
    <div className="relative h-32 w-full rounded-xl bg-black/5 overflow-hidden"><ShimmerSweep /></div>
    <div className="relative h-16 w-full rounded-xl bg-black/5 overflow-hidden"><ShimmerSweep /></div>
  </div>
);

export const AdminStatSkeleton = () => (
  <div className="relative p-6 rounded-2xl bg-white border border-zinc-200 overflow-hidden">
    <ShimmerSweep />
    <div className="relative h-4 w-1/3 mb-4 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
    <div className="relative h-8 w-1/2 rounded bg-black/5 overflow-hidden"><ShimmerSweep /></div>
  </div>
);

export const AdminRowSkeleton = () => (
  <div className="relative flex items-center justify-between p-4 border-b border-zinc-100 overflow-hidden">
    <ShimmerSweep />
    <div className="relative h-4 w-1/4 rounded bg-black/5 overflow-hidden"></div>
    <div className="relative h-4 w-1/4 rounded bg-black/5 overflow-hidden"></div>
    <div className="relative h-4 w-1/6 rounded bg-black/5 overflow-hidden"></div>
    <div className="relative h-8 w-8 rounded-full bg-black/5 overflow-hidden"></div>
  </div>
);

export const ComboBuilderSkeleton = () => (
  <div className="relative aspect-square w-full rounded-xl bg-black/5 overflow-hidden">
    <ShimmerSweep />
  </div>
);
