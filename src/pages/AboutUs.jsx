import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Star, Hexagon, Quote, Droplets, Sun, Fingerprint } from 'lucide-react'; 
import PageTransition from "./PageTransition";
import Loader from "../Components/Loader"; // Ensure you have this component

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
    // 🟢 State for CMS Data
    const [cmsData, setCmsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

    // 🟢 1. FETCH DATA FROM CMS
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

    // 🟢 2. MERGE CMS DATA WITH DEFAULTS
    const content = {
        heroTitle: cmsData?.heroTitle || "DEVID AURA",
        heroSubtitle: cmsData?.heroSubtitle || "Est. 2023",
        heroImage: cmsData?.heroImage || hero,
        
        pillar1: {
            title: cmsData?.pillar1Title || "Unrefined Nature.",
            desc: cmsData?.pillar1Desc || "We harvest when the sun is highest. Petals, roots, and resins gathered by hand.",
            image: cmsData?.pillar1Image || pillar_1
        },
        pillar2: {
            title: cmsData?.pillar2Title || "Liquid Patience.",
            desc: cmsData?.pillar2Desc || "Speed is the enemy of luxury. Our blends macerate in glass for 90 days.",
            image: cmsData?.pillar2Image || pillar_2
        },
        pillar3: {
            title: cmsData?.pillar3Title || "The Human Canvas.",
            desc: cmsData?.pillar3Desc || "A perfume is unfinished until it meets your warmth. It is not a mask you wear.",
            image: cmsData?.pillar3Image || pillar_3
        },
        founders: {
            title: cmsData?.foundersTitle || "Architects of Memory.",
            quote: cmsData?.foundersQuote || "We believe that luxury is transparency. We stripped away the marketing noise.",
            desc: cmsData?.foundersDesc || "Harsh & Yomesh founded Devid Aura with a simple premise: to modernize the ancient art of Indian perfumery.",
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

    // 🟢 3. GSAP ANIMATION (Wait for loading to finish)
    useLayoutEffect(() => {
        if (loading) return; // Don't animate until data is ready

        window.scrollTo(0, 0);
        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();
            
            // 1. HERO REVEAL
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
                        end: () => "+=" + horizontalSection.offsetWidth, 
                        invalidateOnRefresh: true
                    }
                });
            }

            // 3. FOUNDERS SECTION
            const founderTrigger = {
                trigger: ".founder-section",
                start: "top 60%",
                toggleActions: "play none none reverse"
            };

            gsap.fromTo(".founder-img-anim",
                { scale: 1.1, opacity: 0.8 },
                { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out", 
                  scrollTrigger: { trigger: ".founder-section", start: "top 70%", end: "bottom top", scrub: 1 }
                }
            );

            gsap.fromTo(".founder-text-anim",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: founderTrigger }
            );

            // 4. FOOTER ANIMATION
            gsap.fromTo(".footer-card-anim", 
                { clipPath: "inset(20% 10% 20% 10% round 60px)", scale: 0.95, filter: "brightness(0.2)" },
                { clipPath: "inset(0% 0% 0% 0% round 48px)", scale: 1, filter: "brightness(1)", duration: 1.5, ease: "power4.out",
                  scrollTrigger: { trigger: ".footer-wrapper", start: "top 85%", end: "bottom bottom", toggleActions: "play none none reverse" }
                }
            );

            mm.add("(min-width: 768px)", () => {
                gsap.fromTo(".footer-bg-parallax", 
                    { scale: 1.2, yPercent: -10 },
                    { scale: 1.2, yPercent: 20, ease: "none",
                      scrollTrigger: { trigger: ".footer-wrapper", start: "top bottom", end: "bottom top", scrub: true }
                    }
                );
            });

            mm.add("(max-width: 767px)", () => {
                gsap.set(".footer-bg-parallax", { scale: 1, yPercent: 0 });
            });

            gsap.fromTo(".footer-content-reveal",
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1,
                  scrollTrigger: { trigger: ".footer-wrapper", start: "top 60%" }
                }
            );

        }, containerRef);

        const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => { ctx.revert(); clearTimeout(timer); };
    }, [loading]); // Only run animation after data loads

    if (loading) return <Loader />;

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#FCFCFA] text-[#1a1a1a] font-sans w-full overflow-hidden">

                {/* 1. ABOUT US HEADING */}
                <section className="py-24 px-6 md:px-20 bg-[#FCFCFA] text-[#0F0F0F]">
                    <div className="max-w-[1600px] mx-auto text-center about-us-heading-container">
                        <div className="about-us-heading-anim">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                                <Star size={12} className="text-yellow-600" /> Our Heritage
                            </span>
                            <h1 className="text-5xl md:text-7xl font-medium mb-4 text-[#1a1a1a]">
                                The Devid Aura Story
                            </h1>
                            <p className="text-xl text-neutral-500 max-w-3xl mx-auto font-light">
                                We believe in the invisible power of scent to define presence. Our journey is one of radical purity and slow, deliberate craft.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. HERO */}
                <section className="hero-section h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#FCFCFA]">
                    <div className="hero-title z-20 text-center mix-blend-difference text-white will-change-transform">
                        <h1 className="text-[12vw] leading-[0.8] font-serif font-bold tracking-tighter text-[#0F0F0F] inline-block whitespace-nowrap">
                            {content.heroTitle}
                        </h1>
                        <p className="text-xl text-[#333] mt-8 tracking-widest uppercase font-bold">{content.heroSubtitle}</p>
                    </div>
                    <div className="hero-image-mask absolute z-10 w-[40vw] h-[60vh] rounded-[200px] overflow-hidden shadow-2xl [will-change:width,height,border-radius,transform]">
                        <img src={content.heroImage} alt="Hero Bottle" fetchPriority="high" decoding="sync" className="w-full h-full object-cover" onLoad={handleImageLoad} />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </section>

                {/* 3. HORIZONTAL SCROLL */}
                <div className="horizontal-wrapper h-screen w-full bg-[#F2F2F2] text-[#1a1a1a] overflow-hidden relative">
                    <div className="horizontal-scroll flex h-full w-[300vw] will-change-transform">
                        {/* Slide 1 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden">
                                <img src={content.pillar1.image} alt="Ingredients" loading="lazy" decoding="async" className="w-full h-full object-cover" onLoad={handleImageLoad} />
                                <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#F2F2F2]">
                                <div className="mb-8">
                                    <Sun className="w-8 h-8 text-yellow-600 mb-4 opacity-80" strokeWidth={1.5} />
                                    <span className="text-xs font-bold tracking-[0.5em] uppercase text-neutral-500">01. Ingredients</span>
                                </div>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">
                                    {content.pillar1.title.split(" ")[0]} <br /> <span className="italic text-neutral-400">{content.pillar1.title.split(" ").slice(1).join(" ")}</span>
                                </h2>
                                <p className="text-xl text-neutral-600 leading-relaxed max-w-md font-light">{content.pillar1.desc}</p>
                            </div>
                        </div>
                        {/* Slide 2 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden order-2 md:order-1">
                                <img src={content.pillar2.image} alt="Alchemy" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#EAEAEA] order-1 md:order-2">
                                <div className="mb-8">
                                    <Droplets className="w-8 h-8 text-blue-900 mb-4 opacity-60" strokeWidth={1.5} />
                                    <span className="text-xs font-bold tracking-[0.5em] uppercase text-neutral-500">02. Alchemy</span>
                                </div>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">
                                    {content.pillar2.title.split(" ")[0]} <br /> <span className="italic text-neutral-400">{content.pillar2.title.split(" ").slice(1).join(" ")}</span>
                                </h2>
                                <p className="text-xl text-neutral-600 leading-relaxed max-w-md font-light">{content.pillar2.desc}</p>
                            </div>
                        </div>
                        {/* Slide 3 */}
                        <div className="h-slide w-screen h-full grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-full w-full overflow-hidden">
                                <img src={content.pillar3.image} alt="Identity" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center px-12 md:px-24 bg-[#F2F2F2]">
                                <div className="mb-8">
                                    <Fingerprint className="w-8 h-8 text-rose-900 mb-4 opacity-60" strokeWidth={1.5} />
                                    <span className="text-xs font-bold tracking-[0.5em] uppercase text-neutral-500">03. Identity</span>
                                </div>
                                <h2 className="text-5xl md:text-8xl font-serif leading-tight mb-8">
                                    {content.pillar3.title.split(" ")[0]} <br /> <span className="italic text-neutral-400">{content.pillar3.title.split(" ").slice(1).join(" ")}</span>
                                </h2>
                                <p className="text-xl text-neutral-600 leading-relaxed max-w-md font-light">{content.pillar3.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. FOUNDERS */}
                <section className="founder-section relative py-32 bg-white text-[#1a1a1a] overflow-hidden">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="relative w-full h-[60vh] lg:h-[80vh] overflow-hidden rounded-sm shadow-xl bg-gray-100">
                            <img src={content.founders.image} alt="Founders" loading="lazy" decoding="async" className="founder-img-anim w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-700 will-change-transform" />
                        </div>
                        <div className="flex flex-col justify-center relative z-10">
                            <div className="founder-text-anim mb-8">
                                <span className="inline-block border-b border-black pb-1 text-xs font-bold tracking-[0.3em] uppercase text-neutral-900">The Visionaries</span>
                            </div>
                            <h2 className="founder-text-anim text-5xl md:text-7xl font-serif leading-[0.9] mb-8 text-black">
                                {content.founders.title.split(" ")[0]} <br/> <span className="text-neutral-400 italic">{content.founders.title.split(" ").slice(1).join(" ")}</span>
                            </h2>
                            <div className="founder-text-anim relative pl-8 border-l border-neutral-300 mb-10">
                                <Quote className="absolute -left-3 -top-3 w-6 h-6 text-neutral-300 fill-neutral-100" />
                                <p className="text-xl md:text-2xl text-neutral-600 font-light italic leading-relaxed">{content.founders.quote}</p>
                            </div>
                            <div className="founder-text-anim space-y-6 text-neutral-500 max-w-lg leading-relaxed font-light">
                                <p>{content.founders.desc}</p>
                            </div>
                            <div className="founder-text-anim mt-12 flex items-center gap-12">
                                <div><p className="font-serif text-2xl text-black">{content.founders.f1Name}</p><p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">{content.founders.f1Role}</p></div>
                                <div className="w-12 h-[1px] bg-neutral-300" />
                                <div><p className="font-serif text-2xl text-black">{content.founders.f2Name}</p><p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">{content.founders.f2Role}</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. FOOTER */}
                <section className="footer-wrapper w-full bg-white pb-20 pt-20 flex justify-center items-center">
                    <div className="footer-card-anim relative w-[90%] h-[60vh] md:h-[70vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-black">
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <picture>
                                <source media="(max-width: 767px)" srcSet={content.footer.mobile} />
                                <img src={content.footer.desktop} alt="Footer" className="footer-bg-parallax w-full h-full object-cover object-center" />
                            </picture>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 z-10 pointer-events-none"></div>
                        <div className="absolute top-10 right-10 z-20 opacity-50"><Hexagon className="w-8 h-8 md:w-12 md:h-12 text-white/40 animate-spin-slow" strokeWidth={0.5} /></div>
                        <div className="relative z-30 h-full flex flex-col justify-end items-center pb-10 md:pb-16">
                            <h2 className="hidden md:block footer-content-reveal text-3xl md:text-5xl font-serif text-white mb-8 text-center px-4" style={{ opacity: 0 }}>
                                {content.footer.title}
                            </h2>
                            <button className="footer-content-reveal group relative px-8 py-3 md:px-14 md:py-5 bg-white text-black rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.05]" style={{ opacity: 0 }}>
                                <span className="relative z-10 font-bold tracking-widest uppercase text-xs md:text-sm flex items-center gap-3">
                                    Shop Collection <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                </span>
                                <div className="absolute inset-0 bg-gray-200 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                            </button>
                        </div>
                    </div>
                </section>

                <style>{`.animate-spin-slow { animation: spin 15s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </PageTransition>
    );
}