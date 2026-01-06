// src/Components/Footer.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white text-[var(--color-black)] pt-24 pb-12 border-t border-gray-100">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand */}
          <div className="space-y-6">
            <h2 className="font-heading text-4xl">Devid Aura</h2>
            <p className="text-gray-500 font-light leading-relaxed max-w-sm">
              An olfactory signature. A presence unseen but always felt.
              Crafted for those who leave a mark.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-[var(--color-gold)]">Explore</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li onClick={() => navigate('/')} className="cursor-pointer hover:text-black transition-colors">Home</li>
              <li onClick={() => navigate('/products')} className="cursor-pointer hover:text-black transition-colors">Collection</li>
              <li onClick={() => navigate('/about')} className="cursor-pointer hover:text-black transition-colors">Our Heritage</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-[var(--color-gold)]">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="cursor-pointer hover:text-black transition-colors">Privacy Policy</li>
              <li className="cursor-pointer hover:text-black transition-colors">Terms of Service</li>
              <li className="cursor-pointer hover:text-black transition-colors">Refund Policy</li>
            </ul>
          </div>
          
          {/* Newsletter (Optional) */}
          <div>
             <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-[var(--color-gold)]">Stay Connected</h4>
             <div className="flex border-b border-gray-300 pb-2">
                <input type="email" placeholder="Email Address" className="w-full bg-transparent outline-none text-sm" />
                <button className="text-xs uppercase font-bold hover:text-[var(--color-gold)]">Join</button>
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Devid Aura. All rights reserved.</p>
          <p className="mt-2 md:mt-0 font-heading">Designed with Precision</p>
        </div>
      </div>
    </footer>
  );
}