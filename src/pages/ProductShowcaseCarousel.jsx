import React, { useCallback, useContext, useEffect, useState, useMemo, memo, useRef } from "react";
import { ProductContext } from "../contexts/productContext";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, MoveRight } from "lucide-react";
import { optimizeImage } from "../utils/imageOptimizer";

const baseTheme = {
    colors: {
        luxuryDark: "225 15% 11%",
        background: "210 20% 98%",
        accentPrimary: "222 47% 11%",
        accentSecondary: "215 16% 47%",
    },
};

const infoVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1, delayChildren: 0.2 }
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    },
};

const createImageVariants = (shouldReduce) => ({
    enter: ({ direction, isMobile }) => ({
        x: shouldReduce ? 0 : (direction > 0 ? (isMobile ? 30 : 100) : (isMobile ? -30 : -100)),
        opacity: shouldReduce ? 1 : 0,
        scale: shouldReduce ? 1 : 0.95,
        rotateY: shouldReduce ? 0 : (isMobile ? 0 : (direction > 0 ? -15 : 15)),
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        rotateY: 0,
        transition: { duration: shouldReduce ? 0.1 : 0.8, ease: [0.16, 1, 0.3, 1] },
    },
    exit: ({ direction, isMobile }) => ({
        zIndex: 0,
        x: shouldReduce ? 0 : (direction < 0 ? (isMobile ? 30 : 100) : (isMobile ? -30 : -100)),
        opacity: shouldReduce ? 1 : 0,
        scale: shouldReduce ? 1 : 0.95,
        rotateY: shouldReduce ? 0 : (isMobile ? 0 : (direction > 0 ? 15 : -15)),
        transition: { duration: shouldReduce ? 0.1 : 0.6, ease: [0.16, 1, 0.3, 1] },
    }),
});

const rotateCircle = {
    animate: {
        rotate: 360,
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
    }
};

/* ------------------ OPTIMIZED BLUR IMAGE COMPONENT ------------------ */
const BlurImage = memo(({ src, alt, className, priority = false, width, height }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const optimizedSrc = useMemo(() => optimizeImage(src, 'card'), [src]);

    const handleLoad = useCallback(() => {
        requestAnimationFrame(() => {
            setIsLoading(false);
        });
    }, []);

    const handleError = useCallback(() => {
        requestAnimationFrame(() => {
            setIsLoading(false);
            setHasError(true);
        });
    }, []);

    useEffect(() => {
        // Reset loading state when src changes
        setIsLoading(true);
        setHasError(false);
    }, [optimizedSrc]);

    if (hasError) {
        return (
            <div className={`relative ${className} bg-gray-100 flex items-center justify-center`}>
                <span className="text-4xl font-bold opacity-20">{alt?.[0] || '?'}</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className} bg-gray-200`}>
            <motion.div
                className="absolute inset-0 bg-gray-300 z-10"
                initial={{ opacity: 1 }}
                animate={{ opacity: isLoading ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "linear" }}
            />

            <motion.img
                ref={imgRef}
                src={optimizedSrc}
                alt={alt}
                width={width}
                height={height}
                initial={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                animate={{
                    opacity: isLoading ? 0 : 1,
                    filter: isLoading ? "blur(10px)" : "blur(0px)",
                    scale: 1
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onLoad={handleLoad}
                onError={handleError}
                fetchPriority={priority ? "high" : "auto"}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className="relative z-0 w-full h-full object-cover"
            />
        </div>
    );
});

BlurImage.displayName = "BlurImage";

export default function ProductShowcaseCarousel() {
    const { products: contextProducts } = useContext(ProductContext);
    const shouldReduceMotion = useReducedMotion();
    const imageVariants = useMemo(() => createImageVariants(shouldReduceMotion), [shouldReduceMotion]);

    const [products, setProducts] = useState(() => {
        try {
            const cached = sessionStorage.getItem("immersive_showcase_cache");
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const [activeIdx, setActiveIdx] = useState(0);
    const [direction, setDirection] = useState(0);
    const [storyExpanded, setStoryExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const preloadedImages = useRef(new Set());
    const resizeTimeoutRef = useRef(null);

    // Sync products with context
    useEffect(() => {
        if (contextProducts && contextProducts.length > 0) {
            const valid = contextProducts.filter(p => p.category !== "Template" && !p.isArchived);
            setProducts(prev => {
                const prevStr = JSON.stringify(prev);
                const validStr = JSON.stringify(valid);
                if (prevStr !== validStr) {
                    sessionStorage.setItem("immersive_showcase_cache", validStr);
                    return valid;
                }
                return prev;
            });
        }
    }, [contextProducts]);

    // Optimized mobile detection with debouncing
    useEffect(() => {
        const checkMobile = () => {
            clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                requestAnimationFrame(() => {
                    setIsMobile(window.innerWidth < 768);
                });
            }, 150);
        };
        
        checkMobile();
        window.addEventListener("resize", checkMobile, { passive: true });
        
        return () => {
            window.removeEventListener("resize", checkMobile);
            clearTimeout(resizeTimeoutRef.current);
        };
    }, []);

    // Intelligent image preloading
    useEffect(() => {
        if (!products.length) return;

        const preloadImage = (src) => {
            if (!src || preloadedImages.current.has(src)) return;
            
            const optimized = optimizeImage(src, 800);
            const img = new Image();
            img.fetchPriority = 'low';
            img.decoding = 'async';
            img.onload = () => preloadedImages.current.add(src);
            img.src = optimized;
        };

        // Preload current, next, and previous images
        const indicesToLoad = [
            activeIdx,
            (activeIdx + 1) % products.length,
            (activeIdx - 1 + products.length) % products.length
        ];

        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                indicesToLoad.forEach(idx => {
                    const p = products[idx];
                    if (p) {
                        const rawSrc = p.imageUrl || (Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl);
                        preloadImage(rawSrc);
                    }
                });
            });
        } else {
            setTimeout(() => {
                indicesToLoad.forEach(idx => {
                    const p = products[idx];
                    if (p) {
                        const rawSrc = p.imageUrl || (Array.isArray(p.imageurl) ? p.imageurl[0] : p.imageurl);
                        preloadImage(rawSrc);
                    }
                });
            }, 100);
        }
    }, [activeIdx, products]);

    const onNext = useCallback(() => {
        if (!products.length || isTransitioning) return;
        setIsTransitioning(true);
        setDirection(1);
        setActiveIdx((i) => (i + 1) % products.length);
        setStoryExpanded(false);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [products.length, isTransitioning]);

    const onPrev = useCallback(() => {
        if (!products.length || isTransitioning) return;
        setIsTransitioning(true);
        setDirection(-1);
        setActiveIdx((i) => (i - 1 + products.length) % products.length);
        setStoryExpanded(false);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [products.length, isTransitioning]);

    const goToIndex = useCallback((i) => {
        if (isTransitioning || i === activeIdx) return;
        setIsTransitioning(true);
        setDirection(i > activeIdx ? 1 : -1);
        setActiveIdx(i);
        setStoryExpanded(false);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [activeIdx, isTransitioning]);

    const swipeHandlers = useSwipeable({
        onSwipedLeft: onNext,
        onSwipedRight: onPrev,
        trackMouse: true,
        preventScrollOnSwipe: true,
        delta: 50, // Require 50px swipe to trigger
    });

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "ArrowRight") onNext();
            else if (e.key === "ArrowLeft") onPrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onNext, onPrev]);

    // Validate active index
    useEffect(() => {
        if (products.length > 0 && activeIdx >= products.length) {
            setActiveIdx(0);
        }
    }, [products, activeIdx]);

    // Memoize color values
    const colors = useMemo(() => ({
        bg: `hsl(${baseTheme.colors.background})`,
        text: `hsl(${baseTheme.colors.luxuryDark})`,
        brandLight: `hsl(${baseTheme.colors.accentPrimary})`,
        brandDeep: `hsl(${baseTheme.colors.accentSecondary})`,
    }), []);

    if (products.length === 0) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg opacity-50">Loading fragrances...</p>
                </div>
            </div>
        );
    }

    const product = products[activeIdx] || {};

    const storyText = product.description || "";
    const teaser = storyText.slice(0, 150).trim();
    const isLongStory = storyText && storyText.length > 150;

    const allNotes = useMemo(() => {
        try {
            const parseNotes = (source) => {
                if (!source) return [];
                if (Array.isArray(source)) return source;
                return typeof source === 'string' ? source.split(',').map(n => n.trim()) : [];
            };
            const top = parseNotes(product.composition);
            const heart = parseNotes(product.fragrance);
            const base = parseNotes(product.fragranceNotes);
            return [...top, ...heart, ...base].filter(Boolean);
        } catch (e) { 
            return []; 
        }
    }, [product.composition, product.fragrance, product.fragranceNotes]);

    const displayImage = product.imageUrl || (Array.isArray(product.imageurl) ? product.imageurl[0] : product.imageurl);

    return (
        <>
            <div className="text-center px-4 pt-20 md:pt-32">
                <h2 className="text-5xl md:text-7xl font-medium tracking-tight" style={{ color: colors.text }}>
                    Explore Our Scents
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg opacity-70" style={{ color: colors.text }}>
                    An immersive journey into our signature fragrances.
                </p>
            </div>

            <section className="relative w-full py-16 md:py-24 min-h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="relative w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16 md:gap-22 px-6 touch-pan-y" {...swipeHandlers}>

                    {/* LEFT PANEL - Product Info */}
                    <motion.div
                        key={`info-${activeIdx}`}
                        className="w-full h-full flex flex-col justify-center text-left items-start relative z-10 p-2 lg:p-0"
                        variants={infoVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <div className="relative w-full flex flex-col items-start justify-center">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{ duration: shouldReduceMotion ? 0.1 : 1, delay: shouldReduceMotion ? 0 : 0.2 }}
                                className="absolute left-0 top-0 bottom-0 w-[4px] lg:w-1.5 opacity-100 rounded-full"
                                style={{
                                    backgroundColor: colors.brandLight,
                                    boxShadow: `0 0 15px rgba(0,0,0,0.1)`
                                }}
                            />

                            <div className="pl-6 lg:pl-8 w-full">
                                <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4 lg:mb-6">
                                    <span className="text-xs lg:text-sm font-bold tracking-[0.2em] opacity-80" style={{ color: colors.brandDeep }}>
                                        N° 0{activeIdx + 1} — COLLECTION
                                    </span>
                                </motion.div>

                                <motion.h1
                                    className="text-5xl md:text-8xl font-medium tracking-tight uppercase leading-none"
                                    style={{
                                        color: colors.text,
                                        textShadow: "0 2px 40px rgba(0, 0, 0, 0.05)"
                                    }}
                                    variants={itemVariants}
                                >
                                    {product.name || "Untitled"}
                                </motion.h1>

                                <motion.div variants={itemVariants} className="mt-6 text-sm lg:text-base leading-relaxed max-w-lg opacity-80" style={{ color: colors.text }}>
                                    <p id="scent-story" className="transition-all duration-500 text-left">
                                        {storyExpanded ? storyText : teaser + (isLongStory ? "..." : "")}
                                    </p>

                                    {isLongStory && (
                                        <button
                                            className="group flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-70 active:scale-95"
                                            onClick={() => setStoryExpanded((s) => !s)}
                                            style={{ color: colors.brandDeep }}
                                            aria-expanded={storyExpanded}
                                            aria-controls="scent-story"
                                        >
                                            <span>{storyExpanded ? "Close" : "Discover Story"}</span>
                                            <motion.div 
                                                animate={shouldReduceMotion ? {} : { x: storyExpanded ? 0 : [0, 5, 0] }} 
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                <MoveRight size={14} />
                                            </motion.div>
                                        </button>
                                    )}
                                </motion.div>

                                <motion.div variants={itemVariants} className="mt-10">
                                    <h4 className="text-[10px] lg:text-xs uppercase tracking-widest mb-3 opacity-60 font-bold" style={{ color: colors.brandDeep }}>
                                        Olfactory Profile
                                    </h4>
                                    <div className="flex flex-wrap gap-y-2 gap-x-4">
                                        {allNotes.length > 0 ? (
                                            allNotes.map((note, i) => (
                                                <div key={`${note}-${i}`} className="flex items-center gap-2">
                                                    <span className="text-xs lg:text-sm font-medium tracking-wide" style={{ color: colors.text }}>
                                                        {note}
                                                    </span>
                                                    {i < allNotes.length - 1 && (
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{
                                                                backgroundColor: colors.brandLight,
                                                                opacity: 0.3
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-sm opacity-50 italic">Notes unavailable</span>
                                        )}
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="flex gap-3 mt-10">
                                    {products.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToIndex(i)}
                                            disabled={isTransitioning}
                                            className={`rounded-full transition-all duration-500 ${i === activeIdx ? 'w-8 h-1.5' : 'w-1.5 h-1.5 opacity-30 hover:opacity-60'} disabled:cursor-not-allowed`}
                                            style={{ backgroundColor: i === activeIdx ? colors.brandLight : colors.text }}
                                            aria-label={`Go to product ${i + 1}`}
                                            aria-current={i === activeIdx ? 'true' : 'false'}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT PANEL - Product Image */}
                    <div className="relative w-full h-[450px] md:h-[700px] flex items-center justify-center overflow-visible mt-10 lg:mt-0" style={{ perspective: '1200px' }}>

                        <motion.div
                            className="absolute inset-0 z-0 flex items-center justify-center transition-colors duration-1000"
                            animate={{ background: `radial-gradient(circle at center, ${colors.brandLight} 0%, transparent 70%)` }}
                            style={{ opacity: 0.1 }}
                        />

                        {!shouldReduceMotion && (
                            <div className="absolute inset-0 z-0 flex items-center justify-center">
                                <motion.div
                                    className="w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full border border-dashed"
                                    style={{ borderColor: colors.brandLight, opacity: 0.2 }}
                                    variants={rotateCircle}
                                    animate="animate"
                                />
                                <motion.div
                                    className="absolute w-[240px] h-[240px] md:w-[380px] md:h-[380px] rounded-full border"
                                    style={{ borderColor: colors.brandLight, opacity: 0.1 }}
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        )}

                        <div className="absolute right-0 top-0 bottom-0 z-0 flex items-center justify-end overflow-hidden pointer-events-none opacity-5 select-none">
                            <motion.span
                                key={product.name}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: shouldReduceMotion ? 0.1 : 1 }}
                                className="text-[6rem] leading-none font-bold tracking-widest"
                                style={{ color: colors.brandLight, writingMode: 'vertical-rl' }}
                            >
                                {(product.name || "").split(" ")[0]}
                            </motion.span>
                        </div>

                        <AnimatePresence custom={{ direction, isMobile }} mode="wait">
                            <motion.div
                                key={product.id ?? `product-${activeIdx}`}
                                className="relative z-10 w-64 md:w-80 aspect-[3/4]"
                                variants={imageVariants}
                                custom={{ direction, isMobile }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <div className="relative w-full h-full rounded-t-[100px] rounded-b-[40px] overflow-hidden shadow-2xl transition-all duration-500 bg-white/5 backdrop-blur-sm border border-black/5 group">

                                    {displayImage ? (
                                        <BlurImage
                                            src={displayImage}
                                            alt={product.name || 'Product image'}
                                            priority={activeIdx === 0}
                                            width={320}
                                            height={430}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-7xl font-bold opacity-30">{product.name?.[0] || '?'}</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none" />
                                </div>

                                <div
                                    className="absolute -bottom-8 left-4 right-4 h-6 rounded-[50%] blur-xl opacity-30"
                                    style={{ backgroundColor: "#000" }}
                                />
                            </motion.div>
                        </AnimatePresence>

                        <div className="absolute bottom-4 right-0 left-0 z-20 flex justify-center gap-12">
                            <button 
                                onClick={onPrev} 
                                disabled={isTransitioning}
                                className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:-translate-x-1 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" 
                                style={{ color: colors.text }}
                                aria-label="Previous product"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="w-px h-6 bg-current opacity-20" style={{ color: colors.text }}></div>
                            <button 
                                onClick={onNext} 
                                disabled={isTransitioning}
                                className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:translate-x-1 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" 
                                style={{ color: colors.text }}
                                aria-label="Next product"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {!shouldReduceMotion && (
                            <motion.div
                                className="absolute top-1/4 right-1/4 opacity-80"
                                animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ color: colors.brandLight }}
                            >
                                <Sparkles size={24} strokeWidth={1} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>

            <style>{`
                .touch-pan-y { touch-action: pan-y; }
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </>
    );
}