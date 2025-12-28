import React from "react";
import { ShieldCheck, Database, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="text-zinc-700 font-sans space-y-12 px-2 pb-6">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Privacy Policy</h2>
        <p className="text-sm text-zinc-500 mt-3 max-w-lg mx-auto leading-relaxed">
          At Devid Aura, we are committed to protecting your personal information. This policy outlines how we handle your data transparently.
        </p>
      </div>

      {/* Grid Layout for Core Info */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Data Collection */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
               <Database size={20} />
            </div>
            <h3 className="text-zinc-900 font-bold text-sm">Information We Collect</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
              <span><strong>Personal:</strong> Name, Shipping Address, Email, Phone Number.</span>
            </li>
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
              <span><strong>Transactional:</strong> Order history and payment confirmation IDs.</span>
            </li>
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
              <span><strong>Technical:</strong> IP address, browser type, and device info for analytics.</span>
            </li>
          </ul>
        </div>

        {/* Data Usage */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100/50">
           <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm text-teal-500">
               <Eye size={20} />
            </div>
            <h3 className="text-zinc-900 font-bold text-sm">How We Use Your Data</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
              <span>Processing and delivering your perfume orders.</span>
            </li>
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
              <span>Sending order updates and tracking information.</span>
            </li>
            <li className="flex gap-3 text-sm text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
              <span>Fraud prevention and ensuring platform security.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Third Party Section */}
      <section>
        <div className="flex items-center justify-center gap-2 mb-6">
            <Server className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Trusted Processors</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <PartnerBadge name="Razorpay" role="Secure Payments" />
          <PartnerBadge name="Clerk" role="Authentication" />
          <PartnerBadge name="Google Analytics" role="Site Performance" />
        </div>
      </section>

      {/* Security Note */}
      <div className="bg-gradient-to-b from-blue-50/40 to-white border border-blue-100 rounded-3xl p-8 text-center">
        <Lock className="w-8 h-8 text-blue-300 mx-auto mb-4" />
        <h3 className="text-zinc-900 font-bold text-sm mb-2">Data Security Commitment</h3>
        <p className="text-sm text-zinc-600 max-w-lg mx-auto leading-relaxed">
          We use industry-standard SSL encryption to protect your data during transmission. We <strong>never</strong> sell your personal data to third-party advertisers. Your payment details are processed directly by Razorpay and are not stored on our servers.
        </p>
      </div>

      <div className="text-center pt-4 border-t border-zinc-50">
        <p className="text-xs text-zinc-400">For privacy concerns, contact <a href="mailto:devidauraofficial@gmail.com" className="text-zinc-600 underline">devidauraofficial@gmail.com</a></p>
      </div>
    </div>
  );
}

function PartnerBadge({ name, role }) {
    return (
        <div className="px-5 py-3 rounded-2xl bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-zinc-50 flex flex-col items-center min-w-[140px]">
            <span className="text-sm font-bold text-zinc-800">{name}</span>
            <span className="text-[10px] uppercase font-medium text-zinc-400 mt-1">{role}</span>
        </div>
    )
}