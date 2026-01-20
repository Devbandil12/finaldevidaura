import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Loader2, Upload } from 'lucide-react';
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useCloudinary from "../../utils/useCloudinary"; // Path adjust needed based on folder structure
import { Button, FloatingInput, FloatingDropdown } from './SharedUserComponents';

const NotificationSettings = ({ user, onUpdate }) => {
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: { notify_order_updates: user.notify_order_updates ?? true, notify_promos: user.notify_promos ?? true, notify_pincode: user.notify_pincode ?? true }
  });
  const onSubmit = async (data) => { if (await onUpdate(data)) window.toast.success("Preferences Saved"); };

  const SettingRow = ({ label, desc, ...props }) => (
    <label className="flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-3xl cursor-pointer hover:border-zinc-300 transition-all gap-4 shadow-sm group">
      <div className="flex-1 min-w-0"><p className="font-medium text-zinc-900">{label}</p><p className="text-xs text-zinc-500 mt-1 font-light">{desc}</p></div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-zinc-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <h2 className="text-xl font-medium tracking-tight mb-6">Notification Preferences</h2>
      <SettingRow label="Order Updates" desc="Get notified about shipping and delivery status." {...register("notify_order_updates")} />
      <SettingRow label="Promotions & Deals" desc="Receive updates on new coupons and sales." {...register("notify_promos")} />
      <SettingRow label="Service Alerts" desc="Important updates about service availability." {...register("notify_pincode")} />
      <Button type="submit" disabled={!isDirty} variant="primary" className="mt-4">Save Preferences</Button>
    </form>
  );
};

export default function SettingsTab({ user, onUpdate, activeSection = 'profile' }) {
  // If activeSection is 'notifications', render that
  if (activeSection === 'notifications') return <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]"><NotificationSettings user={user} onUpdate={onUpdate} /></div>;

  // Default Profile Form
  const { register, handleSubmit, control, formState: { isDirty } } = useForm({
    defaultValues: { name: user.name, phone: user.phone, dob: user.dob ? new Date(user.dob) : null, gender: user.gender }
  });
  const { uploadImage } = useCloudinary();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(user.profileImage);

  const onSubmit = async (data) => {
    try { await onUpdate({ ...data, dob: data.dob ? data.dob.toISOString().split('T')[0] : null }); window.toast.success("Profile Updated"); } catch (e) { window.toast.error("Update failed"); }
  };
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try { const url = await uploadImage(file); await onUpdate({ profileImage: url }); setImagePreview(url); window.toast.success("Profile photo updated!"); } catch (e) { window.toast.error("Upload failed."); } finally { setLoading(false); }
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
      <div className="max-w-2xl">
        <h2 className="text-xl font-medium text-zinc-900 mb-8 tracking-tight">Profile Settings</h2>
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group w-24 h-24 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden border border-zinc-200 bg-white relative">
              <img src={imagePreview || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
              <label className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                <input type="file" className="hidden" onChange={handleAvatar} disabled={loading} accept="image/*" />
              </label>
            </div>
          </div>
          <div><h3 className="font-medium text-zinc-900">Profile Photo</h3><p className="text-xs text-zinc-500 mb-3 font-light">Update your public avatar.</p>{imagePreview && !loading && (<button onClick={async () => { if (window.confirm("Remove?")) { await onUpdate({ profileImage: "" }); setImagePreview(null); } }} className="text-xs text-red-500 font-bold hover:underline">Remove Photo</button>)}</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FloatingInput label="Full Name" {...register("name")} />
          <FloatingInput label="Phone" {...register("phone")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller control={control} name="dob" render={({ field }) => (<ReactDatePicker selected={field.value} onChange={field.onChange} customInput={<FloatingInput label="Date of Birth" />} showPopperArrow={false} />)} />
            <Controller control={control} name="gender" render={({ field }) => (<FloatingDropdown label="Gender" value={field.value} onChange={field.onChange} options={["Male", "Female", "Other"]} />)} />
          </div>
          <Button type="submit" disabled={!isDirty || loading} variant="primary" className="mt-4">Save Changes</Button>
        </form>
      </div>
    </div>
  );
}