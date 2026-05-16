import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImage } from "../../utils/imageOptimizer"; 

const CouponBanner = ({ banner, index }) => {
    const [copied, setCopied] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const navigate = useNavigate();
    
    // Extract dynamic settings from CMS config
    const couponCode = banner.config?.couponCode || "FREESHIP";
    const bgColor = banner.config?.bgColor || "#FEF3C7"; // Default Amber
    const textColor = banner.config?.textColor || "#171717"; 
    
    const optimizedImage = banner.imageUrl ? optimizeImage(banner.imageUrl, 800) : null;

    const handleCopy = (e) => {
        e.stopPropagation(); // Prevent navigating to the link when clicking copy
        navigator.clipboard.writeText(couponCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Framer Motion Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    return (
        <section className="w-full py-12 px-4 md:px-8 flex justify-center items-center">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onClick={() => navigate(banner.link)}
                className="w-full max-w-[1400px] rounded-[2.5rem] p-8 md:p-14 cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-shadow duration-500 overflow-hidden relative group"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                {/* Subtle Background Glow effect */}
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10"
                >
                    {/* Text & Coupon Side */}
                    <div className="flex flex-col items-start gap-6">
                        <motion.span 
                            variants={itemVariants}
                            className="px-5 py-2 rounded-full bg-black/5 backdrop-blur-sm border border-black/5 text-xs font-extrabold uppercase tracking-[0.25em]"
                        >
                            Exclusive Offer
                        </motion.span>
                        
                        <motion.h2 
                            variants={itemVariants}
                            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
                        >
                            {banner.title}
                        </motion.h2>
                        
                        {banner.subtitle && (
                            <motion.p 
                                variants={itemVariants}
                                className="text-lg md:text-xl font-medium opacity-75 max-w-md leading-relaxed"
                            >
                                {banner.subtitle}
                            </motion.p>
                        )}

                        {/* Interactive Coupon Box */}
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCopy}
                            className="mt-6 relative group/coupon bg-white p-6 md:p-8 rounded-3xl border-2 border-dashed border-black/10 hover:border-black/30 transition-colors w-full max-w-md shadow-sm hover:shadow-xl"
                        >
                            {/* Animated Scissors */}
                            <motion.div 
                                animate={{ rotate: [0, -15, 0, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                                className="absolute -top-4 -left-4 bg-white p-2.5 rounded-full text-neutral-400 group-hover/coupon:text-black group-hover/coupon:shadow-md transition-all border border-black/5"
                            >
                                <Scissors size={20} />
                            </motion.div>

                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                Use Code at Checkout
                            </p>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-3xl md:text-4xl font-mono font-black tracking-widest text-black">
                                    {couponCode}
                                </span>
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        >
                                            <CheckCircle2 size={28} className="text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            whileHover={{ scale: 1.1 }}
                                            className="p-2 rounded-full bg-black/5 text-black/60 group-hover/coupon:bg-black group-hover/coupon:text-white transition-colors"
                                        >
                                            <Copy size={20} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            <p className={`text-xs mt-4 font-medium transition-colors ${copied ? 'text-green-600' : 'text-neutral-400 group-hover/coupon:text-black/60'}`}>
                                {copied ? "Code successfully copied to clipboard!" : "Click anywhere to copy code"}
                            </p>
                        </motion.div>
                    </div>

                    {/* Image Side with Shimmer */}
                    {optimizedImage && (
                        <motion.div 
                            variants={itemVariants}
                            className="relative h-[350px] lg:h-[450px] w-full rounded-[2rem] overflow-hidden shadow-2xl bg-black/5"
                        >
                            {/* Shimmer Loading Skeleton */}
                            <AnimatePresence>
                                {!imageLoaded && (
                                    <motion.div 
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 overflow-hidden"
                                    >
                                        <motion.div
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.img 
                                src={optimizedImage} 
                                alt="Sale Promotion" 
                                onLoad={() => setImageLoaded(true)}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ 
                                    scale: imageLoaded ? 1 : 1.2,
                                    opacity: imageLoaded ? 1 : 0 
                                }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out" 
                            />
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </section>
    );
};

export default CouponBanner;