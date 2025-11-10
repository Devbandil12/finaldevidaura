import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// --- NEW: Added Gem and Heart, removed Link2 and Shield ---
import { Leaf, Gem, Heart, Sparkles, Crown } from 'lucide-react';
import HeroImage from "../assets/images/our-story.png";

gsap.registerPlugin(ScrollTrigger);

// Royalty-free Unsplash image URLs
const FOUNDERS_IMG = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto-format&fit=crop&w=1600&q=80';
const BOTANICALS_IMG = 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto-format&fit=crop&w=1600&q=80';
const OUTRO_IMG = 'https://images.unsplash.com/photo-1621311290280-7d1469c2d575?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D3%D&auto-format&fit=crop&q=80&w=1170';

// Reusable Skeleton/Lazy Image Component
const LazyImage = ({ src, alt, className, eager = false, loading: loadingProp, ...rest }) => {
    const [isLoaded, setIsLoaded] = useState(eager);
    const loadingStrategy = eager ? 'eager' : (loadingProp || 'lazy');

    return (
        <div className={`relative ${className} bg-gray-100`}>
            <img
                src={src}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading={loadingStrategy}
                onLoad={() => setIsLoaded(true)}
                {...rest}
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
        </div>
    );
};

// --- Main AboutUs Component ---
export default function AboutUs() {

    // Refs for all animated elements
    const mainRef = useRef(null);
    const heroImageRef = useRef(null);
    const heroTextRef = useRef(null);
    const heroHeadingRef = useRef(null);
    const heroSubheadingRef = useRef(null);

    const foundersImageRef = useRef(null);
    const foundersTextRef = useRef(null);

    // --- REFS FOR NEW PILLAR DESIGN ---
    const pillarsHeadingRef = useRef(null);
    const pillarsSubheadingRef = useRef(null);
    const pillarsDescriptionRef = useRef(null);
    const pillar1IconRef = useRef(null);
    const pillar1TextRef = useRef(null);
    const pillar2IconRef = useRef(null);
    const pillar2TextRef = useRef(null);
    const pillar3IconRef = useRef(null);
    const pillar3TextRef = useRef(null);

    const processTextRef = useRef(null);
    const processImageRef = useRef(null);

    const outroImageRef = useRef(null);
    const outroTextRef = useRef(null);
    const outroHeadingRef = useRef(null);
    const outroSubheadingRef = useRef(null);
    const outroButtonRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {

            const smoothEase = 'power4.out';
            const gpuBoost = { force3D: true };
            const animStyle = {
                visibility: 'hidden',
                willChange: 'transform, opacity'
            };

            // --- Hero Section (Animate on Load) ---
            const heroTl = gsap.timeline({ delay: 0.3 });
            heroTl
                .fromTo(heroImageRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5, ease: 'power2.out', ...gpuBoost })
                .fromTo(heroTextRef.current, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.0")
                .fromTo(heroHeadingRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.2")
                .fromTo(heroSubheadingRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.2");

            // --- Founders Section (Animate on Scroll) ---
            gsap.fromTo(foundersImageRef.current, { autoAlpha: 0, x: -50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: foundersImageRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            gsap.fromTo(foundersTextRef.current, { autoAlpha: 0, x: 50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: foundersTextRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });

            // --- NEW PILLARS SECTION ANIMATION ---
            const pillarsTl = gsap.timeline({
                scrollTrigger: { trigger: pillarsHeadingRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            pillarsTl
                .fromTo(pillarsHeadingRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: smoothEase, ...gpuBoost })
                .fromTo(pillarsSubheadingRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: smoothEase, ...gpuBoost }, "-=0.8")
                .fromTo(pillarsDescriptionRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: smoothEase, ...gpuBoost }, "-=0.8");

            // Pillar 1 Animation
            gsap.fromTo(pillar1IconRef.current, { autoAlpha: 0, x: -50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar1IconRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            gsap.fromTo(pillar1TextRef.current, { autoAlpha: 0, x: 50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar1TextRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });

            // Pillar 2 Animation (Reversed)
            gsap.fromTo(pillar2TextRef.current, { autoAlpha: 0, x: -50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar2TextRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            gsap.fromTo(pillar2IconRef.current, { autoAlpha: 0, x: 50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar2IconRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });

            // Pillar 3 Animation
            gsap.fromTo(pillar3IconRef.current, { autoAlpha: 0, x: -50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar3IconRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            gsap.fromTo(pillar3TextRef.current, { autoAlpha: 0, x: 50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: pillar3TextRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            // --- END OF NEW PILLARS ANIMATION ---

            // --- Process Section (Animate on Scroll) ---
            gsap.fromTo(processTextRef.current, { autoAlpha: 0, x: -40 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: processTextRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            gsap.fromTo(processImageRef.current, { autoAlpha: 0, x: 50 }, {
                autoAlpha: 1, x: 0, duration: 1.2, ease: smoothEase, ...gpuBoost,
                scrollTrigger: { trigger: processImageRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });

            // --- Outro Section (Animate on Scroll) ---
            const outroTl = gsap.timeline({
                scrollTrigger: { trigger: outroImageRef.current, start: 'top 85%', toggleActions: 'play none none none' }
            });
            outroTl
                .fromTo(outroImageRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5, ease: 'power2.out', ...gpuBoost })
                .fromTo(outroTextRef.current, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.0")
                .fromTo(outroHeadingRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.2")
                .fromTo(outroSubheadingRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: smoothEase, ...gpuBoost }, "-=1.2")
                .fromTo(outroButtonRef.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: smoothEase, ...gpuBoost }, "-=1.2");

        }, mainRef);

        return () => ctx.revert();
    }, []);

    // --- NEW PILLAR CONTENT ---
    const pillars = [
        {
            icon: <Leaf className="h-16 w-16" />,
            title: 'The Essence',
            text: 'We believe in radical purity. Our scents are sourced from the world\'s most pristine environments—from Haitian vetiver to Bulgarian roses. No synthetics, no shortcuts. Just the raw, untamed spirit of nature, bottled.',
            refIcon: pillar1IconRef,
            refText: pillar1TextRef,
            order: ''
        },
        {
            icon: <Heart className="h-16 w-16" />,
            title: 'The Connection',
            text: 'A fragrance is a memory in the making. It\'s the silent language between souls, the bond between a moment and a feeling. Our creations are designed to connect—to your skin, your story, and the world you touch.',
            refIcon: pillar2IconRef,
            refText: pillar2TextRef,
            order: 'lg:order-last' // This will reverse the order on desktop
        },
        {
            icon: <Gem className="h-16 w-16" />,
            title: 'The Craft',
            text: 'Patience is our most precious ingredient. Each fragrance is meticulously blended by master perfumers and aged in small batches. This slow, deliberate process ensures unparalleled depth and character.',
            refIcon: pillar3IconRef,
            refText: pillar3TextRef,
            order: ''
        },
    ];

    const sectionPadding = "py-16 md:py-24 px-4 md:px-8";

    // This style prop will be added to all animated elements
    const animStyle = {
        visibility: 'hidden',
        willChange: 'transform, opacity'
    };

    return (
        <div ref={mainRef} className="relative overflow-hidden ">

            {/* Hero Section - Card 1 */}
            <section className={`w-full ${sectionPadding} pt-0`} >
                <div className="text-center mb-10 px-4 mt-24">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight drop-shadow-md">
                        Our Scent Philosophy
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600">
                        A commitment to quality, artistry, and the moments that define you.
                    </p>
                </div>
                <div className="max-w-9xl mx-auto rounded-3xl overflow-hidden shadow-[0_8px_12px_rgba(230,229,229,0.3)] relative h-[50vh] flex flex-col items-center justify-center text-center">
                    <div
                        ref={heroImageRef}
                        style={animStyle}
                        className="absolute inset-0 w-full h-full"
                    >
                        <img
                            src={HeroImage}
                            alt="Luxury perfume bottle with artistic shadows - Devid Aura"
                            className="w-full h-full object-cover object-center"
                            loading="eager"
                            fetchPriority="high"
                        />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/30" />
                    <div
                        ref={heroTextRef}
                        style={animStyle}
                        className="relative z-10 px-6 max-w-4xl mx-auto text-white"
                    >
                        <h1
                            ref={heroHeadingRef}
                            style={animStyle}
                            className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight drop-shadow-lg"
                        >
                            Our Story
                        </h1>
                        <p
                            ref={heroSubheadingRef}
                            style={animStyle}
                            className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-200 leading-relaxed"
                        >
                            The bond of two friends, a shared dream, and the fragrance that became their aura.
                        </p>
                    </div>
                </div>
            </section>

            {/* Founders Section */}
            <section className="relative py-12 px-6 md:px-12 bg-white">
                <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div
                        ref={foundersImageRef}
                        style={animStyle}
                        className="relative"
                    >
                        <div className="rounded-3xl overflow-hidden shadow-[0_8px_12px_rgba(230,229,229,0.3)] group relative h-[600px]">
                            <LazyImage
                                src={FOUNDERS_IMG}
                                alt="Founders of Devid Aura: Harshvardhan Singh Jadon and Yomesh Chaudhary"
                                className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-8 left-8 text-white">
                                <h3 className="font-display text-3xl font-semibold mb-2">
                                    
                                </h3>
                                <p className="text-gray-300 text-sm tracking-widest uppercase">
                                
                                </p>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={foundersTextRef}
                        style={animStyle}
                        className="space-y-6"
                    >
                        <span className="text-neutral-500 text-sm font-semibold tracking-widest uppercase">
                            The Beginning
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-semibold leading-tight text-neutral-800">
                            From Friendship to Fragrance
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-neutral-800 to-neutral-400 rounded-full" />
                        <blockquote className="border-l-4 border-neutral-800 pl-6 italic text-lg text-neutral-600 my-8">
                            "We didn’t know how to start a business, but we knew what we wanted to create — a scent that carries emotion, trust, and identity."
                        </blockquote>
                        <div className="space-y-4 text-neutral-700 leading-relaxed">
                            <p>
                                Devid Aura was born from the unwavering trust between two childhood friends. United by a dream and guided by passion, They built more than a perfume brand — they built an experience that reflects who you are.
                            </p>
                            <p>
                                With no roadmap but endless determination, their journey transformed mistakes into lessons and curiosity into art. Every bottle of Devid Aura holds that story.
                            </p>
                            <p className="font-medium text-neutral-800">
                                This is not just fragrance. It’s aura — your essence, reimagined.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- NEW PREMIUM PILLARS SECTION --- */}
            <section className="relative py-24 px-6 md:px-12 bg-white">
                <div className="max-w-5xl mx-auto text-center mb-20">
                    <span
                        ref={pillarsHeadingRef}
                        style={animStyle}
                        className="text-neutral-500 text-xs tracking-[0.25em] uppercase"
                    >
                        Our Pillars
                    </span>
                    <h2
                        ref={pillarsSubheadingRef}
                        style={animStyle}
                        className="text-4xl md:text-6xl font-display font-semibold tracking-tight mt-3 text-neutral-800"
                    >
                        Built on Conviction
                    </h2>
                    <p
                        ref={pillarsDescriptionRef}
                        style={animStyle}
                        className="text-neutral-600 text-lg max-w-2xl mx-auto mt-6 leading-relaxed"
                    >
                        Three principles guide every scent we create, from the raw ingredient to the final experience.
                    </p>
                </div>

                {/* New Alternating Layout */}
                <div className="max-w-6xl mx-auto space-y-20">
                    {pillars.map((pillar) => (
                        <div key={pillar.title} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                            {/* Icon Column */}
                            <div
                                ref={pillar.refIcon}
                                style={animStyle}
                                className={`flex justify-center ${pillar.order}`}
                            >
                                <div className="w-full max-w-xs lg:max-w-none h-64 lg:h-80 bg-neutral-100 rounded-3xl flex items-center justify-center text-neutral-600 p-6 shadow-[0_8px_12px_rgba(230,229,229,0.3)]">
                                    {pillar.icon}
                                </div>
                            </div>
                            {/* Text Column */}
                            <div ref={pillar.refText} style={animStyle}>
                                <h3 className="text-3xl md:text-4xl font-semibold text-neutral-800 mb-4">{pillar.title}</h3>
                                <p className="text-lg text-neutral-600 leading-relaxed">
                                    {pillar.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {/* --- END OF NEW PILLARS SECTION --- */}


            {/* Process Section */}
            <section className="relative py-12 px-6 md:px-12 bg-neutral-50">
                <div className="max-w-8xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div
                        ref={processTextRef}
                        style={animStyle}
                        className="space-y-6"
                    >
                        <span className="text-neutral-500 text-sm font-semibold tracking-widest uppercase">
                            The Process
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-semibold leading-tight text-neutral-800">
                            The Craft of Aura
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-neutral-800 to-neutral-400 rounded-full" />
                        <div className="space-y-6 mt-8">
                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-neutral-800 group-hover:bg-neutral-800 group-hover:text-white transition-all shadow-sm shadow-black/5">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2 text-neutral-800">Ethical Origins</h4>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Our ingredients are gathered from ethical sources worldwide — distilled with respect for both craft and planet.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-neutral-800 group-hover:bg-neutral-800 group-hover:text-white transition-all shadow-sm shadow-black/5">
                                    <Crown className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2 text-neutral-800">Artisanal Blending</h4>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Each blend is balanced through instinct and memory — where science meets soul to create timeless harmony.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-neutral-800 group-hover:bg-neutral-800 group-hover:text-white transition-all shadow-sm shadow-black/5">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2 text-neutral-800">Aged in Emotion</h4>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Every fragrance matures in time, absorbing depth and character — much like the journey that created it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={processImageRef}
                        style={animStyle}
                        className="relative"
                    >
                        <div className="rounded-3xl overflow-hidden shadow-xl shadow-black/5 relative h-[600px]">
                            <LazyImage
                                src={BOTANICALS_IMG}
                                alt="Botanical perfume creation with natural ingredients"
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA / Emotional Outro Section - Card 4 */}
            <section className={`w-full ${sectionPadding} pt-0 pb-16`}>
                <div className="max-w-9xl mx-auto rounded-3xl overflow-hidden shadow-[0_8px_12px_rgba(230,229,229,0.3)] relative h-[50vh] flex flex-col items-center justify-center text-center">
                    <div
                        ref={outroImageRef}
                        style={animStyle}
                        className="absolute inset-0 w-full h-full"
                    >
                        <LazyImage
                            src={OUTRO_IMG}
                            alt="Background of a person feeling confident to 'Feel the Aura'"
                            className="w-full h-full"
                            loading="lazy"
                            eager={false}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/30" />
                    <div
                        ref={outroTextRef}
                        style={animStyle}
                        className="relative z-10 px-6 max-w-4xl mx-auto text-white"
                    >
                        <h2
                            ref={outroHeadingRef}
                            style={animStyle}
                            className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight drop-shadow-lg"
                        >
                            Feel the Aura
                        </h2>
                        <p
                            ref={outroSubheadingRef}
                            style={animStyle}
                            className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-200 leading-relaxed mb-10"
                        >
                            More than a perfume — it’s a presence that moves with you.
                            A silent language of confidence, elegance, and truth.
                        </p>
                        <button
                            ref={outroButtonRef}
                            style={animStyle}
                            className="inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-[0_8px_12px_rgba(230,229,229,0.3)] hover:shadow-black/10 transition-all hover:scale-105"
                        >
                            Explore Collection
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}