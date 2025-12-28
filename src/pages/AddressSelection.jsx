import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import { MapPin, Plus } from "lucide-react";

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address";

const smoothTransition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.4
};

const AddressCard = ({ addr, index, selectedIndex, selectAddress, setDefaultAddress, editAddress, deleteAddress }) => {
    const fullAddress = [addr.address, addr.landmark, `${addr.city}, ${addr.state} - ${addr.postalCode}`].filter(Boolean).join(", ");
    const isSelected = selectedIndex === index;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
        transition={smoothTransition}
        onClick={() => selectAddress(index)}
        // Responsive padding (p-4)
        className={`relative rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 cursor-pointer group transition-all duration-300 border ${
          isSelected
            ? 'bg-slate-50 border-slate-800 shadow-sm' 
            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="mt-1 flex-shrink-0">
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-black' : 'border-slate-300 group-hover:border-slate-400'}`}>
            <AnimatePresence>
                {isSelected && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-2.5 h-2.5 rounded-full bg-black" 
                    />
                )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* min-w-0 ensures the flex child doesn't overflow parent */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className={`font-semibold transition-colors duration-300 ${isSelected ? 'text-black' : 'text-slate-700'}`}>{addr.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 whitespace-nowrap">{addr.addressType}</span>
            </div>
            {addr.isDefault && <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">Default</div>}
          </div>
          
          {/* break-words handles long addresses */}
          <p className="text-sm text-slate-500 mt-1 leading-relaxed break-words">{fullAddress}</p>
          <p className="text-sm text-slate-500 mt-2">Phone: <span className="text-slate-700">{addr.phone}</span></p>
          
          {/* Buttons wrap on small screens */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            {!addr.isDefault && <button onClick={(e) => { e.stopPropagation(); setDefaultAddress(index); }} className="text-slate-500 hover:text-black transition-colors py-1">Set Default</button>}
            <button onClick={(e) => { e.stopPropagation(); editAddress(index); }} className="text-slate-500 hover:text-black transition-colors py-1">Edit</button>
            <button onClick={(e) => { e.stopPropagation(); deleteAddress(index); }} className="text-red-400 hover:text-red-600 transition-colors py-1">Delete</button>
          </div>
        </div>
      </motion.div>
    );
};


export default function AddressSelection({ userId, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const emptyAddress = {
    name: "", phone: "", altPhone: "", postalCode: "", city: "",
    state: "", country: "India", address: "", landmark: "",
    deliveryInstructions: "", addressType: "Home", label: "",
    latitude: "", longitude: "", geoAccuracy: "", isDefault: false,
  };

  const [formAddress, setFormAddress] = useState(emptyAddress);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customAddressType, setCustomAddressType] = useState("");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/user/${userId}`);
        const data = await res.json();
        if (data.success) {
          const loadedAddresses = data.data || [];
          setAddresses(loadedAddresses);
          const defaultIdx = loadedAddresses.findIndex((a) => a.isDefault);
          if (defaultIdx >= 0) {
            setSelectedIndex(defaultIdx);
            onSelect?.(loadedAddresses[defaultIdx]);
          } else if (loadedAddresses.length > 0) {
            setSelectedIndex(0);
            onSelect?.(loadedAddresses[0]);
          }
        }
      } catch (err) {
        console.error("fetch addresses", err);
        window.toast.error("Failed to load your addresses.");
      }
    })();
  }, [userId, onSelect]);

  function selectAddress(idx) {
    setSelectedIndex(idx);
    onSelect?.(addresses[idx]);
    setShowAll(false);
  }

  function addNew() {
    setFormAddress(emptyAddress);
    setCustomAddressType("");
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
    setFormError("");
  }

  function editAddress(idx) {
    const addr = addresses[idx];
    setFormAddress(addr);
    setIsEditing(true);
    setEditingId(addr.id);
    setShowForm(true);
    setFormError("");
    setCustomAddressType(addr.addressType && !["Home", "Work", "Other"].includes(addr.addressType) ? addr.addressType : "");
  }

  async function deleteAddress(idx) {
    const toDelete = addresses[idx];
    if (!toDelete) return window.toast.error("Address not found.");
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`${API_BASE}/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const filtered = addresses.filter((a) => a.id !== toDelete.id);
        setAddresses(filtered);
        if (selectedIndex === idx) {
          if (filtered.length > 0) {
            selectAddress(0);
          } else {
            setSelectedIndex(null);
            onSelect?.(null);
          }
        }
        setShowForm(false);
        window.toast.success("Address deleted successfully.");
      } else {
        window.toast.error(data.msg || "Failed to delete address.");
      }
    } catch (err) {
      console.error("deleteAddress error:", err);
      window.toast.error("Network error while deleting address.");
    }
  }

  async function setDefaultAddress(idx) {
    const addr = addresses[idx];
    if (!addr) return;
    try {
      const res = await fetch(`${API_BASE}/${addr.id}/default`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === addr.id })));
        selectAddress(idx);
        window.toast.success("Default address updated.");
      } else {
        window.toast.error(data.msg || "Failed to set default address.");
      }
    } catch (err) {
      console.error("setDefaultAddress error:", err);
      window.toast.error("Network error while setting default.");
    }
  }

  async function saveAddress() {
    setFormError("");
    if (!userId) {
      return window.toast.error("User ID is missing. Please try again.");
    }
    if (!formAddress.name || !formAddress.phone || !formAddress.address || !formAddress.city || !formAddress.state || !formAddress.postalCode) {
      setFormError("Please fill all required fields marked with *.");
      return;
    }

    let finalAddressType = formAddress.addressType;
    if (finalAddressType === "Other") {
      if (!customAddressType.trim()) {
        setFormError("Please specify the custom address type.");
        return;
      }
      finalAddressType = customAddressType.trim();
    }

    setLoading(true);
    try {
      const url = isEditing ? `${API_BASE}/${editingId}` : `${API_BASE}/`;
      const method = isEditing ? "PUT" : "POST";
      const payload = { ...formAddress, addressType: finalAddressType, userId };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (isEditing) {
          const updatedAddresses = addresses.map((a) => (a.id === data.data.id ? data.data : a));
          setAddresses(updatedAddresses);
          const updatedIndex = updatedAddresses.findIndex((a) => a.id === data.data.id);
          selectAddress(updatedIndex >= 0 ? updatedIndex : 0);
        } else {
          const newAddresses = [data.data, ...addresses];
          setAddresses(newAddresses);
          selectAddress(0);
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        window.toast.success(isEditing ? "Address updated successfully!" : "Address added successfully!");
      } else {
        window.toast.error(data.msg || "Failed to save address.");
      }
    } catch (err) {
      console.error("saveAddress error:", err);
      window.toast.error("Network error while saving address.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupPostalCode(pc) {
    if (!pc) return;
    const postal = String(pc).trim();
    if (/^\d{6}$/.test(postal)) {
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${postal}`);
        const j = await r.json();
        if (Array.isArray(j) && j[0].Status === "Success" && j[0].PostOffice?.length) {
          const po = j[0].PostOffice[0];
          setFormAddress((prev) => ({
            ...prev,
            city: po.District || prev.city,
            state: po.State || prev.state,
          }));
        }
      } catch (e) {
        console.warn("postalpincode lookup failed", e);
      }
    }
  }


function useCurrentLocationInForm() {
    if (!navigator.geolocation) {
      return window.toast.error("Geolocation is not supported by your browser.");
    }
    window.toast.info("Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const response = await fetch(`${API_BASE}/reverse-geocode?lat=${latitude}&lon=${longitude}`);

          if (!response.ok) {
            throw new Error('Failed to reverse-geocode location from server.');
          }

          const data = await response.json();
          
          if (data && data.address) { 
            setFormAddress((prev) => ({
              ...prev,
              address: data.address || prev.address,
              city: data.city || prev.city,
              state: data.state || prev.state,
              postalCode: data.postalCode || prev.postalCode,
              country: data.country || "India",
              latitude,
              longitude,
              geoAccuracy: accuracy,
            }));
            
            setShowForm(true);
            window.toast.success("Location found!");
          } else {
            window.toast.error("Unable to determine address from your location.");
          }
        } catch (err) {
          console.error("reverse geocode failed", err);
          window.toast.error("Failed to fetch address details from location.");
        }
      },
      (error) => {
        window.toast.error("Failed to get your location: " + error.message);
      }
    );
}

  function onPostalBlur() {
    const pc = formAddress.postalCode;
    if (!pc) return;
    lookupPostalCode(pc);
  }

  function updateFormAddress(field, value) {
    if (field === "addressType") {
      setFormAddress((prev) => ({ ...prev, addressType: value }));
      if (value !== "Other") setCustomAddressType("");
    } else {
      setFormAddress((prev) => ({ ...prev, [field]: value }));
    }
  }

  return (
    // Reduced padding: p-4 sm:p-8
    <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
          <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-700">
            <MapPin className="w-4 h-4" />
          </div>
          Delivery Address
        </h3>
        {addresses.length > 1 && (
          <button onClick={() => setShowAll(prev => !prev)} className="text-sm font-semibold text-slate-500 hover:text-black transition-colors duration-300 ml-2 whitespace-nowrap">
            {showAll ? 'Show Less' : 'Change'}
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div layout className="space-y-4">
          {showAll
            ? addresses.map((addr, i) => <AddressCard key={addr.id} addr={addr} index={i} selectedIndex={selectedIndex} selectAddress={selectAddress} setDefaultAddress={setDefaultAddress} editAddress={editAddress} deleteAddress={deleteAddress} />)
            : selectedIndex !== null && addresses[selectedIndex]
              ? <AddressCard addr={addresses[selectedIndex]} index={selectedIndex} selectedIndex={selectedIndex} selectAddress={selectAddress} setDefaultAddress={setDefaultAddress} editAddress={editAddress} deleteAddress={deleteAddress} />
              : !showForm && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={smoothTransition}
                    className="text-sm text-slate-400 py-10 text-center italic border border-dashed border-slate-100 rounded-2xl bg-slate-50/50"
                  >
                    No addresses found. Please add one below.
                  </motion.div>
                )
          }
        </motion.div>
      </AnimatePresence>
      
      <AnimatePresence>
        {!showForm && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }}
            transition={smoothTransition}
            className="mt-6"
          >
            <motion.button
              onClick={addNew}
              whileHover={{ scale: 1.005, backgroundColor: "#f8fafc" }} 
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-200 text-slate-500 py-4 rounded-xl font-medium hover:border-slate-400 hover:text-black transition-colors duration-300"
            >
              <Plus className="w-4 h-4" /> Add New Address
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={smoothTransition}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-6 sm:pt-8 sm:mt-8 border-t border-slate-100">
              <h4 className="font-bold text-lg mb-6 text-slate-800 tracking-tight">{isEditing ? "Edit Address" : "Add New Address"}</h4>
              {formError && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 shadow-sm">{formError}</div>}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Added w-full to inputs */}
                <div className="relative sm:col-span-2">
                  <input id="name" value={formAddress.name} onChange={(e) => updateFormAddress("name", e.target.value)} className="form-input peer w-full" placeholder=" " required />
                  <label htmlFor="name" className="floating-label">Full Name *</label>
                </div>
                <div className="relative">
                  <input id="phone" type="tel" value={formAddress.phone} onChange={(e) => updateFormAddress("phone", e.target.value)} className="form-input peer w-full" placeholder=" " required />
                  <label htmlFor="phone" className="floating-label">Phone *</label>
                </div>
                <div className="relative">
                   <input id="altPhone" type="tel" value={formAddress.altPhone || ""} onChange={(e) => updateFormAddress("altPhone", e.target.value)} className="form-input peer w-full" placeholder=" " />
                   <label htmlFor="altPhone" className="floating-label">Alternate Phone</label>
                </div>
                <div className="relative sm:col-span-2">
                  <input id="address" value={formAddress.address || ""} onChange={(e) => updateFormAddress("address", e.target.value)} className="form-input peer w-full" placeholder=" " required />
                  <label htmlFor="address" className="floating-label">Address (House No, Building, Street, Area) *</label>
                </div>
                <div className="relative">
                  <input id="landmark" value={formAddress.landmark || ""} onChange={(e) => updateFormAddress("landmark", e.target.value)} className="form-input peer w-full" placeholder=" " />
                  <label htmlFor="landmark" className="floating-label">Landmark</label>
                </div>
                <div className="relative">
                  <input id="city" value={formAddress.city || ""} onChange={(e) => updateFormAddress("city", e.target.value)} className="form-input peer w-full" placeholder=" " required />
                  <label htmlFor="city" className="floating-label">City *</label>
                </div>
                <div className="sm:col-span-2 flex items-end gap-3">
                    <div className="relative flex-grow">
                        <input id="postalCode" value={formAddress.postalCode || ""} onChange={(e) => updateFormAddress("postalCode", e.target.value)} onBlur={onPostalBlur} className="form-input peer w-full" placeholder=" " required />
                        <label htmlFor="postalCode" className="floating-label">Postal Code *</label>
                    </div>
                    <motion.button type="button" onClick={useCurrentLocationInForm} whileTap={{ scale: 0.95 }} className="h-12 px-4 sm:px-5 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-black transition-all duration-300 flex-shrink-0 flex items-center gap-2 shadow-sm hover:shadow-md">
                        <FontAwesomeIcon icon={faLocationArrow} /> <span className="hidden sm:inline">Locate</span>
                    </motion.button>
                </div>
                <div className="relative">
                  <input id="state" value={formAddress.state || ""} onChange={(e) => updateFormAddress("state", e.target.value)} className="form-input peer w-full" placeholder=" " required />
                  <label htmlFor="state" className="floating-label">State *</label>
                </div>
                <div className="relative">
                  <input id="country" value={formAddress.country || "India"} disabled className="form-input peer bg-slate-50 cursor-not-allowed text-slate-500 w-full" placeholder=" "/>
                  <label htmlFor="country" className="floating-label">Country</label>
                </div>
                <div className="relative sm:col-span-2">
                  <textarea id="deliveryInstructions" value={formAddress.deliveryInstructions || ""} onChange={(e) => updateFormAddress("deliveryInstructions", e.target.value)} className="form-input peer w-full" placeholder=" " rows={2}></textarea>
                  <label htmlFor="deliveryInstructions" className="floating-label">Delivery Instructions (Optional)</label>
                </div>
                <div className="sm:col-span-2 mt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Address Type</label>
                    <div className="flex flex-wrap items-center gap-4">
                        {['Home', 'Work', 'Other'].map(type => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-200 ${formAddress.addressType === type ? 'border-black' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                    {formAddress.addressType === type && <div className="w-2 h-2 rounded-full bg-black" />}
                                </div>
                                <input type="radio" name="addressType" value={type} checked={formAddress.addressType === type} onChange={(e) => updateFormAddress("addressType", e.target.value)} className="hidden" />
                                <span className={`text-sm font-medium transition-colors ${formAddress.addressType === type ? 'text-black' : 'text-slate-600'}`}>{type}</span>
                            </label>
                        ))}
                    </div>
                    {formAddress.addressType === 'Other' && (
                        <div className="relative mt-4">
                          <input type="text" placeholder=" " value={customAddressType} onChange={(e) => setCustomAddressType(e.target.value)} className="form-input peer w-full" />
                          <label className="floating-label">Custom Type *</label>
                        </div>
                    )}
                </div>
                {/* Buttons stack on mobile */}
                <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                  <motion.button type="button" onClick={() => setShowForm(false)} disabled={loading} whileTap={{ scale: 0.98 }} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 w-full sm:w-auto">Cancel</motion.button>
                  <motion.button type="button" onClick={saveAddress} disabled={loading} whileTap={{ scale: 0.98 }} className="px-8 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-slate-800 disabled:bg-slate-300 shadow-lg shadow-slate-200 transition-all duration-200 w-full sm:w-auto">{loading ? "Saving..." : "Save Address"}</motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}