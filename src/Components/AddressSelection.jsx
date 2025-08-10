import React, { useState, useEffect } from "react";

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address";

export default function AddressSelection({ userId, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const emptyAddress = {
    name: "",
    phone: "",
    altPhone: null,
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    landmark: "",
    deliveryInstructions: "",
    addressType: "Home",
    label: "",
    latitude: null,
    longitude: null,
    geoAccuracy: null,
    isDefault: false,
    isVerified: false,
  };

  const [formAddress, setFormAddress] = useState(emptyAddress);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load addresses for user
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/user/${userId}`);
        const data = await res.json();
        if (data.success) {
          setAddresses(data.data || []);
          const defaultIdx = (data.data || []).findIndex((a) => a.isDefault);
          if (defaultIdx >= 0) {
            setSelectedIndex(defaultIdx);
            onSelect?.(data.data[defaultIdx]);
          } else if ((data.data || []).length > 0) {
            setSelectedIndex(0);
            onSelect?.(data.data[0]);
          }
        } else {
          console.error("Failed to load addresses", data.msg);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    })();
  }, [userId]);

  function selectAddress(idx) {
    setSelectedIndex(idx);
    onSelect?.(addresses[idx]);
  }

  function addNew() {
    setFormAddress(emptyAddress);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  }

  function editAddress(idx) {
    setFormAddress(addresses[idx]);
    setIsEditing(true);
    setEditingId(addresses[idx].id);
    setShowForm(true);
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
        setSelectedIndex(null);
        onSelect?.(null);
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
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === addr.id }))
        );
        setSelectedIndex(idx);
        onSelect?.(addr);
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

    // Basic required validation
    if (!formAddress.name || !formAddress.phone || !formAddress.address || !formAddress.city || !formAddress.state || !formAddress.postalCode) {
      return alert("Please fill all required fields");
    }

    setLoading(true);
    try {
      const url = isEditing ? `${API_BASE}/${editingId}` : `${API_BASE}/`;
      const method = isEditing ? "PUT" : "POST";

      const payload = { ...formAddress, userId };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Prefer using returned `data` from server if available
        if (data.data) {
          // If POST returned new item, insert/update locally
          if (isEditing) {
            setAddresses((prev) => prev.map((a) => (a.id === data.data.id ? data.data : a)));
          } else {
            setAddresses((prev) => [data.data, ...prev]);
          }
          // Choose default or first
          const defaultAddr = (isEditing ? data.data : data.data) || addresses[0];
          const defaultIdx = (addresses.findIndex?.((a) => a.id === defaultAddr?.id)) ?? 0;
          setSelectedIndex(defaultIdx);
          onSelect?.(defaultAddr);
        } else {
          // Fallback: re-fetch whole list
          const r = await fetch(`${API_BASE}/user/${userId}`);
          const d = await r.json();
          if (d.success) setAddresses(d.data || []);
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

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data && data.address) {
            const addr = data.address;
            setFormAddress((prev) => ({
              ...prev,
              address: (addr.road || addr.pedestrian || addr.house_number || "").trim(),
              city: addr.city || addr.town || addr.village || "",
              state: addr.state || "",
              postalCode: addr.postcode || "",
              country: addr.country || "India",
              latitude,
              longitude,
              geoAccuracy: accuracy,
            }));
            setShowForm(true);
            setIsEditing(false);
            setEditingId(null);
          } else {
            alert("Unable to retrieve address from your location.");
          }
        } catch (err) {
          alert("Failed to fetch address details from location.");
          console.error(err);
        }
      },
      (error) => {
        alert("Failed to get your location: " + error.message);
      }
    );
  }

  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>

      <button onClick={addNew} className="add-new-btn">+ Add New Address</button>
      <button onClick={useCurrentLocation} className="use-location-btn" style={{ marginLeft: 10 }}>
        Use My Current Location
      </button>

      <div className="address-list" style={{ marginTop: 15 }}>
        {addresses.map((addr, i) => (
          <div
            key={addr.id}
            className={`address-card ${selectedIndex === i ? "active" : ""}`}
            onClick={() => selectAddress(i)}
          >
            <div className="address-header">
              <strong>
                {addr.name} {addr.isVerified ? "✔️" : ""}
              </strong>
              <div className="address-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editAddress(i);
                  }}
                >
                  ✎
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(i);
                  }}
                >
                  🗑
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultAddress(i);
                    }}
                  >
                    Set Default
                  </button>
                )}
                {addr.isDefault && <span className="default-label">Default</span>}
              </div>
            </div>
            <p>
              {addr.address}{addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}
            </p>
            <p>{addr.country}</p>
            <p>
              Phone: {addr.phone}{addr.altPhone ? `, Alt: ${addr.altPhone}` : ""}
            </p>
            {addr.deliveryInstructions && <p>Delivery Instructions: {addr.deliveryInstructions}</p>}
            <p>Address Type: {addr.addressType}</p>
            {addr.label && <p>Label: {addr.label}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="address-form">
          <h3>{isEditing ? "Edit Address" : "Add New Address"}</h3>

          <div className="form-grid">
            {[
              { label: "Name", field: "name", required: true },
              { label: "Phone", field: "phone", required: true },
              { label: "Alt Phone", field: "altPhone" },
              { label: "Address", field: "address", required: true },
              { label: "Landmark", field: "landmark" },
              { label: "City", field: "city", required: true },
              { label: "State", field: "state", required: true },
              { label: "Postal Code", field: "postalCode", required: true },
              { label: "Country", field: "country", required: true },
              { label: "Delivery Instructions", field: "deliveryInstructions" },
              { label: "Address Type", field: "addressType" },
              { label: "Label", field: "label" },
              { label: "Is Default", field: "isDefault", type: "checkbox" },
              { label: "Is Verified", field: "isVerified", type: "checkbox", disabled: true },
            ].map(({ label, field, required, type = "text", disabled = false }) => (
              <label key={field} className="form-label">
                {label}
                {required && <span style={{ color: "red" }}>*</span>}
                {type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={!!formAddress[field]}
                    disabled={disabled}
                    onChange={(e) => setFormAddress({ ...formAddress, [field]: e.target.checked })}
                  />
                ) : (
                  <input
                    type={type}
                    value={formAddress[field] || ""}
                    onChange={(e) => setFormAddress({ ...formAddress, [field]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button onClick={saveAddress} disabled={loading}>
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
