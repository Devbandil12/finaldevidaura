
// src/components/AddressSelection.jsx

import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// import "../style/addressSelection.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

/* Fix default icon paths for many bundlers */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "") + "/api/address";

function ClickableMap({ center, marker, setMarker }) {
  useMapEvents({
    click(e) {
      setMarker(e.latlng);
    },
  });
  return marker ? <Marker position={marker} /> : null;
}

export default function AddressSelection({ userId, onSelect, selectedAddress }) {
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
            const currentPos = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
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
    setCustomAddressType(
      addr.addressType && !["Home", "Work", "Other"].includes(addr.addressType)
        ? addr.addressType
        : ""
    );
  }

  async function deleteAddress(idx) {
    const toDelete = addresses[idx];
    if (!toDelete) return alert("Address not found");
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`${API_BASE}/${toDelete.id}`, {
        method: "DELETE",
      });
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
      const res = await fetch(`${API_BASE}/${addr.id}/default`, {
        method: "PUT",
      });
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
      return alert(
        "User ID missing — please login or wait for user data to load."
      );
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
          setAddresses((prev) =>
            prev.map((a) => (a.id === data.data.id ? data.data : a))
          );
        } else {
          setAddresses((prev) => [data.data, ...prev]);
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        const idx = addresses.findIndex?.((a) => a.id === data.data.id) ?? 0;
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
            city: po.District,
            state: po.State,
            country: "India",
          }));
        } else {
          console.log("No postal data found");
        }
      } catch (err) {
        console.error("Postal lookup error:", err);
      }
    }
  }

  function applyMapLocation() {
    if (!mapMarker) return;
    setFormAddress((prev) => ({
      ...prev,
      latitude: mapMarker.lat,
      longitude: mapMarker.lng,
      geoAccuracy: "Approximate",
    }));
    setShowMap(false);
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Select Address
      </h2>

      {!showForm && addresses.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr, idx) => (
              <div
                key={addr.id}
                onClick={() => selectAddress(idx)}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${
                    selectedAddress?.id === addr.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-500 shadow-sm hover:shadow-md"
                  }`}
              >
                {addr.isDefault && (
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {addr.name}
                  </h3>
                  <div className="flex gap-2 text-gray-500 text-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        editAddress(idx);
                      }}
                      className="hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(idx);
                      }}
                      className="hover:text-red-600"
                    >
                      Delete
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultAddress(idx);
                        }}
                        className="hover:text-green-600"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700">{addr.address}, {addr.city}</p>
                <p className="text-gray-700">
                  {addr.state}, {addr.country} - {addr.postalCode}
                </p>
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">Phone:</span> {addr.phone}
                </p>
                <span className="absolute bottom-2 left-2 text-xs text-gray-500">
                  {addr.addressType}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={addNew}
            className="w-full md:w-auto mt-4 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            Add New Address
          </button>
        </div>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow-inner">
          <p className="text-gray-500 mb-4">You have no saved addresses.</p>
          <button
            onClick={addNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            Add First Address
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Address" : "Add New Address"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                value={formAddress.name}
                onChange={(e) => setFormAddress({ ...formAddress, name: e.target.value })}
                required
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formAddress.phone}
                onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })}
                required
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                id="address"
                value={formAddress.address}
                onChange={(e) => setFormAddress({ ...formAddress, address: e.target.value })}
                required
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full">
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  value={formAddress.postalCode}
                  onChange={(e) => setFormAddress({ ...formAddress, postalCode: e.target.value })}
                  onBlur={(e) => lookupPostalCode(e.target.value)}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-full">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  id="city"
                  value={formAddress.city}
                  onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                id="state"
                value={formAddress.state}
                onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })}
                required
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                id="country"
                value={formAddress.country}
                onChange={(e) => setFormAddress({ ...formAddress, country: e.target.value })}
                required
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                id="landmark"
                value={formAddress.landmark}
                onChange={(e) => setFormAddress({ ...formAddress, landmark: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="addressType" className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <select
                id="addressType"
                value={formAddress.addressType}
                onChange={(e) => setFormAddress({ ...formAddress, addressType: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formAddress.addressType === "Other" && (
              <div>
                <label htmlFor="customAddressType" className="block text-sm font-medium text-gray-700 mb-1">Custom Type</label>
                <input
                  type="text"
                  id="customAddressType"
                  value={customAddressType}
                  onChange={(e) => setCustomAddressType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveAddress}
              disabled={loading}
              className={`px-6 py-3 rounded-md font-semibold transition-colors duration-200 shadow-md ${
                loading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Address"}
            </button>
          </div>
        </form>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-11/12 max-w-2xl h-3/4 flex flex-col shadow-lg">
            <MapContainer
              center={mapMarker || [20.5937, 78.9629]}
              zoom={15}
              style={{ flex: 1, borderRadius: "0.5rem" }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickableMap center={mapMarker} marker={mapMarker} setMarker={setMapMarker} />
            </MapContainer>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyMapLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Use This Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
