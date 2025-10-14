import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import bottleImage from "../assets/images/bottle-perfume-isolated-white-background_977935-10892-removebg-preview (1).png";

const HeroSection = () => {
    const bottleRef = useRef(null);
    const circleRefs = useRef([]);

    useEffect(() => {
        // GSAP timeline for bottle with complex animation
        if (bottleRef.current) {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(bottleRef.current, {
                y: -30,
                rotation: 3,
                duration: 4,
                ease: "sine.inOut",
            })
                .to(bottleRef.current, {
                    y: 0,
                    rotation: -2,
                    duration: 4,
                    ease: "sine.inOut",
                });
        }

        // Animate decorative circles
        circleRefs.current.forEach((circle, i) => {
            if (circle) {
                gsap.to(circle, {
                    y: `${Math.sin(i) * 50}`,
                    x: `${Math.cos(i) * 30}`,
                    rotation: 360,
                    duration: 8 + i * 2,
                    ease: "none",
                    repeat: -1,
                });
            }
        });

        // Sophisticated mouse parallax with multiple layers
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            const xPercent = (clientX / innerWidth - 0.5);
            const yPercent = (clientY / innerHeight - 0.5);

            if (bottleRef.current) {
                gsap.to(bottleRef.current, {
                    x: xPercent * 40,
                    y: yPercent * 40,
                    rotationY: xPercent * 15,
                    rotationX: -yPercent * 15,
                    duration: 0.8,
                    ease: "power2.out",
                });
            }

            // Parallax for decorative elements
            circleRefs.current.forEach((circle, i) => {
                if (circle) {
                    const speed = (i + 1) * 0.5;
                    gsap.to(circle, {
                        x: xPercent * 20 * speed,
                        y: yPercent * 20 * speed,
                        duration: 1,
                        ease: "power2.out",
                    });
                }
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="hero-theme">
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cream">
                {/* Sophisticated background layers */}
                <div className="absolute inset-0">
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cream via-gold/5 to-rose/5" />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(212,175,55,0.15), transparent 40%)' }} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 70%, rgba(220,20,60,0.1), transparent 50%)' }} />

                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Floating decorative shapes with complex animations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Large decorative circles */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={`circle-${i}`}
                            ref={(el) => (circleRefs.current[i] = el)}
                            className="absolute rounded-full border-2"
                            style={{
                                width: `${150 + i * 50}px`,
                                height: `${150 + i * 50}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                borderColor: i % 3 === 0 ? 'rgba(212,175,55,0.2)' : i % 3 === 1 ? 'rgba(220,20,60,0.15)' : 'rgba(240,240,240,0.3)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 6 + i,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5,
                            }}
                        />
                    ))}

                    {/* Floating particles with trails */}
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={`particle-${i}`}
                            className="absolute rounded-full"
                            style={{
                                width: `${2 + Math.random() * 4}px`,
                                height: `${2 + Math.random() * 4}px`,
                                background: i % 2 === 0 ? 'rgba(212,175,55,0.6)' : 'rgba(220,20,60,0.4)',
                                boxShadow: i % 2 === 0 ? '0 0 10px rgba(212,175,55,0.5)' : '0 0 10px rgba(220,20,60,0.3)',
                            }}
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                            }}
                            animate={{
                                y: [null, Math.random() * window.innerHeight],
                                x: [null, Math.random() * window.innerWidth],
                                opacity: [0, 1, 0.8, 0],
                            }}
                            transition={{
                                duration: 15 + Math.random() * 10,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    ))}

                    {/* Geometric accent shapes removed (rotating rectangles) */}
                </div>

                <div className="relative z-10 container mx-auto px-6 lg:px-20 py-20">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left content with layered design */}
                        <motion.div
                            initial={{ opacity: 0, x: -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative text-center lg:text-left space-y-10"
                        >
                            {/* Decorative elements behind text */}
                            <motion.div
                                className="absolute -left-10 top-0 w-64 h-64 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="relative space-y-6"
                            >
                                {/* Premium badge */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/20 to-rose/20 backdrop-blur-sm border border-gold/30 rounded-full"
                                >
                                    <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                                    <span className="text-sm font-semibold text-luxury-dark tracking-wider">EXCLUSIVE COLLECTION</span>
                                </motion.div>

                                {/* Main headline with multiple text effects */}
                                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-tight">
                                    <motion.span
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="block text-luxury-dark"
                                    >
                                        Not seen,
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="block text-luxury-dark"
                                    >
                                        not heard —
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8, type: "spring" }}
                                        className="relative block"
                                    >
                                        <span
                                            className="relative z-10 bg-gradient-to-r from-gold via-rose to-gold-light bg-clip-text text-transparent text-gradient-only-felt"
                                            style={{
                                                backgroundImage: 'linear-gradient(90deg, hsl(var(--gold)), hsl(var(--rose)), hsl(var(--gold-light)))',
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text',
                                                color: 'transparent',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundSize: '200% 100%',
                                                backgroundPosition: '-100% 0',
                                                animation: 'shimmer 3s linear infinite',
                                            }}
                                        >
                                            only felt
                                        </span>
                                        <motion.span
                                            className="absolute inset-0 bg-gold/30 blur-2xl"
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 0.8, 0.5],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                            }}
                                        />
                                    </motion.span>
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="space-y-4"
                            >
                                <p className="text-xl sm:text-2xl text-navy font-serif italic">
                                    In every breath he{" "}
                                    <span
                                        className="font-bold not-italic bg-gradient-to-r from-gold to-rose bg-clip-text text-transparent text-gradient-leaves"
                                        style={{
                                            backgroundImage: 'linear-gradient(90deg, hsl(var(--gold)), hsl(var(--rose)))',
                                            WebkitBackgroundClip: 'text',
                                            backgroundClip: 'text',
                                            color: 'transparent',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        leaves
                                    </span>{" "}
                                    behind.
                                </p>

                                <p className="text-lg text-navy/70 font-sans max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                    Discover the essence of elegance with our exclusive perfume collection.
                                    Each fragrance tells a story, crafted with the finest ingredients.
                                </p>
                            </motion.div>

                            {/* CTA buttons with complex hover effects */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                            >
                                <button
                                    size="lg"
                                    className="group relative overflow-hidden bg-gradient-to-r from-gold via-gold-light to-gold text-white font-semibold px-10 py-7 text-lg rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_60px_rgba(212,175,55,0.6)] transition-all duration-500"
                                >
                                    <motion.span
                                        className="absolute inset-0 bg-gradient-to-r from-rose to-gold"
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: "0%" }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    <span className="relative z-10 flex items-center gap-2">
                                        Explore Collection
                                        <motion.span
                                            className="cta-arrow"
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            →
                                        </motion.span>
                                    </span>
                                </button>

                                <button
                                    size="lg"
                                    variant="outline"
                                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-2 border-gold text-luxury-dark font-semibold px-10 py-7 text-lg rounded-full hover:bg-gold/10 transition-all duration-300"
                                >
                                    <span className="relative z-10">View Catalog</span>
                                </button>
                            </motion.div>

                            {/* Trust indicators removed per design request */}
                        </motion.div>

                        {/* Right - Elaborate bottle showcase */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 100 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="relative flex justify-center items-center"
                        >
                            {/* Layered background effects */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-gold/20 via-rose/10 to-transparent rounded-full blur-3xl"
                                animate={{
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />

                            {/* Ornate frame */}
                            {/* Ornate frame removed per request */}

                            {/* Main bottle container with glass effect */}
                            <motion.div
                                className="relative backdrop-blur-2xl bg-white/40 border-2 border-white/60 rounded-[3rem] p-12 sm:p-16 shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
                                whileHover={{ scale: 1.02, rotateY: 5 }}
                                transition={{ duration: 0.4 }}
                                style={{ perspective: "1000px" }}
                            >
                                {/* Inner glow layers */}
                                <motion.div
                                    className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-gold/20 via-transparent to-rose/20"
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                    }}
                                />

                                {/* Bottle with 3D effect */}
                                <div ref={bottleRef} className="relative z-10" style={{ transformStyle: "preserve-3d" }}>
                                    <img
                                        src={bottleImage}
                                        alt="Luxury Perfume Bottle"
                                        className="w-72 sm:w-96 lg:w-[28rem] h-auto object-contain drop-shadow-[0_30px_60px_rgba(212,175,55,0.4)]"
                                    />

                                    {/* Reflection effect */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent rounded-lg opacity-50"
                                        style={{ transform: "translateZ(-10px)" }}
                                    />
                                </div>

                                {/* Orbiting decorative elements */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={`orbit-${i}`}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{
                                            background: i % 2 === 0 ? 'linear-gradient(135deg, #d4af37, #f4d03f)' : 'linear-gradient(135deg, #dc143c, #ff69b4)',
                                            boxShadow: i % 2 === 0 ? '0 0 20px rgba(212,175,55,0.8)' : '0 0 20px rgba(220,20,60,0.6)',
                                        }}
                                        animate={{
                                            x: [
                                                Math.cos((i * Math.PI * 2) / 6) * 200,
                                                Math.cos(((i + 1) * Math.PI * 2) / 6) * 200,
                                            ],
                                            y: [
                                                Math.sin((i * Math.PI * 2) / 6) * 200,
                                                Math.sin(((i + 1) * Math.PI * 2) / 6) * 200,
                                            ],
                                        }}
                                        transition={{
                                            duration: 10,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: i * 0.5,
                                        }}
                                    />
                                ))}

                                {/* Corner accents */}
                                {/* Top-right decorative accent removed per request */}
                                {/* Bottom-left decorative accent removed per request */}
                            </motion.div>

                            {/* Floating text labels */}
                            <motion.div
                                className="absolute top-10 -left-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gold/30"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <span className="text-sm font-semibold text-luxury-dark">100% Natural</span>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-20 -right-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-rose/30"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                            >
                                <span className="text-sm font-semibold text-luxury-dark">Long Lasting</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom decorative wave */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-cream-dark to-transparent" />
            </section>
        </div>
    );
};

export default HeroSection;
