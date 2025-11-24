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
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageTransition from "./PageTransition";

/* ------------------ THEME (FINAL APPROVED PALETTE) ------------------ */
const theme = {
    colors: {
        // 1. PRIMARY BACKGROUND & TEXT (Configuration for CREAM/LIGHT MODE)
        luxuryDark: "225 15% 11%", // Primary Text Color: Deep Charcoal (#1A1C20)
        cream: "38 43% 96%",       // Primary Background: Creamy Champagne (#FBF6EF)
        
        // 2. SECONDARY COLORS (Using the dark primary color for consistency)
        creamDark: "225 15% 11%",   
        navy: "225 15% 11%", 
        
        // 3. ACCENT: VIBRANT AMBER GOLD PALETTE
        gold: "42 100% 47%",      // Primary Accent: #F0A500 
        goldDark: "34 100% 41%",  // Shadow Base: #CF7500 
        goldLight: "42 84% 66%",  // Calculated Highlight: #F2C45E
    },
};

/* ------------------ DATA (Keep this as is) ------------------ */
const scentDetails = {
    SHADOW: { slogan: "Where silence lingers longer than light.", story: `Crafted for those who speak softly and leave echoes. SHADOW is the fragrance of quiet strength — the scent of velvet evenings, of mysteries half-told. It begins with a crisp, cooling rush of peppermint and lavender, stirring curiosity. As it unfolds, earthy oakmoss and sensual sandalwood emerge, grounding the fragrance in sophistication. A warm finish of amber and musk cloaks the wearer like midnight silk. Best worn in evening hours, when the world slows and presence becomes power.`, notes: ["Peppermint", "Lavender Burst", "Oakmoss", "Geranium", "Sandalwood", "Amber", "Musk Facets"] },
    SUNSET: { slogan: "Where golden light melts into longing.", story: `SUNSET is the perfume of tender transitions — from heat to hush, from glance to embrace. It opens with a vivid burst of saffron and grapefruit, laced with sage and bergamot, evoking the golden glow of dusk. The heart blooms with soft magnolia and jasmine, kissed by a hint of pepper — warm, intimate, alive. As it deepens, a rich foundation of oud and patchouli anchors the scent in sensual memory. Best worn at twilight, when the day exhales and romance begins to stir.`, notes: ["Saffron", "Sage", "Bergamot", "Grapefruit", "Magnolia", "Pepper", "Jasmine", "Oud", "Cedarwood", "Sandalwood", "Patchouli"] },
    VIGOR: { slogan: "Where boldness breaks like sunrise.", story: `VIGOR is a surge of momentum — a scent for those who lead with presence and move with purpose. It opens in a blaze of grapefruit and pepper, charged with the cool clarity of violet leaves. At its core, clary sage and French lavender pulse with herbal strength, while a powerful base of amber wood and tonka grounds the composition in warmth and persistence. Designed for daylight hours, when ambition sharpens and confidence commands the room.`, notes: ["Grapefruit", "Violet Leaves", "Sichuan Pepper", "Clary Sage", "Geranium", "French Lavender", "Amber Wood", "Tonka Bean", "Cristal Moss"] },
    "OUD HORIZON": { slogan: "Where tropics meet twilight — bold, bright, unforgettable.", story: `OUD HORIZON is an exploration in contrast — where sunlit fruits meet deep, grounding woods. It begins with a burst of tropical exuberance: juicy mandarin, pineapple, and papaya, spiced gently by cardamom. A heart of sandalwood and amber follows, warm and magnetic, before settling into a complex tapestry of cedar, musk, and oud — refined, exotic, and lingering. Worn to make an impression, this scent is your signature when you want to arrive without speaking.`, notes: ["Mandarin Orange", "Papaya", "Bergamot", "Pineapple", "Cardamom", "Sandalwood", "Amber", "Musk", "Cedar", "Oakmoss", "Nutmeg", "Violet", "Orris Root", "Jasmine", "Lily-of-the-Valley"] },
};
const NOTE_EMOJI = { PEPPERMINT: "🌿", SAGE: "🌿", "CLARY SAGE": "🌿", "FRENCH LAVENDER": "💜", LAVENDER: "💜", "LAVENDER BURST": "💜", JASMINE: "🌸", MAGNOLIA: "🌼", "LILY-OF-THE-VALLEY": "🌼", VIOLET: "💜", "VIOLET LEAVES": "💜", GERANIUM: "🌺", "ORRIS ROOT": "🌼", BERGAMOT: "🍋", GRAPEFRUIT: "🍊", "MANDARIN ORANGE": "🍊", PINEAPPLE: "🍍", PAPAYA: "🥭", MANGO: "🥭", TANGERINE: "🍊", SAFFRON: "🌾", "SICHUAN PEPPER": "🌶️", PEPPER: "🌶️", CARDAMOM: "🧂", NUTMEG: "🌰", "TONKA BEAN": "🫘", TONKA: "🫘", SANDALWOOD: "🪵", CEDARWOOD: "🌲", OUD: "🪵", "OUD HORIZON": "🪵", OAKMOSS: "🍃", "CRISTAL MOSS": "🍃", AMBER: "🟠", "AMBER WOOD": "🟠", MUSK: "🌫️", "MUSK FACETS": "🌫️", PATCHOULI: "🌿", VANILLA: "🍮", CEDAR: "🌲", DEFAULT: "✨" };
function normalize(str) { return String(str || "").trim().toUpperCase(); }
function getNoteEmoji(note) { if (!note) return NOTE_EMOJI.DEFAULT; const key = note.trim().toUpperCase(); if (NOTE_EMOJI[key]) return NOTE_EMOJI[key]; for (const k of Object.keys(NOTE_EMOJI)) { if (k === "DEFAULT") continue; if (key.includes(k)) return NOTE_EMOJI[k]; } const words = key.split(/\s+/); for (const w of words) { if (NOTE_EMOJI[w]) return NOTE_EMOJI[w]; } return NOTE_EMOJI.DEFAULT; }
// Updated ACCENT_MAP to use a single dynamic accent color based on the theme.colors.gold
const ACCENT_MAP = {
    SHADOW: { primary: "225 15% 11%", accent: "42 100% 47%" }, // Charcoal/Amber
    SUNSET: { primary: "42 100% 47%", accent: "42 84% 66%" }, // Amber/Light Amber
    VIGOR: { primary: "225 15% 11%", accent: "42 100% 47%" }, // Charcoal/Amber
    "OUD HORIZON": { primary: "34 100% 41%", accent: "42 100% 47%" }, // Dark Amber/Amber
    DEFAULT: { primary: "225 15% 11%", accent: "42 100% 47%" }, // Defaulting to Charcoal/Amber
};

