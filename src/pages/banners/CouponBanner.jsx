import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { optimizeImage } from "../../utils/imageOptimizer";

const CouponBanner = ({ banner }) => {
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  const couponCode = banner.config?.couponCode || "FREESHIP";

  const optimizedImage = banner.imageUrl
    ? optimizeImage(banner.imageUrl, 1200)
    : null;

  const handleCopy = (e) => {
    e.stopPropagation();

    navigator.clipboard.writeText(couponCode);

    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="relative w-full px-4 md:px-8 py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => navigate(banner.link)}
        className="
          relative
          max-w-[1500px]
          mx-auto
          min-h-[700px]
          rounded-[40px]
          overflow-hidden
          cursor-pointer
          bg-[#0f0f10]
          text-white
          group
        "
      >
        {/* BACKGROUND IMAGE */}
        {optimizedImage && (
          <div className="absolute inset-0">
            <motion.img
              src={optimizedImage}
              alt=""
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8 }}
              className="
                w-full
                h-full
                object-cover
                opacity-40
                group-hover:scale-105
                transition-transform
                duration-[3000ms]
              "
            />

            {/* overlays */}
            <div className="absolute inset-0 bg-black/45" />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black
                via-black/60
                to-transparent
              "
            />

            <div
              className="
                absolute
                top-[-20%]
                right-[-10%]
                w-[700px]
                h-[700px]
                rounded-full
                bg-orange-500/20
                blur-[140px]
              "
            />
          </div>
        )}

        {/* CONTENT */}
        <div
          className="
            relative
            z-10
            grid
            lg:grid-cols-[1.1fr_0.9fr]
            min-h-[700px]
          "
        >
          {/* LEFT */}
          <div
            className="
              flex
              flex-col
              justify-center
              px-8
              md:px-16
              py-16
            "
          >
            {/* TAG */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="
                mb-8
                w-fit
                px-5
                py-2
                rounded-full
                border
                border-white/10
                bg-white/5
                backdrop-blur-xl
                text-[11px]
                uppercase
                tracking-[0.35em]
                font-semibold
              "
            >
              Limited Edition Offer
            </motion.div>

            {/* TITLE */}
            <motion.h1
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="
                text-5xl
                md:text-7xl
                xl:text-[7rem]
                font-black
                leading-[0.92]
                tracking-[-0.05em]
                max-w-[800px]
              "
            >
              {banner.title}
            </motion.h1>

            {/* SUBTITLE */}
            {banner.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="
                  mt-8
                  text-lg
                  md:text-xl
                  text-white/70
                  max-w-[580px]
                  leading-relaxed
                "
              >
                {banner.subtitle}
              </motion.p>
            )}

            {/* ACTION ROW */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="
                mt-14
                flex
                flex-col
                sm:flex-row
                gap-5
                items-start
                sm:items-center
              "
            >
              {/* COUPON */}
              <div
                onClick={handleCopy}
                className="
                  group/coupon
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  backdrop-blur-2xl
                  px-7
                  py-5
                  min-w-[260px]
                  hover:bg-white/15
                  transition-all
                  duration-500
                "
              >
                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-white/10
                    to-transparent
                    opacity-0
                    group-hover/coupon:opacity-100
                    transition-opacity
                  "
                />

                <div className="relative z-10 flex items-center justify-between gap-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
                      Coupon Code
                    </p>

                    <h3
                      className="
                        text-3xl
                        font-black
                        tracking-[0.25em]
                      "
                    >
                      {couponCode}
                    </h3>
                  </div>

                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="
                          w-12
                          h-12
                          rounded-full
                          bg-green-500
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Check size={20} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="
                          w-12
                          h-12
                          rounded-full
                          bg-white
                          text-black
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Copy size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.96 }}
                className="
                  flex
                  items-center
                  gap-3
                  text-lg
                  font-semibold
                  text-white
                "
              >
                Shop Collection

                <span
                  className="
                    w-11
                    h-11
                    rounded-full
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    bg-white/5
                    backdrop-blur-xl
                  "
                >
                  <ArrowRight size={18} />
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* RIGHT SIDE DECOR */}
          <div className="relative hidden lg:block">
            {/* Floating glass card */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              whileInView={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="
                absolute
                bottom-20
                right-20
                w-[320px]
                h-[420px]
                rounded-[32px]
                border
                border-white/10
                bg-white/10
                backdrop-blur-3xl
                shadow-2xl
                overflow-hidden
              "
            >
              {optimizedImage && (
                <img
                  src={optimizedImage}
                  alt=""
                  className="
                    w-full
                    h-full
                    object-cover
                    opacity-90
                  "
                />
              )}

              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-black/60
                  via-transparent
                  to-transparent
                "
              />

              <div className="absolute bottom-8 left-8">
                <p className="text-white/60 text-sm mb-2">
                  New Arrival
                </p>

                <h3 className="text-3xl font-bold">
                  Premium Drop
                </h3>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CouponBanner;