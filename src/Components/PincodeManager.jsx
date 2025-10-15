import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address/pincodes";

// Complete list of Indian states and Union Territories. This is stable and reliable for a local list.
const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Reusable Accordion Component for displaying saved data
const AccordionItem = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 font-semibold text-gray-700 hover:bg-gray-50 flex justify-between items-center transition-colors">
                <span>{title}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>+</span>
            </button>
            {isOpen && <div className="p-4 bg-gray-50">{children}</div>}
        </div>
    );
};

// Custom hook for debouncing input to prevent excessive API calls
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// --- Edit Modal Component ---
const EditPincodeModal = ({ pincodeData, onClose, onSave }) => {
    const [formData, setFormData] = useState(pincodeData);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : parseInt(value, 10) || 0 };
            if (name === "isServiceable" && !checked) {
                newData.codAvailable = false;
            }
            return newData;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Edit Pincode: {pincodeData.pincode}</h3>
                
                <div className="space-y-2">
                    <label htmlFor="deliveryCharge" className="text-sm font-medium text-gray-700">Delivery Charge (₹)</label>
                    <input id="deliveryCharge" name="deliveryCharge" type="number" value={formData.deliveryCharge} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>

                <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="isServiceable" checked={formData.isServiceable} onChange={handleInputChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                        <span className="text-sm text-gray-700">Serviceable</span>
                    </label>
                    <label className={`flex items-center space-x-2 ${!formData.isServiceable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" name="codAvailable" checked={formData.codAvailable} onChange={handleInputChange} disabled={!formData.isServiceable} className="h-5 w-5 text-indigo-600 border-gray-300 rounded disabled:bg-gray-200 focus:ring-indigo-500"/>
                        <span className="text-sm text-gray-700">COD Available</span>
                    </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} disabled={!formData.isServiceable} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


export default function PincodeManager() {
    // UI State
    const [selectedState, setSelectedState] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [cityPincodes, setCityPincodes] = useState({});
    const [selectedPincodes, setSelectedPincodes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingPincodes, setIsFetchingPincodes] = useState(false);
    const [editingPincode, setEditingPincode] = useState(null);
    
    // Batch Settings State
    const [batchSettings, setBatchSettings] = useState({
        isServiceable: true,
        codAvailable: true,
        deliveryCharge: 50,
    });

    // Data State
    const [savedPincodes, setSavedPincodes] = useState({});
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [error, setError] = useState("");

    const debouncedCitySearch = useDebounce(citySearch, 400);

    useEffect(() => { fetchSavedPincodes() }, []);
    useEffect(() => {
        if (debouncedCitySearch.length > 1 && selectedState) {
            fetchCitySuggestions(debouncedCitySearch);
        } else {
            setCitySuggestions([]);
        }
    }, [debouncedCitySearch, selectedState]);

    const fetchCitySuggestions = async (query) => {
        try {
            const res = await fetch(`https://api.postalpincode.in/postoffice/${query}`);
            const data = await res.json();
            if (data[0].Status === "Success") {
                const cities = [...new Set(data[0].PostOffice.filter(po => po.State === selectedState).map(po => po.District))];
                setCitySuggestions(cities.filter(c => !selectedCities.includes(c)));
            }
        } catch (err) { console.error("Error fetching city suggestions:", err); }
    };

    const fetchSavedPincodes = async () => {
        setIsLoadingList(true);
        setError("");
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();
            if (data.success) setSavedPincodes(data.data);
            else setError(data.msg || "Failed to fetch saved pincodes");
        } catch (err) {
            setError("Network error fetching data.");
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleAddCity = (city) => {
        if (!selectedCities.includes(city)) setSelectedCities([...selectedCities, city].sort());
        setCitySearch("");
        setCitySuggestions([]);
    };

    const handleRemoveCity = (cityToRemove) => {
        setSelectedCities(selectedCities.filter(city => city !== cityToRemove));
        const newCityPincodes = { ...cityPincodes };
        delete newCityPincodes[cityToRemove];
        setCityPincodes(newCityPincodes);
    };
    
    const handleFetchPincodes = async () => {
        setError("");
        setIsFetchingPincodes(true);
        let pincodesData = {};
        let newSelectedPincodes = {};

        for (const city of selectedCities) {
            try {
                const res = await fetch(`https://api.postalpincode.in/postoffice/${city}`);
                const data = await res.json();
                if (data[0].Status === "Success") {
                    const fetchedPincodes = [...new Set(data[0].PostOffice.map(p => p.Pincode))].sort();
                    pincodesData[city] = fetchedPincodes;

                    const savedCityPincodes = savedPincodes[selectedState]?.[city]?.map(p => p.pincode) || [];
                    for (const pincode of fetchedPincodes) {
                        if (savedCityPincodes.includes(pincode)) {
                            newSelectedPincodes[pincode] = true;
                        }
                    }
                } else {
                    setError(prev => `${prev} No pincodes found for ${city}.`);
                }
            } catch (err) {
                setError(prev => `${prev} API error for ${city}.`);
            }
        }
        setCityPincodes(pincodesData);
        setSelectedPincodes(newSelectedPincodes);
        setIsFetchingPincodes(false);
    };

    const handlePincodeToggle = (pincode) => {
        setSelectedPincodes(prev => ({ ...prev, [pincode]: !prev[pincode] }));
    };

    const handleBatchSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBatchSettings(prev => {
            const newSettings = { ...prev, [name]: type === 'checkbox' ? checked : parseInt(value, 10) || 0 };
            if (name === "isServiceable" && !checked) {
                newSettings.codAvailable = false;
            }
            return newSettings;
        });
    };

    const handleBatchAdd = async () => {
        setIsSubmitting(true);
        const pincodesToAdd = Object.entries(selectedPincodes)
            .filter(([, isSelected]) => isSelected)
            .map(([pincode]) => {
                const city = Object.keys(cityPincodes).find(c => cityPincodes[c].includes(pincode));
                return {
                    pincode, city, state: selectedState,
                    isServiceable: batchSettings.isServiceable,
                    codAvailable: batchSettings.codAvailable,
                    deliveryCharge: batchSettings.deliveryCharge,
                };
            });

        try {
            const res = await fetch(`${API_BASE}/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pincodes: pincodesToAdd }) });
            const data = await res.json();
            if (data.success) {
                alert(data.msg || "Pincodes updated successfully!");
                fetchSavedPincodes();
                setCityPincodes({});
                setSelectedPincodes({});
            } else {
                alert(data.msg || "Failed to save pincodes.");
            }
        } catch (err) {
            alert("Network error while saving pincodes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePincode = async (updatedData) => {
        try {
            const res = await fetch(`${API_BASE}/${updatedData.pincode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            if (data.success) {
                alert("Pincode updated successfully!");
                setEditingPincode(null);
                fetchSavedPincodes();
            } else {
                alert(data.msg || "Failed to update pincode.");
            }
        } catch(err) {
            alert("Network error while updating.");
        }
    };

    const handleDelete = async (pincode) => {
        if (!window.confirm(`Are you sure you want to delete pincode ${pincode}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/${pincode}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchSavedPincodes();
                alert('Pincode deleted.');
            } else {
                alert(data.msg || "Failed to delete");
            }
        } catch (err) {
            alert("Network error");
        }
    };
    
    const hasSelectedPincodes = Object.values(selectedPincodes).some(Boolean);

    return (
        <div className="space-y-8">
            {editingPincode && <EditPincodeModal pincodeData={editingPincode} onClose={() => setEditingPincode(null)} onSave={handleUpdatePincode} />}
            
            <div>
                <h2 className="text-3xl font-bold">Advanced Pincode Manager</h2>
                <p className="text-gray-500 mt-1">Dynamically search and add serviceable regions by State and City.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">1. Select a State</h3>
                <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCities([]); setCityPincodes({}); }} className="mt-2 w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">-- Choose State --</option>
                    {indianStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
            </div>

            {selectedState && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">2. Search and Add Cities</h3>
                    <div className="relative mt-2">
                        <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder={`Type to search for cities in ${selectedState}...`} className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        {citySuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full md:w-1/2 bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                                {citySuggestions.map(city => <li key={city} onClick={() => handleAddCity(city)} className="p-2 hover:bg-indigo-50 cursor-pointer">{city}</li>)}
                            </ul>
                        )}
                    </div>
                    {selectedCities.length > 0 && (
                        <>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {selectedCities.map(city => (
                                    <div key={city} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {city}
                                        <button onClick={() => handleRemoveCity(city)} className="ml-2 text-indigo-600 hover:text-indigo-800"><FaTimes size={12} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleFetchPincodes} disabled={isFetchingPincodes} className="mt-4 px-5 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 disabled:bg-gray-400">
                                {isFetchingPincodes ? 'Fetching...' : 'Fetch Area Pincodes'}
                            </button>
                        </>
                    )}
                </div>
            )}

            {Object.keys(cityPincodes).length > 0 && (
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">3. Select Area Pincodes to Add/Update</h3>
                     <div className="mt-4 space-y-4">
                        {Object.keys(cityPincodes).map(cityName => (
                            <div key={cityName}>
                                <h4 className="font-medium text-indigo-700 border-b pb-1 mb-2">{cityName}</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {cityPincodes[cityName].map(pincode => (
                                        <label key={pincode} className={`text-sm p-2 border rounded-md flex items-center justify-center space-x-2 cursor-pointer transition-colors ${selectedPincodes[pincode] ? 'bg-indigo-100 border-indigo-300' : 'hover:bg-gray-100'}`}>
                                            <input type="checkbox" checked={!!selectedPincodes[pincode]} onChange={() => handlePincodeToggle(pincode)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                            <span>{pincode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
            )}
            
            {(Object.keys(cityPincodes).length > 0) && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-indigo-300">
                    <h3 className="text-lg font-semibold text-gray-800">4. Set Rules for Pincodes to Add/Update</h3>
                    <p className="text-xs text-gray-500 mt-1">These settings will be applied to all pincodes you have checked above.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
                        <div className="space-y-2">
                            <label htmlFor="batchDeliveryCharge" className="text-sm font-medium text-gray-700">Delivery Charge (₹)</label>
                            <input id="batchDeliveryCharge" name="deliveryCharge" type="number" value={batchSettings.deliveryCharge} onChange={handleBatchSettingsChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div className="flex items-center space-x-6 pt-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" name="isServiceable" checked={batchSettings.isServiceable} onChange={handleBatchSettingsChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded"/>
                                <span className="text-sm text-gray-700">Serviceable</span>
                            </label>
                            <label className={`flex items-center space-x-2 ${!batchSettings.isServiceable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                <input type="checkbox" name="codAvailable" checked={batchSettings.codAvailable} onChange={handleBatchSettingsChange} disabled={!batchSettings.isServiceable} className="h-5 w-5 text-indigo-600 border-gray-300 rounded disabled:bg-gray-200"/>
                                <span className="text-sm text-gray-700">COD Available</span>
                            </label>
                        </div>
                        <div>
                            <button onClick={handleBatchAdd} disabled={isSubmitting} className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400">
                                {isSubmitting ? "Saving..." : `Apply Rules & Save`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

             <div>
                <h3 className="text-2xl font-bold mt-12 mb-4">Currently Serviceable Regions</h3>
                {isLoadingList && <p className="text-center p-4">Loading list...</p>}
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    {!isLoadingList && Object.keys(savedPincodes).length > 0 ? Object.keys(savedPincodes).sort().map(state => (
                        <AccordionItem key={state} title={state}>
                            {Object.keys(savedPincodes[state]).sort().map(city => (
                                <AccordionItem key={city} title={city}>
                                     <ul className="divide-y divide-gray-200">
                                        {savedPincodes[state][city].map(p => (
                                            <li key={p.pincode} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3">
                                                <div className="text-sm">
                                                    <span className="font-bold text-gray-800">{p.pincode}</span>
                                                    <div className="flex flex-col sm:flex-row sm:space-x-4 text-gray-500 mt-1">
                                                        <span>Serviceable: {p.isServiceable ? 'Yes' : 'No'}</span>
                                                        <span>Charge: ₹{p.deliveryCharge}</span>
                                                        <span>COD: {p.codAvailable ? 'Yes' : 'No'}</span>
                                                    </div>
                                                </div>
                                                <div className="space-x-4 mt-2 sm:mt-0">
                                                    <button onClick={() => setEditingPincode(p)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
                                                    <button onClick={() => handleDelete(p.pincode)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                                                </div>
                                            </li>
                                        ))}
                                     </ul>
                                </AccordionItem>
                            ))}
                        </AccordionItem>
                    )) : !isLoadingList && <p className="p-4 text-gray-500 text-center">No serviceable regions have been added yet.</p>}
                </div>
            </div>
        </div>
    );
}