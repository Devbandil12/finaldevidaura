import React, { useState } from 'react';
import { Monitor, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerManager from '../../features/admin/components/cms/BannerManager';
import AboutUsManager from '../../features/admin/components/cms/AboutUsManager';

const CmsTab = () => {
  const [mainView, setMainView] = useState('banners'); 

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn font-body transition-colors duration-300 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
        <div>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] tracking-tight">Content Manager</h2>
            <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">Design your store's visual journey.</p>
        </div>
        
        {/* REFINED TOGGLE */}
        <div className="flex bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] shadow-sm">
            <button 
                onClick={() => setMainView('banners')} 
                className={`px-6 md:px-8 py-3 rounded-lg font-body font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all duration-300 ${
                  mainView === 'banners' 
                    ? 'bg-[var(--brand)] text-[var(--surface)] shadow-[var(--shadow-strong)]' 
                    : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'
                }`}
            >
                <Monitor size={18} strokeWidth={1.5} /> Home Banners
            </button>
            <button 
                onClick={() => setMainView('about')} 
                className={`px-6 md:px-8 py-3 rounded-lg font-body font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all duration-300 ${
                  mainView === 'about' 
                    ? 'bg-[var(--brand)] text-[var(--surface)] shadow-[var(--shadow-strong)]' 
                    : 'text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-muted)]'
                }`}
            >
                <BookOpen size={18} strokeWidth={1.5} /> About Us
            </button>
        </div>
      </div>

      {/* VIEW RENDERER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {mainView === 'banners' ? <BannerManager /> : <AboutUsManager />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CmsTab;