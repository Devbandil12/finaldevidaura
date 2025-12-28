import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="font-sans text-zinc-700 space-y-12 px-2 pb-6">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Terms of Service</h2>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mt-2">Effective Date: July 18, 2025</p>
      </div>

      <div className="space-y-10 relative">
        {/* Decorative Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-zinc-100 via-zinc-200 to-transparent hidden sm:block"></div>

        <TermSection 
          num="01" 
          title="Introduction & Eligibility" 
          content={
            <>
              Welcome to <strong>Devid Aura</strong>. By accessing our website, you agree to these Terms. You must be at least 18 years old to purchase products. If you are under 18, you may use the site only with the involvement of a parent or guardian.
            </>
          }
        />
        
        <TermSection 
          num="02" 
          title="Fragrance & Product Disclaimer" 
          content={
            <>
              <p className="mb-2"><strong>Scent Variation:</strong> Perfumes interact uniquely with individual skin chemistry. A scent may smell different on your skin compared to a test strip or another person. We cannot refund open bottles based on personal preference or skin chemistry results.</p>
              <p><strong>Medical Disclaimer:</strong> Our products are for external use only. If you have sensitive skin or allergies, please review ingredients carefully. Discontinue use immediately if irritation occurs.</p>
            </>
          }
        />

        <TermSection 
          num="03" 
          title="Orders & Payment" 
          content={
            <>
              All orders are subject to acceptance and availability. We reserve the right to refuse service or cancel orders suspected of fraud. Payments are processed securely via <strong>Razorpay</strong>; we do not store your financial data on our servers.
            </>
          }
        />
        
        <TermSection 
          num="04" 
          title="Shipping & Delivery" 
          content={
            <>
              Perfumes are classified as <em>Dangerous Goods</em> (flammable) by courier partners, which may restrict air shipping to certain pin codes. Delivery timelines are estimates. Devid Aura is not liable for delays caused by logistics partners, weather, or force majeure events.
            </>
          }
        />

        <TermSection 
          num="05" 
          title="Intellectual Property" 
          content={
            <>
              All content on this site—including the Devid Aura trademark, logo, bottle designs, product descriptions, and imagery—is the exclusive property of Devid Aura. Unauthorized commercial use, reproduction, or framing is strictly prohibited.
            </>
          }
        />

         <TermSection 
          num="06" 
          title="Limitation of Liability" 
          content={
            <>
              To the fullest extent permitted by law, Devid Aura shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability is limited to the amount paid for the product.
            </>
          }
        />

        <TermSection 
          num="07" 
          title="Governing Law" 
          content={
            <>
              These terms are governed by the laws of India. Any disputes arising in relation to these terms shall be subject to the exclusive jurisdiction of the courts in [Your City/State].
            </>
          }
        />
      </div>

      <div className="mt-12 text-center pt-8 border-t border-zinc-100">
        <p className="text-xs text-zinc-400">Questions about the Terms?</p>
        <a href="mailto:devidauraofficial@gmail.com" className="text-sm font-medium text-zinc-900 hover:text-blue-600 transition-colors">devidauraofficial@gmail.com</a>
      </div>
    </div>
  );
}

function TermSection({ num, title, content }) {
  return (
    <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 items-start group">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 font-semibold flex items-center justify-center text-sm shadow-[0_4px_10px_rgb(0,0,0,0.03)] group-hover:scale-105 group-hover:bg-white group-hover:border-zinc-200 group-hover:text-black transition-all duration-300 z-10">
        {num}
      </div>
      <div className="pt-1">
        <h3 className="text-zinc-900 font-bold text-base mb-2 group-hover:text-black transition-colors">{title}</h3>
        <div className="text-sm text-zinc-500 leading-relaxed font-light">
            {content}
        </div>
      </div>
    </div>
  );
}