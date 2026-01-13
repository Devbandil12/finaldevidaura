import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Droplets, Sun, Fingerprint } from 'lucide-react'; 
import Loader from "../Components/Loader"; 
// 👇 IMPORT OPTIMIZER
import { optimizeImage } from "../utils/imageOptimizer"; 

// --- ASSETS (Fallbacks) ---
import footer_bg_desktop from "../assets/images/aboutus-footer.webp"; 
import footer_bg_mobile from "../assets/images/aboutus-footer.webp"; 
import hero from "../assets/images/banner.webp";
import hero_2 from "../assets/images/banner-2.webp";
import pillar_1 from "../assets/images/saphire-mist-2.webp";
import pillar_2 from "../assets/images/vigor.webp";
import pillar_3 from "../assets/images/scarlet-night.webp";
import founder_img from "../assets/images/founder-img.jpg";

gsap.registerPlugin(ScrollTrigger);

export default function AboutUs() {
    const containerRef = useRef(null);
    const [cmsData, setCmsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

    // 1. FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/cms/about`);
                if (res.ok) {
                    const data = await res.json();
                    setCmsData(data || {}); 
                }
            } catch (err) {
                console.error("Failed to fetch About Us content", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [BACKEND_URL]);

    // ⚡ 2. OPTIMIZE CONTENT & MEMOIZE (Prevents GSAP glitches)
    const content = useMemo(() => {
        return {
            heroTitle: cmsData?.heroTitle || "DEVID AURA",
            heroSubtitle: cmsData?.heroSubtitle || "Est. 2023",
            // Optimize Hero (Large)
            heroImage: optimizeImage(cmsData?.heroImage || hero, 'hero'),
            
            pillar1: {
                title: cmsData?.pillar1Title || "Unrefined Nature.",
                desc: cmsData?.pillar1Desc || "We harvest when the sun is highest. Petals, roots, and resins gathered by hand from the finest estates across the globe.",
                // Optimize Pillars (Medium)
                image: optimizeImage(cmsData?.pillar1Image || pillar_1, 'card')
            },
            pillar2: {
                title: cmsData?.pillar2Title || "Liquid Patience.",
                desc: cmsData?.pillar2Desc || "Speed is the enemy of luxury. Our blends macerate in glass vessels for 90 days, allowing each note to find its harmony.",
                image: optimizeImage(cmsData?.pillar2Image || pillar_2, 'card')
            },
            pillar3: {
                title: cmsData?.pillar3Title || "The Human Canvas.",
                desc: cmsData?.pillar3Desc || "A perfume is unfinished until it meets your warmth. It is not a mask you wear — it is an invisible signature.",
                image: optimizeImage(cmsData?.pillar3Image || pillar_3, 'card')
            },
            founders: {
                title: cmsData?.foundersTitle || "Architects of Memory.",
                quote: cmsData?.foundersQuote || "We believe that luxury is transparency. We stripped away the marketing noise to reveal the soul of fragrance.",
                desc: cmsData?.foundersDesc || "Harsh & Yomesh founded Devid Aura with a simple premise: to modernize the ancient art of Indian perfumery, crafting fragrances that speak to both heritage and innovation.",
                // Optimize Founder (Medium)
                image: optimizeImage(cmsData?.foundersImage || founder_img, 800),
                f1Name: cmsData?.founder1Name || "Harsh",
                f1Role: cmsData?.founder1Role || "The Nose",
                f2Name: cmsData?.founder2Name || "Yomesh",
                f2Role: cmsData?.founder2Role || "The Eye",
            },
            footer: {
                title: cmsData?.footerTitle || "Define Your Presence.",
                // Optimize Footer (Large)
                desktop: optimizeImage(cmsData?.footerImageDesktop || footer_bg_desktop, 1200),
                mobile: optimizeImage(cmsData?.footerImageMobile || footer_bg_mobile, 600),
            }
        };
    }, [cmsData]);

    const handleImageLoad = () => ScrollTrigger.refresh();

    // 3. ANIMATIONS
    useLayoutEffect(() => {
        if (loading) return; 

        window.scrollTo(0, 0);
        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();
            
            // ============================================
            // 1. DESKTOP ANIMATIONS (min-width: 768px)
            // ============================================
            mm.add("(min-width: 768px)", () => {
                
                // Hero Pinning & Expand
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
                      .fromTo(".hero-image-mask", 
                          { width: "30vw", borderRadius: "200px" }, 
                          { width: "85vw", height: "80vh", borderRadius: "40px", scale: 1, ease: "power2.inOut" }, 
                      0);

                // Horizontal Scroll
                const horizontalSection = document.querySelector(".horizontal-scroll");
                const slides = gsap.utils.toArray(".h-slide-desktop");
                if (horizontalSection && slides.length > 0) {
                    gsap.to(slides, {
                        xPercent: -100 * (slides.length - 1),
                        ease: "none",
                        scrollTrigger: {
                            trigger: ".horizontal-wrapper",
                            pin: true,
                            scrub: 1,
                            snap: 1 / (slides.length - 1),
                            end: () => "+=" + horizontalSection.offsetWidth, 
                        }
                    });
                }
            });

            // ============================================
            // 2. MOBILE ANIMATIONS (max-width: 767px)
            // ============================================
            mm.add("(max-width: 767px)", () => {

                // --- MOBILE HERO ---
                const mHeroTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".hero-section",
                        start: "top top",
                        end: "bottom 30%", 
                        scrub: 1,
                    }
                });
                
                mHeroTl
                    .to(".hero-title", { opacity: 0, y: -30, scale: 0.9, duration: 0.5 })
                    .fromTo(".hero-image-mask",
                       { width: "70%", borderRadius: "50px", scale: 0.9 },
                       { width: "92%", borderRadius: "30px", scale: 1, ease: "power1.out", duration: 1 }, 
                       0
                    );

                // --- MOBILE VERTICAL STACK ---
                const mobileCards = gsap.utils.toArray(".mobile-pillar-card");
                
                mobileCards.forEach((card, i) => {
                    if (i === mobileCards.length - 1) return; // Don't animate last card out

                    // Optimized animation: Less blur, subtle scale, stays visible longer
                    gsap.to(card.querySelector('.inner-content'), {
                        scale: 0.95,      // Subtle shrink (was 0.9)
                        opacity: 0.05,    // Fade to barely visible (not 0)
                        filter: "blur(2px)", // Less blur to keep performance high
                        scrollTrigger: {
                            trigger: card,
                            start: "top top", 
                            end: "bottom top", 
                            scrub: true,
                            toggleActions: "restart none none reverse"
                        }
                    });
                });
            });

            // ============================================
            // 3. SHARED ANIMATIONS 
            // ============================================
            gsap.fromTo(".founder-img-anim",
                { scale: 1.05, filter: "grayscale(100%)" },
                { scale: 1, filter: "grayscale(0%)", duration: 1.5, ease: "power2.out", 
                  scrollTrigger: { trigger: ".founder-section", start: "top 70%", end: "bottom top", scrub: 1 }
                }
            );

            gsap.fromTo(".founder-text-anim",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", 
                  scrollTrigger: { trigger: ".founder-section", start: "top 70%" } 
                }
            );

            gsap.fromTo(".footer-card-anim", 
                { clipPath: "inset(20% 5% 20% 5% round 40px)", scale: 0.95 },
                { clipPath: "inset(0% 0% 0% 0% round 30px)", scale: 1, duration: 1.5, ease: "power4.out",
                  scrollTrigger: { trigger: ".footer-wrapper", start: "top 85%", end: "bottom bottom", toggleActions: "play none none reverse" }
                }
            );
            
            gsap.fromTo(".footer-content-reveal",
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1,
                  scrollTrigger: { trigger: ".footer-wrapper", start: "top 60%" }
                }
            );

        }, containerRef);

        // Ensure ScrollTrigger refreshes after a moment to catch any layout shifts
        const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => { ctx.revert(); clearTimeout(timer); };
    }, [loading]);

    if (loading) return <Loader />;

    return (
        
            <div ref={containerRef} className="text-[#1a1a1a] w-full overflow-hidden bg-white">

                {/* --- HEADER --- */}
                <section className="pt-24 pb-8 px-6 md:px-20 text-[#0F0F0F] bg-white">
                    <div className="max-w-[1600px] mx-auto text-center about-us-heading-container">
                        <div className="about-us-heading-anim">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm text-neutral-500">
                                <Star size={12} className="text-yellow-600" /> Our Heritage
                            </span>
                            <h1 className="text-5xl md:text-7xl  font-medium mb-4 text-[#1a1a1a]">
                                The Story Behind Devid Aura 
                            </h1>
                            <p className="text-xl text-neutral-500 max-w-3xl mx-auto font-light">
                                We believe in the invisible power of scent to define presence. 
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- HERO PARALLAX --- */}
                <section className="hero-section h-[60vh] md:h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
                    <div className="hero-title z-20 text-center mix-blend-difference text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <h1 className="text-[12vw] text-[#0F0F0F] font-bold inline-block whitespace-nowrap">
                            {content.heroTitle}
                        </h1>
                        <p className="text-sm md:text-xl text-[#333] mt-4 md:mt-8 tracking-widest uppercase font-bold">
                            {content.heroSubtitle}
                        </p>
                    </div>
                    
                    <div className="hero-image-mask absolute z-10 overflow-hidden shadow-2xl flex items-center justify-center origin-center">
                        <img 
                            src={content.heroImage} 
                            alt="Hero Bottle" 
                            className="w-full h-full object-cover" 
                            onLoad={handleImageLoad}
                            // ⚡ LCP OPTIMIZATION: Eager load hero
                            loading="eager"
                            fetchPriority="high" 
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </section>

                {/* --- PILLARS SECTION --- */}

                {/* DESKTOP (Horizontal) */}
                <div className="hidden md:block horizontal-wrapper relative w-full bg-white h-screen">
                    <div className="horizontal-scroll flex w-[300vw] h-full will-change-transform">
                        {[content.pillar1, content.pillar2, content.pillar3].map((pillar, i) => (
                            <div key={i} className="h-slide-desktop w-screen h-full flex items-center justify-center px-12">
                                <div className="max-w-7xl w-full grid grid-cols-2 gap-24 items-center">
                                    <div className={`relative h-[55vh] w-full rounded-[32px] overflow-hidden shadow-lg bg-gray-200 ${i === 1 ? 'order-1' : ''}`}>
                                        <img 
                                            src={pillar.image} 
                                            alt={pillar.title} 
                                            className="w-full h-full object-cover" 
                                            loading="lazy" 
                                            decoding="async" 
                                        />
                                    </div>
                                    <div className={`flex flex-col justify-center ${i === 1 ? 'order-2' : ''}`}>
                                        <div className="mb-6 flex items-center gap-3">
                                            {i === 0 && <Sun className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            {i === 1 && <Droplets className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            {i === 2 && <Fingerprint className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500">0{i+1}. {["INGREDIENTS","ALCHEMY","IDENTITY"][i]}</span>
                                        </div>
                                        <h2 className="text-7xl  mb-8 text-[#1a1a1a] leading-tight">
                                            {pillar.title}
                                        </h2>
                                        <p className="text-xl text-neutral-500 font-light max-w-md">{pillar.desc}</p>
                                        <div className="w-12 h-[1px] bg-neutral-300 mt-12"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MOBILE (Vertical Sticky Stack) */}
                <div className="block md:hidden w-full bg-white pb-10">
                    {[content.pillar1, content.pillar2, content.pillar3].map((pillar, i) => (
                        <div key={i} className="mobile-pillar-card sticky top-0 h-screen w-full flex items-center justify-center bg-white border-t border-gray-100/50">
                            <div className="inner-content relative w-full h-full px-5 flex flex-col justify-center items-center bg-white">
                                <div className="relative w-full aspect-[4/5] max-h-[55vh] rounded-[24px] overflow-hidden shadow-lg mb-5">
                                    <img 
                                        src={pillar.image} 
                                        alt={pillar.title} 
                                        className="w-full h-full object-cover" 
                                        loading="lazy" 
                                    />
                                    <div className="absolute inset-0 bg-black/5" />
                                </div>
                                <div className="w-full text-center">
                                    <div className="mb-2 flex items-center justify-center gap-2">
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                                            0{i+1} — {["INGREDIENTS","ALCHEMY","IDENTITY"][i]}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl  mb-3 text-[#1a1a1a] leading-tight">
                                        {pillar.title}
                                    </h2>
                                    <p className="text-sm text-neutral-500 font-light leading-relaxed max-w-[90%] mx-auto">
                                        {pillar.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="h-[5vh] w-full bg-white"></div>
                </div>

                {/* --- FOUNDERS SECTION --- */}
                <section className="founder-section relative py-20 md:py-32 bg-white text-[#1a1a1a] overflow-hidden z-20">
                    <div className="max-w-[1400px]  px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-48 items-center">
                        <div className="w-full flex justify-center lg:justify-end">
                             <div className="relative w-full max-w-md aspect-[3/4] rounded-[32px] overflow-hidden bg-gray-100 shadow-xl">
                                <img 
                                    src={content.founders.image} 
                                    alt="Founders" 
                                    className="founder-img-anim w-full h-full object-cover grayscale" 
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center relative z-10">
                            <div className="founder-text-anim mb-8 md:mb-10">
                                <span className="inline-block border-b-2 border-black pb-2 text-xs font-bold tracking-[0.25em] uppercase text-[#1a1a1a]">
                                    The Visionaries
                                </span>
                            </div>
                            <h2 className="founder-text-anim text-4xl md:text-7xl  leading-tight mb-8 text-[#1a1a1a]">
                                {content.founders.title}
                            </h2>
                            <div className="founder-text-anim relative mb-8 pl-4 border-l-2 border-neutral-200">
                                <p className="text-lg md:text-2xl text-neutral-500  italic">
                                    "{content.founders.quote}"
                                </p>
                            </div>
                            <div className="founder-text-anim space-y-6 text-neutral-500 max-w-lg leading-relaxed font-light text-base md:text-lg">
                                <p>{content.founders.desc}</p>
                            </div>
                            <div className="founder-text-anim mt-16 flex items-start gap-5 lg:gap-16">
                                <div className="flex flex-col gap-2">
                                    <p className="text-3xl uppercase font-bold  text-[#1a1a1a]">{content.founders.f1Name}</p>
                                    <p className="text-[10px] tracking-[0.2em] text-neutral-400 ">{content.founders.f1Role}</p>
                                </div>
                                <div className="h-full py-2">
                                     <div className="w-12 h-[1px] bg-neutral-200 mt-4"></div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-3xl uppercase font-bold text-[#1a1a1a]">{content.founders.f2Name}</p>
                                    <p className="text-[10px]  tracking-[0.2em] text-neutral-400 ">{content.founders.f2Role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FOOTER --- */}
                <section className="footer-wrapper w-full bg-white pb-12 pt-10 flex justify-center items-center">
                    <div className="footer-card-anim relative w-[92%] h-[50vh] md:h-[70vh] rounded-[30px] md:rounded-[3rem] overflow-hidden shadow-2xl bg-black">
                        <img 
                            src={content.footer.desktop} 
                            alt="Footer" 
                            className="w-full h-full object-cover opacity-80" 
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end items-center pb-12">
                            <h2 className="footer-content-reveal text-3xl md:text-6xl  text-white mb-8 text-center px-4">
                                {content.footer.title}
                            </h2>
                            <button className="footer-content-reveal px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                                Shop Collection
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        
    );
}