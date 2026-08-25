import React from "react";
import { Clock, Ban, Video, CheckCircle2, PackageX } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="text-[var(--sub)] space-y-10 px-2 pb-6">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-[var(--text)] tracking-tight">Refund Policy</h2>
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-widest">Last updated: July 18, 2025</p>
      </div>

      {/* 1. Cancellation - Floating Card */}
      <section className="relative bg-[var(--surface)] p-6 sm:p-8 rounded-3xl shadow-sm border border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--text)] mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Order Cancellation
        </h3>

        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Before Processing</span>
            <p className="text-sm text-[var(--sub)] leading-relaxed">
              You may cancel your order before the status changes to <strong>"Processing"</strong> (approx. 12 hours).
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Cancellation Fee</span>
            <p className="text-sm text-[var(--sub)] leading-relaxed">
              A <strong>5% payment gateway fee</strong> will be deducted from your refund amount.
            </p>
          </div>

          <div className="col-span-full pt-4 border-t border-dashed border-zinc-100">
             <p className="text-xs text-[var(--muted)]">
               *Refunds are processed to the original payment source (Razorpay) within 5–7 business days.
             </p>
          </div>
        </div>
      </section>

      {/* 2. No Returns Warning */}
      <section className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl flex items-start gap-4">
        <Ban className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[var(--text)] font-bold text-sm">Non-Returnable Items</h3>
          <p className="text-sm text-[var(--sub)] mt-1 leading-relaxed">
            Perfumes are personal hygiene products. Once the bottle is delivered or the seal is broken, we <strong>cannot</strong> accept returns or exchanges due to "change of mind" or scent preference.
          </p>
        </div>
      </section>

      {/* 3. Damages - Visual Step Flow */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-2">
           <PackageX className="w-5 h-5 text-purple-600" />
           <h3 className="text-lg font-bold text-[var(--text)]">Received a Damaged Bottle?</h3>
        </div>
        
        <div className="space-y-4">
          <div className="group flex items-center p-4 rounded-2xl bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center text-[var(--muted)] group-hover:text-purple-600 transition-colors">
              <Video size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-[var(--text)]">Mandatory Video Proof</h4>
              <p className="text-xs text-[var(--sub)] mt-0.5">Record a continuous unboxing video <strong>starting before</strong> you open the package seal.</p>
            </div>
          </div>

          <div className="group flex items-center p-4 rounded-2xl bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center text-[var(--muted)] group-hover:text-purple-600 transition-colors">
              <Clock size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-[var(--text)]">Report in 24 Hours</h4>
              <p className="text-xs text-[var(--sub)] mt-0.5">Claims must be emailed to <span className="font-medium text-[var(--text)]">devidauraofficial@gmail.com</span> within 24 hours of delivery.</p>
            </div>
          </div>

          <div className="group flex items-center p-4 rounded-2xl bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--surface)] shadow-sm flex items-center justify-center text-[var(--muted)] group-hover:text-purple-600 transition-colors">
              <CheckCircle2 size={18} />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-[var(--text)]">Resolution</h4>
              <p className="text-xs text-[var(--sub)] mt-0.5">We verify within 48 hours. If approved, we will issue a full refund or free replacement.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}