import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, ChevronDown, Edit2, Trash2, Search, Save, MapPin, UploadCloud, FileText, CheckCircle, AlertCircle 
} from 'lucide-react';

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address/pincodes";

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// --- 1. TOGGLE SWITCH ---
const ToggleSwitch = ({ label, checked, onChange, disabled, name }) => (
  <label className={`flex items-center justify-between p-3 rounded-xl border border-gray-200 transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-indigo-300 bg-white shadow-sm'}`}>
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    <input 
      type="checkbox" 
      name={name} 
      checked={!!checked} 
      onChange={onChange} 
      disabled={disabled} 
      className="hidden" 
    />
  </label>
);

// --- 2. CUSTOM DROPDOWN ---
const CustomDropdown = ({ options, selected, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-left hover:border-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
                <span className={`text-sm font-medium ${selected ? 'text-gray-900' : 'text-gray-400'}`}>{selected || placeholder}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto p-1">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input
                                type="text"
                                placeholder="Search state..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-0 text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                    <ul className="py-1">
                        {filteredOptions.map(option => (
                            <li key={option} onClick={() => { onSelect(option); setIsOpen(false); setSearchTerm(""); }} className="px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer text-sm font-medium text-gray-700 transition-colors">
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- 3. ACCORDION ITEM ---
const AccordionItem = ({ title, children, badgeCount, onSelect, active }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Auto-open if active prop is passed
    useEffect(() => { if(active) setIsOpen(true); }, [active]);

    return (
        <div className="border border-gray-200 rounded-xl mb-3 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <button 
                onClick={() => { setIsOpen(!isOpen); if(onSelect) onSelect(); }} 
                className={`w-full text-left p-4 flex justify-between items-center transition-colors ${active || isOpen ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
            >
                <span className="font-semibold text-gray-800 text-sm">{title}</span>
                <div className="flex items-center space-x-3">
                    {badgeCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">{badgeCount}</span>}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && <div className="p-4 border-t border-gray-100 bg-white">{children}</div>}
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

// --- 4. EDIT MODAL ---
const EditPincodeModal = ({ pincodeData, onClose, onSave }) => {
    const [formData, setFormData] = useState(pincodeData);
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const val = type === 'checkbox' ? checked : (parseInt(value, 10) || 0);
            const newData = { ...prev, [name]: val };
            if (name === "isServiceable" && !checked) newData.codAvailable = false;
            return newData;
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Edit Zone Rules</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">PIN: {pincodeData.pincode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Delivery Fee (₹)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <input name="deliveryCharge" type="number" value={formData.deliveryCharge} onChange={handleInputChange} className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"/>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <ToggleSwitch label="Serviceable Area" checked={formData.isServiceable} onChange={handleInputChange} name="isServiceable" />
                        <ToggleSwitch label="Cash on Delivery" checked={formData.codAvailable} onChange={handleInputChange} disabled={!formData.isServiceable} name="codAvailable" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} disabled={!formData.isServiceable} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-black disabled:bg-gray-300 disabled:shadow-none transition-all hover:-translate-y-0.5">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function PincodeManager() {
    const [activeTab, setActiveTab] = useState('import'); 

    // Tab 1: Import
    const [selectedStateImport, setSelectedStateImport] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [selectedCityImport, setSelectedCityImport] = useState("");
    const [bulkText, setBulkText] = useState("");
    const [filePincodes, setFilePincodes] = useState(""); 
    const [batchSettings, setBatchSettings] = useState({ isServiceable: true, codAvailable: true, deliveryCharge: 50 });
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);
    
    // Tab 2: Manage
    const [savedPincodes, setSavedPincodes] = useState({});
    const [manageSearchQuery, setManageSearchQuery] = useState("");
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [editingPincode, setEditingPincode] = useState(null);
    const [selectedStateManage, setSelectedStateManage] = useState("");
    const [selectedCityManage, setSelectedCityManage] = useState("");
    const [cityPincodesManage, setCityPincodesManage] = useState([]);

    const debouncedCitySearch = useDebounce(citySearch, 400);

    // Initial Fetch
    useEffect(() => { fetchSavedPincodes() }, []);
    
    // Google City Search
    useEffect(() => {
        if (debouncedCitySearch.length > 1 && selectedStateImport) {
            fetchCitySuggestions(debouncedCitySearch);
        } else {
            setCitySuggestions([]);
        }
    }, [debouncedCitySearch, selectedStateImport]);

    // 🟢 SAFE FILTERING LOGIC
    const filteredSavedPincodes = useMemo(() => {
        if (!manageSearchQuery) return savedPincodes;
        const lowerQ = manageSearchQuery.toLowerCase();
        const result = {};

        // Safety check: ensure savedPincodes is an object
        if (!savedPincodes || typeof savedPincodes !== 'object') return {};

        Object.keys(savedPincodes).forEach(state => {
            const cities = savedPincodes[state];
            if (!cities) return;

            const matchingCities = {};
            const stateMatch = state.toLowerCase().includes(lowerQ);

            Object.keys(cities).forEach(city => {
                const cityMatch = city.toLowerCase().includes(lowerQ);
                const pincodes = cities[city] || [];
                // Safe string conversion
                const pinMatch = Array.isArray(pincodes) && pincodes.some(p => p && String(p.pincode).includes(lowerQ));

                if (stateMatch || cityMatch || pinMatch) {
                    matchingCities[city] = pincodes;
                }
            });

            if (Object.keys(matchingCities).length > 0) {
                result[state] = matchingCities;
            }
        });
        return result;
    }, [savedPincodes, manageSearchQuery]);

    // API Calls
    const fetchSavedPincodes = async () => {
        setIsLoadingList(true);
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();
            if (data.success) setSavedPincodes(data.data || {});
        } catch (err) { console.error("Error fetching saved pincodes:", err); }
        finally { setIsLoadingList(false); }
    };
    
    const fetchCitySuggestions = async (query) => {
        if (!selectedStateImport) return;
        try {
            const res = await fetch(`${API_BASE}/search-cities/${encodeURIComponent(selectedStateImport)}/${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) setCitySuggestions(data.data.filter(c => c !== selectedStateImport));
        } catch (err) { console.error("Error fetching city suggestions:", err); }
    };

    const fetchCityPincodesForManage = async (state, city) => {
        if (state === selectedStateManage && city === selectedCityManage && cityPincodesManage.length > 0) return;
        setSelectedStateManage(state);
        setSelectedCityManage(city);
        setCityPincodesManage([]);
        try {
            const res = await fetch(`${API_BASE}/${encodeURIComponent(state)}/${encodeURIComponent(city)}`);
            const data = await res.json();
            if (data.success) setCityPincodesManage(data.data || []);
        } catch (err) { console.error("Error fetching city pincodes:", err); }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setFilePincodes(e.target.result);
        reader.readAsText(file);
    };

    // Handlers
    const handleBatchSettingsChange = (e) => {
        const { name, checked } = e.target;
        setBatchSettings(prev => {
            const newSettings = { ...prev, [name]: checked };
            if (name === "isServiceable" && !checked) newSettings.codAvailable = false;
            return newSettings;
        });
    };

    const handleImportPincodes = async () => {
        const sourceText = (bulkText.trim() || filePincodes.trim());
        if (!selectedStateImport || !selectedCityImport || !sourceText) return alert("Select state, city, and enter/import pincodes.");
        
        setIsSubmittingImport(true);
        const rawPincodes = sourceText.split(/[\s,]+/);
        const validPincodes = rawPincodes.filter(p => /^\d{6}$/.test(p));

        if (validPincodes.length === 0) {
            alert("No valid 6-digit pincodes found.");
            setIsSubmittingImport(false);
            return;
        }

        const pincodesToAdd = validPincodes.map(p => ({
            pincode: p,
            city: selectedCityImport.trim(),
            state: selectedStateImport,
            ...batchSettings,
            deliveryCharge: parseInt(batchSettings.deliveryCharge) || 0
        }));

        try {
            const res = await fetch(`${API_BASE}/batch`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ pincodes: pincodesToAdd }) 
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.msg);

            alert("Import successful!");
            setBulkText(""); setFilePincodes(""); setCitySearch(""); setCitySuggestions([]); setSelectedCityImport("");
            fetchSavedPincodes();
        } catch(e) { alert("Import failed: " + e.message); } 
        finally { setIsSubmittingImport(false); }
    };
    
    const handleUpdatePincode = async (updatedData) => {
        try {
            const res = await fetch(`${API_BASE}/${updatedData.pincode}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
            const data = await res.json();
            if (data.success) {
                alert("Updated.");
                setEditingPincode(null);
                fetchSavedPincodes(); 
                fetchCityPincodesForManage(selectedStateManage, selectedCityManage); 
            } else { alert(data.msg); }
        } catch(err) { alert("Network error."); }
    };
    
    const handleDelete = async (pincode) => {
        if (!window.confirm(`Delete ${pincode}?`)) return;
        try {
            await fetch(`${API_BASE}/${pincode}`, { method: 'DELETE' });
            fetchSavedPincodes(); 
            fetchCityPincodesForManage(selectedStateManage, selectedCityManage); 
        } catch (err) { alert("Network error."); }
    };
    
    // --- Renderers ---
    const renderImportTab = () => (
        <div className="space-y-8">
            {/* STEP 1 */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">1</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Select Target Region</h3>
                </div>
                <CustomDropdown 
                    options={indianStates}
                    selected={selectedStateImport}
                    onSelect={(state) => { 
                        setSelectedStateImport(state); 
                        setSelectedCityImport("");
                        setCitySearch("");
                    }}
                    placeholder="Choose State"
                />
            </section>

            {selectedStateImport && (
                <>
                    {/* STEP 2 */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">2</span>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Identify City</h3>
                        </div>
                        
                        <div className="relative group mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input 
                                type="text" 
                                value={citySearch} 
                                onChange={(e) => setCitySearch(e.target.value)} 
                                placeholder={`Search city in ${selectedStateImport}...`} 
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" 
                            />
                             {citySuggestions.length > 0 && (
                                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto p-1">
                                    {citySuggestions.map(city => (
                                        <div 
                                            key={city} 
                                            onClick={() => { setSelectedCityImport(city); setCitySearch(city); setCitySuggestions([]); }} 
                                            className="px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors"
                                        >
                                            {city}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {selectedCityImport && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-xl border border-green-100">
                                <CheckCircle size={16} />
                                <span className="text-sm font-medium">Selected: <strong>{selectedCityImport}</strong></span>
                            </div>
                        )}
                    </section>
                    
                    {/* STEP 3 */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">3</span>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pincode Data & Rules</h3>
                        </div>
                        
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                            <div className="flex flex-wrap gap-6 items-end">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Delivery Fee</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input name="deliveryCharge" type="number" value={batchSettings.deliveryCharge} onChange={(e) => setBatchSettings(p => ({ ...p, deliveryCharge: parseInt(e.target.value) || 0 }))} className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"/>
                                    </div>
                                </div>
                                <div className="min-w-[140px]">
                                    <ToggleSwitch label="Serviceable" checked={batchSettings.isServiceable} onChange={handleBatchSettingsChange} name="isServiceable" />
                                </div>
                                <div className="min-w-[140px]">
                                    <ToggleSwitch label="Allow COD" checked={batchSettings.codAvailable} onChange={handleBatchSettingsChange} disabled={!batchSettings.isServiceable} name="codAvailable" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-600">
                                <UploadCloud size={20} className="text-indigo-500" />
                                <span>Upload CSV / TXT File</span>
                                <input type="file" accept=".csv, .txt" onChange={handleFileChange} className="hidden" />
                            </label>
                            {filePincodes && (
                                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl text-sm font-medium text-green-700">
                                    <FileText size={18} />
                                    <span>{filePincodes.split(/[\s,]+/).filter(x=>x).length} codes loaded</span>
                                </div>
                            )}
                        </div>
                        
                        <textarea 
                            value={bulkText} 
                            onChange={(e) => setBulkText(e.target.value)} 
                            placeholder="Or manually paste pincodes here (separated by commas or spaces)..."
                            rows="4"
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                        ></textarea>

                        <button 
                            onClick={handleImportPincodes} 
                            disabled={isSubmittingImport || !selectedCityImport || !bulkText.trim() && !filePincodes.trim()} 
                            className="mt-6 w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2.5"
                        >
                            <Save size={18} />
                            <span>{isSubmittingImport ? "Processing..." : "Import Pincodes"}</span>
                        </button>
                    </section>
                </>
            )}
        </div>
    );

    const renderManageTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Active Service Zones</h2>
                        <p className="text-sm text-gray-500">Browse and edit rules for specific locations.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                            type="text"
                            placeholder="Search State, City, PIN..."
                            value={manageSearchQuery}
                            onChange={(e) => setManageSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoadingList ? (
                        <div className="py-20 text-center text-gray-400 text-sm">Syncing data...</div>
                    ) : Object.keys(filteredSavedPincodes).length > 0 ? (
                        <div className="space-y-2">
                            {Object.keys(filteredSavedPincodes).sort().map(state => (
                                <AccordionItem 
                                    key={state} 
                                    title={state} 
                                    badgeCount={Object.keys(filteredSavedPincodes[state]).length}
                                    active={state === selectedStateManage}
                                >
                                    <div className="space-y-1 pl-2">
                                        {Object.keys(filteredSavedPincodes[state]).sort().map(city => (
                                            <div key={city} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                                <AccordionItem 
                                                    title={city} 
                                                    onSelect={() => fetchCityPincodesForManage(state, city)}
                                                    active={city === selectedCityManage && state === selectedStateManage}
                                                >
                                                    {city === selectedCityManage && state === selectedStateManage && (
                                                        <div className="grid gap-2 pt-2 pr-2">
                                                            {cityPincodesManage.length > 0 ? (
                                                                cityPincodesManage.filter(p => !manageSearchQuery || String(p.pincode).includes(manageSearchQuery)).map(p => (
                                                                    <div key={p.pincode} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-all">
                                                                        <div>
                                                                            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                                                {p.pincode}
                                                                                {!p.isServiceable && <AlertCircle size={12} className="text-red-500" />}
                                                                            </div>
                                                                            <div className="flex gap-2 mt-1.5">
                                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${p.isServiceable ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{p.isServiceable ? 'Active' : 'Inactive'}</span>
                                                                                {p.codAvailable && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">COD</span>}
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">₹{p.deliveryCharge}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => setEditingPincode(p)} className="p-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-md text-gray-600 transition-colors"><Edit2 size={14} /></button>
                                                                            <button onClick={() => handleDelete(p.pincode)} className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-md text-red-600 transition-colors"><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-xs text-gray-400 p-2 text-center">Loading or no pincodes found...</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </AccordionItem>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionItem>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="inline-block p-4 bg-gray-50 rounded-full mb-3 text-gray-300"><MapPin size={32}/></div>
                            <p className="text-sm text-gray-500 font-medium">No matching zones found.</p>
                            {!manageSearchQuery && (
                                <button onClick={() => setActiveTab('import')} className="mt-4 text-sm font-bold text-indigo-600 hover:underline">Import Data Now</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-8 p-4 sm:p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
            {editingPincode && <EditPincodeModal pincodeData={editingPincode} onClose={() => setEditingPincode(null)} onSave={handleUpdatePincode} />}
            
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                        <MapPin className="text-indigo-600" size={28} />
                        <span>Logistics Manager</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Configure serviceable areas and delivery rules.</p>
                </div>
            </header>

            <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm w-fit">
                <button 
                    onClick={() => setActiveTab('import')} 
                    className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'import' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    <UploadCloud size={16} /> Bulk Import
                </button>
                <button 
                    onClick={() => setActiveTab('manage')} 
                    className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                    <FileText size={16} /> Manage Database
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-12">
                    {activeTab === 'import' ? renderImportTab() : renderManageTab()}
                </div>
            </div>
        </div>
    );
}