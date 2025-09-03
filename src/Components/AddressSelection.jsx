import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';

// --- Re-usable FloatingInput Component ---
// NOTE: You should import this from its actual location in your project.
const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref}
      placeholder=" "
      className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none ${error ? "border-red-400" : "border-slate-200"} ${props.readOnly || props.disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      {...props}
    />
    <label
      className="absolute left-3 -top-2 bg-white px-1 text-slate-500 text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-base
      peer-focus:-top-2 peer-focus:text-sm peer-focus:text-slate-900"
    >
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address";

export default function AddressSelection({ userId, onSelect }) {
  [span_0](start_span)const [addresses, setAddresses] = useState([]);[span_0](end_span)
  [span_1](start_span)const [selectedIndex, setSelectedIndex] = useState(null);[span_1](end_span)
  
  const emptyAddress = {
    name: "",
    phone: "",
    altPhone: "",
    postalCode: "",
    city: "",
    state: "",
    country: "India",
    address: "",
    landmark: "",
    deliveryInstructions: "",
    addressType: "Home",
    label: "",
    latitude: "",
    longitude: "",
    geoAccuracy: "",
    isDefault: false,
    isVerified: false,
  [span_2](start_span)};[span_2](end_span)

  [span_3](start_span)const [formAddress, setFormAddress] = useState(emptyAddress);[span_3](end_span)
  [span_4](start_span)const [isEditing, setIsEditing] = useState(false);[span_4](end_span)
  [span_5](start_span)const [editingId, setEditingId] = useState(null);[span_5](end_span)
  [span_6](start_span)const [showForm, setShowForm] = useState(false);[span_6](end_span)
  [span_7](start_span)const [loading, setLoading] = useState(false);[span_7](end_span)

  [span_8](start_span)const [customAddressType, setCustomAddressType] = useState("");[span_8](end_span)
  
  useEffect(() => {
    [span_9](start_span)if (!userId) return;[span_9](end_span)
    (async () => {
      try {
        [span_10](start_span)const res = await fetch(`${API_BASE}/user/${userId}`);[span_10](end_span)
        [span_11](start_span)const data = await res.json();[span_11](end_span)
        if (data.success) {
          [span_12](start_span)setAddresses(data.data || []);[span_12](end_span)
          [span_13](start_span)const defaultIdx = (data.data || []).findIndex((a) => a.isDefault);[span_13](end_span)
          if (defaultIdx >= 0) {
            [span_14](start_span)setSelectedIndex(defaultIdx);[span_14](end_span)
            [span_15](start_span)onSelect?.(data.data[defaultIdx]);[span_15](end_span)
          } else if ((data.data || []).length > 0) {
            [span_16](start_span)setSelectedIndex(0);[span_16](end_span)
            [span_17](start_span)onSelect?.(data.data[0]);[span_17](end_span)
          }
        }
      } catch (err) {
        [span_18](start_span)console.error("fetch addresses", err);[span_18](end_span)
      }
    })();
  [span_19](start_span)}, [userId, onSelect]);[span_19](end_span)

  function selectAddress(idx) {
    [span_20](start_span)setSelectedIndex(idx);[span_20](end_span)
    [span_21](start_span)onSelect?.(addresses[idx]);[span_21](end_span)
  }

  function addNew() {
    [span_22](start_span)setFormAddress(emptyAddress);[span_22](end_span)
    [span_23](start_span)setCustomAddressType("");[span_23](end_span)
    [span_24](start_span)setIsEditing(false);[span_24](end_span)
    [span_25](start_span)setEditingId(null);[span_25](end_span)
    [span_26](start_span)setShowForm(true);[span_26](end_span)
  }

  function editAddress(idx) {
    [span_27](start_span)const addr = addresses[idx];[span_27](end_span)
    [span_28](start_span)setFormAddress(addr);[span_28](end_span)
    [span_29](start_span)setIsEditing(true);[span_29](end_span)
    [span_30](start_span)setEditingId(addr.id);[span_30](end_span)
    [span_31](start_span)setShowForm(true);[span_31](end_span)
    [span_32](start_span)setCustomAddressType(addr.addressType && !["Home", "Work", "Other"].includes(addr.addressType) ? addr.addressType : "");[span_32](end_span)
  }

  async function deleteAddress(idx) {
    [span_33](start_span)const toDelete = addresses[idx];[span_33](end_span)
    [span_34](start_span)if (!toDelete) return alert("Address not found");[span_34](end_span)
    [span_35](start_span)if (!window.confirm("Are you sure you want to delete this address?")) return;[span_35](end_span)

    try {
      [span_36](start_span)const res = await fetch(`${API_BASE}/${toDelete.id}`, { method: "DELETE" });[span_36](end_span)
      [span_37](start_span)const data = await res.json();[span_37](end_span)
      if (data.success) {
        [span_38](start_span)const filtered = addresses.filter((a) => a.id !== toDelete.id);[span_38](end_span)
        [span_39](start_span)setAddresses(filtered);[span_39](end_span)
        [span_40](start_span)setSelectedIndex(null);[span_40](end_span)
        [span_41](start_span)onSelect?.(null);[span_41](end_span)
        [span_42](start_span)setShowForm(false);[span_42](end_span)
      } else {
        [span_43](start_span)alert(data.msg || "Failed to delete address");[span_43](end_span)
      }
    } catch (err) {
      [span_44](start_span)console.error("deleteAddress error:", err);[span_44](end_span)
      [span_45](start_span)alert("Network error while deleting address");[span_45](end_span)
    }
  }

  async function setDefaultAddress(idx) {
    [span_46](start_span)const addr = addresses[idx];[span_46](end_span)
    [span_47](start_span)if (!addr) return;[span_47](end_span)
    try {
      [span_48](start_span)const res = await fetch(`${API_BASE}/${addr.id}/default`, { method: "PUT" });[span_48](end_span)
      [span_49](start_span)const data = await res.json();[span_49](end_span)
      if (data.success) {
        [span_50](start_span)setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === addr.id })));[span_50](end_span)
        [span_51](start_span)setSelectedIndex(idx);[span_51](end_span)
        [span_52](start_span)onSelect?.(addr);[span_52](end_span)
      } else {
        [span_53](start_span)alert(data.msg || "Failed to set default");[span_53](end_span)
      }
    } catch (err) {
      [span_54](start_span)console.error("setDefaultAddress error:", err);[span_54](end_span)
      [span_55](start_span)alert("Network error while setting default");[span_55](end_span)
    }
  }

  async function saveAddress() {
    if (!userId) {
      [span_56](start_span)return alert("User ID missing — please login or wait for user data to load.");[span_56](end_span)
    }
    if (
      !formAddress.name ||
      !formAddress.phone ||
      !formAddress.address ||
      !formAddress.city ||
      !formAddress.state ||
      !formAddress.postalCode
    ) {
      [span_57](start_span)return alert("Please fill all required fields");[span_57](end_span)
    }

    [span_58](start_span)let finalAddressType = formAddress.addressType;[span_58](end_span)
    if (finalAddressType === "Other") {
      if (!customAddressType.trim()) {
        [span_59](start_span)return alert("Please specify the custom address type.");[span_59](end_span)
      }
      [span_60](start_span)finalAddressType = customAddressType.trim();[span_60](end_span)
    }

    [span_61](start_span)setLoading(true);[span_61](end_span)
    try {
      const url = isEditing ? [span_62](start_span)`${API_BASE}/${editingId}` : `${API_BASE}/`;[span_62](end_span)
      const method = isEditing ? [span_63](start_span)"PUT" : "POST";[span_63](end_span)
      [span_64](start_span)const payload = { ...formAddress, addressType: finalAddressType, userId };[span_64](end_span)
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      [span_65](start_span)});[span_65](end_span)
      [span_66](start_span)const data = await res.json();[span_66](end_span)
      if (data.success) {
        if (isEditing) {
          [span_67](start_span)setAddresses((prev) => prev.map((a) => (a.id === data.data.id ? data.data : a)));[span_67](end_span)
        } else {
          [span_68](start_span)setAddresses((prev) => [data.data, ...prev]);[span_68](end_span)
        }
        [span_69](start_span)setShowForm(false);[span_69](end_span)
        [span_70](start_span)setIsEditing(false);[span_70](end_span)
        [span_71](start_span)setEditingId(null);[span_71](end_span)
        [span_72](start_span)const newIndex = addresses.findIndex(a => a.id === data.data.id);[span_72](end_span)
        [span_73](start_span)setSelectedIndex(newIndex !== -1 ? newIndex : 0);[span_73](end_span)
        [span_74](start_span)onSelect?.(data.data);[span_74](end_span)
      } else {
        [span_75](start_span)alert(data.msg || "Failed to save address");[span_75](end_span)
      }
    } catch (err) {
      [span_76](start_span)console.error("saveAddress error:", err);[span_76](end_span)
      [span_77](start_span)alert("Network error while saving address");[span_77](end_span)
    } finally {
      [span_78](start_span)setLoading(false);[span_78](end_span)
    }
  }

  async function lookupPostalCode(pc) {
    [span_79](start_span)if (!pc) return;[span_79](end_span)
    [span_80](start_span)const postal = String(pc).trim();[span_80](end_span)
    if (/^\d{6}$/.test(postal)) {
      try {
        [span_81](start_span)const r = await fetch(`https://api.postalpincode.in/pincode/${postal}`);[span_81](end_span)
        [span_82](start_span)const j = await r.json();[span_82](end_span)
        if (Array.isArray(j) && j[0].Status === "Success" && j[0].PostOffice?.length) {
          [span_83](start_span)const po = j[0].PostOffice[0];[span_83](end_span)
          setFormAddress((prev) => ({
            ...prev,
            city: po.District || prev.city,
            state: po.State || prev.state,
            country: "India",
          [span_84](start_span)}));[span_84](end_span)
        }
      } catch (e) {
        [span_85](start_span)console.warn("postalpincode lookup failed", e);[span_85](end_span)
      }
    }
  }

  function useCurrentLocationInForm() {
    [span_86](start_span)if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");[span_86](end_span)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        [span_87](start_span)const { latitude, longitude, accuracy } = position.coords;[span_87](end_span)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          [span_88](start_span));[span_88](end_span)
          [span_89](start_span)const data = await response.json();[span_89](end_span)
          if (data) {
            const addr = data.address || [span_90](start_span){};[span_90](end_span)
            setFormAddress((prev) => ({
              ...prev,
              [span_91](start_span)address: (data.display_name || prev.address).split(",")[0],[span_91](end_span)
              [span_92](start_span)city: addr.city || addr.town || addr.village || prev.city,[span_92](end_span)
              [span_93](start_span)state: addr.state || prev.state,[span_93](end_span)
              [span_94](start_span)postalCode: addr.postcode || prev.postalCode,[span_94](end_span)
              [span_95](start_span)country: addr.country || prev.country,[span_95](end_span)
              [span_96](start_span)latitude,[span_96](end_span)
              [span_97](start_span)longitude,[span_97](end_span)
              [span_98](start_span)geoAccuracy: accuracy,[span_98](end_span)
            [span_99](start_span)}));[span_99](end_span)
            [span_100](start_span)setShowForm(true);[span_100](end_span)
          } else {
            [span_101](start_span)alert("Unable to reverse-geocode your location.");[span_101](end_span)
          }
        } catch (err) {
          [span_102](start_span)console.error("reverse geocode failed", err);[span_102](end_span)
          [span_103](start_span)alert("Failed to fetch address details from location.");[span_103](end_span)
        }
      },
      (error) => {
        [span_104](start_span)alert("Failed to get your location: " + error.message);[span_104](end_span)
      }
    );
  }

  function onPostalBlur() {
    [span_105](start_span)const pc = formAddress.postalCode;[span_105](end_span)
    [span_106](start_span)if (!pc) return;[span_106](end_span)
    [span_107](start_span)lookupPostalCode(pc);[span_107](end_span)
  }

  function updateFormAddress(field, value) {
    if (field === "addressType") {
      [span_108](start_span)setFormAddress((prev) => ({ ...prev, addressType: value }));[span_108](end_span)
      [span_109](start_span)if (value !== "Other") setCustomAddressType("");[span_109](end_span)
    } else {
      [span_110](start_span)setFormAddress((prev) => ({ ...prev, [field]: value }));[span_110](end_span)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        [span_111](start_span)<h2 className="text-xl font-semibold">Select Delivery Address</h2>[span_111](end_span)
        <button 
          onClick={addNew} 
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition"
        >
          + Add New Address
        [span_112](start_span)</button>[span_112](end_span)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        [span_113](start_span){addresses.map((addr, i) => {[span_113](end_span)
          const fullAddress = [
            addr.address,
            addr.landmark,
            `${addr.city}, ${addr.state} - ${addr.postalCode}`,
            addr.country
          ].filter(Boolean).join(", ");

          return (
            <div
              key={addr.id}
              [span_114](start_span)className={`bg-white rounded-lg p-4 shadow-sm flex flex-col gap-2 border cursor-pointer transition ${selectedIndex === i ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'}`}[span_114](end_span)
              [span_115](start_span)onClick={() => selectAddress(i)}[span_115](end_span)
            >
              <div className="flex items-start justify-between">
                <div>
                  [span_116](start_span)<div className="font-medium">{addr.name}</div>[span_116](end_span)
                  <div className="text-sm text-slate-500 mt-1">
                    {fullAddress}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  [span_117](start_span){addr.isDefault && ([span_117](end_span)
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white">Default</span> 
                  )}
                </div>
              </div>

              <div className="text-sm text-slate-600">
                [span_118](start_span)📞 {addr.phone}[span_118](end_span)
                [span_119](start_span){addr.altPhone && <span className="text-slate-500"> (Alt: {addr.altPhone})</span>}[span_119](end_span)
              </div>

              <div className="flex gap-2 mt-2">
                [span_120](start_span){!addr.isDefault && ([span_120](end_span)
                  <button onClick={(e) => { e.stopPropagation(); setDefaultAddress(i); [span_121](start_span)}} className="px-3 py-1 rounded-md border text-sm hover:bg-slate-50 transition">[span_121](end_span)
                    Set Default
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); editAddress(i); [span_122](start_span)}} className="px-3 py-1 rounded-md border text-sm hover:bg-slate-50 transition">[span_122](end_span)
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAddress(i); [span_123](start_span)}}[span_123](end_span)
                  className="px-3 py-1 rounded-md border text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      [span_124](start_span){showForm && ([span_124](end_span)
        <div className="mt-6 bg-slate-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{isEditing ? [span_125](start_span)"Edit Address" : "Add New Address"}</h3>[span_125](end_span)
          
          <div className="grid grid-cols-1 gap-y-4 gap-x-3">
            <FloatingInput
              label="Name*"
              [span_126](start_span)value={formAddress.name}[span_126](end_span)
              [span_127](start_span)onChange={(e) => updateFormAddress("name", e.target.value)}[span_127](end_span)
            />
            <div className="grid md:grid-cols-2 gap-3">
              <FloatingInput
                label="Phone*"
                type="tel"
                [span_128](start_span)value={formAddress.phone}[span_128](end_span)
                [span_129](start_span)onChange={(e) => updateFormAddress("phone", e.target.value)}[span_129](end_span)
              />
              <FloatingInput
                label="Alternate Phone"
                type="tel"
                value={formAddress.altPhone || [span_130](start_span)""}[span_130](end_span)
                [span_131](start_span)onChange={(e) => updateFormAddress("altPhone", e.target.value)}[span_131](end_span)
              />
            </div>
            <FloatingInput
              label="Address (House No, Building, Street, Area)*"
              value={formAddress.address || [span_132](start_span)""}[span_132](end_span)
              [span_133](start_span)onChange={(e) => updateFormAddress("address", e.target.value)}[span_133](end_span)
            />
            <div className="grid md:grid-cols-2 gap-3">
              <FloatingInput
                label="Landmark"
                value={formAddress.landmark || [span_134](start_span)""}[span_134](end_span)
                [span_135](start_span)onChange={(e) => updateFormAddress("landmark", e.target.value)}[span_135](end_span)
              />
              <FloatingInput
                label="City*"
                value={formAddress.city || [span_136](start_span)""}[span_136](end_span)
                [span_137](start_span)onChange={(e) => updateFormAddress("city", e.target.value)}[span_137](end_span)
              />
            </div>
            <div className="flex items-center gap-2">
              <FloatingInput
                label="Postal Code*"
                value={formAddress.postalCode || [span_138](start_span)""}[span_138](end_span)
                [span_139](start_span)onChange={(e) => updateFormAddress("postalCode", e.target.value)}[span_139](end_span)
                [span_140](start_span)onBlur={onPostalBlur}[span_140](end_span)
              />
              [span_141](start_span)<button type="button" onClick={useCurrentLocationInForm} className="p-2 h-12 border rounded-md hover:bg-slate-100 transition whitespace-nowrap text-sm">[span_141](end_span)
                <FontAwesomeIcon icon={faLocationArrow} className="mr-2" />Locate Me
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <FloatingInput
                label="State*"
                value={formAddress.state || [span_142](start_span)""}[span_142](end_span)
                [span_143](start_span)onChange={(e) => updateFormAddress("state", e.target.value)}[span_143](end_span)
              />
              <FloatingInput
                label="Country"
                value={formAddress.country || [span_144](start_span)"India"}[span_144](end_span)
                disabled
              />
            </div>
            
            <fieldset>
              [span_145](start_span)<legend className="text-sm font-medium text-slate-700 mb-2">Address Type</legend>[span_145](end_span)
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {["Home", "Work", "Other"].map(type => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                        <input 
                            type="radio" 
                            name="addressType" 
                            value={type} 
                            [span_146](start_span)checked={formAddress.addressType === type}[span_146](end_span)
                            [span_147](start_span)onChange={(e) => updateFormAddress("addressType", e.target.value)}[span_147](end_span)
                        />
                        {type}
                    </label>
                ))}
                [span_148](start_span){formAddress.addressType === "Other" && ([span_148](end_span)
                  [span_149](start_span)<input type="text" placeholder="Specify type" value={customAddressType} onChange={(e) => setCustomAddressType(e.target.value)} className="rounded-md border-slate-300 text-sm"/>[span_149](end_span)
                )}
              </div>
            </fieldset>
            
            <div className="flex gap-2 mt-3">
              [span_150](start_span)<button type="button" onClick={saveAddress} disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400">[span_150](end_span)
                {loading ? [span_151](start_span)"Saving..." : "Save Address"}[span_151](end_span)
              </button>
              [span_152](start_span)<button type="button" onClick={() => setShowForm(false)} disabled={loading} className="px-4 py-2 rounded-md border hover:bg-slate-100">[span_152](end_span)
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
