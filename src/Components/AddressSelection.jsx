import React, { useState, useEffect } from "react";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "")}/api/address`;

export default function AddressSelection({ userId, onSelect }) {
  // Addresses loaded from backend
  const [addresses, setAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Form state for adding/editing address
  const emptyAddress = {
    name: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
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

  // Load addresses for user
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/list/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAddresses(data.data);
          // Select default address automatically
          const defaultIdx = data.data.findIndex((a) => a.isDefault);
          if (defaultIdx >= 0) {
            setSelectedIndex(defaultIdx);
            onSelect?.(data.data[defaultIdx]);
          }
        }
      });
  }, [userId]);

  // Handle selecting address
  function selectAddress(idx) {
    setSelectedIndex(idx);
    onSelect?.(addresses[idx]);
  }

  // Open form for new address
  function addNew() {
    setFormAddress(emptyAddress);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(true);
  }

  // Open form for editing existing address
  function editAddress(idx) {
    setFormAddress(addresses[idx]);
    setIsEditing(true);
    setEditingId(addresses[idx].id);
    setShowForm(true);
  }

  // Delete address (soft delete)
  async function deleteAddress(idx) {
    const toDelete = addresses[idx];
    if (!toDelete) return alert("Address not found");
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    const res = await fetch(`${API_BASE}/soft-delete/${toDelete.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      // Refresh list after deletion
      const filtered = addresses.filter((a) => a.id !== toDelete.id);
      setAddresses(filtered);
      setSelectedIndex(null);
      onSelect?.(null);
      setShowForm(false);
    } else {
      alert(data.msg || "Failed to delete address");
    }
  }

  // Set default address
  async function setDefaultAddress(idx) {
    const addr = addresses[idx];
    if (!addr) return;
    const res = await fetch(`${API_BASE}/set-default/${addr.id}`, { method: "PUT" });
    const data = await res.json();
    if (data.success) {
      // Update local state to mark default
      setAddresses((prev) =>
        prev.map((a, i) => ({
          ...a,
          isDefault: i === idx,
        }))
      );
      setSelectedIndex(idx);
      onSelect?.(addr);
    } else {
      alert(data.msg || "Failed to set default");
    }
  }

  // Save or update address form
  async function saveAddress() {
    // Basic validation
    if (!formAddress.name || !formAddress.phone || !formAddress.address || !formAddress.city || !formAddress.state || !formAddress.postalCode) {
      return alert("Please fill all required fields");
    }

    const url = isEditing ? `${API_BASE}/update/${editingId}` : `${API_BASE}/save`;
    const method = isEditing ? "PUT" : "POST";

    const payload = { ...formAddress, userId };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      // Refresh address list after save
      fetch(`${API_BASE}/list/${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setAddresses(d.data);
            setShowForm(false);
            // Select default or first address after saving
            const defaultAddr = d.data.find((a) => a.isDefault) || d.data[0];
            const defaultIdx = d.data.findIndex((a) => a.id === defaultAddr.id);
            setSelectedIndex(defaultIdx);
            onSelect?.(defaultAddr);
          }
        });
    } else {
      alert(data.msg || "Failed to save address");
    }
  }

  // Use browser geolocation + reverse geocode to fill address form (without showing lat/lon fields)
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
              address: addr.road || addr.pedestrian || addr.house_number || "",
              city: addr.city || addr.town || addr.village || "",
              state: addr.state || "",
              postalCode: addr.postcode || "",
              country: addr.country || "",
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

      <button onClick={addNew} className="add-new-btn">
        + Add New Address
      </button>

      <button onClick={useCurrentLocation} className="use-location-btn" style={{ marginLeft: "10px" }}>
        Use My Current Location
      </button>

      <div className="address-list" style={{ marginTop: "15px" }}>
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
              {addr.address}, {addr.landmark ? `${addr.landmark}, ` : ""}
              {addr.city}, {addr.state} - {addr.postalCode}
            </p>
            <p>{addr.country}</p>
            <p>
              Phone: {addr.phone}
              {addr.altPhone ? `, Alt: ${addr.altPhone}` : ""}
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
              // Removed lat/lng fields from UI
              // { label: "Latitude", field: "latitude" },
              // { label: "Longitude", field: "longitude" },
              // { label: "Geo Accuracy", field: "geoAccuracy" },
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
                    onChange={(e) =>
                      setFormAddress({ ...formAddress, [field]: e.target.checked })
                    }
                  />
                ) : (
                  <input
                    type={type}
                    value={formAddress[field] || ""}
                    onChange={(e) =>
                      setFormAddress({ ...formAddress, [field]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button
              onClick={() => {
                saveAddress();
              }}
            >
              Save Address
            </button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
