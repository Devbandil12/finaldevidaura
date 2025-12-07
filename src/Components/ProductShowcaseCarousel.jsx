import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { ProductContext } from "../contexts/productContext";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, MoveRight } from "lucide-react";
import PageTransition from "./PageTransition";

/* ------------------ THEME & UTILS ------------------ */
const baseTheme = {
    colors: {
        luxuryDark: "225 15% 11%", // #181A21
        cream: "38 43% 96%",       // #FAF8F5
        
        // ✨ REAL SHINING DARK GOLD PALETTE
        // Rich Metallic Gold (for accents/glows) - darker and more saturated
        goldMetallic: "45 90% 45%", 
        // Deep Bronze (for high-contrast text)
        goldDeep: "38 85% 25%",    
    },
};

/* ------------------ ANIMATION VARIANTS (OPTIMIZED) ------------------ */
// Added 'willChange' hint to variants for smoother mobile performance
const infoVariants = {
    hidden: { opacity: 0, willChange: "opacity" },
    visible: { 
        opacity: 1, 
        transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1, delayChildren: 0.2 } 
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20, willChange: "transform, opacity" },
    visible: { 
        opacity: 1, 
        x: 0, 
        transition: { duration: 0.6, ease: "easeOut" } 
    },
};

const luxuryImageVariants = {
    enter: (direction) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? -15 : 15,
        willChange: "transform, opacity", // ⚡ Performance Boost
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        rotateY: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
        willChange: "transform, opacity", // ⚡ Performance Boost
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 100 : -100,
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? 15 : -15,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        willChange: "transform, opacity", // ⚡ Performance Boost
    }),
};

const rotateCircle = {
    animate: {
        rotate: 360,
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
    }
};

