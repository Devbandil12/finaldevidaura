import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Star, ShieldCheck } from 'lucide-react';

const MidSectionBanner = ({ index = 0 }) => {
    const [banner, setBanner] = useState(null);
    const [isVisible, setIsVisible] = useState(false); 
    const sectionRef = useRef(null); 
    const navigate = useNavigate();
    
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
    const isEven = index % 2 === 0;

    // 1. DATA FETCHING
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/cms/banners`)
            .then(res => res.json())
            .then(data => {
                const midBanners = data
                    .filter(b => b.type === 'mid_section' && b.isActive)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                if (midBanners[index]) {
                    setBanner(midBanners[index]);
                }
            })
            .catch(err => console.error(err));
    }, [index, BACKEND_URL]);

    // 2. SCROLL TRIGGER ANIMATION LOGIC
    useEffect(() => {
        if (!banner) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 } 
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [banner]);

    if (!banner) return null;

    return (
        <section 
            ref={sectionRef}
            className="w-full py-16 px-4 md:px-8 flex justify-center items-center overflow-hidden"
        >
            {/* === MAIN CARD CONTAINER === */}
            <div
                onClick={() => navigate(banner.link)}
                className={`
                    group relative w-full max-w-[1500px] bg-white rounded-[2.5rem] p-8 md:p-12 
                    cursor-pointer border border-white isolate
                    transition-all duration-1000 ease-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}
                    hover:-translate-y-2 hover:shadow-2xl
                `}
            >

                {/* LAYOUT GRID: 40% Text / 60% Image */}
                <div className={`relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center`}>

                    {/* --- TEXT SECTION (Span 2) --- */}
                    <div className={`flex flex-col gap-6 lg:col-span-2 ${!isEven ? 'lg:order-2' : 'lg:order-1'}`}>

                        {/* Badge & Meta */}
                        <div className={`flex items-center gap-4 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                            <span className="px-4 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-neutral-900/20">
                                {isEven ? 'New Arrival' : 'Featured'}
                            </span>
                            <span className="text-sm  text-neutral-400">
                                #{index + 1} · Collection
                            </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <h2 className="text-3xl md:text-5xl  text-neutral-900 leading-[1.1] mb-4 group-hover:text-black transition-colors">
                                {banner.title}
                            </h2>

                            {banner.subtitle && (
                                <p className="text-base text-neutral-600 font-light leading-relaxed max-w-prose">
                                    {banner.subtitle}
                                </p>
                            )}
                        </div>

                        {/* STATIC ICONS */}
                        <div className={`flex items-center gap-6 py-5 border-y border-neutral-100 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-50 rounded-lg">
                                    <ShieldCheck size={18} className="text-neutral-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400">Quality</p>
                                    <p className="text-sm font-bold text-neutral-900">Verified</p>
                                </div>
                            </div>
                            <div className="h-8 w-[1px] bg-neutral-200"></div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-50 rounded-lg">
                                    <Star size={18} className="text-neutral-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400">Rating</p>
                                    <p className="text-sm font-bold text-neutral-900">Top Tier</p>
                                </div>
                            </div>
                        </div>

                        {/* Button - FIXED HOVER TIMING */}
                        <button className={`
                            relative inline-flex items-center gap-4 self-start px-8 py-4 rounded-full border border-neutral-200 bg-white 
                            text-neutral-900 font-bold text-xs uppercase tracking-widest overflow-hidden 
                            
                            /* Base Animation (Entrance) */
                            transition-all duration-1000 delay-700 
                            
                            /* Hover Overrides (Make interaction snappy) */
                            hover:delay-0 hover:duration-300
                            
                            hover:border-neutral-900 hover:text-white shadow-sm hover:shadow-lg
                            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                        `}>
                            <span className="relative z-10">{banner.buttonText}</span>
                            <ArrowRight size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                            <div className="absolute inset-0 bg-neutral-900 scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100" />
                        </button>
                    </div>

                    {/* --- IMAGE SECTION (Span 3 - Wider) --- */}
                    <div className={`relative w-full lg:col-span-3 ${!isEven ? 'lg:order-1' : 'lg:order-2'}`}>

                        {/* Main Image */}
                        <div className="relative w-full h-[320px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl bg-neutral-100">
                            <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none" />
                        </div>

                        {/* Floating Glass Card */}
                        <div className={`
                             absolute -bottom-6 ${isEven ? '-left-6' : '-right-6'} 
                             w-60 p-5 rounded-2xl 
                             bg-white/90 backdrop-blur-xl border border-white/60 
                             shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]
                             transition-all duration-700 ease-out delay-700
                             hidden md:block
                             ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
                             group-hover:-translate-y-4 group-hover:scale-[1.02]
                        `}>
                            <div className="flex items-center justify-between mb-2 border-b border-neutral-200/60 pb-2">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Spotlight</span>
                                <Zap size={14} className="text-amber-500 fill-amber-500" />
                            </div>
                            <p className="text-sm font-semibold text-neutral-900 leading-snug">
                                Explore this exclusive collection.
                            </p>
                            <div className="flex gap-0.5 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={10} className="fill-neutral-900 text-neutral-900" />
                                ))}
                            </div>
                        </div>

                        {/* Corner Stamp Animation */}
                        <div className={`
                            absolute -top-4 ${isEven ? '-right-4' : '-left-4'} 
                            w-16 h-16 rounded-full 
                            bg-neutral-900 text-white 
                            flex items-center justify-center 
                            shadow-2xl shadow-neutral-900/30
                            transition-all duration-700 delay-1000
                            ${isVisible ? 'scale-100 rotate-12 opacity-100' : 'scale-0 rotate-0 opacity-0'}
                            group-hover:rotate-[30deg]
                        `}>
                            <Sparkles size={20} />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default MidSectionBanner;