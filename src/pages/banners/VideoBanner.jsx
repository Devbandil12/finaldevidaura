import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoBanner = ({ banner }) => {
    const navigate = useNavigate();
    const [mediaLoaded, setMediaLoaded] = useState(false);
    
    // Check if the URL is a video (.mp4, .webm) or an image fallback
    const isVideo = banner.imageUrl?.match(/\.(mp4|webm|ogg)$/i);

    // Framer Motion Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { 
                duration: 1, 
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.15, 
                delayChildren: 0.3 
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 20 } }
    };

    return (
        <section className="w-full py-8 md:py-12 px-4 md:px-8 flex justify-center overflow-hidden">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                onClick={() => navigate(banner.link)}
                className="w-full max-w-[1600px] h-[60vh] md:h-[75vh] min-h-[500px] rounded-[2.5rem] cursor-pointer relative group isolate overflow-hidden shadow-2xl bg-[var(--brand)]"
            >
                {/* Shimmer Loading Skeleton */}
                <AnimatePresence>
                    {!mediaLoaded && (
                        <motion.div 
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0 z-10 bg-[var(--surface-muted)] overflow-hidden"
                        >
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--brand-contrast)]/10 to-transparent skew-x-12"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Media Layer */}
                <div className="absolute inset-0 w-full h-full bg-[var(--brand)]">
                    {isVideo ? (
                        <motion.video 
                            src={banner.imageUrl} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            onCanPlayThrough={() => setMediaLoaded(true)}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ 
                                scale: mediaLoaded ? 1 : 1.1,
                                opacity: mediaLoaded ? 0.6 : 0 
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="w-full h-full object-cover transform group-hover:scale-105 group-hover:opacity-50 transition-all duration-[2s] ease-out"
                        />
                    ) : (
                        <motion.img 
                            src={banner.imageUrl} 
                            alt={banner.title} 
                            onLoad={() => setMediaLoaded(true)}
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ 
                                scale: mediaLoaded ? 1 : 1.1,
                                opacity: mediaLoaded ? 0.6 : 0 
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="w-full h-full object-cover transform group-hover:scale-105 group-hover:opacity-50 transition-all duration-[2s] ease-out"
                        />
                    )}
                </div>

                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />

                {/* Floating Glass Content Box */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate={mediaLoaded ? "visible" : "hidden"}
                        className="relative bg-[var(--brand-contrast)]/5 backdrop-blur-md border border-[var(--brand-contrast)]/10 p-10 md:p-16 rounded-[2rem] text-center max-w-3xl w-full group-hover:bg-[var(--brand-contrast)]/10 group-hover:backdrop-blur-xl group-hover:border-[var(--brand-contrast)]/20 transition-all duration-700 ease-out shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-contrast)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {isVideo && (
                            <motion.div variants={itemVariants} className="flex justify-center mb-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand-contrast)]/10 border border-[var(--brand-contrast)]/20 backdrop-blur-md text-[var(--brand-contrast)]">
                                    <Play size={18} className="ml-1 opacity-80" />
                                </div>
                            </motion.div>
                        )}

                        <motion.h2 
                            variants={itemVariants}
                            className="text-4xl md:text-6xl lg:text-7xl font-extralight text-[var(--brand-contrast)] mb-6 tracking-tight leading-[1.1]"
                        >
                            {banner.title}
                        </motion.h2>
                        
                        {banner.subtitle && (
                            <motion.p 
                                variants={itemVariants}
                                className="text-xs md:text-sm text-[var(--brand-contrast)]/60 uppercase tracking-[0.3em] font-semibold mb-10 max-w-xl mx-auto leading-relaxed"
                            >
                                {banner.subtitle}
                            </motion.p>
                        )}
                        
                        <motion.button 
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative inline-flex items-center gap-4 px-10 py-5 bg-[var(--brand-contrast)] text-[var(--brand)] font-bold uppercase text-xs tracking-[0.2em] rounded-full overflow-hidden hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 group/btn"
                        >
                            <span className="relative z-10">{banner.buttonText}</span>
                            <ArrowRight size={16} className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default VideoBanner;