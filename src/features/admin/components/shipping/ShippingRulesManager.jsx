import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, IndianRupee } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

const ShippingRulesManager = () => {
    const { getToken } = useAuth();
    const [rules, setRules] = useState({ freeShippingThreshold: 999, flatShippingRate: 50 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${BACKEND}/api/shipping/shiprocket/rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch shipping rules", error);
            window.toast?.error("Failed to load shipping rules.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${BACKEND}/api/shipping/shiprocket/rules`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(rules)
            });
            if (res.ok) {
                window.toast?.success("Shipping rules updated successfully!");
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            window.toast?.error("Failed to save shipping rules.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-4 min-h-[50vh] animate-fadeIn font-body">
            <div className="w-8 h-8 border-2 border-[var(--brand)] rounded-full border-t-transparent animate-spin" /> 
            <p className="font-display italic text-xl text-[var(--sub)] tracking-wide">Loading Rules...</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--bg)] min-h-screen font-body animate-fadeIn transition-colors duration-300 pb-20">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-[var(--surface)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
                <div>
                    <h2 className="font-display text-3xl md:text-4xl font-medium text-[var(--text)] tracking-tight">Shipping Rules Engine</h2>
                    <p className="font-display italic text-[var(--sub)] text-lg mt-2 tracking-wide">
                        Manage global shipping logic. Real-time Pincode serviceability & EDD are automatically handled by Shiprocket during checkout.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2.5 bg-[var(--brand)] text-[var(--bg)] px-8 py-3 rounded-lg font-body font-bold text-sm tracking-wide hover:brightness-110 transition-all shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] disabled:opacity-50 button-hero whitespace-nowrap w-full sm:w-auto justify-center"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-[#F5F1E8]/30 border-t-[#F5F1E8] rounded-full animate-spin" />
                    ) : (
                        <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                    )}
                    {isSaving ? "Saving..." : "Save Rules"}
                    {!isSaving && <div className="pulse border-[#F5F1E8]"></div>}
                </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Free Shipping Card */}
                <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 group cursor-default">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--success)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
                            <IndianRupee className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h3 className="font-body font-bold text-[var(--text)] text-base tracking-wide">Free Shipping Threshold</h3>
                            <p className="font-body text-xs font-bold text-[var(--sub)] mt-0.5">Orders above this amount get free shipping</p>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-body font-bold text-sm">₹</span>
                        <input
                            type="number"
                            value={rules.freeShippingThreshold}
                            onChange={(e) => setRules({ ...rules, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                            className="w-full pl-8 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Flat Shipping Card */}
                <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] hover:border-[var(--border)] transition-all duration-300 group cursor-default">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
                            <Truck className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-body font-bold text-[var(--text)] text-base tracking-wide">Flat Shipping Rate</h3>
                            <p className="font-body text-xs font-bold text-[var(--sub)] mt-0.5">Delivery charge for orders below the threshold</p>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-body font-bold text-sm">₹</span>
                        <input
                            type="number"
                            value={rules.flatShippingRate}
                            onChange={(e) => setRules({ ...rules, flatShippingRate: parseInt(e.target.value) || 0 })}
                            className="w-full pl-8 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl font-body font-bold text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Explanatory Banner */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-[var(--shadow)]">
                <h4 className="font-display text-2xl font-medium text-[var(--text)] flex items-center gap-3 tracking-tight mb-4">
                    <Truck className="w-6 h-6 text-[var(--brand)]" strokeWidth={1.5} /> How this works
                </h4>
                <ul className="font-body text-sm font-bold text-[var(--sub)] space-y-3 list-disc list-inside leading-relaxed">
                    <li>The checkout process will automatically query <strong className="text-[var(--text)]">Shiprocket</strong> to check if a user's pincode is serviceable.</li>
                    <li>Cash on Delivery (COD) availability and Estimated Delivery Days are displayed dynamically from Shiprocket.</li>
                    <li>If the user's cart total (after discounts) is <strong className="text-[var(--text)]">≥ ₹{rules.freeShippingThreshold.toLocaleString()}</strong>, shipping is <strong className="text-[var(--success)]">Free</strong>.</li>
                    <li>Otherwise, a flat fee of <strong className="text-[var(--text)]">₹{rules.flatShippingRate.toLocaleString()}</strong> is applied.</li>
                </ul>
            </div>
        </div>
    );
};

export default ShippingRulesManager;