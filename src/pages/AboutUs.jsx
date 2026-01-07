import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Star, Hexagon, Quote, Droplets, Sun, Fingerprint } from 'lucide-react'; 
import PageTransition from "./PageTransition";
import Loader from "../Components/Loader"; 

// --- DEFAULT ASSETS (Fallbacks) ---
import footer_bg_desktop from "../assets/images/aboutus-footer.webp"; 
import footer_bg_mobile from "../assets/images/aboutus-footer.webp"; 
import hero from "../assets/images/banner-2.png";
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
    }, []);

    // 2. CONTENT MAPPING
    const content = {
        heroTitle: cmsData?.heroTitle || "DEVID AURA",
        heroSubtitle: cmsData?.heroSubtitle || "Est. 2023",
        heroImage: cmsData?.heroImage || hero,
        
        pillar1: {
            title: cmsData?.pillar1Title || "Unrefined Nature.",
            desc: cmsData?.pillar1Desc || "We harvest when the sun is highest. Petals, roots, and resins gathered by hand from the finest estates across the globe.",
            image: cmsData?.pillar1Image || pillar_1
        },
        pillar2: {
            title: cmsData?.pillar2Title || "Liquid Patience.",
            desc: cmsData?.pillar2Desc || "Speed is the enemy of luxury. Our blends macerate in glass vessels for 90 days, allowing each note to find its harmony.",
            image: cmsData?.pillar2Image || pillar_2
        },
        pillar3: {
            title: cmsData?.pillar3Title || "The Human Canvas.",
            desc: cmsData?.pillar3Desc || "A perfume is unfinished until it meets your warmth. It is not a mask you wear — it is an invisible signature.",
            image: cmsData?.pillar3Image || pillar_3
        },
        founders: {
            title: cmsData?.foundersTitle || "Architects of Memory.",
            quote: cmsData?.foundersQuote || "We believe that luxury is transparency. We stripped away the marketing noise to reveal the soul of fragrance.",
            desc: cmsData?.foundersDesc || "Harsh & Yomesh founded Devid Aura with a simple premise: to modernize the ancient art of Indian perfumery, crafting fragrances that speak to both heritage and innovation.",
            image: cmsData?.foundersImage || founder_img,
            f1Name: cmsData?.founder1Name || "Harsh",
            f1Role: cmsData?.founder1Role || "The Nose",
            f2Name: cmsData?.founder2Name || "Yomesh",
            f2Role: cmsData?.founder2Role || "The Eye",
        },
        footer: {
            title: cmsData?.footerTitle || "Define Your Presence.",
            desktop: cmsData?.footerImageDesktop || footer_bg_desktop,
            mobile: cmsData?.footerImageMobile || footer_bg_mobile,
        }
    };

    const handleImageLoad = () => {
        ScrollTrigger.refresh();
    };

    // 3. ANIMATIONS
    useLayoutEffect(() => {
        if (loading) return; 

        window.scrollTo(0, 0);
        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();
            
            // --- Hero Animation ---
            // Starts small (30vw) and expands to a contained box (85vw), never full screen.
            const heroTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".hero-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1,
                    pin: true,
                    invalidateOnRefresh: true, 
                }
            });
            heroTl.to(".hero-title", { scale: 0.6, opacity: 0, y: -100 }, 0)
                  .fromTo(".hero-image-mask", 
                      { width: "30vw", borderRadius: "200px" }, 
                      { width: "85vw", height: "80vh", borderRadius: "40px", scale: 1, ease: "power2.inOut" }, 
                  0);

            // --- Horizontal Scroll ---
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
                        end: () => "+=" + horizontalSection.offsetWidth, 
                        invalidateOnRefresh: true
                    }
                });
            }

            // --- Founders ---
            gsap.fromTo(".founder-img-anim",
                { scale: 1.05, filter: "grayscale(100%)" },
                { scale: 1, filter: "grayscale(0%)", duration: 1.5, ease: "power2.out", 
                  scrollTrigger: { trigger: ".founder-section", start: "top 60%", end: "bottom top", scrub: 1 }
                }
            );

            gsap.fromTo(".founder-text-anim",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", 
                  scrollTrigger: { trigger: ".founder-section", start: "top 60%", toggleActions: "play none none reverse" } 
                }
            );

            // --- Footer ---
            gsap.fromTo(".footer-card-anim", 
                { clipPath: "inset(20% 10% 20% 10% round 60px)", scale: 0.95, filter: "brightness(0.2)" },
                { clipPath: "inset(0% 0% 0% 0% round 48px)", scale: 1, filter: "brightness(1)", duration: 1.5, ease: "power4.out",
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

        const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => { ctx.revert(); clearTimeout(timer); };
    }, [loading]);

    if (loading) return <Loader />;

    return (
        <PageTransition>
            <div ref={containerRef} className="text-[#1a1a1a] w-full overflow-hidden ">

                {/* --- HEADER --- */}
                <section className="py-24 px-6 md:px-20 text-[#0F0F0F] bg-white">
                    <div className="max-w-[1600px] mx-auto text-center about-us-heading-container">
                        <div className="about-us-heading-anim">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm text-neutral-500">
                                <Star size={12} className="text-yellow-600" /> Our Heritage
                            </span>
                            <h1 className="text-5xl md:text-7xl font-serif font-medium mb-4 text-[#1a1a1a]">
                                The Story Behind Devid Aura 
                            </h1>
                            <p className="text-xl text-neutral-500 max-w-3xl mx-auto font-light">
                                We believe in the invisible power of scent to define presence. 
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- HERO PARALLAX --- */}
                <section className="hero-section h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-white">
                    <div className="hero-title z-20 text-center mix-blend-difference text-white will-change-transform">
                        <h1 className="text-[12vw] text-[#0F0F0F] font-bold inline-block whitespace-nowrap">
                            {content.heroTitle}
                        </h1>
                        <p className="text-xl text-[#333] mt-8 tracking-widest uppercase font-bold">{content.heroSubtitle}</p>
                    </div>
                    
                    <div className="hero-image-mask absolute z-10 w-[30vw] h-[60vh] rounded-[200px] overflow-hidden shadow-2xl">
                        <img src={content.heroImage} alt="Hero Bottle" className="w-full h-full object-cover" onLoad={handleImageLoad} />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </section>

                {/* --- PILLARS (HORIZONTAL SCROLL) --- */}
                <div className="horizontal-wrapper h-screen w-full  relative">
                    <div className="horizontal-scroll flex h-full w-[300vw] will-change-transform">
                        
                        {/* Slide 1: UP Position */}
                        {/* pt-20 on mobile (was 32), items-start to allow text flow below */}
                        <div className="h-slide w-screen h-full flex items-start justify-center px-6 pt-20 md:pt-0 md:items-center md:px-12">
                            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center">
                                {/* Image: h-[40vh] on mobile to save space, h-[55vh] on desktop */}
                                <div className="relative h-[40vh] md:h-[55vh] w-full rounded-[32px] overflow-hidden shadow-lg bg-gray-200">
                                    <img src={content.pillar1.image} alt="Ingredients" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="mb-4 md:mb-6 flex items-center gap-3">
                                        <Sun className="w-6 h-6 text-[#1a1a1a] opacity-80" strokeWidth={1} />
                                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500">01. INGREDIENTS</span>
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-serif mb-6 md:mb-8 text-[#1a1a1a] leading-tight">
                                        {content.pillar1.title.split(" ")[0]} <br /> 
                                        <span className="italic text-neutral-400 font-light">{content.pillar1.title.split(" ").slice(1).join(" ")}</span>
                                    </h2>
                                    <p className="text-base md:text-xl text-neutral-500 leading-relaxed font-light max-w-md">
                                        {content.pillar1.desc}
                                    </p>
                                    <div className="w-12 h-[1px] bg-neutral-300 mt-8 md:mt-12"></div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 2: DOWN Position */}
                        <div className="h-slide w-screen h-full flex items-start justify-center px-6 pt-20 md:pt-0 md:items-center md:px-12">
                            {/* mt-12 on mobile (was 24) to create wave without hiding text */}
                            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center mt-12 md:mt-0 md:pt-20"> 
                                <div className="relative h-[40vh] md:h-[55vh] w-full rounded-[32px] overflow-hidden shadow-lg bg-gray-200 order-1 md:order-1">
                                    <img src={content.pillar2.image} alt="Alchemy" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" />
                                </div>
                                <div className="flex flex-col justify-center order-2 md:order-2">
                                    <div className="mb-4 md:mb-6 flex items-center gap-3">
                                        <Droplets className="w-6 h-6 text-[#1a1a1a] opacity-80" strokeWidth={1} />
                                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500">02. ALCHEMY</span>
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-serif mb-6 md:mb-8 text-[#1a1a1a] leading-tight">
                                        {content.pillar2.title.split(" ")[0]} <br /> 
                                        <span className="italic text-neutral-400 font-light">{content.pillar2.title.split(" ").slice(1).join(" ")}</span>
                                    </h2>
                                    <p className="text-base md:text-xl text-neutral-500 leading-relaxed font-light max-w-md">
                                        {content.pillar2.desc}
                                    </p>
                                    <div className="w-12 h-[1px] bg-neutral-300 mt-8 md:mt-12"></div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 3: UP Position */}
                        <div className="h-slide w-screen h-full flex items-start justify-center px-6 pt-20 md:pt-0 md:items-center md:px-12">
                            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center">
                                <div className="relative h-[40vh] md:h-[55vh] w-full rounded-[32px] overflow-hidden shadow-lg bg-gray-200">
                                    <img src={content.pillar3.image} alt="Identity" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="mb-4 md:mb-6 flex items-center gap-3">
                                        <Fingerprint className="w-6 h-6 text-[#b08d55] opacity-80" strokeWidth={1} />
                                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500">03. IDENTITY</span>
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-serif mb-6 md:mb-8 text-[#1a1a1a] leading-tight">
                                        {content.pillar3.title.split(" ")[0]} <br /> 
                                        <span className="italic text-neutral-400 font-light">{content.pillar3.title.split(" ").slice(1).join(" ")}</span>
                                    </h2>
                                    <p className="text-base md:text-xl text-neutral-500 leading-relaxed font-light max-w-md">
                                        {content.pillar3.desc}
                                    </p>
                                    <div className="w-12 h-[1px] bg-neutral-300 mt-8 md:mt-12"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- FOUNDERS SECTION --- */}
                <section className="founder-section relative py-32 bg-white text-[#1a1a1a] overflow-hidden">
                    <div className="max-w-[1400px] px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-48 items-center">
                        
                        <div className="w-full flex justify-center lg:justify-end">
                             <div className="relative w-full max-w-md aspect-[3/4] rounded-[32px] overflow-hidden bg-gray-100 shadow-xl">
                                <img src={content.founders.image} alt="Founders" className="founder-img-anim w-full h-full object-cover grayscale transition-all duration-700" />
                            </div>
                        </div>

                        <div className="flex flex-col justify-center relative z-10">
                            <div className="founder-text-anim mb-10">
                                <span className="inline-block border-b-2 border-black pb-2 text-xs font-bold tracking-[0.25em] uppercase text-[#1a1a1a]">
                                    The Visionaries
                                </span>
                            </div>
                            <h2 className="founder-text-anim text-5xl md:text-7xl font-serif leading-tight mb-8 text-[#1a1a1a]">
                                {content.founders.title.split(" ")[0]} <br/> 
                                <span className="text-neutral-300 italic font-light">{content.founders.title.split(" ").slice(1).join(" ")}</span>
                            </h2>
                            <div className="founder-text-anim relative mb-10 pl-2">
                                <Quote className="w-8 h-8 text-neutral-200 fill-neutral-100 mb-4 transform scale-x-[-1]" />
                                <p className="text-xl md:text-2xl text-neutral-500 font-serif italic leading-relaxed">
                                    "{content.founders.quote}"
                                </p>
                            </div>
                            <div className="founder-text-anim space-y-6 text-neutral-500 max-w-lg leading-relaxed font-light text-base md:text-lg">
                                <p>{content.founders.desc}</p>
                            </div>
                            <div className="founder-text-anim mt-16 flex items-start gap-16">
                                <div className="flex flex-col gap-2">
                                    <p className="text-3xl font-serif text-[#1a1a1a]">{content.founders.f1Name}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">{content.founders.f1Role}</p>
                                </div>
                                <div className="h-full py-2">
                                     <div className="w-12 h-[1px] bg-neutral-200 mt-4"></div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-3xl font-serif text-[#1a1a1a]">{content.founders.f2Name}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">{content.founders.f2Role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- FOOTER --- */}
                <section className="footer-wrapper w-full bg-white pb-20 pt-10 flex justify-center items-center">
                    <div className="footer-card-anim relative w-[94%] h-[60vh] md:h-[70vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-black">
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <picture>
                                <source media="(max-width: 767px)" srcSet={content.footer.mobile} />
                                <img src={content.footer.desktop} alt="Footer" className="footer-bg-parallax w-full h-full object-cover object-center" />
                            </picture>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 z-10 pointer-events-none"></div>
                        <div className="relative z-30 h-full flex flex-col justify-end items-center pb-12 md:pb-20">
                            <h2 className="hidden md:block footer-content-reveal text-3xl md:text-6xl font-serif text-white mb-10 text-center px-4" style={{ opacity: 0 }}>
                                {content.footer.title}
                            </h2>
                            <button className="footer-content-reveal group relative px-8 py-3 md:px-12 md:py-4 bg-white text-black rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.05]" style={{ opacity: 0 }}>
                                <span className="relative z-10 font-bold tracking-widest uppercase text-xs md:text-xs flex items-center gap-3">
                                    Shop Collection <ArrowRight className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 bg-neutral-200 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                            </button>
                        </div>
                    </div>
                </section>

                <style>{`.animate-spin-slow { animation: spin 15s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </PageTransition>
    );
}