/* ------------------ ANIMATION VARIANTS ------------------ */
const wrapperVariants = {
    enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, ease: [0.45, 0, 0.55, 1] } },
    exit: (direction) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0, transition: { duration: 0.5, ease: [0.45, 0, 0.55, 1] } }),
};
const imageVariants = {
    enter: (direction) => ({ opacity: 0, scale: 0.8, rotateY: direction > 0 ? -45 : 45 }),
    center: { opacity: 1, scale: 1, rotateY: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 } },
    exit: (direction) => ({ opacity: 0, scale: 0.8, rotateY: direction > 0 ? 45 : -45, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};
const infoVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.08, delayChildren: 0.2 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ------------------ MAIN COMPONENT ------------------ */
export default function ImmersiveProductShowcase() {
    const { products = [] } = useContext(ProductContext);
    const [activeIdx, setActiveIdx] = useState(0);
    const [direction, setDirection] = useState(0);
    const [storyExpanded, setStoryExpanded] = useState(false);

    const onNext = useCallback(() => {
        setDirection(1);
        setActiveIdx((i) => (products.length ? (i + 1) % products.length : 0));
        setStoryExpanded(false);
    }, [products.length]);

    const onPrev = useCallback(() => {
        setDirection(-1);
        setActiveIdx((i) => (products.length ? (i - 1 + products.length) % products.length : 0));
        setStoryExpanded(false);
    }, [products.length]);

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
        if (!products || products.length === 0) return;
        if (activeIdx >= products.length) setActiveIdx(0);
    }, [products, activeIdx]);

    const product = products[activeIdx] || {};
    const scent = scentDetails[normalize(product.name)];
    
    // Dynamically retrieve accent colors using HSL strings
    const accent = useMemo(() => {
        const key = normalize(product.name);
        // ACCENT_MAP now returns HSL strings
        const map = ACCENT_MAP[key] || ACCENT_MAP.DEFAULT;

        // Convert the HSL string values from ACCENT_MAP into styles using hsl()
        return { 
            primary: `hsl(${map.primary})`,
            accent: `hsl(${map.accent})`, // Used for slogan and specific details
            // We'll use the theme's defined charcoal color for standard dark elements
            textDark: `hsl(${theme.colors.luxuryDark})`,
            background: `hsl(${theme.colors.cream})`
        };
    }, [product]);

    // --- START: LOGIC FOR DYNAMIC FONT SIZE BASED ON TEXT LENGTH (CORRECTED) ---
    const productNameLength = (product.name || "").length;

    const { bgTextSizeClass, bgTextMdSizeClass } = useMemo(() => {
        let baseClass; 
        let mdClass;  

        if (productNameLength > 6) {
            baseClass = "text-[3.1rem]"; 
        } else {
            baseClass = "text-[4.6rem]";
        }

        if (productNameLength > 10) {
            mdClass = "md:text-[8rem]";
        } else if (productNameLength > 7) {
            mdClass = "md:text-[6.5rem]";
        } else {
            mdClass = "md:text-[9rem]";
        }

        return {
            bgTextSizeClass: baseClass, 
            bgTextMdSizeClass: mdClass  
        };
    }, [productNameLength]);
    // --- END: LOGIC FOR DYNAMIC FONT SIZE BASED ON TEXT LENGTH (CORRECTED) ---


    const storyText = (scent && scent.story) || product.description || "";
    const teaser = storyText.slice(0, 150).trim();
    const isLongStory = storyText && storyText.length > 150;

    return (
        <PageTransition>
            <>
                {/* --- TOP HEADER (Styled with Deep Charcoal and Creamy Background) --- */}
                <div 
                    className="text-center px-4 pt-20 md:pt-32"
                >
                    <h2 
                        className="text-5xl md:text-7xl  font-medium tracking-tight"
                        style={{ color: accent.textDark }}
                    >
                        Explore Our Scents
                    </h2>
                    <p 
                        className="mt-4 max-w-2xl mx-auto text-base sm:text-lg"
                        style={{ color: accent.textDark, opacity: 0.7 }}
                    >
                        An immersive journey into our signature fragrances.
                    </p>
                </div>
                
                {/* --- MAIN SHOWCASE SECTION (Uses Creamy Champagne Background) --- */}
                <section 
                    className="relative w-full py-16 md:py-24 min-h-screen flex flex-col items-center justify-center overflow-hidden rounded-md font-sans transition-colors duration-700"
                >
                    <div
                        className="relative w-full max-w-7xl h-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16 md:gap-22 px-6"
                        {...swipeHandlers}
                    >
                        {/* --- LEFT / INFO PANEL --- */}
                        <motion.div
                            key={activeIdx}
                            className="w-full h-full flex flex-col justify-center text-center lg:text-left relative z-10 p-4 lg:p-0"
                            variants={infoVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            {/* H1 for Product Name (Uses Dynamic Accent Color) */}
                            <div className="relative">
                                <motion.h1
                                    className="text-5xl md:text-7xl font-serif font-medium tracking-tight uppercase"
                                    style={{ color: accent.primary }}
                                    variants={itemVariants}
                                >
                                    {product.name || "Untitled Scent"}
                                </motion.h1>
                            </div>

                            {/* Slogan (Uses Lighter Dynamic Accent Color) */}
                            <motion.p 
                                variants={itemVariants} 
                                className="font-serif text-xl italic mb-6" 
                                style={{ color: accent.primary }}
                            >
                                {scent?.slogan || "An unforgettable essence"}
                            </motion.p>

                            {/* Story/Description */}
                            <motion.div variants={itemVariants} className="mt-4 text-base max-w-lg mx-auto lg:mx-0">
                                <p 
                                    id="scent-story" 
                                    className="transition-all duration-500"
                                    style={{ color: accent.textDark }}
                                >
                                    {storyExpanded ? storyText : teaser + (isLongStory ? "…" : "")}
                                </p>
                                {isLongStory && (
                                    <button
                                        className="inline-block mt-3 text-sm font-bold tracking-wide transition hover:opacity-70 border-b border-dashed"
                                        onClick={() => setStoryExpanded((s) => !s)}
                                        style={{ color: accent.primary, borderColor: accent.primary }}
                                        aria-controls="scent-story"
                                    >
                                        {storyExpanded ? "SHOW LESS" : "READ MORE"}
                                    </button>
                                )}
                            </motion.div>

                            {/* Notes/Accords */}
                            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-x-6 gap-y-3 mt-10 max-w-sm mx-auto lg:mx-0">
                                {(scent?.notes || []).slice(0, 6).map((note, i) => (
                                    <motion.div
                                        key={note + i}
                                        // Using theme colors directly
                                        className="flex items-center gap-3 p-2 rounded-lg text-white"
                                        style={{ backgroundColor: accent.textDark, opacity: 0.05 }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                                    >
                                        <span className="text-xl" >{getNoteEmoji(note)}</span>
                                        <span className="text-sm" >{note}</span>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination Dots */}
                            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start gap-3 mt-12">
                                {products.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToIndex(i)}
                                        // Light/Gray unselected dots
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i === activeIdx ? 'scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                                        style={i === activeIdx ? { backgroundColor: accent.primary } : {}}
                                        aria-label={`Go to product ${i + 1}`}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* --- RIGHT / IMAGE CAROUSEL --- */}
                        <div className="relative w-full h-[450px] md:h-[600px] flex items-center justify-center perspective-1200">

                            {/* Background Text H1 (Dynamically Sized) */}
                            <AnimatePresence>
                                <motion.div
                                    key={`${activeIdx}-bg-text`}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    initial={{ opacity: 0, scale: 1.2 }}
                                    whileInView={{ opacity: 0.1, scale: 1 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <h1
                                        // Uses Serif Font and Dynamic Size/Color
                                        className={` uppercase text-center leading-none ${bgTextSizeClass} ${bgTextMdSizeClass}`}
                                        style={{
                                            // Using the primary accent color with heavy transparency
                                            color: `${accent.primary}20`,
                                        }}
                                    >
                                        {(product.name || "").slice(0,)}
                                    </h1>
                                </motion.div>
                            </AnimatePresence>

                            {/* Product Image Motion Div */}
                            <AnimatePresence custom={direction} mode="wait">
                                <motion.div
                                    key={product.id ?? product.name ?? activeIdx}
                                    // Added border for definition on light background
                                    className="absolute w-64 h-96 md:w-80 md:h-[480px] rounded-2xl shadow-2xl shadow-gray-400/50 overflow-hidden transform-style-3d border"
                                    style={{ borderColor: accent.textDark, opacity: 0.1 }}
                                    variants={imageVariants}
                                    custom={direction}
                                    initial="enter"
                                    whileInView="center"
                                    viewport={{ once: true, amount: 0.2 }}
                                    exit="exit"
                                >
                                    <div
                                        className="w-full h-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${product.imageurl?.[0]})` }}
                                    />
                                    {!product.imageurl && (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-7xl font-bold" style={{ color: accent.primary }}>
                                                {(product.name || "P").slice(0, 1)}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="absolute inset-0 z-20 flex justify-between items-center pointer-events-none px-4 md:px-0">
                                <motion.button
                                    onClick={onPrev}
                                    // Light, slightly transparent buttons with accent icon
                                    className="pointer-events-auto w-12 h-12 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ backgroundColor: accent.background, opacity: 0.8 }}
                                    aria-label="Previous product"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <ChevronLeft size={24} style={{ color: accent.primary }} />
                                </motion.button>
                                <motion.button
                                    onClick={onNext}
                                    // Light, slightly transparent buttons with accent icon
                                    className="pointer-events-auto w-12 h-12 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ backgroundColor: accent.background, opacity: 0.8 }}
                                    aria-label="Next product"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <ChevronRight size={24} style={{ color: accent.primary }} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </section>
            </>
        </PageTransition>
    );
}