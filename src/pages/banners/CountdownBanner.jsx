import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImage } from "../../utils/imageOptimizer";

const CountdownBanner = ({ banner }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const targetDate = new Date(banner.config?.endDate || new Date().getTime() + 86400000);
    const optimizedImage = banner.imageUrl ? optimizeImage(banner.imageUrl, 1200) : null;

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +targetDate - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [banner.config?.endDate]);

    // Framer Motion Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    const TimeUnit = ({ value, label }) => (
        <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-2xl w-16 h-16 md:w-24 md:h-24 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden group"
        >
            {/* Subtle inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] md:text-xs uppercase font-semibold text-white/50 tracking-[0.2em] mt-1">
                {label}
            </span>
        </motion.div>
    );

    return (
        <section className="w-full py-12 px-4 md:px-8 flex justify-center items-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate(banner.link)}
                className="w-full max-w-[1400px] h-[500px] rounded-[2.5rem] cursor-pointer overflow-hidden relative group shadow-2xl bg-neutral-950 border border-white/5"
            >
                {/* Shimmer Loading Skeleton */}
                <AnimatePresence>
                    {!imageLoaded && (
                        <motion.div 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 bg-neutral-900 overflow-hidden"
                        >
                            <motion.div
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "linear",
                                }}
                                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Background Image */}
                {optimizedImage && (
                    <motion.img 
                        src={optimizedImage} 
                        alt="Flash Sale" 
                        onLoad={() => setImageLoaded(true)}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: imageLoaded ? 1 : 1.1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-all duration-1000 ease-out group-hover:scale-105" 
                    />
                )}
                
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Content Container */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate={imageLoaded ? "visible" : "hidden"}
                    className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-3xl text-white z-20"
                >
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-500 backdrop-blur-sm border border-red-500/20">
                            <Timer size={16} className="animate-pulse" />
                        </div>
                        <span className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-red-400">
                            Flash Sale Ending Soon
                        </span>
                    </motion.div>

                    <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
                        {banner.title}
                    </motion.h2>
                    
                    {banner.subtitle && (
                        <motion.p variants={itemVariants} className="text-lg md:text-xl text-neutral-300 mb-10 max-w-xl font-light">
                            {banner.subtitle}
                        </motion.p>
                    )}

                    {/* Timer Grid */}
                    <motion.div variants={itemVariants} className="flex gap-4 md:gap-6 mb-10">
                        <TimeUnit value={timeLeft.days} label="Days" />
                        <TimeUnit value={timeLeft.hours} label="Hrs" />
                        <TimeUnit value={timeLeft.minutes} label="Min" />
                        <TimeUnit value={timeLeft.seconds} label="Sec" />
                    </motion.div>

                    <motion.button 
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="self-start relative overflow-hidden group inline-flex items-center gap-4 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-full transition-all"
                    >
                        {/* Button Hover Glow */}
                        <div className="absolute inset-0 w-full h-full bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        
                        <span className="relative z-10">{banner.buttonText}</span>
                        <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default CountdownBanner;