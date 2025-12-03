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

/* ------------------ THEME ------------------ */
const theme = {
    colors: {
        luxuryDark: "225 15% 11%",
        cream: "38 43% 96%",
        creamDark: "225 15% 11%",
        navy: "225 15% 11%",
        gold: "42 100% 47%",
        goldDark: "34 100% 41%",
        goldLight: "42 84% 66%",
    },
};

/* ------------------ DATA ------------------ */
const scentDetails = {
    SHADOW: { slogan: "Where silence lingers longer than light.", story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told. It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk. Best worn in evening hours, when the world slows and presence becomes power.`, notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"] },
    SUNSET: { slogan: "Where golden light melts into longing.", story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk. The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory. Best worn at twilight, when the day exhales and romance begins to stir.`, notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Sandalwood", "Patchouli"] },
    VIGOR: { slogan: "Where boldness breaks like sunrise.", story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves. At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence. Designed for daylight hours, when ambition sharpens and confidence commands the room.`, notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"] },
    "OUD HORIZON": { slogan: "Where tropics meet twilight — bold, bright, unforgettable.", story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom. A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering. Worn to make an impression, this scent is your signature when you want to arrive without speaking.`, notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss", "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"] },
};

function normalize(str) { return String(str || "").trim().toUpperCase(); }

const ACCENT_MAP = {
    SHADOW: { primary: "225 15% 11%", accent: "42 100% 47%" },
    SUNSET: { primary: "42 100% 47%", accent: "42 84% 66%" },
    VIGOR: { primary: "225 15% 11%", accent: "42 100% 47%" },
    "OUD HORIZON": { primary: "34 100% 41%", accent: "42 100% 47%" },
    DEFAULT: { primary: "225 15% 11%", accent: "42 100% 47%" },
};

/* ------------------ ANIMATION VARIANTS ------------------ */
const infoVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const luxuryImageVariants = {
    enter: (direction) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? -15 : 15,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        rotateY: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 100 : -100,
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? 15 : -15,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
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

    const visibleProducts = useMemo(() => {
        return products.filter(p => p.category !== "Template");
    }, [products]);

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

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "ArrowRight") onNext();
            if (e.key === "ArrowLeft") onPrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onNext, onPrev]);

    useEffect(() => {
        if (!visibleProducts || visibleProducts.length === 0) return;
        if (activeIdx >= visibleProducts.length) setActiveIdx(0);
    }, [visibleProducts, activeIdx]);

    const product = visibleProducts[activeIdx] || {};
    const scent = scentDetails[normalize(product.name)];
    
    const accent = useMemo(() => {
        const key = normalize(product.name);
        const map = ACCENT_MAP[key] || ACCENT_MAP.DEFAULT;
        return { 
            primary: `hsl(${map.primary})`,
            accent: `hsl(${map.accent})`,
            textDark: `hsl(${theme.colors.luxuryDark})`,
            background: `hsl(${theme.colors.cream})`
        };
    }, [product]);

    const storyText = (scent && scent.story) || product.description || "";
    const teaser = storyText.slice(0, 150).trim();
    const isLongStory = storyText && storyText.length > 150;

    if (visibleProducts.length === 0 && products.length > 0) return null;

    return (
        <PageTransition>
            <>
                {/* --- HEADER --- */}
                <div className="text-center px-4 pt-20 md:pt-32">
                    <h2 className="text-5xl md:text-7xl font-medium tracking-tight" style={{ color: accent.textDark }}>
                        Explore Our Scents
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg" style={{ color: accent.textDark, opacity: 0.7 }}>
                        An immersive journey into our signature fragrances.
                    </p>
                </div>
                
                {/* --- MAIN SHOWCASE --- */}
                <section className="relative w-full py-16 md:py-24 min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
                    <div className="relative w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16 md:gap-22 px-6" {...swipeHandlers}>
                        
                        {/* --- LEFT PANEL (FIXED FOR MOBILE) --- */}
                        <motion.div
                            key={activeIdx}
                            // CHANGE 1: Removed 'text-center' and forced 'text-left' on mobile. Added 'items-start' to align content.
                            className="w-full h-full flex flex-col justify-center text-left items-start relative z-10 p-2 lg:p-0"
                            variants={infoVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            {/* CHANGE 2: Content Container with Vertical Line and Left Padding */}
                            <div className="relative w-full flex flex-col items-start justify-center">
                                
                                {/* The Vertical Line Accent (Now Visible on Mobile) */}
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: "100%" }} 
                                    transition={{ duration: 1, delay: 0.2 }}
                                    // CHANGE 3: Changed 'hidden lg:block' to 'block' so line appears on mobile. 
                                    // Adjusted width for mobile elegance.
                                    className="absolute left-0 top-0 bottom-0 w-[2px] lg:w-1 bg-current opacity-80"
                                    style={{ backgroundColor: accent.primary }}
                                />
                                
                                {/* Content Wrapper (Padding Left ensures text doesn't hit the line) */}
                                <div className="pl-6 lg:pl-8 w-full">

                                    {/* 1. Brand/Number Eyebrow */}
                                    <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4 lg:mb-6">
                                        <span className="text-xs lg:text-sm font-bold tracking-[0.2em] opacity-50" style={{ color: accent.textDark }}>
                                            N° 0{activeIdx + 1} — COLLECTION
                                        </span>
                                    </motion.div>

                                    {/* 2. Main Title */}
                                    <motion.h1 
                                        className="text-5xl md:text-8xl font-serif font-medium tracking-tight uppercase leading-none" 
                                        style={{ color: accent.textDark }} 
                                        variants={itemVariants}
                                    >
                                        {product.name || "Untitled"}
                                    </motion.h1>
                                    
                                    <motion.p 
                                        variants={itemVariants} 
                                        className="font-serif text-xl lg:text-2xl italic mt-3 lg:mt-4 opacity-80" 
                                        style={{ color: accent.primary }}
                                    >
                                        {scent?.slogan || "An unforgettable essence"}
                                    </motion.p>

                                    {/* 3. Description / Story */}
                                    <motion.div variants={itemVariants} className="mt-8 text-sm lg:text-base leading-relaxed max-w-lg opacity-80" style={{ color: accent.textDark }}>
                                        {/* CHANGE 4: Removed text-justify on mobile for cleaner rag, easier reading */}
                                        <p id="scent-story" className="transition-all duration-500 text-left">
                                            {storyExpanded ? storyText : teaser + (isLongStory ? "..." : "")}
                                        </p>
                                        
                                        {isLongStory && (
                                            <button
                                                className="group flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-70"
                                                onClick={() => setStoryExpanded((s) => !s)}
                                                style={{ color: accent.primary }}
                                            >
                                                <span>{storyExpanded ? "Close" : "Discover Story"}</span>
                                                <motion.div animate={{ x: storyExpanded ? 0 : [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                                    <MoveRight size={14} />
                                                </motion.div>
                                            </button>
                                        )}
                                    </motion.div>

                                    {/* 4. Refined Notes Section */}
                                    <motion.div variants={itemVariants} className="mt-10">
                                        <h4 className="text-[10px] lg:text-xs uppercase tracking-widest mb-3 opacity-50 font-bold" style={{ color: accent.textDark }}>
                                            Olfactory Profile
                                        </h4>
                                        <div className="flex flex-wrap gap-y-2 gap-x-4">
                                            {(scent?.notes || []).slice(0, 5).map((note, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="text-xs lg:text-sm font-medium tracking-wide" style={{ color: accent.textDark }}>
                                                        {note}
                                                    </span>
                                                    {i < 4 && (
                                                        <span className="w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: accent.textDark }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* 5. Pagination Dots */}
                                    <motion.div variants={itemVariants} className="flex gap-3 mt-10">
                                        {visibleProducts.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => goToIndex(i)}
                                                className={`rounded-full transition-all duration-500 ${i === activeIdx ? 'w-8 h-1.5' : 'w-1.5 h-1.5 opacity-30 hover:opacity-60'}`}
                                                style={{ backgroundColor: i === activeIdx ? accent.primary : accent.textDark }}
                                            />
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>

                        {/* --- RIGHT PANEL (UNCHANGED) --- */}
                        <div className="relative w-full h-[450px] md:h-[700px] flex items-center justify-center perspective-1200 overflow-visible mt-10 lg:mt-0">
                            <motion.div 
                                className="absolute inset-0 z-0 flex items-center justify-center opacity-50 transition-colors duration-1000"
                                animate={{ background: `radial-gradient(circle at center, ${accent.accent}40 0%, transparent 70%)` }}
                            />
                            <div className="absolute inset-0 z-0 flex items-center justify-center">
                                <motion.div 
                                    className="w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full border border-dashed opacity-30"
                                    style={{ borderColor: accent.primary }}
                                    variants={rotateCircle}
                                    animate="animate"
                                />
                                <motion.div 
                                    className="absolute w-[240px] h-[240px] md:w-[380px] md:h-[380px] rounded-full border opacity-20"
                                    style={{ borderColor: accent.primary }}
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 z-0 flex items-center justify-end overflow-hidden pointer-events-none opacity-10 select-none">
                                <motion.span 
                                    key={product.name}
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1 }}
                                    className="text-[6rem] leading-none font-bold tracking-widest writing-vertical-rl"
                                    style={{ color: accent.primary, writingMode: 'vertical-rl' }}
                                >
                                    {(product.name || "").split(" ")[0]}
                                </motion.span>
                            </div>
                            <AnimatePresence custom={direction} mode="wait">
                                <motion.div
                                    key={product.id ?? activeIdx}
                                    className="relative z-10 w-64 md:w-80 aspect-[3/4]"
                                    variants={luxuryImageVariants}
                                    custom={direction}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    <div className="relative w-full h-full rounded-t-[100px] rounded-b-[40px] overflow-hidden shadow-2xl transition-all duration-500 bg-white/5 backdrop-blur-sm border border-white/20 group">
                                        <div className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" style={{ backgroundImage: `url(${product.imageurl?.[0]})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 pointer-events-none" />
                                        {!product.imageurl && (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-7xl font-bold opacity-30">{product.name?.[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-8 left-4 right-4 h-6 rounded-[50%] blur-xl opacity-40" style={{ backgroundColor: accent.primary }} />
                                </motion.div>
                            </AnimatePresence>
                            <div className="absolute bottom-4 right-0 left-0 z-20 flex justify-center gap-12">
                                <button onClick={onPrev} className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:-translate-x-1" style={{ color: accent.textDark }}>
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="w-px h-6 bg-current opacity-20" style={{ color: accent.textDark }}></div>
                                <button onClick={onNext} className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-all hover:translate-x-1" style={{ color: accent.textDark }}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <motion.div 
                                className="absolute top-1/4 right-1/4 text-yellow-500 opacity-60"
                                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
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