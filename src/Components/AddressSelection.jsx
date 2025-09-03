import React, { useState, useEffect } from "react";
import "../style/addressSelection.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address";

export default function AddressSelection({ userId, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showAllAddresses, setShowAllAddresses] = useState(false);

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
  };

  const [formAddress, setFormAddress] = useState(emptyAddress);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // For controlling custom address type input
  const [customAddressType, setCustomAddressType] = useState("");

  // Load addresses
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
      }
    })();
  }, [userId, onSelect]);


  function selectAddress(idx) {
    setSelectedIndex(idx);
    onSelect?.(addresses[idx]);
    setShowAllAddresses(false); // Collapse list upon selection
  }

  function addNew() {
    setFormAddress(emptyAddress);
    setCustomAddressType("");
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  }

  function editAddress(idx) {
    const addr = addresses[idx];
    setFormAddress(addr);
    setIsEditing(true);
    setEditingId(addr.id);
    setShowForm(true);
    setCustomAddressType(addr.addressType && !["Home", "Work", "Other"].includes(addr.addressType) ? addr.addressType : "");
  }

  async function deleteAddress(idx) {
    const toDelete = addresses[idx];
    if (!toDelete) return alert("Address not found");
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`${API_BASE}/${toDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const filtered = addresses.filter((a) => a.id !== toDelete.id);
        setAddresses(filtered);
        // If the deleted address was selected, select the first one or none
        if (selectedIndex === idx) {
            if(filtered.length > 0) {
                selectAddress(0);
            } else {
                setSelectedIndex(null);
                onSelect?.(null);
            }
        }
        setShowForm(false);
      } else {
        alert(data.msg || "Failed to delete address");
      }
    } catch (err) {
      console.error("deleteAddress error:", err);
      alert("Network error while deleting address");
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
      } else {
        alert(data.msg || "Failed to set default");
      }
    } catch (err) {
      console.error("setDefaultAddress error:", err);
      alert("Network error while setting default");
    }
  }

  async function saveAddress() {
    if (!userId) {
      return alert("User ID missing — please login or wait for user data to load.");
    }
    // required fields
    if (
      !formAddress.name ||
      !formAddress.phone ||
      !formAddress.address ||
      !formAddress.city ||
      !formAddress.state ||
      !formAddress.postalCode
    ) {
      return alert("Please fill all required fields");
    }

    // Compose addressType properly
    let finalAddressType = formAddress.addressType;
    if (finalAddressType === "Other") {
      if (!customAddressType.trim()) {
        return alert("Please specify the custom address type.");
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
            const updatedIndex = updatedAddresses.findIndex(a => a.id === data.data.id);
            selectAddress(updatedIndex >= 0 ? updatedIndex : 0);
        } else {
            const newAddresses = [data.data, ...addresses];
            setAddresses(newAddresses);
            selectAddress(0); // Select the new address at the top
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
      } else {
        alert(data.msg || "Failed to save address");
      }
    } catch (err) {
      console.error("saveAddress error:", err);
      alert("Network error while saving address");
    } finally {
      setLoading(false);
    }
  }

  // Postal code lookup
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
            country: "India",
          }));
        }
      } catch (e) {
        console.warn("postalpincode lookup failed", e);
      }
    }
  }

  function useCurrentLocationInForm() {
    if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data) {
            const addr = data.address || {};
            setFormAddress((prev) => ({
              ...prev,
              address: (data.display_name || prev.address).split(",")[0],
              city: addr.city || addr.town || addr.village || prev.city,
              state: addr.state || prev.state,
              postalCode: addr.postcode || prev.postalCode,
              country: addr.country || prev.country,
              latitude,
              longitude,
              geoAccuracy: accuracy,
            }));
            setShowForm(true);
          } else {
            alert("Unable to reverse-geocode your location.");
          }
        } catch (err) {
          console.error("reverse geocode failed", err);
          alert("Failed to fetch address details from location.");
        }
      },
      (error) => {
        alert("Failed to get your location: " + error.message);
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
  
  const renderAddressCard = (addr, index) => {
    const fullAddress = [
      addr.address,
      addr.landmark,
      `${addr.city}, ${addr.state} - ${addr.postalCode}`,
      addr.country
    ].filter(Boolean).join(", ");
  
    return (
      <div
        key={addr.id}
        className={`address-card ${selectedIndex === index ? "active" : ""}`}
        onClick={() => selectAddress(index)}
      >
        <div className="radio-control">
          <input
            type="radio"
            name="delivery-address"
            readOnly
            checked={selectedIndex === index}
          />
        </div>
        <div className="address-details">
          <div className="address-card-top">
            <div className="address-card-name-type">
              <span className="name">{addr.name}</span>
              <span className="type">{addr.addressType}</span>
            </div>
            {addr.isDefault && <div className="address-card-default-badge">Default</div>}
          </div>
          <div className="address-card-body">{fullAddress}</div>
          <div className="address-card-phone">Phone: {addr.phone}</div>
  
          <div className="address-card-actions">
            {!addr.isDefault && (
              <button onClick={(e) => { e.stopPropagation(); setDefaultAddress(index); }}>
                Set Default
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); editAddress(index); }}>
              Edit
            </button>
            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteAddress(index); }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="address-selection">
      <h2>Select Delivery Address</h2>

      <div className="address-list-container">
        {addresses.length > 0 && (
          <div className="address-list-header">
            <h4>{showAllAddresses ? 'Choose an address' : 'Delivering to:'}</h4>
            {addresses.length > 1 && (
              <button onClick={() => setShowAllAddresses(prev => !prev)} className="change-address-btn">
                {showAllAddresses ? 'Cancel' : 'Change'}
              </button>
            )}
          </div>
        )}
        
        <div className="address-list">
          {showAllAddresses 
            ? addresses.map((addr, i) => renderAddressCard(addr, i))
            : selectedIndex !== null && addresses[selectedIndex] 
              ? renderAddressCard(addresses[selectedIndex], selectedIndex) 
              : addresses.length === 0 && !showForm ? <p>No addresses found. Please add one.</p> : null
          }
        </div>
      </div>

      {!showForm && (
        <button onClick={addNew} className="add-new-btn">
            + Add New Address
        </button>
      )}

      {showForm && (
        <div className="address-form">
          <h3>{isEditing ? "Edit Address" : "Add New Address"}</h3>
          <div className="form-grid">
            <div className="input-group">
              <input id="name" value={formAddress.name} onChange={(e) => updateFormAddress("name", e.target.value)} placeholder=" " required />
              <label htmlFor="name">Name<span style={{ color: "red" }}>*</span></label>
            </div>
            <div className="row">
              <div className="input-group">
                <input id="phone" type="tel" value={formAddress.phone} onChange={(e) => updateFormAddress("phone", e.target.value)} placeholder=" " required />
                <label htmlFor="phone">Phone<span style={{ color: "red" }}>*</span></label>
              </div>
              <div className="input-group">
                <input id="altPhone" type="tel" value={formAddress.altPhone || ""} onChange={(e) => updateFormAddress("altPhone", e.target.value)} placeholder=" " />
                <label htmlFor="altPhone">Alt Phone</label>
              </div>
            </div>
            <div className="input-group">
              <input id="address" value={formAddress.address || ""} onChange={(e) => updateFormAddress("address", e.target.value)} placeholder=" " required />
              <label htmlFor="address">Address<span style={{ color: "red" }}>*</span></label>
            </div>
            <div className="row">
              <div className="input-group">
                <input id="landmark" value={formAddress.landmark || ""} onChange={(e) => updateFormAddress("landmark", e.target.value)} placeholder=" " />
                <label htmlFor="landmark">Landmark</label>
              </div>
              <div className="input-group">
                <input id="city" value={formAddress.city || ""} onChange={(e) => updateFormAddress("city", e.target.value)} placeholder=" " required />
                <label htmlFor="city">City<span style={{ color: "red" }}>*</span></label>
              </div>
            </div>
            <div className="postal-row">
              <div className="input-group" style={{ flex: 1 }}>
                <input id="postalCode" value={formAddress.postalCode || ""} onChange={(e) => updateFormAddress("postalCode", e.target.value)} onBlur={onPostalBlur} placeholder=" " required />
                <label htmlFor="postalCode">Postal Code<span style={{ color: "red" }}>*</span></label>
              </div>
              <button type="button" onClick={useCurrentLocationInForm}>
                <FontAwesomeIcon icon={faLocationArrow} style={{ marginRight: '6px' }} /> Locate Me
              </button>
            </div>
            <div className="row">
              <div className="input-group">
                <input id="state" value={formAddress.state || ""} onChange={(e) => updateFormAddress("state", e.target.value)} placeholder=" " required />
                <label htmlFor="state">State<span style={{ color: "red" }}>*</span></label>
              </div>
              <div className="input-group">
                <input id="country" value={formAddress.country || "India"} disabled placeholder=" " onChange={(e) => updateFormAddress("country", e.target.value)} />
                <label htmlFor="country">Country</label>
              </div>
            </div>
            <div className="input-group">
              <textarea id="deliveryInstructions" value={formAddress.deliveryInstructions || ""} onChange={(e) => updateFormAddress("deliveryInstructions", e.target.value)} placeholder=" " rows={3} />
              <label htmlFor="deliveryInstructions">Delivery Instructions</label>
            </div>
            <fieldset className="form-label">
              <legend>Address Type</legend>
              <label><input type="radio" name="addressType" value="Home" checked={formAddress.addressType === "Home"} onChange={(e) => updateFormAddress("addressType", e.target.value)} /> Home</label>
              <label><input type="radio" name="addressType" value="Work" checked={formAddress.addressType === "Work"} onChange={(e) => updateFormAddress("addressType", e.target.value)} /> Work</label>
              <label><input type="radio" name="addressType" value="Other" checked={formAddress.addressType === "Other"} onChange={(e) => updateFormAddress("addressType", e.target.value)} /> Other</label>
              {formAddress.addressType === "Other" && (
                <input type="text" placeholder="Enter custom address type" value={customAddressType} onChange={(e) => setCustomAddressType(e.target.value)} />
              )}
            </fieldset>
            <div className="form-buttons" style={{ marginTop: 15 }}>
              <button type="button" onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
              <button type="button" onClick={saveAddress} disabled={loading}>{loading ? "Saving..." : "Save Address"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
