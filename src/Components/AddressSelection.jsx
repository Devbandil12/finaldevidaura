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
  // a small component to capture clicks and update marker
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

  // DELETE and set default keep same as prior; omitted for brevity here but
  // assume you keep previous deleteAddress and setDefaultAddress implementations.
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

  // Save / Update
  async function saveAddress() {
    if (!userId) {
      return alert("User ID missing — please login or wait for user data to load.");
    }
    // required fields
    if (!formAddress.name || !formAddress.phone || !formAddress.address || !formAddress.city || !formAddress.state || !formAddress.postalCode) {
      return alert("Please fill all required fields");
    }

    setLoading(true);
    try {
      const url = isEditing ? `${API_BASE}/${editingId}` : `${API_BASE}/`;
      const method = isEditing ? "PUT" : "POST";
      const payload = { ...formAddress, userId };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        // update local list
        if (isEditing) {
          setAddresses((prev) => prev.map((a) => (a.id === data.data.id ? data.data : a)));
        } else {
          setAddresses((prev) => [data.data, ...prev]);
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        // select newly saved
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

  /* --------------------------
     Postal-code -> autofill
     - If 6-digit numeric (India) -> use api.postalpincode.in
     - else fallback to Nominatim search
     -------------------------- */
  async function lookupPostalCode(pc) {
    if (!pc) return;
    // quick trim
    const postal = String(pc).trim();
    // India fast path: 6 digits
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

    // fallback to Nominatim (works for many countries)
    try {
      const q = encodeURIComponent(postal);
      const r2 = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1`);
      const j2 = await r2.json();
      if (Array.isArray(j2) && j2.length > 0) {
        const first = j2[0];
        // Parse address if present
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
          // set lat/lon if available, but not address components
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

  // Use browser geolocation and reverse-geocode to fill form (button inside form)
  function useCurrentLocationInForm() {
    if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
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

  // When postal code field loses focus, try lookup
  function onPostalBlur() {
    const pc = formAddress.postalCode;
    if (!pc) return;
    lookupPostalCode(pc);
  }

  // Map modal save: uses mapMarker to set lat/lon and reverse geocode
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

  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>

      <button onClick={addNew} className="add-new-btn">+ Add New Address</button>

      <div className="address-list" style={{ marginTop: 15 }}>
        {addresses.map((addr, i) => (
          <div key={addr.id} className={`address-card ${selectedIndex === i ? "active" : ""}`} onClick={() => selectAddress(i)}>
            <div className="address-header">
              <strong>{addr.name} {addr.isVerified ? "✔️" : ""}</strong>
              <div className="address-actions">
                <button onClick={(e) => { e.stopPropagation(); editAddress(i); }}>✎</button>
                <button onClick={(e) => { e.stopPropagation(); deleteAddress(i); }}>🗑</button>
                {!addr.isDefault ? (
                  <button onClick={(e) => { e.stopPropagation(); setDefaultAddress(i); }}>Set Default</button>
                ) : (
                  <span className="default-label">Default</span>
                )}
              </div>
            </div>
            <p>{addr.address}{addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}</p>
            <p>{addr.country}</p>
            <p>Phone: {addr.phone}{addr.altPhone ? `, Alt: ${addr.altPhone}` : ""}</p>
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
            {/* Basic fields */}
            <label className="form-label">Name<span style={{ color: "red" }}>*</span>
              <input value={formAddress.name} onChange={(e) => setFormAddress({ ...formAddress, name: e.target.value })} />
            </label>

            <label className="form-label">Phone<span style={{ color: "red" }}>*</span>
              <input value={formAddress.phone} onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })} />
            </label>

            <label className="form-label">Alt Phone
              <input value={formAddress.altPhone || ""} onChange={(e) => setFormAddress({ ...formAddress, altPhone: e.target.value })} />
            </label>

            {/* Postal code now above city */}
            <label className="form-label">Postal Code<span style={{ color: "red" }}>*</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={formAddress.postalCode || ""}
                  onChange={(e) => setFormAddress({ ...formAddress, postalCode: e.target.value })}
                  onBlur={onPostalBlur}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={useCurrentLocationInForm}>Use my location</button>
                <button type="button" onClick={() => { setShowMap(true); /* open map modal */ }}>Pick on map</button>
              </div>
            </label>

            <label className="form-label">City<span style={{ color: "red" }}>*</span>
              <input value={formAddress.city || ""} onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })} />
            </label>

            <label className="form-label">State<span style={{ color: "red" }}>*</span>
              <input value={formAddress.state || ""} onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })} />
            </label>

            <label className="form-label">Country<span style={{ color: "red" }}>*</span>
              <input value={formAddress.country || ""} onChange={(e) => setFormAddress({ ...formAddress, country: e.target.value })} />
            </label>

            <label className="form-label">Address<span style={{ color: "red" }}>*</span>
              <input value={formAddress.address || ""} onChange={(e) => setFormAddress({ ...formAddress, address: e.target.value })} />
            </label>

            <label className="form-label">Landmark
              <input value={formAddress.landmark || ""} onChange={(e) => setFormAddress({ ...formAddress, landmark: e.target.value })} />
            </label>

            <label className="form-label">Delivery Instructions
              <input value={formAddress.deliveryInstructions || ""} onChange={(e) => setFormAddress({ ...formAddress, deliveryInstructions: e.target.value })} />
            </label>

            <label className="form-label">Address Type
              <input value={formAddress.addressType || ""} onChange={(e) => setFormAddress({ ...formAddress, addressType: e.target.value })} />
            </label>

            <label className="form-label">Label
              <input value={formAddress.label || ""} onChange={(e) => setFormAddress({ ...formAddress, label: e.target.value })} />
            </label>

            <label className="form-label">Latitude
              <input value={formAddress.latitude || ""} onChange={(e) => setFormAddress({ ...formAddress, latitude: e.target.value })} />
            </label>

            <label className="form-label">Longitude
              <input value={formAddress.longitude || ""} onChange={(e) => setFormAddress({ ...formAddress, longitude: e.target.value })} />
            </label>

            <label className="form-label">Is Default
              <input type="checkbox" checked={!!formAddress.isDefault} onChange={(e) => setFormAddress({ ...formAddress, isDefault: e.target.checked })} />
            </label>

            <label className="form-label">Is Verified
              <input type="checkbox" checked={!!formAddress.isVerified} disabled />
            </label>
          </div>

          <div className="form-actions">
            <button onClick={saveAddress} disabled={loading}>
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Map modal */}
      {showMap && (
        <div className="map-modal" style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{ width: "90%", maxWidth: 900, height: 500, background: "#fff", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Pick exact location on map</strong>
              <div>
                <button onClick={() => setShowMap(false)} style={{ marginRight: 8 }}>Close</button>
                <button onClick={applyMapMarker}>Use this location</button>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <MapContainer center={mapMarker || [20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickableMap center={mapMarker} marker={mapMarker} setMarker={setMapMarker} />
                {mapMarker && <Marker position={mapMarker} />}
              </MapContainer>
            </div>
            <div style={{ padding: 8, textAlign: "center" }}>
              <small>Click anywhere on the map to place a marker. Zoom/pan to refine the position.</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
