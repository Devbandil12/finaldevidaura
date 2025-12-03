import React from "react";
import { Clock, Ban, Video, CheckCircle2, PackageX } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="text-zinc-700 font-sans space-y-10 px-2 pb-6">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Refund Policy</h2>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Last updated: July 18, 2025</p>
      </div>

      {/* 1. Cancellation - Floating Card */}
      <section className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-50">
        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Order Cancellation
        </h3>

        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Before Processing</span>
            <p className="text-sm text-zinc-600 leading-relaxed">
              You may cancel your order before the status changes to <strong>"Processing"</strong> (approx. 12 hours).
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cancellation Fee</span>
            <p className="text-sm text-zinc-600 leading-relaxed">
              A <strong>5% payment gateway fee</strong> will be deducted from your refund amount.
            </p>
          </div>

          <div className="col-span-full pt-4 border-t border-dashed border-zinc-100">
             <p className="text-xs text-zinc-400">
               *Refunds are processed to the original payment source (Razorpay) within 5–7 business days.
             </p>
          </div>
        </div>
      </section>

      {/* 2. No Returns Warning */}
      <section className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl flex items-start gap-4">
        <Ban className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-zinc-900 font-bold text-sm">Non-Returnable Items</h3>
          <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
            Perfumes are personal hygiene products. Once the bottle is delivered or the seal is broken, we <strong>cannot</strong> accept returns or exchanges due to "change of mind" or scent preference.
          </p>
        </div>
      </section>

      {/* 3. Damages - Visual Step Flow */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-2">
           <PackageX className="w-5 h-5 text-purple-600" />
           <h3 className="text-lg font-bold text-zinc-900">Received a Damaged Bottle?</h3>
        </div>
        
        <div className="space-y-4">
          <div className="group flex items-center p-4 rounded-2xl bg-zinc-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-zinc-100">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-purple-600 transition-colors">
              <Video size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-zinc-900">Mandatory Video Proof</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Record a continuous unboxing video <strong>starting before</strong> you open the package seal.</p>
            </div>
          </div>

          <div className="group flex items-center p-4 rounded-2xl bg-zinc-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-zinc-100">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-purple-600 transition-colors">
              <Clock size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-zinc-900">Report in 24 Hours</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Claims must be emailed to <span className="font-medium text-zinc-700">devidauraofficial@gmail.com</span> within 24 hours of delivery.</p>
            </div>
          </div>

          <div className="group flex items-center p-4 rounded-2xl bg-zinc-50 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-zinc-100">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-purple-600 transition-colors">
              <CheckCircle2 size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-zinc-900">Resolution</h4>
              <p className="text-xs text-zinc-500 mt-0.5">We verify within 48 hours. If approved, we will issue a full refund or free replacement.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}