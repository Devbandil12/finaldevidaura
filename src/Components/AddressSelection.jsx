import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";


/* Fix default icon paths for many bundlers */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address";

function ClickableMap({ center, marker, setMarker }) {
  useMapEvents({
    click(e) {
      setMarker(e.latlng);
    },
  });
  return marker ? <Marker position={marker} /> : null;
}

export default function AddressSelection({ userId, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

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

  // Map modal
  const [showMap, setShowMap] = useState(false);
  const [mapMarker, setMapMarker] = useState(null);
  const mapRef = useRef();

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
          setAddresses(data.data || []);
          const defaultIdx = (data.data || []).findIndex((a) => a.isDefault);
          if (defaultIdx >= 0) {
            setSelectedIndex(defaultIdx);
            onSelect?.(data.data[defaultIdx]);
          } else if ((data.data || []).length > 0) {
            setSelectedIndex(0);
            onSelect?.(data.data[0]);
          }
        }
      } catch (err) {
        console.error("fetch addresses", err);
      }
    })();
  }, [userId]);

  // When opening the map modal, set marker to current location if available
  useEffect(() => {
    if (showMap) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMapMarker(currentPos);
            if (mapRef.current) {
              mapRef.current.setView(currentPos, 15);
            }
          },
          (err) => {
            console.warn("Geolocation failed or denied, using previous marker or default", err);
            if (!mapMarker) {
              setMapMarker({ lat: 20.5937, lng: 78.9629 }); // Default India
            }
          }
        );
      } else {
        if (!mapMarker) {
          setMapMarker({ lat: 20.5937, lng: 78.9629 });
        }
      }
    }
  }, [showMap]);

  function selectAddress(idx) {
    setSelectedIndex(idx);
    onSelect?.(addresses[idx]);
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
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === addr.id })));
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
      return alert("User ID missing â€” please login or wait for user data to load.");
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
          setAddresses((prev) => prev.map((a) => (a.id === data.data.id ? data.data : a)));
        } else {
          setAddresses((prev) => [data.data, ...prev]);
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        const idx = (addresses.findIndex?.((a) => a.id === data.data.id)) ?? 0;
        setSelectedIndex(idx);
        onSelect?.(data.data);
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

  // Postal code lookup as before
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
          return;
        }
      } catch (e) {
        console.warn("postalpincode lookup failed", e);
      }
    }
    // fallback to Nominatim
    try {
      const q = encodeURIComponent(postal);
      const r2 = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1`);
      const j2 = await r2.json();
      if (Array.isArray(j2) && j2.length > 0) {
        const first = j2[0];
        if (first.address) {
          setFormAddress((prev) => ({
            ...prev,
            city: first.address.city || first.address.town || first.address.village || prev.city,
            state: first.address.state || prev.state,
            country: first.address.country || prev.country,
            latitude: first.lat || prev.latitude,
            longitude: first.lon || prev.longitude,
          }));
        } else {
          setFormAddress((prev) => ({
            ...prev,
            latitude: first.lat || prev.latitude,
            longitude: first.lon || prev.longitude,
          }));
        }
      }
    } catch (e) {
      console.warn("nominatim postal lookup failed", e);
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

  async function applyMapMarker() {
    if (!mapMarker) {
      alert("Please pick a location on the map.");
      return;
    }
    const lat = mapMarker.lat;
    const lon = mapMarker.lng ?? mapMarker.lon;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const j = await res.json();
      const addr = j.address || {};
      setFormAddress((prev) => ({
        ...prev,
        address: j.display_name?.split(",")[0] || prev.address,
        city: addr.city || addr.town || addr.village || prev.city,
        state: addr.state || prev.state,
        postalCode: addr.postcode || prev.postalCode,
        country: addr.country || prev.country,
        latitude: lat,
        longitude: lon,
        geoAccuracy: prev.geoAccuracy,
      }));
      setShowMap(false);
      setShowForm(true);
    } catch (err) {
      console.error("reverse geocode marker failed", err);
      alert("Failed to fetch address for selected location.");
    }
  }

  // Helper to update formAddress with changes, including addressType management
  function updateFormAddress(field, value) {
    if (field === "addressType") {
      setFormAddress((prev) => ({ ...prev, addressType: value }));
      if (value !== "Other") setCustomAddressType("");
    } else {
      setFormAddress((prev) => ({ ...prev, [field]: value }));
    }
  }

  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>

      <button onClick={addNew} className="add-new-btn">
        + Add New Address
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
                {addr.name} {addr.isVerified ? "âœ”ï¸" : ""}
              </strong>
              <div className="address-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editAddress(i);
                  }}
                >
                  âœŽ
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(i);
                  }}
                >
                  ðŸ—‘
                </button>
                {!addr.isDefault ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultAddress(i);
                    }}
                  >
                    Set Default
                  </button>
                ) : (
                  <span className="default-label">Default</span>
                )}
              </div>
            </div>
            <p>
              {addr.address}
              {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}
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
            {/* Name */}
            <label className="form-label">
              Name<span style={{ color: "red" }}>*</span>
              <input
                value={formAddress.name}
                onChange={(e) => updateFormAddress("name", e.target.value)}
              />
            </label>

            {/* Phone */}
            <label className="form-label">
              Phone<span style={{ color: "red" }}>*</span>
              <input
                value={formAddress.phone}
                onChange={(e) => updateFormAddress("phone", e.target.value)}
              />
            </label>

            {/* Alt Phone */}
            <label className="form-label">
              Alt Phone
              <input
                value={formAddress.altPhone || ""}
                onChange={(e) => updateFormAddress("altPhone", e.target.value)}
              />
            </label>

            {/* Address (moved above postal code) */}
            <label className="form-label">
              Address<span style={{ color: "red" }}>*</span>
              <input
                value={formAddress.address || ""}
                onChange={(e) => updateFormAddress("address", e.target.value)}
              />
            </label>

            {/* Landmark (above postal code) */}
            <label className="form-label">
              Landmark
              <input
                value={formAddress.landmark || ""}
                onChange={(e) => updateFormAddress("landmark", e.target.value)}
              />
            </label>

            {/* Postal Code */}
            <label className="form-label">
              Postal Code<span style={{ color: "red" }}>*</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={formAddress.postalCode || ""}
                  onChange={(e) => updateFormAddress("postalCode", e.target.value)}
                  onBlur={onPostalBlur}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={useCurrentLocationInForm}>
                  Use my location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMap(true);
                  }}
                >
                  Pick on map
                </button>
              </div>
            </label>

            {/* City */}
            <label className="form-label">
              City<span style={{ color: "red" }}>*</span>
              <input
                value={formAddress.city || ""}
                onChange={(e) => updateFormAddress("city", e.target.value)}
              />
            </label>

            {/* State */}
            <label className="form-label">
              State<span style={{ color: "red" }}>*</span>
              <input
                value={formAddress.state || ""}
                onChange={(e) => updateFormAddress("state", e.target.value)}
              />
            </label>

            {/* Country */}
            <label className="form-label">
              Country
              <input
                value={formAddress.country || "India"}
                disabled
                onChange={(e) => updateFormAddress("country", e.target.value)}
              />
            </label>

            {/* Delivery Instructions */}
            <label className="form-label">
              Delivery Instructions
              <textarea
                value={formAddress.deliveryInstructions || ""}
                onChange={(e) => updateFormAddress("deliveryInstructions", e.target.value)}
              />
            </label>

            {/* Address Type radios */}
            <fieldset className="form-label">
              <legend>Address Type</legend>
              <label>
                <input
                  type="radio"
                  name="addressType"
                  value="Home"
                  checked={formAddress.addressType === "Home"}
                  onChange={(e) => updateFormAddress("addressType", e.target.value)}
                />
                Home
              </label>
              <label>
                <input
                  type="radio"
                  name="addressType"
                  value="Work"
                  checked={formAddress.addressType === "Work"}
                  onChange={(e) => updateFormAddress("addressType", e.target.value)}
                />
                Work
              </label>
              <label>
                <input
                  type="radio"
                  name="addressType"
                  value="Other"
                  checked={formAddress.addressType === "Other"}
                  onChange={(e) => updateFormAddress("addressType", e.target.value)}
                />
                Other
              </label>
              {formAddress.addressType === "Other" && (
                <input
                  type="text"
                  placeholder="Enter custom address type"
                  value={customAddressType}
                  onChange={(e) => setCustomAddressType(e.target.value)}
                />
              )}
            </fieldset>

            {/* Label */}
            <label className="form-label">
              Label
              <input
                value={formAddress.label || ""}
                onChange={(e) => updateFormAddress("label", e.target.value)}
              />
            </label>

            {/* Verified label (hidden checkbox, show verified label instead) */}
            <div className="form-label" style={{ marginTop: 12 }}>
              <label>
                Status: <strong style={{ color: "green" }}>Verified</strong>
              </label>
            </div>

            {/* Hidden latitude and longitude in state only */}
            {/* Not rendered in UI */}

            <div className="form-buttons" style={{ marginTop: 15 }}>
              <button type="button" onClick={() => setShowForm(false)} disabled={loading}>
                Cancel
              </button>
              <button type="button" onClick={saveAddress} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div
          className="map-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 10,
              borderRadius: 8,
              width: "90%",
              maxWidth: 600,
              height: 400,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MapContainer
              center={mapMarker || [20.5937, 78.9629]}
              zoom={15}
              style={{ flex: 1 }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickableMap center={mapMarker} marker={mapMarker} setMarker={setMapMarker} />
            </MapContainer>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
              <button type="button" onClick={() => setShowMap(false)}>
                Cancel
              </button>
              <button type="button" onClick={applyMapMarker}>
                Select Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}