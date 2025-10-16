import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaChevronDown, FaPen, FaTrash, FaSearch, FaRegSave, FaMapMarkerAlt } from 'react-icons/fa';

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address/pincodes";

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// --- NEW Custom Dropdown Component ---
const CustomDropdown = ({ options, selected, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full md:w-2/3" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-left focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                <span className={selected ? 'text-gray-800' : 'text-gray-400'}>{selected || placeholder}</span>
                <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Search state..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        />
                    </div>
                    <ul className="py-1">
                        {filteredOptions.map(option => (
                            <li key={option} onClick={() => { onSelect(option); setIsOpen(false); setSearchTerm(""); }} className="p-2.5 hover:bg-indigo-50 cursor-pointer text-sm">
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const AccordionItem = ({ title, children, badgeCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                <span className="font-semibold text-gray-800">{title}</span>
                <div className="flex items-center space-x-4">
                    {badgeCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">{badgeCount} Cities</span>}
                    <FaChevronDown className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={14} />
                </div>
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
};

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const EditPincodeModal = ({ pincodeData, onClose, onSave }) => {
    const [formData, setFormData] = useState(pincodeData);
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : parseInt(value, 10) || 0 };
            if (name === "isServiceable" && !checked) newData.codAvailable = false;
            return newData;
        });
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Edit Pincode: {pincodeData.pincode}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="deliveryCharge" className="text-sm font-medium text-gray-700">Delivery Charge (₹)</label>
                        <input id="deliveryCharge" name="deliveryCharge" type="number" value={formData.deliveryCharge} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div className="flex items-center space-x-6 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="isServiceable" checked={formData.isServiceable} onChange={handleInputChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                            <span className="text-sm font-medium text-gray-700">Serviceable</span>
                        </label>
                        <label className={`flex items-center space-x-2 ${!formData.isServiceable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            <input type="checkbox" name="codAvailable" checked={formData.codAvailable} onChange={handleInputChange} disabled={!formData.isServiceable} className="h-5 w-5 text-indigo-600 border-gray-300 rounded disabled:bg-gray-200 focus:ring-indigo-500"/>
                            <span className="text-sm font-medium text-gray-700">COD Available</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} disabled={!formData.isServiceable} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default function PincodeManager() {
    const [selectedState, setSelectedState] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [cityPincodes, setCityPincodes] = useState({});
    const [selectedPincodes, setSelectedPincodes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingPincodes, setIsFetchingPincodes] = useState(false);
    const [editingPincode, setEditingPincode] = useState(null);
    const [batchSettings, setBatchSettings] = useState({ isServiceable: true, codAvailable: true, deliveryCharge: 50 });
    const [savedPincodes, setSavedPincodes] = useState({});
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [error, setError] = useState("");
    const debouncedCitySearch = useDebounce(citySearch, 400);

    useEffect(() => { fetchSavedPincodes() }, []);
    useEffect(() => {
        if (debouncedCitySearch.length > 1 && selectedState) fetchCitySuggestions(debouncedCitySearch);
        else setCitySuggestions([]);
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
            if (data.success) {
                setSavedPincodes(data.data);
            } else {
                setError(data.msg || "Failed to fetch saved pincodes");
            }
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
        const pincodesToProcess = {
            addOrUpdate: [],
            remove: []
        };
    
        for (const city in cityPincodes) {
            for (const pincode of cityPincodes[city]) {
                const isSelected = !!selectedPincodes[pincode];
                const isAlreadySaved = savedPincodes[selectedState]?.[city]?.some(p => p.pincode === pincode);

                if (isSelected) {
                    pincodesToProcess.addOrUpdate.push({
                        pincode, city, state: selectedState,
                        isServiceable: batchSettings.isServiceable,
                        codAvailable: batchSettings.codAvailable,
                        deliveryCharge: batchSettings.deliveryCharge,
                    });
                } else if (isAlreadySaved && !isSelected) {
                    pincodesToProcess.remove.push(pincode);
                }
            }
        }

        try {
            if (pincodesToProcess.addOrUpdate.length > 0) {
                const res = await fetch(`${API_BASE}/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pincodes: pincodesToProcess.addOrUpdate }) });
                const data = await res.json();
                if (!data.success) throw new Error(data.msg || "Failed to save pincodes.");
            }

            for (const pincode of pincodesToProcess.remove) {
                await handleDelete(pincode, true);
            }

            alert("Pincode selections have been saved successfully!");
            fetchSavedPincodes();
            setCityPincodes({});
            setSelectedPincodes({});

        } catch (err) {
            alert(`An error occurred: ${err.message}`);
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
    
    const handleDelete = async (pincode, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm(`Are you sure you want to delete pincode ${pincode}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/${pincode}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (!skipConfirm) {
                    alert('Pincode deleted.');
                }
                fetchSavedPincodes();
            } else {
                if (!skipConfirm) {
                    alert(data.msg || "Failed to delete");
                } else {
                    throw new Error(`Failed to delete ${pincode}`);
                }
            }
        } catch (err) {
            if (!skipConfirm) {
                alert("Network error");
            } else {
                throw err;
            }
        }
    };
    
    const hasSelectedPincodesInUI = Object.keys(cityPincodes).length > 0;

    return (
        <div className="space-y-8 p-1">
            {editingPincode && <EditPincodeModal pincodeData={editingPincode} onClose={() => setEditingPincode(null)} onSave={handleUpdatePincode} />}
            
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center space-x-3">
                        <FaMapMarkerAlt className="text-indigo-500" />
                        <span>Advanced Pincode Manager</span>
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Dynamically search and add serviceable regions by State and City.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 space-y-6">
                    <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <h3 className="ml-4 text-lg font-semibold text-gray-800">Select a State</h3>
                        </div>
                        <div className="mt-4">
                            <CustomDropdown 
                                options={indianStates}
                                selected={selectedState}
                                onSelect={(state) => { setSelectedState(state); setSelectedCities([]); setCityPincodes({}); }}
                                placeholder="-- Choose State --"
                            />
                        </div>
                    </section>

                    {selectedState && (
                        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fade-in-up">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-800">Search and Add Cities</h3>
                            </div>
                            <div className="relative mt-4">
                                <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder={`Type to search for cities in ${selectedState}...`} className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                                {citySuggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        {citySuggestions.map(city => <li key={city} onClick={() => handleAddCity(city)} className="p-2.5 hover:bg-indigo-50 cursor-pointer text-sm">{city}</li>)}
                                    </ul>
                                )}
                            </div>
                            {selectedCities.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCities.map(city => (
                                            <div key={city} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-full animate-fade-in-up">
                                                <span>{city}</span>
                                                <button onClick={() => handleRemoveCity(city)} className="ml-2 text-indigo-500 hover:text-indigo-800"><FaTimes size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleFetchPincodes} disabled={isFetchingPincodes} className="mt-4 px-5 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-900 disabled:bg-gray-400 transition-colors">
                                        {isFetchingPincodes ? 'Fetching...' : 'Fetch Area Pincodes'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {Object.keys(cityPincodes).length > 0 && (
                         <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fade-in-up">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-800">Select Area Pincodes to Add/Update</h3>
                            </div>
                             <div className="mt-4 space-y-5">
                                {Object.keys(cityPincodes).map(cityName => (
                                    <div key={cityName}>
                                        <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">{cityName}</h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {cityPincodes[cityName].map(pincode => (
                                                <label key={pincode} className={`text-sm p-2.5 border rounded-lg flex items-center justify-center space-x-2.5 cursor-pointer transition-all duration-200 ${selectedPincodes[pincode] ? 'bg-indigo-100 border-indigo-400 font-semibold text-indigo-800 shadow-sm' : 'hover:border-gray-400'}`}>
                                                    <input type="checkbox" checked={!!selectedPincodes[pincode]} onChange={() => handlePincodeToggle(pincode)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"/>
                                                    <span>{pincode}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </section>
                    )}
                    
                    {hasSelectedPincodesInUI && (
                        <section className="bg-indigo-50 p-6 rounded-xl shadow-lg border-2 border-indigo-200 animate-fade-in-up">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-800">Set Rules for Selections</h3>
                            </div>
                            <div className="mt-4 md:ml-12">
                                <p className="text-xs text-gray-500">These settings will be applied to all pincodes you have checked/unchecked above.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-end mt-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="batchDeliveryCharge" className="text-sm font-medium text-gray-700">Delivery Charge (₹)</label>
                                        <input id="batchDeliveryCharge" name="deliveryCharge" type="number" value={batchSettings.deliveryCharge} onChange={handleBatchSettingsChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                                    </div>
                                    <div className="flex items-center space-x-6 pt-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" name="isServiceable" checked={batchSettings.isServiceable} onChange={handleBatchSettingsChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded"/>
                                            <span className="text-sm font-medium text-gray-700">Serviceable</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 ${!batchSettings.isServiceable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                            <input type="checkbox" name="codAvailable" checked={batchSettings.codAvailable} onChange={handleBatchSettingsChange} disabled={!batchSettings.isServiceable} className="h-5 w-5 text-indigo-600 border-gray-300 rounded disabled:bg-gray-200"/>
                                            <span className="text-sm font-medium text-gray-700">COD Available</span>
                                        </label>
                                    </div>
                                    <div>
                                        <button onClick={handleBatchAdd} disabled={isSubmitting} className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                            <FaRegSave />
                                            <span>{isSubmitting ? "Saving..." : `Apply & Save`}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Currently Serviceable Regions</h2>
                    {isLoadingList && <div className="text-center p-4 text-gray-500 bg-white rounded-lg shadow-md border"><p>Loading list...</p></div>}
                    {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        {!isLoadingList && Object.keys(savedPincodes).length > 0 ? Object.keys(savedPincodes).sort().map(state => (
                            <AccordionItem key={state} title={state} badgeCount={Object.keys(savedPincodes[state]).length}>
                                {Object.keys(savedPincodes[state]).sort().map(city => (
                                    <AccordionItem key={city} title={city}>
                                         <ul className="divide-y divide-gray-100">
                                            {savedPincodes[state][city].map(p => (
                                                <li key={p.pincode} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-2">
                                                    <div className="text-sm">
                                                        <span className="font-bold text-gray-800">{p.pincode}</span>
                                                        <div className="flex flex-col sm:flex-row sm:space-x-4 text-gray-500 mt-1">
                                                            <span>Serviceable: {p.isServiceable ? 'Yes' : 'No'}</span>
                                                            <span>Charge: ₹{p.deliveryCharge}</span>
                                                            <span>COD: {p.codAvailable ? 'Yes' : 'No'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-x-4 mt-2 sm:mt-0 flex-shrink-0">
                                                        <button onClick={() => setEditingPincode(p)} className="text-sm font-medium text-indigo-600 hover:underline flex items-center space-x-1"><FaPen size={10}/> <span>Edit</span></button>
                                                        <button onClick={() => handleDelete(p.pincode)} className="text-sm font-medium text-red-600 hover:underline flex items-center space-x-1"><FaTrash size={10}/> <span>Delete</span></button>
                                                    </div>
                                                </li>
                                            ))}
                                         </ul>
                                    </AccordionItem>
                                ))}
                            </AccordionItem>
                        )) : !isLoadingList && <p className="p-6 text-gray-500 text-center">No serviceable regions have been added yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}