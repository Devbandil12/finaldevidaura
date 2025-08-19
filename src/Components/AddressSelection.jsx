import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow, faMapMarkerAlt, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';


/* Fix default icon paths for many bundlers */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/?$/, "")) + "/api/address";

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
  const [showMap, setShowMap] = useState(false);
  const [mapMarker, setMapMarker] = useState(null);
  const [form, setForm] = useState({});
  const [isNew, setIsNew] = useState(true);
  const mapRef = useRef(null);

  const emptyAddress = {
    name: "",
    phone: "",
    altPhone: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    deliveryInstructions: "",
    addressType: "",
    latitude: "",
    longitude: ""
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/${userId}`);
      const data = await res.json();
      setAddresses(data);
      if (data.length > 0) {
        const defaultIndex = data.findIndex((addr) => addr.isDefault);
        setSelectedIndex(defaultIndex !== -1 ? defaultIndex : 0);
        onSelect(data[defaultIndex !== -1 ? defaultIndex : 0]);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const selectAddress = (index) => {
    setSelectedIndex(index);
    onSelect(addresses[index]);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? API_BASE : `${API_BASE}/${form.id}`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId }),
    });
    if (res.ok) {
      fetchAddresses();
      setForm({});
      setIsNew(true);
    } else {
      console.error("Failed to save address");
    }
  };

  const deleteAddress = async (index) => {
    if (confirm("Are you sure you want to delete this address?")) {
      const id = addresses[index].id;
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAddresses();
      } else {
        console.error("Failed to delete address");
      }
    }
  };

  const editAddress = (index) => {
    setForm(addresses[index]);
    setIsNew(false);
  };

  const setDefaultAddress = async (index) => {
    const id = addresses[index].id;
    const res = await fetch(`${API_BASE}/${id}/default`, {
      method: "PUT",
    });
    if (res.ok) {
      fetchAddresses();
    } else {
      console.error("Failed to set default address");
    }
  };

  const applyMapLocation = () => {
    if (mapMarker) {
      const { lat, lng } = mapMarker;
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        geoAccuracy: "Approximate",
      }));
    }
    setShowMap(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Select your address</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {addresses.map((addr, i) => (
          <div
            key={addr.id}
            className={`bg-white rounded-lg p-5 shadow-sm transition-all duration-200 ease-in-out cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-blue-400 ${
              selectedIndex === i ? "ring-2 ring-blue-500 shadow-lg" : "shadow-md"
            }`}
            onClick={() => selectAddress(i)}
          >
            <div className="flex justify-between items-center mb-2">
              <strong className="text-lg text-gray-700">
                {addr.name} {addr.isVerified ? "✔️" : ""}
              </strong>
              <div className="flex items-center space-x-2">
                <button
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    editAddress(i);
                  }}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                <button
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(i);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                {!addr.isDefault ? (
                  <button
                    className="ml-2 text-sm text-blue-500 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultAddress(i);
                    }}
                  >
                    Set Default
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-1 rounded-full">Default</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-blue-600 mr-1">{addr.addressType}</span> - {addr.address}
              {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
            </p>
            <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
          </div>
        ))}
      </div>
      <button
        className="flex items-center justify-center w-full md:w-auto px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        onClick={() => {
          setForm(emptyAddress);
          setIsNew(true);
        }}
      >
        <span className="text-xl font-bold mr-2">+</span> Add New Address
      </button>

      {(isNew || form.id) && (
        <form className="mt-8 p-6 bg-white rounded-lg shadow-lg" onSubmit={saveAddress}>
          <h4 className="text-xl font-semibold text-gray-800 mb-4">{isNew ? "Add New Address" : "Edit Address"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={form.name || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={form.phone || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={form.address || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" name="city" value={form.city || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" name="state" value={form.state || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" name="postalCode" value={form.postalCode || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" name="country" value={form.country || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input type="text" name="landmark" value={form.landmark || ""} onChange={handleInputChange} className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <select name="addressType" value={form.addressType || ""} onChange={handleInputChange} required className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                <option value="">Select Address Type</option>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
              <textarea name="deliveryInstructions" value={form.deliveryInstructions || ""} onChange={handleInputChange} className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"></textarea>
            </div>
            <div className="flex flex-col col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Use Current Location{" "}
                <FontAwesomeIcon icon={faLocationArrow} className="cursor-pointer text-blue-500" onClick={() => {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setMapMarker({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setShowMap(true);
                  });
                }} />{" "}
                or Pin Location{" "}
                <FontAwesomeIcon icon={faMapMarkerAlt} className="cursor-pointer text-blue-500" onClick={() => setShowMap(true)} />
              </label>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
              {isNew ? "Save Address" : "Update Address"}
            </button>
            <button type="button" onClick={() => { setForm({}); setIsNew(true); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-11/12 max-w-2xl h-4/5 flex flex-col">
            <MapContainer
              center={mapMarker || [20.5937, 78.9629]}
              zoom={15}
              className="flex-1 rounded-lg"
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickableMap center={mapMarker} marker={mapMarker} setMarker={setMapMarker} />
            </MapContainer>

            <div className="mt-4 flex justify-between">
              <button type="button" onClick={() => setShowMap(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                Cancel
              </button>
              <button type="button" onClick={applyMapLocation} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                Apply Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
