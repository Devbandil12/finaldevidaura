import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Star, Hexagon, Sparkles } from 'lucide-react';
import PageTransition from "./PageTransition";

gsap.registerPlugin(ScrollTrigger);

// --- ASSETS ---
const IMAGES = {
    hero: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto-format&fit=crop&w=1600&q=80',
    pillar_1: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto-format&fit=crop&w=1200&q=80',
    pillar_2: 'https://images.unsplash.com/photo-1615479785986-c8c97027b54e?auto-format&fit=crop&w=1200&q=80',
    pillar_3: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto-format&fit=crop&w=1200&q=80',
    alchemy_bg: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto-format&fit=crop&w=1600&q=80',
    flower: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto-format&fit=crop&w=600&q=80',
    liquid_drop: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto-format&fit=crop&w=600&q=80',
    founders: 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto-format&fit=crop&w=1200&q=80',
    footer_bg: 'https://images.unsplash.com/photo-1593086997231-5006a292b79a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export default function AboutUs() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            
            // 1. HERO REVEAL
            const heroTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".hero-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1,
                    pin: true,
                }
            });
            heroTl.to(".hero-title", { scale: 0.6, opacity: 0, y: -100 }, 0)
                  .to(".hero-image-mask", { width: "100vw", height: "100vh", borderRadius: "0px", scale: 1 }, 0);

            // 2. HORIZONTAL SCROLL
            const horizontalSection = document.querySelector(".horizontal-scroll");
            const slides = gsap.utils.toArray(".h-slide");
            if (horizontalSection) {
                gsap.to(slides, {
                    xPercent: -100 * (slides.length - 1),
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".horizontal-wrapper",
                        pin: true,
                        scrub: 1,
                        snap: 1 / (slides.length - 1),
                        end: () => "+=" + horizontalSection.offsetWidth
                    }
                });
            }

            // --------------------------------------------------------
            // 3. ARCHITECTURE SECTION (Top-to-Bottom Color Reveal)
            // --------------------------------------------------------
            const archSection = ".architecture-section";

            // Text Reveal
            const archRevealTl = gsap.timeline({
                scrollTrigger: {
                    trigger: archSection,
                    start: "top 60%",
                    toggleActions: "play none none reverse",
                }
            });
            archRevealTl.to(archSection + " .arch-reveal-item", {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out"
            });

            // IMAGE COLOR REVEAL (Clip Path Animation)
            // We animate the clip-path from inset(0 0 100% 0) -> inset(0 0 0% 0)
            // This creates a "wipe down" effect revealing the color image
            gsap.fromTo(".arch-color-layer", 
                { clipPath: "inset(0 0 100% 0)" }, 
                {
                    clipPath: "inset(0 0 0% 0)", 
                    ease: "none",
                    scrollTrigger: {
                        trigger: archSection,
                        start: "top center", 
                        end: "bottom center",
                        scrub: true // This makes it follow the scroll speed
                    }
                }
            );

            // Parallax for floating elements
            gsap.to(archSection + " .floating-1", {
                y: -80, rotation: 30,
                scrollTrigger: { trigger: archSection, start: "top 80%", end: "bottom 20%", scrub: 1 }
            });
            gsap.to(archSection + " .floating-2", {
                y: 120, rotation: -40,
                scrollTrigger: { trigger: archSection, start: "top 80%", end: "bottom 20%", scrub: 1.5 }
            });


            // --------------------------------------------------------
            // 4. FOUNDERS SECTION (Top-to-Bottom Color Reveal)
            // --------------------------------------------------------
            
            // Text Reveal
            gsap.utils.toArray('.founder-reveal-text').forEach((el) => {
                gsap.fromTo(el,
                    { y: 50, opacity: 0 },
                    {
                        y: 0, opacity: 1, duration: 1, ease: "power3.out",
                        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
                    }
                );
            });

            // IMAGE COLOR REVEAL (Clip Path Animation)
            gsap.fromTo(".founder-color-layer", 
                { clipPath: "inset(0 0 100% 0)" }, 
                {
                    clipPath: "inset(0 0 0% 0)", 
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".founder-section",
                        start: "top center",
                        end: "bottom center",
                        scrub: true
                    }
                }
            );

            // Badge Spin
            gsap.to(".founder-badge", {
                rotation: 360, ease: "none",
                scrollTrigger: { trigger: ".founder-section", start: "top bottom", end: "bottom top", scrub: 1 }
            });


            // --------------------------------------------------------
            // 5. FOOTER REVEAL (Fixed Visibility & Trigger)
            // --------------------------------------------------------
            const footerTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".final-signature-section",
                    start: "top 75%", // Trigger earlier so it doesn't get stuck
                    toggleActions: "play none none reverse",
                }
            });

            // Reveal Brand Name
            footerTl.from(".final-signature-section h2", {
                opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: "power3.out"
            }, 0);

            // Reveal Floating Icons (Hexagons/Stars)
            // We force opacity to 0.1/0.05 (whatever the class has) from 0
            footerTl.fromTo(".final-signature-section .dynamic-icon", 
                { opacity: 0, scale: 0 },
                { opacity: (i, target) => target.dataset.opacity || 0.1, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 
                0.2
            );

            // Reveal CTA Group (Heading & Button)
            footerTl.to(".final-cta-anim", {
                opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
            }, 0.5);

            // Footer Background Parallax
            gsap.fromTo(".footer-bg-image",
                { y: 100 },
                {
                    y: 0, ease: "none",
                    scrollTrigger: {
                        trigger: ".final-signature-section",
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 0.5,
                    }
                }
            );

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#050505] text-[#EAEAEA] font-sans w-full overflow-hidden">

                {/* =======================
                   1. ABOUT US HEADING
                ======================= */}
                <section className="py-24 px-6 md:px-20 bg-[#FCFCFA] text-[#0F0F0F]">
                    <div className="max-w-[1600px] mx-auto text-center about-us-heading-container">
                        <div className="about-us-heading-anim">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold tracking-widest uppercase mb-6">
                                <Star size={12} className="text-gray-900" />
                                Our Heritage
                            </span>
                            <h1 className="text-5xl md:text-7xl font-medium mb-4 text-[#1a1a1a]">
                                The Devid Aura Story
                            </h1>
                            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                                We believe in the invisible power of scent to define presence. Our journey is one of radical purity and slow, deliberate craft.
                            </p>
                        </div>
                    </div>
                </section>

                {/* =======================
                   2. HERO
                ======================= */}
                <section className="hero-section h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#FCFCFA]">
                    <div className="hero-title z-20 text-center mix-blend-difference text-white">
                        <h1 className="text-[12vw] leading-[0.8] font-serif font-bold tracking-tighter text-[#0F0F0F] inline-block whitespace-nowrap">
                            DEVID <span className="text-[12vw] font-serif italic text-[#0F0F0F]">AURA</span>
                        </h1>
                        <p className="text-xl text-[#333] mt-8 tracking-widest uppercase font-bold">Est. 2023</p>
                    </div>
                    <div className="hero-image-mask absolute z-10 w-[40vw] h-[60vh] rounded-[200px] overflow-hidden shadow-2xl">
                        <img src={IMAGES.hero} alt="Hero Bottle" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                </section>

                {/* =======================
                   3. HORIZONTAL PILLARS
                ======================= */}
                <div className="horizontal-wrapper h-screen w-full bg-[#0F0F0F] text-[#EAEAEA] overflow-hidden relative">
                    <div className="horizontal-scroll flex h-full w-[300vw]">
                        {/* Slide 1 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden">
                                <img src={IMAGES.pillar_1} alt="Purity" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#0F0F0F]">
                                <span className="text-xs font-bold tracking-[0.5em] uppercase text-white/40 mb-6">01. The Source</span>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">Radical <br /> <span className="italic text-white/50">Purity.</span></h2>
                                <p className="text-xl text-white/60 leading-relaxed max-w-md">We reject the artificial. We scour the globe for Haitan vetiver and Bulgarian rose in their rawest, most untamed forms.</p>
                            </div>
                        </div>
                        {/* Slide 2 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden order-2 md:order-1">
                                <img src={IMAGES.pillar_2} alt="Time" className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#141414] order-1 md:order-2">
                                <span className="text-xs font-bold tracking-[0.5em] uppercase text-white/40 mb-6">02. The Process</span>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">Slow <br /> <span className="italic text-white/50">Craft.</span></h2>
                                <p className="text-xl text-white/60 leading-relaxed max-w-md">Greatness waits for no one, but it takes time to create. Our blends age in barrels for 90 days allowing molecules to bond.</p>
                            </div>
                        </div>
                        {/* Slide 3 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden">
                                <img src={IMAGES.pillar_3} alt="Bond" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#0F0F0F]">
                                <span className="text-xs font-bold tracking-[0.5em] uppercase text-white/40 mb-6">03. The Result</span>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">Your <br /> <span className="italic text-white/50">Aura.</span></h2>
                                <p className="text-xl text-white/60 leading-relaxed max-w-md">A fragrance is not an accessory. It is the invisible language of your presence, reacting uniquely to your skin chemistry.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-12 right-12 flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-white">
                        Scroll to explore <ArrowRight className="w-4 h-4 animate-pulse" />
                    </div>
                </div>

                {/* =======================
                   4. ARCHITECTURE OF SENSATION
                ======================= */}
                <section className="architecture-section w-full bg-[#FCFCFA] text-[#0F0F0F] flex flex-col lg:flex-row min-h-[100vh]">
                    <div className="lg:w-1/2 flex flex-col justify-center p-12 md:p-24 lg:sticky lg:top-0 h-full lg:h-screen">
                        <div className="max-w-xl">
                            <Sparkles className="w-10 h-10 mb-6 text-yellow-600 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }} />
                            <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-8 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }}>The Architecture of Sensation</h2>
                            <p className="text-xl text-neutral-700 leading-relaxed mb-10 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }}>
                                We move beyond simple "mixing." Our perfumers are molecular cartographers.
                            </p>
                            <div className="space-y-6">
                                <div className="border-l-4 border-[#0F0F0F] pl-4 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }}>
                                    <h3 className="text-lg font-bold uppercase tracking-widest text-neutral-800">Top Notes</h3>
                                    <p className="text-neutral-600 mt-1">The vibrant, volatile compounds that capture attention.</p>
                                </div>
                                <div className="border-l-4 border-neutral-400 pl-4 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }}>
                                    <h3 className="text-lg font-bold uppercase tracking-widest text-neutral-800">Heart Notes</h3>
                                    <p className="text-neutral-600 mt-1">The expressive character that emerges as the flash fades.</p>
                                </div>
                                <div className="border-l-4 border-neutral-700 pl-4 arch-reveal-item" style={{ opacity: 0, transform: 'translateY(50px)' }}>
                                    <h3 className="text-lg font-bold uppercase tracking-widest text-neutral-800">Base Notes</h3>
                                    <p className="text-neutral-600 mt-1">The heaviest molecules anchoring the scent for hours.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Color Reveal Image */}
                    <div className="lg:w-1/2 relative min-h-[50vh] lg:min-h-screen overflow-hidden">
                        <div className="absolute inset-0 w-full h-full">
                            {/* 1. Grayscale Background (Bottom Layer) */}
                            <img
                                src={IMAGES.alchemy_bg}
                                alt="Alchemy Grayscale"
                                className="w-full h-full object-cover grayscale"
                            />
                            
                            {/* 2. Color Reveal (Top Layer) - ClipPath controlled by GSAP */}
                            <div className="arch-color-layer absolute inset-0 w-full h-full">
                                <img
                                    src={IMAGES.alchemy_bg}
                                    alt="Alchemy Color"
                                    className="w-full h-full object-cover"
                                />
                                {/* Add a subtle overlay to make text pop if needed, though images here are background */}
                            </div>
                            
                            <div className="absolute inset-0 bg-black/10 z-10" />
                        </div>

                        {/* Floating elements */}
                        <div className="floating-1 absolute top-[10%] left-[5%] w-48 h-48 rounded-full overflow-hidden border border-white/20 z-20 opacity-80">
                            <img src={IMAGES.flower} alt="Flower" className="w-full h-full object-cover" />
                        </div>
                        <div className="floating-2 absolute bottom-[10%] right-[10%] w-40 h-40 rounded-full overflow-hidden border border-white/20 z-20 opacity-80">
                            <img src={IMAGES.liquid_drop} alt="Drop" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </section>

                {/* =======================
                   5. FOUNDERS
                ======================= */}
                <section className="founder-section py-32 px-6 md:px-20 bg-[#FCFCFA] text-[#0F0F0F] overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-5 sticky top-32">
                            <p className="founder-reveal-text text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-6" style={{ opacity: 0, transform: 'translateY(50px)' }}>The Architects</p>
                            <div className="overflow-hidden mb-8">
                                <h2 className="founder-reveal-text text-5xl md:text-7xl font-serif leading-none" style={{ opacity: 0, transform: 'translateY(50px)' }}>Harsh & <br /> Yomesh</h2>
                            </div>
                            <p className="founder-reveal-text text-xl text-neutral-600 leading-relaxed mb-8" style={{ opacity: 0, transform: 'translateY(50px)' }}>"We didn’t start with a business plan. We started with a memory."</p>
                            <p className="founder-reveal-text text-neutral-500 max-w-md leading-relaxed" style={{ opacity: 0, transform: 'translateY(50px)' }}>Driven by the belief that scent is identity, they set out to create fragrances that don't just smell good—they feel true.</p>
                        </div>

                        {/* Founder Image with Color Reveal */}
                        <div className="lg:col-span-7 relative pt-20 lg:pt-0">
                            <div className="relative h-[80vh] w-full overflow-hidden rounded-sm">
                                {/* 1. Grayscale Layer */}
                                <img
                                    src={IMAGES.founders}
                                    alt="Founders BW"
                                    className="absolute inset-0 w-full h-full object-cover grayscale"
                                />
                                {/* 2. Color Layer (ClipPath Animated) */}
                                <div className="founder-color-layer absolute inset-0 w-full h-full">
                                     <img
                                        src={IMAGES.founders}
                                        alt="Founders Color"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="founder-badge absolute -left-12 top-1/2 w-24 h-24 bg-[#0F0F0F] rounded-full flex items-center justify-center text-white shadow-xl z-10">
                                <Star className="w-10 h-10 fill-white" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* =======================
                   6. FOOTER (Fixed)
                ======================= */}
                <section className="final-signature-section h-[70vh] w-full relative flex items-center justify-center overflow-hidden bg-[#000000] text-white">
                    {/* Background Image */}
                    <img
                        src={IMAGES.footer_bg}
                        alt="Devid Aura Footer Background"
                        className="footer-bg-image absolute inset-0 w-full h-full object-cover z-0"
                        style={{ opacity: 0.4 }}
                    />
                    <div className="absolute inset-0 bg-black/60 z-10"></div>

                    {/* Dynamic Aura Elements (Fixed Z-Index & Opacity Handling) */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center z-20 pointer-events-none">
                        <div 
                            className="absolute w-[800px] h-[800px] animate-spin-slow-reverse dynamic-icon" 
                            data-opacity="0.1"
                        >
                            <Hexagon className="absolute top-0 left-0 w-16 h-16 text-white" strokeWidth={0.5} />
                            <Sparkles className="absolute top-[20%] right-[10%] w-10 h-10 text-white" />
                            <Star className="absolute bottom-[10%] left-[20%] w-12 h-12 text-white" />
                        </div>
                        <div 
                            className="absolute w-[1200px] h-[1200px] animate-spin-slow dynamic-icon" 
                            data-opacity="0.05"
                        >
                            <Hexagon className="absolute bottom-0 right-[25%] w-20 h-20 text-white" strokeWidth={0.5} />
                            <Sparkles className="absolute top-[30%] left-[5%] w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative z-30 text-center px-6">
                        <div className="mb-10 leading-none">
                            <h2 className="text-[10vw] md:text-[8vw] font-serif font-bold text-transparent stroke-text-white select-none inline-block whitespace-nowrap opacity-50">DEVID</h2>
                            <h2 className="text-[10vw] md:text-[8vw] font-serif italic text-white -mt-4 select-none inline-block whitespace-nowrap mix-blend-screen">AURA</h2>
                        </div>

                        {/* CTA Group (Fixed Opacity Animation) */}
                        <div className="mt-10 flex flex-col items-center justify-center space-y-8 final-cta-group">
                            <h3 className="text-xl md:text-3xl font-light text-white tracking-widest uppercase final-cta-anim" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                                Define Your Presence
                            </h3>
                            <button className="final-cta-anim group relative px-12 py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-lg" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                                <span className="relative z-10 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                    Shop Collection <ArrowRight className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 bg-neutral-200 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                            </button>
                        </div>
                    </div>
                </section>

                <style>{`
                    .stroke-text { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5); }
                    .stroke-text-white { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5); -webkit-text-fill-color: transparent; }
                    .animate-spin-slow { animation: spin 15s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    .animate-spin-slow-reverse { animation: spin-reverse 20s linear infinite; }
                    @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
                `}</style>
            </div>
        </PageTransition>
    );
}