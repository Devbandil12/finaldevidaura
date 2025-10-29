import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import bottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892-removebg-preview (1).png";
import { useNavigate } from "react-router-dom";

// Design system values moved from index.css into a theme object
const theme = {
    colors: {
        cream: '45 25% 97%',
        creamDark: '45 20% 92%',
        luxuryDark: '240 20% 15%',
        gold: '38 92% 50%',
        goldLight: '45 100% 65%',
        rose: '340 82% 52%',
        navy: '240 40% 25%',
    },
    shadows: {
        button: '0 10px 40px rgba(212,175,55,0.4)', // Corresponds to gold with alpha
    },
};

// Keyframe animations to be injected via a <style> tag
const keyframes = `
  @keyframes shimmer {
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .6; transform: scale(.85); }
  }
`;

const HeroSection = () => {

    const navigate = useNavigate();

    const scrollOrNavigate = (sectionId) => {
        if (window.location.pathname !== "/") {
            sessionStorage.setItem("scrollToSection", sectionId);
            navigate("/");
        } else {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }
        }
    };


    const bottleRef = useRef(null);
    const circleRefs = useRef([]);

    // Generate circle properties only once
    const circles = useMemo(() =>
        [...Array(8)].map((_, i) => ({
            id: `circle-${i}`,
            width: `${150 + i * 50}px`,
            height: `${150 + i * 50}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            borderColor: i % 3 === 0
                ? `hsla(${theme.colors.gold}, 0.2)`
                : i % 3 === 1
                    ? `hsla(${theme.colors.rose}, 0.15)`
                    : 'rgba(240,240,240,0.3)',
        })),
        []);

    useEffect(() => {
        // GSAP animations (unchanged)
        if (bottleRef.current) {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(bottleRef.current, { y: -30, rotation: 3, duration: 4, ease: "sine.inOut" })
                .to(bottleRef.current, { y: 0, rotation: -2, duration: 4, ease: "sine.inOut" });
        }

        circleRefs.current.forEach((circle, i) => {
            if (circle) {
                gsap.to(circle, {
                    y: `${Math.sin(i) * 50}`, x: `${Math.cos(i) * 30}`, rotation: 360,
                    duration: 8 + i * 2, ease: "none", repeat: -1,
                });
            }
        });

        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const xPercent = (clientX / innerWidth - 0.5);
            const yPercent = (clientY / innerHeight - 0.5);

            if (bottleRef.current) {
                gsap.to(bottleRef.current, {
                    x: xPercent * 40, y: yPercent * 40, rotationY: xPercent * 15,
                    rotationX: -yPercent * 15, duration: 0.8, ease: "power2.out",
                });
            }
            circleRefs.current.forEach((circle, i) => {
                if (circle) {
                    const speed = (i + 1) * 0.5;
                    gsap.to(circle, {
                        x: xPercent * 20 * speed, y: yPercent * 20 * speed,
                        duration: 1, ease: "power2.out",
                    });
                }
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const onlyFeltStyles = {
        backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}), hsl(${theme.colors.goldLight}))`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
    };

    const leavesStyles = {
        backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}))`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
    };

    return (
        <div>
            <style>{keyframes}</style>
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="relative z-10 container mx-auto px-6 lg:px-20 py-16">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left content (unchanged) */}
                        <motion.div
                            initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: "easeOut" }}
                            className="relative text-center lg:text-left space-y-10"
                        >
                            <motion.div className="absolute -left-10 top-0 w-64 h-64 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }} />
                            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
                                    className="inline-flex items-center gap-2 px-4  rounded-full"
                                    style={{
                                        background: `linear-gradient(to right, hsla(${theme.colors.gold}, 0.2), hsla(${theme.colors.rose}, 0.2))`,
                                        backdropFilter: 'blur(4px)', border: `1px solid hsla(${theme.colors.gold}, 0.3)`,
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.gold})`, animation: 'pulse 2s cubic-bezier(.4, 0, .6, 1) infinite' }} />
                                    <span className="text-sm font-semibold tracking-wider" style={{ color: `hsl(${theme.colors.luxuryDark})` }}>EXCLUSIVE COLLECTION</span>
                                </motion.div>
                                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-tight">
                                    <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="block" style={{ color: `hsl(${theme.colors.luxuryDark})` }}>Not seen,</motion.span>
                                    <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="block" style={{ color: `hsl(${theme.colors.luxuryDark})` }}>not heard </motion.span>
                                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="relative block">
                                        <span className="relative z-10" style={onlyFeltStyles}>only felt</span>
                                        <motion.span className="absolute inset-0 blur-2xl" style={{ backgroundColor: `hsla(${theme.colors.gold}, 0.3)` }} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
                                    </motion.span>
                                </h1>
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="space-y-2">
                                <p className="text-xl sm:text-2xl font-serif italic" style={{ color: `hsl(${theme.colors.navy})` }}>
                                    In every breath he <span className="font-bold not-italic" style={leavesStyles}>leaves</span> behind.
                                </p>
                                <p className="text-lg font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: `hsla(${theme.colors.navy}, 0.7)` }}>
                                    Fragrances that whisper stories — crafted from the rarest essences and wrapped in glass like a secret.                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                            >
                                {/* Explore Collection → Products */}
                                <button
                                    onClick={() => scrollOrNavigate("collection-section")}
                                    className="group relative overflow-hidden text-white font-normal text-lg rounded-full transition-all duration-500"
                                    style={{
                                        padding: "1rem 2.5rem",
                                        backgroundImage: `linear-gradient(to right, hsl(${theme.colors.gold}), hsl(${theme.colors.goldLight}), hsl(${theme.colors.gold}))`,
                                    }}
                                >
                                    <motion.span
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, hsl(${theme.colors.rose}), hsl(${theme.colors.gold}))`,
                                        }}
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: "0%" }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    <span className="relative z-10 flex items-center gap-2">
                                        Explore Collection
                                        <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                            →
                                        </motion.span>
                                    </span>
                                </button>

                                {/* Our Scents → Carousel */}
                                <button
                                    onClick={() => scrollOrNavigate("scents-section")}
                                    className="group relative overflow-hidden backdrop-blur-sm font-normal text-lg rounded-full transition-all duration-300"
                                    style={{
                                        padding: "1rem 2.5rem",
                                        backgroundColor: "hsla(0, 0%, 100%, 0.8)",
                                        border: `2px solid hsl(${theme.colors.gold})`,
                                        color: `hsl(${theme.colors.luxuryDark})`,
                                    }}
                                >
                                    <span className="relative z-10">Our Scents</span>
                                </button>
                            </motion.div>

                        </motion.div>

                        {/* Right - Bottle showcase */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 100 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1, delay: 0.5 }}
                            className="relative flex justify-center items-center"
                        >
                            {/* The background gradient motion.div that was here has been REMOVED */}

                            <motion.div
                                className="relative p-12 sm:p-16"

                                whileHover={{ scale: 1.02, rotateY: 5 }}
                                transition={{ duration: 0.4 }}
                            >
                                <motion.div className="absolute inset-0" style={{ borderRadius: '3rem', background: `linear-gradient(to bottom right, hsla(${theme.colors.gold}, 0.2), transparent, hsla(${theme.colors.rose}, 0.2))` }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
                                <div ref={bottleRef} className="relative z-10" style={{ transformStyle: "preserve-3d" }}>
                                    <img src={bottleImage} alt="Luxury Perfume Bottle" className="w-72 sm:w-96 lg:w-[28rem] h-auto object-contain" style={{ filter: 'drop-shadow(0 30px 60px rgba(212,175,55,0.4))' }} />
                                    <div className="absolute inset-0 rounded-lg opacity-50" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.4), transparent)', transform: "translateZ(-10px)" }} />
                                </div>
                            </motion.div>

                            <motion.div className="absolute top-10 -left-10 px-6 py-3 rounded-full shadow-lg" style={{ backgroundColor: 'hsla(0, 0%, 100%, 0.9)', backdropFilter: 'blur(4px)', border: `1px solid hsla(${theme.colors.gold}, 0.3)` }} animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                <span className="text-sm font-semibold" style={{ color: `hsl(${theme.colors.luxuryDark})` }}>100% Natural</span>
                            </motion.div>
                            <motion.div className="absolute bottom-20 -right-10 px-6 py-3 rounded-full shadow-lg" style={{ backgroundColor: 'hsla(0, 0%, 100%, 0.9)', backdropFilter: 'blur(4px)', border: `1px solid hsla(${theme.colors.rose}, 0.3)` }} animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
                                <span className="text-sm font-semibold" style={{ color: `hsl(${theme.colors.luxuryDark})` }}>Long Lasting</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

            </section>
        </div>
    );
};

export default HeroSection;