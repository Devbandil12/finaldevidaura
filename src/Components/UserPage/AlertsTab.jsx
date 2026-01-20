import React from 'react';
import { useForm } from "react-hook-form";
import { Bell, Truck, Tag, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingRow = ({ icon: Icon, label, desc, ...props }) => (
  <motion.label 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-[2rem] cursor-pointer hover:border-zinc-300 hover:shadow-lg transition-all gap-6 group"
  >
    <div className="flex items-center gap-5 overflow-hidden">
       <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors flex-shrink-0">
          <Icon size={22} strokeWidth={1.5} />
       </div>
       <div className="flex-1 min-w-0">
          <p className="font-serif text-lg font-medium text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500 mt-1 font-light leading-relaxed max-w-sm">{desc}</p>
       </div>
    </div>

    <div className="relative flex-shrink-0">
      <input type="checkbox" className="sr-only peer" {...props} />
      <div className="w-14 h-8 bg-zinc-200 rounded-full peer-focus:outline-none transition-all peer-checked:bg-zinc-900 relative">
          <div className="absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transition-all peer-checked:translate-x-6"></div>
      </div>
    </div>
  </motion.label>
);

export default function AlertsTab({ user, onUpdate }) {
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: { 
      notify_order_updates: user.notify_order_updates ?? true, 
      notify_promos: user.notify_promos ?? true, 
      notify_pincode: user.notify_pincode ?? true 
    }
  });

  const onSubmit = async (data) => {
    const ok = await onUpdate(data);
    if (ok && window.toast) window.toast.success("Preferences Saved");
  };

  return (
    <div className="animate-fadeIn space-y-8">
      
      <div className="border-b border-zinc-100 pb-2">
         <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight">Notification Settings</h2>
         <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Control what you receive from Devid Aura.</p>
      </div>

      <div className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-dashed border-zinc-200">
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
            
            <SettingRow 
              icon={Truck}
              label="Order Updates" 
              desc="Receive real-time updates on your order status, shipping, and delivery." 
              {...register("notify_order_updates")} 
            />
            
            <SettingRow 
              icon={Tag}
              label="Promotions & Offers" 
              desc="Be the first to know about flash sales, new luxury arrivals, and exclusive coupons." 
              {...register("notify_promos")} 
            />
            
            <SettingRow 
              icon={ShieldCheck}
              label="Account Security" 
              desc="Get alerts for password changes, new logins, and important service updates." 
              {...register("notify_pincode")} 
            />

            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: isDirty ? 1 : 0.5 }} 
               className="pt-6 flex justify-end"
            >
               <button 
                 type="submit" 
                 disabled={!isDirty} 
                 className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Save Preferences
               </button>
            </motion.div>
         </form>
      </div>
      
      {/* Privacy Note */}
      <div className="flex gap-3 items-start p-4 rounded-xl bg-blue-50/50 border border-blue-100 max-w-2xl mx-auto">
         <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
         <p className="text-xs text-zinc-500 leading-relaxed">
            <span className="font-bold text-zinc-700">Privacy Note:</span> We respect your inbox. Essential transactional emails (like order receipts and password resets) cannot be disabled.
         </p>
      </div>

    </div>
  );
}