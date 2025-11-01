import { useRef } from "react"; 
import { motion } from "framer-motion";
import bottleImage from "../assets/images/bottle-perfume.webp";
import { useNavigate } from "react-router-dom";

const theme = {
    colors: {
        cream: "45 25% 97%",
        creamDark: "45 20% 92%",
        luxuryDark: "240 20% 15%",
        gold: "38 92% 50%",
        goldLight: "45 100% 65%",
        rose: "340 82% 52%",
        navy: "240 40% 25%",
    },
};

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
    const bottleRef = useRef(null); 

    const scrollOrNavigate = (sectionId) => {
        if (window.location.pathname !== "/") {
            sessionStorage.setItem("scrollToSection", sectionId);
            navigate("/");
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        }
    };


    const onlyFeltStyles = {
        backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}), hsl(${theme.colors.goldLight}))`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundSize: "200% 100%",
        animation: "shimmer 3s linear infinite",
        display: "inline-block",
    };

    const leavesStyles = {
        backgroundImage: `linear-gradient(90deg, hsl(${theme.colors.gold}), hsl(${theme.colors.rose}))`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    };

    return (
        <div>
            <style>{keyframes}</style>

            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="container mx-auto px-6 lg:px-20 py-16 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">

                        <motion.div
                            initial={{ opacity: 0, x: -80 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="space-y-7 text-center lg:text-left"
                        >
                            <motion.div
                                className="absolute left-0 top-10 w-52 h-52 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl pointer-events-none"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.5, 0.25] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />

                            <div
                                className="inline-flex items-center gap-2 px-4 py-1 rounded-full"
                                style={{
                                    background: `linear-gradient(to right, hsla(${theme.colors.gold}, 0.2), hsla(${theme.colors.rose}, 0.2))`,
                                    backdropFilter: "blur(4px)",
                                    border: `1px solid hsla(${theme.colors.gold}, 0.3)`,
                                }}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                        backgroundColor: `hsl(${theme.colors.gold})`,
                                        animation: "pulse 2s infinite",
                                    }}
                                />
                                <span
                                    className="text-sm font-semibold tracking-wide"
                                    style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                                >
                                    EXCLUSIVE COLLECTION
                                </span>
                            </div>

                            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-tight">
                                <span style={{ color: `hsl(${theme.colors.luxuryDark})` }}>
                                    Not seen,
                                </span>
                                <br />
                                <span style={{ color: `hsl(${theme.colors.luxuryDark})` }}>
                                    not heard,
                                </span>
                                <br />
                                <span style={onlyFeltStyles}>only felt</span>
                            </h1>

                            <p
                                className="text-xl sm:text-2xl font-serif italic"
                                style={{ color: `hsl(${theme.colors.navy})` }}
                            >
                                In every breath he{" "}
                                <span style={leavesStyles} className="font-bold not-italic">
                                    leaves
                                </span>{" "}
                                behind.
                            </p>

                            <p
                                className="text-lg font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed"
                                style={{ color: `hsla(${theme.colors.navy}, 0.75)` }}
                            >
                                Fragrances that whisper stories — crafted from the rarest
                                essences and wrapped in glass like a secret.
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={() => scrollOrNavigate("collection-section")}
                                    className="px-8 py-3 rounded-full text-white shadow-md transition-transform hover:scale-105"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, hsl(${theme.colors.gold}), hsl(${theme.colors.goldLight}), hsl(${theme.colors.gold}))`,
                                    }}
                                >
                                    Explore Collection →
                                </button>

                                <button
                                    onClick={() => scrollOrNavigate("scents-section")}
                                    className="px-8 py-3 rounded-full bg-white border-2 transition-transform hover:scale-105"
                                    style={{
                                        borderColor: `hsl(${theme.colors.gold})`,
                                        color: `hsl(${theme.colors.luxuryDark})`,
                                    }}
                                >
                                    Our Scents
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 80 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="relative flex justify-center items-center p-8 rounded-lg" // Added padding and rounded
                            style={{
                                background: `linear-gradient(to bottom right, hsla(${theme.colors.gold}, 0.1), hsla(${theme.colors.rose}, 0.1), hsla(${theme.colors.goldLight}, 0.1))`
                            }}
                        >
                            <div
                                ref={bottleRef}
                                className="relative z-10"
                            >
                                 <img src={bottleImage} alt="Luxury Perfume Bottle" className="w-72 sm:w-96 lg:w-[28rem] h-auto object-contain" style={{ filter: 'drop-shadow(0 30px 60px rgba(212,175,55,0.4))' }} />
                            </div>

                            <motion.div
                                className="absolute top-10 -left-8 px-6 py-2 rounded-full shadow-lg bg-white/90 backdrop-blur"
                            >
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                                >
                                    100% Natural
                                </span>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-20 -right-8 px-6 py-2 rounded-full shadow-lg bg-white/90 backdrop-blur"
                            >
                                <span
                                    className="text-sm font-semibold"
                                    style={{ color: `hsl(${theme.colors.luxuryDark})` }}
                                >
                                    Long Lasting
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HeroSection;