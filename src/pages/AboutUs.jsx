import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Droplets, Sun, Fingerprint, ArrowRight, Minus } from 'lucide-react'; 
import Loader from "../Components/Loader"; 
// 👇 IMPORT OPTIMIZER
import { optimizeImage } from "../utils/imageOptimizer"; 

// --- ASSETS (Fallbacks) ---
import footer_bg_desktop from "../assets/images/aboutus-footer.webp"; 
import footer_bg_mobile from "../assets/images/aboutus-footer.webp"; 
import hero from "../assets/images/banner.webp";
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

    // 2. MEMOIZE CONTENT
    const content = useMemo(() => {
        return {
            heroTitle: cmsData?.heroTitle || "DEVID AURA",
            heroSubtitle: cmsData?.heroSubtitle || "Est. 2023",
            heroImage: optimizeImage(cmsData?.heroImage || hero, 'hero'),
            
            pillar1: {
                title: cmsData?.pillar1Title || "Unrefined Nature.",
                desc: cmsData?.pillar1Desc || "We harvest when the sun is highest. Petals, roots, and resins gathered by hand from the finest estates across the globe.",
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
                image: optimizeImage(cmsData?.foundersImage || founder_img, 800),
                f1Name: cmsData?.founder1Name || "Harsh",
                f1Role: cmsData?.founder1Role || "The Nose",
                f2Name: cmsData?.founder2Name || "Yomesh",
                f2Role: cmsData?.founder2Role || "The Eye",
            },
            footer: {
                title: cmsData?.footerTitle || "Define Your Presence.",
                desktop: optimizeImage(cmsData?.footerImageDesktop || footer_bg_desktop, 1200),
                mobile: optimizeImage(cmsData?.footerImageMobile || footer_bg_mobile, 600),
            }
        };
    }, [cmsData]);

    const handleImageLoad = () => ScrollTrigger.refresh();

    // 3. ANIMATIONS
    useLayoutEffect(() => {
        if (loading) return; 

        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();
            
            // ============================================
            // 🛑 DESKTOP ANIMATIONS (Only > 768px)
            // ============================================
            mm.add("(min-width: 768px)", () => {
                
                // Hero Pinning
                const heroTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".d-hero-section",
                        start: "top top",
                        end: "bottom top",
                        scrub: 1,
                        pin: true,
                    }
                });
                heroTl.to(".d-hero-title", { scale: 0.6, opacity: 0, y: -100 }, 0)
                      .fromTo(".d-hero-mask", 
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

                // Desktop Elements Reveal
                gsap.fromTo(".d-founder-anim",
                    { scale: 1.05, filter: "grayscale(100%)" },
                    { scale: 1, filter: "grayscale(0%)", duration: 1.5, ease: "power2.out", 
                      scrollTrigger: { trigger: ".d-founder-section", start: "top 70%", end: "bottom top", scrub: 1 }
                    }
                );
                
                gsap.fromTo(".d-footer-card", 
                    { clipPath: "inset(20% 5% 20% 5% round 40px)", scale: 0.95 },
                    { clipPath: "inset(0% 0% 0% 0% round 30px)", scale: 1, duration: 1.5, ease: "power4.out",
                      scrollTrigger: { trigger: ".d-footer-wrapper", start: "top 85%", end: "bottom bottom", toggleActions: "play none none reverse" }
                    }
                );
            });

            // ============================================
            // 📱 NEW MOBILE ANIMATIONS (Only < 767px)
            // ============================================
            mm.add("(max-width: 767px)", () => {

                // Mobile Hero: Soft Zoom Out
                gsap.fromTo(".m-hero-img-inner", 
                    { scale: 1.1 },
                    { scale: 1, duration: 1.5, ease: "power2.out" }
                );

                // Mobile Horizontal Swipe Hint Animation
                gsap.to(".swipe-hint", {
                    x: 10, repeat: -1, yoyo: true, duration: 1, ease: "power1.inOut"
                });
                
                // Mobile Founder Reveal
                gsap.from(".m-founder-content", {
                    y: 40, opacity: 0, duration: 0.8, ease: "power2.out",
                    scrollTrigger: { trigger: ".m-founder-section", start: "top 75%" }
                });
            });

        }, containerRef);

        const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => { ctx.revert(); clearTimeout(timer); };
    }, [loading]);

    if (loading) return <Loader />;

    return (
        <div ref={containerRef} className="text-[#1a1a1a] w-full bg-white overflow-hidden">
            
            {/* =========================================================================
                                       DESKTOP LAYOUT (md:block hidden)
               ========================================================================= */}
            <div className="hidden md:block">
                
                {/* HEADER */}
                <section className="pt-24 pb-8 px-20 text-[#0F0F0F]">
                    <div className="max-w-[1600px] mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm text-neutral-500">
                            <Star size={12} className="text-yellow-600" /> Our Heritage
                        </span>
                        <h1 className="text-7xl font-medium mb-4 text-[#1a1a1a]">The Story Behind Devid Aura</h1>
                        <p className="text-xl text-neutral-500 max-w-3xl mx-auto font-light">We believe in the invisible power of scent to define presence.</p>
                    </div>
                </section>

                {/* HERO PARALLAX */}
                <section className="d-hero-section h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
                    <div className="d-hero-title z-20 text-center mix-blend-difference text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <h1 className="text-[12vw] text-[#0F0F0F] font-bold inline-block whitespace-nowrap">{content.heroTitle}</h1>
                        <p className="text-xl text-[#333] mt-8 tracking-widest uppercase font-bold">{content.heroSubtitle}</p>
                    </div>
                    <div className="d-hero-mask absolute z-10 overflow-hidden shadow-2xl flex items-center justify-center origin-center">
                        <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover" onLoad={handleImageLoad} />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </section>

                {/* HORIZONTAL SCROLL PILLARS */}
                <div className="horizontal-wrapper relative w-full bg-white h-screen">
                    <div className="horizontal-scroll flex w-[300vw] h-full will-change-transform">
                        {[content.pillar1, content.pillar2, content.pillar3].map((pillar, i) => (
                            <div key={i} className="h-slide-desktop w-screen h-full flex items-center justify-center px-12">
                                <div className="max-w-7xl w-full grid grid-cols-2 gap-24 items-center">
                                    <div className={`relative h-[55vh] w-full rounded-[32px] overflow-hidden shadow-lg bg-gray-200 ${i === 1 ? 'order-1' : ''}`}>
                                        <img src={pillar.image} alt={pillar.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className={`flex flex-col justify-center ${i === 1 ? 'order-2' : ''}`}>
                                        <div className="mb-6 flex items-center gap-3">
                                            {i === 0 && <Sun className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            {i === 1 && <Droplets className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            {i === 2 && <Fingerprint className="w-6 h-6 opacity-80" strokeWidth={1} />}
                                            <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500">0{i+1}. {["INGREDIENTS","ALCHEMY","IDENTITY"][i]}</span>
                                        </div>
                                        <h2 className="text-7xl mb-8 text-[#1a1a1a] leading-tight">{pillar.title}</h2>
                                        <p className="text-xl text-neutral-500 font-light max-w-md">{pillar.desc}</p>
                                        <div className="w-12 h-[1px] bg-neutral-300 mt-12"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOUNDERS */}
                <section className="d-founder-section relative py-32 bg-white text-[#1a1a1a] overflow-hidden z-20">
                    <div className="max-w-[1400px] px-12 grid grid-cols-2 gap-48 items-center">
                        <div className="w-full flex justify-end">
                             <div className="relative w-full max-w-md aspect-[3/4] rounded-[32px] overflow-hidden bg-gray-100 shadow-xl">
                                <img src={content.founders.image} alt="Founders" className="d-founder-anim w-full h-full object-cover grayscale" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center relative z-10">
                            <span className="inline-block border-b-2 border-black pb-2 text-xs font-bold tracking-[0.25em] uppercase text-[#1a1a1a] mb-10">The Visionaries</span>
                            <h2 className="text-7xl leading-tight mb-8 text-[#1a1a1a]">{content.founders.title}</h2>
                            <div className="relative mb-8 pl-4 border-l-2 border-neutral-200">
                                <p className="text-2xl text-neutral-500 italic">"{content.founders.quote}"</p>
                            </div>
                            <p className="text-lg text-neutral-500 font-light">{content.founders.desc}</p>
                            <div className="mt-16 flex items-start gap-16">
                                <div><p className="text-3xl uppercase font-bold text-[#1a1a1a]">{content.founders.f1Name}</p><p className="text-[10px] tracking-[0.2em] text-neutral-400 ">{content.founders.f1Role}</p></div>
                                <div className="h-full py-2"><div className="w-12 h-[1px] bg-neutral-200 mt-4"></div></div>
                                <div><p className="text-3xl uppercase font-bold text-[#1a1a1a]">{content.founders.f2Name}</p><p className="text-[10px] tracking-[0.2em] text-neutral-400 ">{content.founders.f2Role}</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <section className="d-footer-wrapper w-full bg-white pb-12 pt-10 flex justify-center items-center">
                    <div className="d-footer-card relative w-[92%] h-[70vh] rounded-[3rem] overflow-hidden shadow-2xl bg-black">
                        <img src={content.footer.desktop} alt="Footer" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end items-center pb-12">
                            <h2 className="text-6xl text-white mb-8 text-center px-4">{content.footer.title}</h2>
                            <button className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">Shop Collection</button>
                        </div>
                    </div>
                </section>
            </div>

            {/* =========================================================================
                                       MOBILE LAYOUT (md:hidden block)
                                       Applied padding-top: 80px
               ========================================================================= */}
            <div className="block md:hidden bg-white pt-[80px]">

                {/* MOBILE HEADER TEXT (Static top) */}
                <div className="px-6 mb-8">
                    <h1 className="text-4xl font-medium text-[#1a1a1a] leading-tight mb-2">The Story</h1>
                    <p className="text-sm text-neutral-500">Unveiling the soul of fragrance.</p>
                </div>

                {/* MOBILE HERO */}
                <section className="relative w-full aspect-[4/5] px-4 mb-16">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-lg">
                        <img src={content.heroImage} alt="Mobile Hero" className="m-hero-img-inner w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <h2 className="text-4xl font-bold text-white tracking-widest mix-blend-overlay opacity-90">{content.heroTitle}</h2>
                        </div>
                    </div>
                </section>

                {/* MOBILE HORIZONTAL SCROLL (Swiper Style) */}
                {/* This mimics the desktop horizontal feeling but uses native touch scroll */}
                <section className="w-full mb-20 overflow-visible">
                    <div className="px-6 mb-4 flex justify-between items-end">
                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Our Pillars</h3>
                        <div className="swipe-hint flex items-center gap-1 text-xs text-neutral-400">
                            <span>Swipe</span> <ArrowRight size={12} />
                        </div>
                    </div>

                    {/* Scroll Container */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 pb-8 no-scrollbar" style={{ scrollPaddingLeft: '1.5rem' }}>
                        {[content.pillar1, content.pillar2, content.pillar3].map((pillar, i) => (
                            <div key={i} className="snap-center shrink-0 w-[85vw] flex flex-col gap-4">
                                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden shadow-sm bg-gray-50">
                                    <img src={pillar.image} alt={pillar.title} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                                        {i === 0 && <Sun size={20} className="text-neutral-600" strokeWidth={1.5} />}
                                        {i === 1 && <Droplets size={20} className="text-neutral-600" strokeWidth={1.5} />}
                                        {i === 2 && <Fingerprint size={20} className="text-neutral-600" strokeWidth={1.5} />}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold tracking-widest text-neutral-400">0{i+1}</span>
                                        <Minus size={12} className="text-neutral-300" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-800">{["Ingredients","Alchemy","Identity"][i]}</span>
                                    </div>
                                    <h2 className="text-2xl font-medium text-[#1a1a1a] mb-2">{pillar.title}</h2>
                                    <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3">{pillar.desc}</p>
                                </div>
                            </div>
                        ))}
                        {/* Spacer for right padding */}
                        <div className="w-2 shrink-0"></div>
                    </div>
                </section>

                {/* MOBILE FOUNDERS */}
                <section className="m-founder-section px-4 mb-20">
                    <div className="bg-neutral-50 rounded-[2rem] p-6 pb-10 m-founder-content">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-[1px] bg-black"></div>
                            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-800">Visionaries</span>
                        </div>
                        
                        <div className="w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-8 bg-white shadow-sm">
                            <img src={content.founders.image} alt="Founders" className="w-full h-full object-cover grayscale opacity-90" />
                        </div>

                        <h2 className="text-3xl font-medium text-[#1a1a1a] mb-4">{content.founders.title}</h2>
                        <p className="text-sm italic text-neutral-600 mb-6 pl-4 border-l border-neutral-300">"{content.founders.quote}"</p>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                                <span className="text-lg font-bold">{content.founders.f1Name}</span>
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400">{content.founders.f1Role}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                                <span className="text-lg font-bold">{content.founders.f2Name}</span>
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400">{content.founders.f2Role}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MOBILE FOOTER */}
                <section className="px-4 pb-8">
                    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-lg">
                        <img src={content.footer.mobile} alt="Footer" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-4">
                            <h2 className="text-3xl text-white font-medium mb-6 leading-tight">{content.footer.title}</h2>
                            <button className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                                Explore
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}