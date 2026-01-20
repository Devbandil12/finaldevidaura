import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Plus, CheckCircle2, Pencil, Trash2, MapPin, Home, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactDatePicker from "react-datepicker"; // If needed by form, though typically not for address

// --- Reusing the standard Button/Input styles (Inline for simplicity) ---
const BTN_PRIMARY = "px-6 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg shadow-zinc-900/10";
const BTN_SECONDARY = "px-6 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all";
const INPUT_CLASS = "w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all";

export default function AddressesTab({ address, addAddress, editAddress, deleteAddress, setDefaultAddress }) {
  const [editingAddress, setEditingAddress] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleFormSubmit = async (data) => {
    try {
      if (editingAddress) await editAddress(editingAddress.id, data);
      else await addAddress(data);
      setIsAdding(false); 
      setEditingAddress(null);
      if(window.toast) window.toast.success("Address saved successfully");
    } catch (e) { 
      if(window.toast) window.toast.error("Failed to save address"); 
    }
  };

  // --- Form View ---
  if (isAdding || editingAddress) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] animate-fadeIn max-w-2xl mx-auto">
         <h2 className="font-serif text-3xl font-medium text-zinc-900 mb-6">{editingAddress ? "Edit Address" : "Add New Address"}</h2>
         <AddressForm 
            initialData={editingAddress} 
            onCancel={() => { setIsAdding(false); setEditingAddress(null); }} 
            onSubmit={handleFormSubmit} 
         />
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-100">
        <div>
          <h2 className="font-serif text-3xl font-medium text-zinc-900 tracking-tight">Saved Addresses</h2>
          <p className="text-zinc-500 font-light text-sm mt-1 font-sans">Manage your shipping destinations.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className={`${BTN_PRIMARY} flex items-center gap-2`}>
            <Plus size={18} /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(address || []).map((addr, i) => (
            <motion.div 
                key={addr.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-[2rem] border transition-all group ${addr.isDefault ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-lg'}`}
            >
                {/* Header Badge */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${addr.isDefault ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
                        {addr.addressType === 'Work' ? <Briefcase size={12}/> : <Home size={12}/>}
                        {addr.addressType || "Home"}
                    </div>
                    {addr.isDefault && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                            <CheckCircle2 size={14} /> Default
                        </span>
                    )}
                </div>

                {/* Content */}
                <h4 className={`font-serif text-xl font-medium mb-2 ${addr.isDefault ? 'text-white' : 'text-zinc-900'}`}>{addr.name}</h4>
                <div className={`text-sm leading-relaxed font-light mb-4 ${addr.isDefault ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <p>{addr.address}</p>
                    <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p className="mt-2 font-mono text-xs opacity-80">Ph: {addr.phone}</p>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-3 pt-4 mt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingAddress(addr)} className={`p-2 rounded-lg transition-colors ${addr.isDefault ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}>
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteAddress(addr.id)} className={`p-2 rounded-lg transition-colors ${addr.isDefault ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                        <Trash2 size={16} />
                    </button>
                    {!addr.isDefault && (
                        <button onClick={() => setDefaultAddress(addr.id)} className="ml-auto text-xs font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-900 transition-colors">
                            Set Default
                        </button>
                    )}
                </div>
            </motion.div>
        ))}
      </div>
      
      {(!address || address.length === 0) && (
          <div className="text-center py-20 text-zinc-400 font-light italic">No addresses saved. Add one to checkout faster.</div>
      )}
    </div>
  );
}

const AddressForm = ({ initialData, onCancel, onSubmit }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({ defaultValues: initialData || {} });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
         <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
         <input {...register("name", { required: "Required" })} className={INPUT_CLASS} placeholder="e.g. John Doe" />
         {errors.name && <span className="text-xs text-red-500 ml-1">{errors.name.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Phone</label>
            <input {...register("phone", { required: "Required" })} className={INPUT_CLASS} placeholder="+91 98765..." />
         </div>
         <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Type</label>
            <Controller 
                control={control} name="addressType" defaultValue="Home"
                render={({ field }) => (
                    <select {...field} className={`${INPUT_CLASS} appearance-none`}>
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                    </select>
                )} 
            />
         </div>
      </div>

      <div className="space-y-1">
         <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Address</label>
         <textarea {...register("address", { required: "Required" })} className={INPUT_CLASS} rows={3} placeholder="Flat no, Street, Landmark..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <input {...register("city", { required: "Required" })} className={INPUT_CLASS} placeholder="City" />
         <input {...register("state", { required: "Required" })} className={INPUT_CLASS} placeholder="State" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
         <input {...register("postalCode", { required: "Required" })} className={INPUT_CLASS} placeholder="Pincode" />
         <input {...register("country", { required: "Required" })} className={INPUT_CLASS} placeholder="Country" defaultValue="India" />
      </div>

      <div className="flex gap-4 pt-4 border-t border-zinc-100 mt-6">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button type="submit" className={BTN_PRIMARY}>Save Address</button>
      </div>
    </form>
  )
};