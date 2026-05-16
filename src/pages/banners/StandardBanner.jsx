import React, { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Star, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImage } from "../../utils/imageOptimizer"; 

const StandardBanner = memo(({ banner, index = 0 }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Alternates layout based on the index (Image left vs Image right)
    const isEven = index % 2 === 0;

    // Optimize Image URL
    const optimizedBannerImage = useMemo(() => {
        return banner?.imageUrl ? optimizeImage(banner.imageUrl, 1200) : null;
    }, [banner?.imageUrl]);

    if (!banner) return null;

    // Framer Motion Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
    };

    const slideInVariants = {
        hidden: { opacity: 0, x: isEven ? -40 : 40 },
        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70, damping: 20 } }
    };

    return (
        <section className="w-full py-16 px-4 md:px-8 flex justify-center items-center overflow-hidden">
            {/* Main Card Container */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                onClick={() => navigate(banner.link)}
                className="group relative w-full max-w-[1500px] bg-white rounded-[2.5rem] p-8 md:p-12 lg:p-16 cursor-pointer border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-700 isolate"
            >
                {/* Layout Grid: 40% Text / 60% Image */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                    {/* Text Section (Spans 5 cols) */}
                    <motion.div 
                        variants={containerVariants}
                        className={`flex flex-col gap-8 lg:col-span-5 ${!isEven ? 'lg:order-2' : 'lg:order-1'}`}
                    >
                        {/* Badge & Meta */}
                        <motion.div variants={slideInVariants} className="flex items-center gap-4">
                            <span className="px-4 py-2 rounded-full bg-neutral-950 text-white text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-neutral-900/20">
                                {isEven ? 'New Arrival' : 'Featured'}
                            </span>
                            <span className="text-sm font-medium text-neutral-400 tracking-wide">
                                #{index + 1} · Collection
                            </span>
                        </motion.div>

                        {/* Title & Subtitle */}
                        <div className="flex flex-col gap-4">
                            <motion.h2 
                                variants={itemVariants} 
                                className="text-4xl md:text-5xl lg:text-6xl text-neutral-950 font-black leading-[1.1] tracking-tight group-hover:text-black transition-colors"
                            >
                                {banner.title}
                            </motion.h2>

                            {banner.subtitle && (
                                <motion.p 
                                    variants={itemVariants} 
                                    className="text-lg text-neutral-500 font-light leading-relaxed max-w-xl"
                                >
                                    {banner.subtitle}
                                </motion.p>
                            )}
                        </div>

                        {/* Static Trust Icons */}
                        <motion.div variants={itemVariants} className="flex items-center gap-8 py-6 border-y border-neutral-100">
                            <div className="flex items-center gap-4 group/icon">
                                <div className="p-3 bg-neutral-50 rounded-xl group-hover/icon:bg-neutral-100 transition-colors">
                                    <ShieldCheck size={20} className="text-neutral-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Quality</p>
                                    <p className="text-sm font-bold text-neutral-900">Verified</p>
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-neutral-100"></div>
                            <div className="flex items-center gap-4 group/icon">
                                <div className="p-3 bg-neutral-50 rounded-xl group-hover/icon:bg-neutral-100 transition-colors">
                                    <Star size={20} className="text-neutral-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Rating</p>
                                    <p className="text-sm font-bold text-neutral-900">Top Tier</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Button */}
                        <motion.button 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative inline-flex items-center gap-4 self-start px-8 py-4 rounded-full border border-neutral-200 bg-white text-neutral-950 font-bold text-xs uppercase tracking-[0.2em] overflow-hidden group/btn shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <span className="relative z-10 group-hover/btn:text-white transition-colors duration-300">{banner.buttonText}</span>
                            <ArrowRight size={16} className="relative z-10 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all duration-300" />
                            <div className="absolute inset-0 bg-neutral-950 scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/btn:scale-x-100" />
                        </motion.button>
                    </motion.div>

                    {/* Image Section (Spans 7 cols) */}
                    <div className={`relative w-full lg:col-span-7 ${!isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                        {/* Main Image Container */}
                        <motion.div 
                            variants={itemVariants}
                            className="relative w-full h-[350px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_rgb(0,0,0,0.1)] bg-neutral-100"
                        >
                            {/* Shimmer Skeleton */}
                            <AnimatePresence>
                                {!imageLoaded && (
                                    <motion.div 
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 bg-neutral-100 overflow-hidden"
                                    >
                                        <motion.div
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {optimizedBannerImage && (
                                <motion.img
                                    src={optimizedBannerImage}
                                    alt={banner.title}
                                    loading="lazy" 
                                    onLoad={() => setImageLoaded(true)}
                                    initial={{ scale: 1.15, filter: 'blur(10px)' }}
                                    animate={{ 
                                        scale: imageLoaded ? 1 : 1.15,
                                        filter: imageLoaded ? 'blur(0px)' : 'blur(10px)'
                                    }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                                />
                            )}
                            {/* Subtle Inner Shadow/Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-50 pointer-events-none mix-blend-multiply" />
                        </motion.div>

                        {/* Floating Glass Card */}
                        <motion.div 
                            variants={itemVariants}
                            className={`
                                absolute -bottom-8 ${isEven ? '-left-8' : '-right-8'} 
                                w-64 p-6 rounded-[1.5rem] 
                                bg-white/80 backdrop-blur-2xl border border-white/60 
                                shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]
                                hidden md:block group-hover:-translate-y-4 group-hover:scale-[1.02] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                            `}
                        >
                            <div className="flex items-center justify-between mb-3 border-b border-neutral-200/60 pb-3">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-neutral-500">Spotlight</span>
                                <Zap size={16} className="text-amber-500 fill-amber-500 drop-shadow-sm" />
                            </div>
                            <p className="text-sm font-bold text-neutral-900 leading-relaxed mb-3">
                                Explore this exclusive collection.
                            </p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={12} className="fill-neutral-900 text-neutral-900" />
                                ))}
                            </div>
                        </motion.div>

                        {/* Corner Stamp Animation */}
                        <motion.div 
                            variants={{
                                hidden: { scale: 0, rotate: -45 },
                                visible: { scale: 1, rotate: 12, transition: { type: "spring", delay: 0.6 } }
                            }}
                            className={`
                                absolute -top-5 ${isEven ? '-right-5' : '-left-5'} 
                                w-16 h-16 rounded-full 
                                bg-neutral-950 text-white 
                                flex items-center justify-center 
                                shadow-2xl shadow-neutral-900/30
                                group-hover:rotate-[45deg] group-hover:scale-110 transition-transform duration-500 ease-out
                            `}
                        >
                            <Sparkles size={20} />
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </section>
    );
});

export default StandardBanner;