/* ------------------ MAIN COMPONENT ------------------ */
export default function ImmersiveProductShowcase() {
    const { products = [] } = useContext(ProductContext);
    const [activeIdx, setActiveIdx] = useState(0);
    const [direction, setDirection] = useState(0);
    const [storyExpanded, setStoryExpanded] = useState(false);

    // Filter valid products
    const visibleProducts = useMemo(() => {
        return products.filter(p => p.category !== "Template" && !p.isArchived);
    }, [products]);

    // --- Handlers ---
    const onNext = useCallback(() => {
        setDirection(1);
        setActiveIdx((i) => (visibleProducts.length ? (i + 1) % visibleProducts.length : 0));
        setStoryExpanded(false);
    }, [visibleProducts.length]);

    const onPrev = useCallback(() => {
        setDirection(-1);
        setActiveIdx((i) => (visibleProducts.length ? (i - 1 + visibleProducts.length) % visibleProducts.length : 0));
        setStoryExpanded(false);
    }, [visibleProducts.length]);

    const goToIndex = (i) => {
        setDirection(i > activeIdx ? 1 : -1);
        setActiveIdx(i);
        setStoryExpanded(false);
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => onNext(),
        onSwipedRight: () => onPrev(),
        trackMouse: true,
    });

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "ArrowRight") onNext();
            if (e.key === "ArrowLeft") onPrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onNext, onPrev]);

    // Safety check for index
    useEffect(() => {
        if (!visibleProducts || visibleProducts.length === 0) return;
        if (activeIdx >= visibleProducts.length) setActiveIdx(0);
    }, [visibleProducts, activeIdx]);

    // --- Data Preparation ---
    const product = visibleProducts[activeIdx] || {};
    
    // Fixed Golden Theme
    const colors = {
        bg: `hsl(${baseTheme.colors.cream})`,
        text: `hsl(${baseTheme.colors.luxuryDark})`,
        brandLight: `hsl(${baseTheme.colors.goldMetallic})`, // Rich Shining Gold
        brandDeep: `hsl(${baseTheme.colors.goldDeep})`,      // Dark Bronze Text
    };

    // Story Logic
    const storyText = product.description || "";
    const teaser = storyText.slice(0, 150).trim();
    const isLongStory = storyText && storyText.length > 150;

    // Notes Logic
    const allNotes = useMemo(() => {
        const parseNotes = (source) => {
            if (!source) return [];
            if (Array.isArray(source)) return source;
            return source.split(',').map(n => n.trim());
        };
        const top = parseNotes(product.composition);
        const heart = parseNotes(product.fragrance);
        const base = parseNotes(product.fragranceNotes);
        return [...top, ...heart, ...base];
    }, [product]);

    if (visibleProducts.length === 0 && products.length > 0) return null;

    return (
        <PageTransition>
            <>
                {/* --- HEADER --- */}
                <div className="text-center px-4 pt-20 md:pt-32">
                    <h2 className="text-5xl md:text-7xl font-medium tracking-tight" style={{ color: colors.text }}>
                        Explore Our Scents
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg opacity-70" style={{ color: colors.text }}>
                        An immersive journey into our signature fragrances.
                    </p>
                </div>
                
                {/* --- MAIN SHOWCASE --- */}
                <section className="relative w-full py-16 md:py-24 min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
                    <div className="relative w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16 md:gap-22 px-6" {...swipeHandlers}>
                        
                        {/* --- LEFT PANEL --- */}
                        <motion.div
                            key={activeIdx}
                            className="w-full h-full flex flex-col justify-center text-left items-start relative z-10 p-2 lg:p-0"
                            variants={infoVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <div className="relative w-full flex flex-col items-start justify-center">
                                
                                {/* Vertical Line Accent */}
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: "100%" }} 
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="absolute left-0 top-0 bottom-0 w-[4px] lg:w-1.5 opacity-100 rounded-full"
                                    style={{ 
                                        backgroundColor: colors.brandLight,
                                        boxShadow: `0 0 15px ${colors.brandLight}` // Glowing Gold Effect
                                    }}
                                />
                                
                                <div className="pl-6 lg:pl-8 w-full">
                                    {/* 1. Brand/Number Eyebrow */}
                                    <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4 lg:mb-6">
                                        <span className="text-xs lg:text-sm font-bold tracking-[0.2em] opacity-80" style={{ color: colors.brandDeep }}>
                                            N° 0{activeIdx + 1} — COLLECTION
                                        </span>
                                    </motion.div>

                                    {/* 2. Main Title */}
                                    <motion.h1 
                                        className="text-5xl md:text-8xl font-serif font-medium tracking-tight uppercase leading-none" 
                                        style={{ 
                                            color: colors.text,
                                            // Subtle text shadow for "shining" feel on title
                                            textShadow: "0 2px 40px rgba(218, 165, 32, 0.1)"
                                        }} 
                                        variants={itemVariants}
                                    >
                                        {product.name || "Untitled"}
                                    </motion.h1>
                                    
                                    {/* 3. Description / Story */}
                                    <motion.div variants={itemVariants} className="mt-6 text-sm lg:text-base leading-relaxed max-w-lg opacity-80" style={{ color: colors.text }}>
                                        <p id="scent-story" className="transition-all duration-500 text-left">
                                            {storyExpanded ? storyText : teaser + (isLongStory ? "..." : "")}
                                        </p>
                                        
                                        {isLongStory && (
                                            <button
                                                className="group flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-70"
                                                onClick={() => setStoryExpanded((s) => !s)}
                                                style={{ color: colors.brandDeep }}
                                            >
                                                <span>{storyExpanded ? "Close" : "Discover Story"}</span>
                                                <motion.div animate={{ x: storyExpanded ? 0 : [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                                    <MoveRight size={14} />
                                                </motion.div>
                                            </button>
                                        )}
                                    </motion.div>

                                    {/* 4. Combined Notes Section */}
                                    <motion.div variants={itemVariants} className="mt-10">
                                        <h4 className="text-[10px] lg:text-xs uppercase tracking-widest mb-3 opacity-60 font-bold" style={{ color: colors.brandDeep }}>
                                            Olfactory Profile
                                        </h4>
                                        <div className="flex flex-wrap gap-y-2 gap-x-4">
                                            {allNotes.length > 0 ? (
                                                allNotes.map((note, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="text-xs lg:text-sm font-medium tracking-wide" style={{ color: colors.text }}>
                                                            {note}
                                                        </span>
                                                        {i < allNotes.length - 1 && (
                                                            <span 
                                                                className="w-1.5 h-1.5 rounded-full" 
                                                                style={{ 
                                                                    backgroundColor: colors.brandLight,
                                                                    boxShadow: `0 0 5px ${colors.brandLight}` 
                                                                }} 
                                                            />
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-sm opacity-50 italic">Notes loading...</span>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* 5. Pagination Dots */}
                                    <motion.div variants={itemVariants} className="flex gap-3 mt-10">
                                        {visibleProducts.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => goToIndex(i)}
                                                className={`rounded-full transition-all duration-500 ${i === activeIdx ? 'w-8 h-1.5' : 'w-1.5 h-1.5 opacity-30 hover:opacity-60'}`}
                                                style={{ backgroundColor: i === activeIdx ? colors.brandLight : colors.text }}
                                                aria-label={`Go to product ${i + 1}`}
                                            />
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>

                        {/* --- RIGHT PANEL --- */}
                        <div className="relative w-full h-[450px] md:h-[700px] flex items-center justify-center perspective-1200 overflow-visible mt-10 lg:mt-0">
                            
                            {/* Ambient Glow (Dark Gold) */}
                            <motion.div 
                                className="absolute inset-0 z-0 flex items-center justify-center transition-colors duration-1000"
                                animate={{ background: `radial-gradient(circle at center, ${colors.brandLight} 0%, transparent 70%)` }}
                                style={{ opacity: 0.25 }} // Reduced opacity for "dark" feel
                            />
                            
                            {/* Rotating Circles */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center">
                                <motion.div 
                                    className="w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full border border-dashed"
                                    style={{ borderColor: colors.brandLight, opacity: 0.4 }}
                                    variants={rotateCircle}
                                    animate="animate"
                                />
                                <motion.div 
                                    className="absolute w-[240px] h-[240px] md:w-[380px] md:h-[380px] rounded-full border"
                                    style={{ borderColor: colors.brandLight, opacity: 0.2 }}
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                />
                            </div>

                            {/* Background Text */}
                            <div className="absolute right-0 top-0 bottom-0 z-0 flex items-center justify-end overflow-hidden pointer-events-none opacity-10 select-none">
                                <motion.span 
                                    key={product.name}
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1 }}
                                    className="text-[6rem] leading-none font-bold tracking-widest writing-vertical-rl"
                                    style={{ color: colors.brandLight, writingMode: 'vertical-rl' }}
                                >
                                    {(product.name || "").split(" ")[0]}
                                </motion.span>
                            </div>

                            {/* Main Product Image Container */}
                            <AnimatePresence custom={direction} mode="wait">
                                <motion.div
                                    key={product.id ?? activeIdx}
                                    className="relative z-10 w-64 md:w-80 aspect-[3/4]"
                                    variants={luxuryImageVariants}
                                    custom={direction}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    // ⚡ PERFORMANCE: Promote to layer
                                    style={{ willChange: "transform, opacity" }}
                                >
                                    <div className="relative w-full h-full rounded-t-[100px] rounded-b-[40px] overflow-hidden shadow-2xl transition-all duration-500 bg-white/5 backdrop-blur-sm border border-white/20 group">
                                        
                                        {/* ⚡ OPTIMIZED IMAGE: Using <img> instead of background-image for better browser loading control */}
                                        {product.imageurl?.[0] ? (
                                            <img 
                                                src={product.imageurl[0]} 
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                loading="eager" // Load current image immediately
                                                decoding="async" // Decode off main thread
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-7xl font-bold opacity-30">{product.name?.[0]}</span>
                                            </div>
                                        )}
                                        
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                                    </div>
                                    
                                    {/* Bottom Shadow Glow */}
                                    <div 
                                        className="absolute -bottom-8 left-4 right-4 h-6 rounded-[50%] blur-xl opacity-50" 
                                        style={{ backgroundColor: colors.brandLight }} 
                                    />
                                </motion.div>
                            </AnimatePresence>
                            
                            <div className="absolute bottom-4 right-0 left-0 z-20 flex justify-center gap-12">
                                <button onClick={onPrev} className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:-translate-x-1" style={{ color: colors.text }}>
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="w-px h-6 bg-current opacity-20" style={{ color: colors.text }}></div>
                                <button onClick={onNext} className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:translate-x-1" style={{ color: colors.text }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            
                            <motion.div 
                                className="absolute top-1/4 right-1/4 opacity-80"
                                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ color: colors.brandLight }}
                            >
                                <Sparkles size={24} strokeWidth={1} />
                            </motion.div>
                        </div>

                    </div>
                </section>
            </>
        </PageTransition>
    );
}