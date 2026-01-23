// src/pages/PincodeManager.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UploadCloud, FileText, Search, MapPin, X, ChevronRight, ChevronDown, Loader2,
  CreditCard, Globe, Wallet, Plus, Edit2, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from "@clerk/clerk-react"; // 🟢 Import Auth

const API_BASE = ((import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "")) + "/api/address/pincodes";

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// ... (Card, Badge, StatCard, Toggle components remain unchanged) ...
const Card = ({ children, className = "bg-white" }) => (
    <div className={`rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 ${className}`}>
        {children}
    </div>
);

const Badge = ({ active, text, className="" }) => (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors ${active 
        ? 'bg-emerald-50/80 text-emerald-600 ring-1 ring-emerald-100' 
        : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200/60'} ${className}`}>
        {active ? <CheckCircle2 size={10} strokeWidth={3} /> : <XCircle size={10} strokeWidth={3} />}
        {text}
    </span>
);

const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <Card className="p-5 flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300 bg-white">
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
            <Icon size={22} className={`sm:w-6 sm:h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate mb-1">{label}</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800 truncate tracking-tight">{value}</h4>
            {subtext && <p className="text-xs text-slate-400 mt-1 font-medium truncate">{subtext}</p>}
        </div>
    </Card>
);

const Toggle = ({ label, checked, onChange, disabled }) => (
    <div className={`flex items-center justify-between p-3 rounded-2xl transition-all ${disabled ? 'opacity-50' : 'hover:bg-slate-50'}`}>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <button 
            onClick={() => !disabled && onChange(!checked)}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 shadow-inner ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}
        >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

// --- MAIN COMPONENT ---

export default function PincodeManager() {
    const [activeTab, setActiveTab] = useState('manage'); 
    const [savedPincodes, setSavedPincodes] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Import State
    const [csvFile, setCsvFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    
    // Settings for Batch Import
    const [settings, setSettings] = useState({
        deliveryCharge: 50,
        isServiceable: true,
        codAvailable: true
    });

    // Manage State
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedStates, setExpandedStates] = useState({}); 
    const [expandedCity, setExpandedCity] = useState(null); 
    const [activeStateForCity, setActiveStateForCity] = useState(null); 
    const [cityPincodes, setCityPincodes] = useState([]);
    
    // Modals
    const [editingPin, setEditingPin] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // 🟢 AUTH TOKEN
    const { getToken } = useAuth();

    // --- API ACTIONS (SECURED) ---
    
    const fetchPincodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(API_BASE, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setSavedPincodes(data.data || {});
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }, [getToken]);

    useEffect(() => { fetchPincodes() }, [fetchPincodes]);

    const toggleState = (state) => {
        setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }));
    };

    const fetchCityDetails = async (state, city) => {
        if (activeStateForCity === state && expandedCity === city) {
            setExpandedCity(null);
            setActiveStateForCity(null);
            return;
        }
        setActiveStateForCity(state);
        setExpandedCity(city);
        setCityPincodes([]); 
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/${encodeURIComponent(state)}/${encodeURIComponent(city)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setCityPincodes(data.data);
        } catch (e) { console.error(e); }
    };

    const handleUpdatePincode = async (updatedData) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/${updatedData.pincode}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 🔒
                },
                body: JSON.stringify(updatedData)
            });
            if (res.ok) {
                setEditingPin(null);
                // Refresh specific city if open, otherwise full list
                if (activeStateForCity && expandedCity) {
                    fetchCityDetails(activeStateForCity, expandedCity);
                }
                fetchPincodes(); // Refresh stats
            }
        } catch (e) { alert("Update failed"); }
    };

    const handleAddPincode = async (newData) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/batch`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 🔒
                },
                body: JSON.stringify({ pincodes: [newData] })
            });
            const data = await res.json();
            if (data.success) {
                alert("Pincode added successfully!");
                setIsAddModalOpen(false);
                fetchPincodes();
            } else {
                alert(data.msg || "Failed to add pincode");
            }
        } catch (e) { alert("Network error"); }
    };

    // --- CSV PARSING (Unchanged Logic) ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split(/\r?\n/);
            const extracted = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (!matches) continue;
                const cols = matches.map(m => m.replace(/^"|"$/g, '').trim());
                if (cols.length >= 8 && /^\d{6}$/.test(cols[4])) {
                    let stateName = toTitleCase(cols[8]);
                    let cityName = toTitleCase(cols[7]);

                    if (!stateName || stateName === "Na" || stateName === "Null" || !cityName || cityName === "Na" || cityName === "Null") continue;
                    if (stateName === "Dadra And Nagar Haveli" || stateName === "Daman And Diu") stateName = "The Dadra And Nagar Haveli And Daman And Diu";

                    extracted.push({
                        pincode: cols[4],
                        city: cityName,
                        state: stateName
                    });
                }
            }
            setParsedData(extracted);
        };
        reader.readAsText(file);
    };

    const toTitleCase = (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "Unknown";

    // --- BATCH UPLOAD (SECURED) ---
    const executeBatchUpload = async () => {
        if (!confirm(`Import ${parsedData.length} pincodes? This might take a moment.`)) return;
        setIsUploading(true);
        setUploadProgress(0);
        const chunkSize = 500;
        const totalChunks = Math.ceil(parsedData.length / chunkSize);
        
        try {
            const token = await getToken(); // Get token once
            
            for (let i = 0; i < totalChunks; i++) {
                const chunk = parsedData.slice(i * chunkSize, (i + 1) * chunkSize).map(p => ({ ...p, ...settings }));
                
                await fetch(`${API_BASE}/batch`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // 🔒
                    },
                    body: JSON.stringify({ pincodes: chunk })
                });
                
                setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
            }
            alert("Success! All pincodes imported.");
            setParsedData([]);
            setCsvFile(null);
            fetchPincodes();
        } catch (e) {
            alert("Error during upload. Check console.");
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    // --- FILTER & STATS (Unchanged) ---
    const stats = useMemo(() => {
        let totalStates = 0;
        let totalCities = 0;
        let totalPincodes = 0;
        let totalCOD = 0;
        let totalOnlineOnly = 0;

        const states = Object.keys(savedPincodes);
        totalStates = states.length;

        states.forEach(state => {
            const cities = Object.keys(savedPincodes[state]);
            totalCities += cities.length;
            
            cities.forEach(city => {
                const pins = savedPincodes[state][city];
                totalPincodes += pins.length;
                pins.forEach(p => {
                    if (p.isServiceable) {
                        if (p.codAvailable) totalCOD++;
                        else totalOnlineOnly++;
                    }
                });
            });
        });

        return { totalStates, totalCities, totalPincodes, totalCOD, totalOnlineOnly };
    }, [savedPincodes]);

    const filteredTree = useMemo(() => {
        if (!searchQuery) return savedPincodes;
        const lowerQ = searchQuery.toLowerCase();
        const result = {};

        Object.keys(savedPincodes).forEach(state => {
            const cities = savedPincodes[state];
            const matchingCities = {};
            let stateMatches = state.toLowerCase().includes(lowerQ);

            Object.keys(cities).forEach(city => {
                if (stateMatches || city.toLowerCase().includes(lowerQ)) {
                    matchingCities[city] = cities[city];
                }
            });

            if (Object.keys(matchingCities).length > 0) result[state] = matchingCities;
        });
        return result;
    }, [savedPincodes, searchQuery]);


    // --- RENDER (Unchanged) ---
    // (Copying your exact JSX structure below)
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-6 md:p-10  text-slate-800">
            {/* 1. HEADER */}
            <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <MapPin className="text-white w-6 h-6" strokeWidth={2.5} />
                            </div>
                            Logistics Hub
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-3 ml-1">Manage delivery network coverage and rules.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="group w-full sm:w-auto justify-center px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                            <span className="whitespace-nowrap">Add Pincode</span>
                        </button>
                        
                        <div className="bg-white p-1.5 rounded-2xl shadow-sm ring-1 ring-slate-100 flex w-full sm:w-auto">
                            <button 
                                onClick={() => setActiveTab('manage')}
                                className={`flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <FileText size={16} /> Overview
                            </button>
                            <button 
                                onClick={() => setActiveTab('import')}
                                className={`flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'import' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <UploadCloud size={16} /> Import
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. STATS GRID */}
                {!isLoading && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard 
                            icon={Globe} 
                            label="States" 
                            value={stats.totalStates} 
                            subtext={`${stats.totalCities} Districts`}
                            colorClass="bg-blue-500 text-blue-600"
                        />
                        <StatCard 
                            icon={MapPin} 
                            label="Pincodes" 
                            value={stats.totalPincodes.toLocaleString()} 
                            subtext="Total Zones"
                            colorClass="bg-indigo-500 text-indigo-600"
                        />
                        <StatCard 
                            icon={Wallet} 
                            label="COD + Online" 
                            value={stats.totalCOD.toLocaleString()} 
                            subtext="Hybrid Mode"
                            colorClass="bg-emerald-500 text-emerald-600"
                        />
                        <StatCard 
                            icon={CreditCard} 
                            label="Prepaid Only" 
                            value={stats.totalOnlineOnly.toLocaleString()} 
                            subtext="No COD"
                            colorClass="bg-amber-500 text-amber-600"
                        />
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto">
                {activeTab === 'import' ? (
                    <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Import Card */}
                        <div className="space-y-6">
                            <Card className="p-8 text-center border-dashed border-2 border-indigo-100 hover:border-indigo-300 transition-colors bg-white">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UploadCloud size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Upload CSV File</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                                    Upload the "All India Pincode Directory" to bulk update your serviceable zones.
                                </p>
                                <label className="inline-flex w-full sm:w-auto justify-center">
                                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                                    <span className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl cursor-pointer hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                                        Select CSV File
                                    </span>
                                </label>
                            </Card>

                            <Card className="p-6 bg-white">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Default Rules</h3>
                                <div className="space-y-2">
                                    <Toggle label="Mark as Serviceable" checked={settings.isServiceable} onChange={(v) => setSettings({...settings, isServiceable: v})} />
                                    <Toggle label="Enable COD" checked={settings.codAvailable} onChange={(v) => setSettings({...settings, codAvailable: v})} disabled={!settings.isServiceable} />
                                    <div className="p-3 bg-slate-50 rounded-2xl mt-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Delivery Fee (₹)</label>
                                        <input type="number" value={settings.deliveryCharge} onChange={(e) => setSettings({...settings, deliveryCharge: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-white border-none shadow-sm ring-1 ring-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Status Card */}
                        <div className="space-y-6">
                            {parsedData.length > 0 ? (
                                <Card className="p-8 h-full flex flex-col justify-center bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-0">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner"><FileText size={28} className="text-white" /></div>
                                        <div className="min-w-0">
                                            <p className="text-indigo-100 text-sm font-bold truncate">{csvFile?.name}</p>
                                            <h2 className="text-4xl font-black text-white mt-1">{parsedData.length.toLocaleString()} <span className="text-lg font-medium opacity-70">Rows</span></h2>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-5 rounded-2xl mb-8 backdrop-blur-sm border border-white/10">
                                        <ul className="space-y-3 text-sm font-medium text-indigo-50">
                                            <li className="flex justify-between border-b border-white/10 pb-2"><span>Regions Detected</span> <strong className="text-white">Auto-Scan</strong></li>
                                            <li className="flex justify-between border-b border-white/10 pb-2"><span>Delivery Fee</span> <strong className="text-white">₹{settings.deliveryCharge}</strong></li>
                                            <li className="flex justify-between pt-1"><span>Payment Mode</span> <strong className="text-white">{settings.codAvailable ? 'COD + Online' : 'Prepaid Only'}</strong></li>
                                        </ul>
                                    </div>

                                    {isUploading ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-indigo-100 opacity-90">
                                                <span>Importing Data...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden p-0.5">
                                                <div className="bg-white h-full rounded-full transition-all duration-300 ease-out" style={{width: `${uploadProgress}%`}} />
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={executeBatchUpload} className="w-full py-4 bg-white text-indigo-600 font-extrabold rounded-2xl hover:bg-indigo-50 transition-all shadow-lg hover:scale-[1.02]">
                                            Start Import Process
                                        </button>
                                    )}
                                </Card>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                    <div className="mb-4 p-5 bg-white rounded-full shadow-sm ring-1 ring-slate-100"><Search size={28} className="text-slate-300"/></div>
                                    <p className="font-medium">No file selected yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* 3. MANAGE TAB */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search by State, District or Pincode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 rounded-2xl text-slate-800 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-slate-100">
                                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                                    </div>
                                    <span className="text-sm font-medium">Syncing database...</span>
                                </div>
                            ) : Object.keys(filteredTree).length === 0 ? (
                                <div className="py-24 text-center text-slate-400">
                                    <p>No results found for "{searchQuery}"</p>
                                </div>
                            ) : (
                                Object.keys(filteredTree).sort().map(state => {
                                    const citiesInState = Object.keys(filteredTree[state]);
                                    const totalPinsInState = citiesInState.reduce((sum, city) => sum + filteredTree[state][city].length, 0);
                                    const isStateOpen = expandedStates[state];

                                    return (
                                        <div key={state} className={`bg-white rounded-2xl ring-1 ring-slate-100 transition-all duration-300 ${isStateOpen ? 'shadow-lg shadow-indigo-500/5 ring-indigo-50' : 'shadow-sm hover:shadow-md'}`}>
                                            
                                            {/* STATE HEADER */}
                                            <div 
                                                className="p-5 flex flex-wrap justify-between items-center cursor-pointer select-none"
                                                onClick={() => toggleState(state)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isStateOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}>
                                                        <ChevronDown size={20} className={`transition-transform duration-300 ${isStateOpen ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{state}</h3>
                                                        <p className="text-xs text-slate-400 font-medium mt-1">{citiesInState.length} Districts / Cities</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${isStateOpen ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}>
                                                        {totalPinsInState} Pincodes
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CITY LIST */}
                                            {isStateOpen && (
                                                <div className="px-3 pb-3 pt-0">
                                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100/50 overflow-hidden">
                                                        {citiesInState.sort().map(city => {
                                                            const isCityOpen = activeStateForCity === state && expandedCity === city;
                                                            const pinCount = filteredTree[state][city].length;

                                                            return (
                                                                <div key={city}>
                                                                    {/* CITY HEADER */}
                                                                    <button 
                                                                        onClick={() => fetchCityDetails(state, city)}
                                                                        className={`w-full flex flex-wrap items-center justify-between px-5 py-3.5 text-left transition-colors ${isCityOpen ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isCityOpen ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                                                                            <span className={`font-semibold text-sm ${isCityOpen ? 'text-indigo-900' : 'text-slate-600'}`}>{city}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{pinCount} ZONES</span>
                                                                            <ChevronRight size={14} className={`text-slate-300 transition-transform duration-200 ${isCityOpen ? 'rotate-90 text-indigo-500' : ''}`} />
                                                                        </div>
                                                                    </button>
                                                                    
                                                                    {/* PINCODE GRID */}
                                                                    {isCityOpen && (
                                                                        <div className="p-4 bg-white border-t border-slate-50 shadow-inner">
                                                                            {cityPincodes.length > 0 ? (
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                    {cityPincodes.map(pin => (
                                                                                        <div 
                                                                                            key={pin.pincode} 
                                                                                            className="group relative bg-white p-3.5 rounded-xl border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex items-center justify-between cursor-pointer"
                                                                                            onClick={() => setEditingPin(pin)}
                                                                                        >
                                                                                            <div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="text-lg font-bold text-slate-700 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">
                                                                                                        {pin.pincode}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex gap-2 mt-2">
                                                                                                    <Badge active={pin.isServiceable} text={pin.isServiceable ? "Active" : "Off"} />
                                                                                                    {pin.codAvailable && <Badge active={true} text="COD" className="bg-blue-50/80 text-blue-600 ring-1 ring-blue-100" />}
                                                                                                </div>
                                                                                            </div>
                                                                                            
                                                                                            <div className="text-right">
                                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Fee</p>
                                                                                                <p className="font-bold text-slate-600">₹{pin.deliveryCharge}</p>
                                                                                            </div>
                                                                                            
                                                                                            <div className="absolute inset-0 border-2 border-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 ring-4 ring-indigo-500/10"></div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                                                    <Loader2 className="animate-spin mb-2 text-indigo-200" size={24} />
                                                                                    <span className="text-xs font-medium">Loading zones...</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {editingPin && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Edit Pincode Rules</h3>
                            <button onClick={() => setEditingPin(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl mb-4 text-center ring-1 ring-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Target Pincode</span>
                                <span className="text-3xl font-black text-slate-800 font-mono tracking-tight mt-1 block">{editingPin.pincode}</span>
                            </div>
                            <Toggle label="Serviceable" checked={editingPin.isServiceable} onChange={(v) => setEditingPin({...editingPin, isServiceable: v, codAvailable: v ? editingPin.codAvailable : false})} />
                            <Toggle label="Cash on Delivery" checked={editingPin.codAvailable} onChange={(v) => setEditingPin({...editingPin, codAvailable: v})} disabled={!editingPin.isServiceable} />
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-2 pl-1">Delivery Charge</label>
                                <input type="number" value={editingPin.deliveryCharge} onChange={(e) => setEditingPin({...editingPin, deliveryCharge: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 bg-white ring-1 ring-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                            </div>
                            <button onClick={() => handleUpdatePincode(editingPin)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all mt-4 shadow-lg hover:shadow-xl active:scale-[0.98]">Save Changes</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ADD PINCODE MODAL */}
            {isAddModalOpen && (
                <AddPincodeModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSave={handleAddPincode} 
                />
            )}
        </div>
    );
}

const AddPincodeModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState({
        pincode: '',
        state: '',
        city: '',
        isServiceable: true,
        codAvailable: true,
        deliveryCharge: 50
    });

    const handleSubmit = () => {
        if(!form.pincode || form.pincode.length !== 6) return alert("Enter valid 6-digit pincode");
        if(!form.state) return alert("Select a State");
        if(!form.city) return alert("Enter City/District name");
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Add New Pincode</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2 pl-1">Pincode</label>
                        <input 
                            type="text" 
                            maxLength={6}
                            placeholder="e.g. 110001"
                            value={form.pincode}
                            onChange={(e) => setForm({...form, pincode: e.target.value.replace(/\D/g,'')})}
                            className="w-full px-4 py-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2 pl-1">State</label>
                        <div className="relative">
                            <select 
                                value={form.state}
                                onChange={(e) => setForm({...form, state: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl font-medium text-slate-800 outline-none appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            >
                                <option value="">Select State</option>
                                {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2 pl-1">City / District</label>
                        <input 
                            type="text" 
                            placeholder="Enter District Name"
                            value={form.city}
                            onChange={(e) => setForm({...form, city: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                        />
                    </div>

                    <div className="pt-2 space-y-2">
                        <Toggle label="Serviceable" checked={form.isServiceable} onChange={(v) => setForm({...form, isServiceable: v})} />
                        <Toggle label="Enable COD" checked={form.codAvailable} onChange={(v) => setForm({...form, codAvailable: v})} disabled={!form.isServiceable} />
                    </div>

                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2 pl-1">Delivery Charge</label>
                        <input 
                            type="number" 
                            value={form.deliveryCharge} 
                            onChange={(e) => setForm({...form, deliveryCharge: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                        />
                    </div>

                    <button onClick={handleSubmit} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors mt-2 shadow-lg shadow-indigo-200 active:scale-[0.98]">
                        Add Pincode
                    </button>
                </div>
            </Card>
        </div>
    );
};