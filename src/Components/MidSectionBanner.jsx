import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react'; // Make sure to install lucide-react if not present

const MidSectionBanner = ({ index = 0 }) => {
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";

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
  }, [index]);

  if (!banner) return null;

  return (
    <section className="w-full py-16 px-4 md:px-8 bg-white">
       <div 
         onClick={() => navigate(banner.link)} 
         className="relative w-full max-w-[1600px] mx-auto h-[300px] md:h-[500px] rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl"
       >
          {/* Background Image with Zoom Effect */}
          <img 
            src={banner.imageUrl} 
            alt={banner.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-500" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
             <h2 className="text-4xl md:text-6xl font-serif mb-6 drop-shadow-md tracking-wide">
                {banner.title}
             </h2>
             
             {banner.subtitle && (
                <p className="text-sm md:text-lg font-light tracking-[0.3em] uppercase mb-10 opacity-90">
                   {banner.subtitle}
                </p>
             )}

             {/* Redesigned Button */}
             <button className="group/btn relative px-8 py-3 rounded-full border border-white/50 bg-white/10 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-white hover:border-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <span className="relative z-10 flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-white transition-colors duration-500 group-hover/btn:text-black">
                   {banner.buttonText}
                   <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </span>
             </button>
          </div>
       </div>
    </section>
  );
};

export default MidSectionBanner;